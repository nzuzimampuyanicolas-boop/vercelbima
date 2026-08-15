import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.95.0"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Expose-Headers": "Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining",
  "Access-Control-Max-Age": "86400",
}

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  })
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

type RateLimitPolicy = {
  scope: string
  limit: number
  windowSeconds: number
  discriminator?: string
}

type RateLimitRow = {
  allowed: boolean
  remaining: number
  retry_after: number
}

const rateLimitPolicies = {
  placePreview: { scope: "place-preview", limit: 20, windowSeconds: 600 },
  placePreviewDaily: { scope: "place-preview-daily", limit: 50, windowSeconds: 86400 },
  createAttempt: { scope: "event-create-attempt", limit: 20, windowSeconds: 3600 },
  createAttemptDaily: { scope: "event-create-attempt-daily", limit: 50, windowSeconds: 86400 },
  createSuccess: { scope: "event-create-success", limit: 5, windowSeconds: 3600 },
  createSuccessDaily: { scope: "event-create-success-daily", limit: 10, windowSeconds: 86400 },
  eventRead: { scope: "event-read", limit: 120, windowSeconds: 60 },
  shortLinkRead: { scope: "short-link-read", limit: 120, windowSeconds: 60 },
  voteNetwork: { scope: "event-vote-network", limit: 100, windowSeconds: 600 },
  voteParticipant: { scope: "event-vote-participant", limit: 10, windowSeconds: 600 },
  organizerMutation: { scope: "organizer-mutation", limit: 30, windowSeconds: 600 },
  organizerInvalid: { scope: "organizer-invalid", limit: 5, windowSeconds: 900 },
  calendar: { scope: "calendar", limit: 30, windowSeconds: 600 },
  adminRead: { scope: "admin-read", limit: 90, windowSeconds: 900 },
  adminDelete: { scope: "admin-delete", limit: 30, windowSeconds: 900 },
  adminInvalid: { scope: "admin-invalid", limit: 5, windowSeconds: 900 },
  notificationValid: { scope: "notification-valid", limit: 60, windowSeconds: 900 },
  notificationInvalid: { scope: "notification-invalid", limit: 5, windowSeconds: 900 },
} as const

function constantTimeEqual(left: string, right: string) {
  if (!left || left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

function firstForwardedIp(value: string | null) {
  return cleanText(value?.split(",")[0], 128)
}

let notificationSecretHashCache: { value: string; expiresAt: number } | null = null

async function notificationSecretHash() {
  if (notificationSecretHashCache && notificationSecretHashCache.expiresAt > Date.now()) {
    return notificationSecretHashCache.value
  }
  const { data, error } = await db
    .from("bima_config")
    .select("value")
    .eq("key", "notification_secret_hash")
    .maybeSingle()
  assertDatabase(error, "Impossible de vérifier le secret serveur.")
  const value = cleanText(data?.value, 128)
  notificationSecretHashCache = { value, expiresAt: Date.now() + 60_000 }
  return value
}

async function requestIdentity(request: Request) {
  const suppliedProxySecret = request.headers.get("x-bima-proxy-secret") || ""
  const expectedSecretHash = suppliedProxySecret ? await notificationSecretHash() : ""
  const suppliedSecretHash = suppliedProxySecret ? await sha256(suppliedProxySecret) : ""
  const trustedProxy = constantTimeEqual(suppliedSecretHash, expectedSecretHash)
  const trustedClientIp = trustedProxy
    ? cleanText(request.headers.get("x-bima-client-ip"), 128)
    : ""
  const edgeClientIp = cleanText(request.headers.get("cf-connecting-ip"), 128)
    || cleanText(request.headers.get("x-real-ip"), 128)
    || firstForwardedIp(request.headers.get("x-forwarded-for"))
  const fallbackFingerprint = [
    cleanText(request.headers.get("user-agent"), 160),
    cleanText(request.headers.get("accept-language"), 80),
  ].join("|")
  const clientIp = trustedClientIp || edgeClientIp
  return clientIp ? `ip:${clientIp}` : `fingerprint:${fallbackFingerprint || "unknown"}`
}

async function consumeRateLimit(request: Request, policy: RateLimitPolicy) {
  const identityHash = await sha256(`${serviceRoleKey}:${await requestIdentity(request)}`)
  const bucket = await sha256(`${policy.scope}:${policy.discriminator || "global"}:${identityHash}`)
  const { data, error } = await db.rpc("bima_consume_rate_limit", {
    p_bucket: bucket,
    p_limit: policy.limit,
    p_window_seconds: policy.windowSeconds,
  })
  assertDatabase(error, "Impossible de vérifier la limite de requêtes.")
  const result = (data as RateLimitRow[] | null)?.[0]
  if (!result) throw new Error("Réponse de limitation invalide.")
  return result
}

function rateLimitResponse(result: RateLimitRow, policy: RateLimitPolicy) {
  const retryLabel = result.retry_after >= 60
    ? `${Math.ceil(result.retry_after / 60)} min`
    : `${result.retry_after} s`
  console.info(JSON.stringify({
    event: "rate_limit_exceeded",
    scope: policy.scope,
    retryAfter: result.retry_after,
  }))
  return json(
    {
      error: `Trop de demandes depuis cette connexion. Réessaie dans ${retryLabel}.`,
      code: "rate_limit_exceeded",
      retryAfter: result.retry_after,
    },
    429,
    {
      "Retry-After": String(result.retry_after),
      "X-RateLimit-Limit": String(policy.limit),
      "X-RateLimit-Remaining": String(result.remaining),
    },
  )
}

async function rateLimited(
  request: Request,
  policy: RateLimitPolicy,
  operation: () => Promise<Response>,
) {
  const result = await consumeRateLimit(request, policy)
  if (result.allowed) {
    const response = await operation()
    const headers = new Headers(response.headers)
    if (!headers.has("X-RateLimit-Limit")) headers.set("X-RateLimit-Limit", String(policy.limit))
    if (!headers.has("X-RateLimit-Remaining")) headers.set("X-RateLimit-Remaining", String(result.remaining))
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
  return rateLimitResponse(result, policy)
}

function makeToken() {
  return `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`
}

function makeShortCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")
}

async function createShortLink(kind: "manage" | "participant", eventId: string, participantId: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = makeShortCode()
    const { error } = await db.from("bima_short_links").insert({
      code_hash: await sha256(code),
      kind,
      event_id: eventId,
      participant_id: participantId,
    })
    if (!error) return code
    if (error.code !== "23505") assertDatabase(error, "Impossible de créer le lien court.")
  }
  throw new Error("Impossible de créer un lien court unique.")
}

async function findShortLink(code: string, kind: "manage" | "participant") {
  if (!code) return null
  const { data, error } = await db
    .from("bima_short_links")
    .select("event_id,participant_id,kind")
    .eq("code_hash", await sha256(code))
    .eq("kind", kind)
    .maybeSingle()
  assertDatabase(error, "Impossible de vérifier ce lien court.")
  return data
}

function makeSlug(title: string) {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42)
  return `${base || "sortie"}-${makeToken().slice(0, 6)}`
}

function assertDatabase(error: { message?: string } | null, fallback: string) {
  if (error) throw new Error(error.message || fallback)
}

async function findEvent(slug: string) {
  const { data, error } = await db
    .from("bima_events")
    .select("id,slug,manage_token_hash,organizer_name,organizer_email,title,city,max_places,budget_eur,response_deadline,confirmed_date_id,event_type,notify_new_responses,notify_reminders,notifications_started_at,created_at,updated_at")
    .eq("slug", slug)
    .maybeSingle()
  assertDatabase(error, "Impossible de charger cette sortie.")
  return data
}

async function hasManageAccess(event: { id: string; manage_token_hash: string }, manageToken?: string | null, manageShortCode?: string | null) {
  if (manageToken && (await sha256(manageToken)) === event.manage_token_hash) return true
  if (!manageShortCode) return false
  const link = await findShortLink(manageShortCode, "manage")
  return link?.event_id === event.id
}

async function readEvent(
  slug: string,
  manageToken?: string | null,
  participantToken?: string | null,
  manageShortCode?: string | null,
  participantShortCode?: string | null,
) {
  const event = await findEvent(slug)
  if (!event) return null

  const [manageShortLink, participantShortLink] = await Promise.all([
    manageShortCode ? findShortLink(manageShortCode, "manage") : Promise.resolve(null),
    participantShortCode ? findShortLink(participantShortCode, "participant") : Promise.resolve(null),
  ])

  const [placesResult, datesResult, participantsResult, dateVotesResult, stageVotesResult] = await Promise.all([
    db.from("bima_places").select("id,position,start_time,maps_url,name,rating,rating_label,address,category,hours,image").eq("event_id", event.id).order("position"),
    db.from("bima_date_options").select("id,position,starts_at,ends_at").eq("event_id", event.id).order("position"),
    db.from("bima_participants").select("id,name,role,token_hash,created_at").eq("event_id", event.id).order("created_at"),
    db.from("bima_date_votes").select("participant_id,date_option_id,available,bima_participants!inner(event_id)").eq("bima_participants.event_id", event.id),
    db.from("bima_stage_votes").select("participant_id,place_id,attending,bima_participants!inner(event_id)").eq("bima_participants.event_id", event.id),
  ])
  for (const result of [placesResult, datesResult, participantsResult, dateVotesResult, stageVotesResult]) {
    assertDatabase(result.error, "Impossible de charger les réponses.")
  }

  const answersByParticipant = new Map<string, Record<string, boolean>>()
  const stagesByParticipant = new Map<string, Record<string, boolean>>()
  const dateCounts = new Map<string, number>()
  const stageCounts = new Map<string, number>()
  for (const vote of dateVotesResult.data || []) {
    const answers = answersByParticipant.get(vote.participant_id) || {}
    answers[vote.date_option_id] = Boolean(vote.available)
    answersByParticipant.set(vote.participant_id, answers)
    if (vote.available) dateCounts.set(vote.date_option_id, (dateCounts.get(vote.date_option_id) || 0) + 1)
  }
  for (const vote of stageVotesResult.data || []) {
    const answers = stagesByParticipant.get(vote.participant_id) || {}
    answers[vote.place_id] = Boolean(vote.attending)
    stagesByParticipant.set(vote.participant_id, answers)
    if (vote.attending) stageCounts.set(vote.place_id, (stageCounts.get(vote.place_id) || 0) + 1)
  }

  const isManager = Boolean(
    (manageToken && (await sha256(manageToken)) === event.manage_token_hash) ||
    (manageShortLink && manageShortLink.event_id === event.id),
  )
  const personalToken = participantToken || (isManager ? manageToken : null)
  const personalTokenHash = personalToken ? await sha256(personalToken) : null
  const personalParticipantId = participantShortLink?.event_id === event.id
    ? participantShortLink.participant_id
    : manageShortLink?.event_id === event.id
      ? manageShortLink.participant_id
      : null
  const participants = (participantsResult.data || []).map((participant) => ({
    id: participant.id,
    name: participant.name,
    role: participant.role,
    answers: answersByParticipant.get(participant.id) || {},
    stageAnswers: stagesByParticipant.get(participant.id) || {},
  }))

  return {
    event: {
      slug: event.slug,
      organizerName: event.organizer_name,
      title: event.title,
      city: event.city,
      maxPlaces: event.max_places,
      budgetEur: event.budget_eur,
      responseDeadline: event.response_deadline,
      confirmedDateId: event.confirmed_date_id,
      eventType: event.event_type === "stay" ? "stay" : "outing",
      status: event.confirmed_date_id ? "confirmed" : "collecting",
      createdAt: event.created_at,
      places: (placesResult.data || []).map((place) => ({
        id: place.id,
        position: place.position,
        startTime: place.start_time,
        mapsUrl: place.maps_url,
        name: place.name,
        rating: place.rating,
        ratingLabel: place.rating_label,
        address: place.address,
        category: place.category,
        hours: place.hours,
        image: place.image,
        attendingCount: stageCounts.get(place.id) || 0,
      })),
      dates: (datesResult.data || []).map((date) => ({
        id: date.id,
        position: date.position,
        startsAt: date.starts_at,
        endsAt: date.ends_at,
        availableCount: dateCounts.get(date.id) || 0,
      })),
    },
    summary: {
      participantCount: participants.length,
      guestCount: participants.filter((participant) => participant.role === "guest").length,
    },
    manage: isManager,
    me: personalParticipantId
      ? participants.find((participant) => participant.id === personalParticipantId) || undefined
      : personalTokenHash
      ? participants.find((participant) => {
          const source = (participantsResult.data || []).find((candidate) => candidate.id === participant.id)
          return source?.token_hash === personalTokenHash
        }) || undefined
      : undefined,
    voters: isManager ? participants : undefined,
    notificationPreferences: isManager ? {
      newResponses: event.notify_new_responses !== false,
      reminders: event.notify_reminders !== false,
      active: Boolean(event.notifications_started_at),
    } : undefined,
  }
}

type NotificationKind = "participant_joined" | "event_full" | "deadline_48h" | "deadline_reached"

async function enqueueNotification(eventId: string, kind: NotificationKind, dedupeKey: string, payload: Record<string, unknown> = {}) {
  const { error } = await db.from("bima_notification_deliveries").insert({
    event_id: eventId,
    kind,
    dedupe_key: dedupeKey,
    payload,
  })
  if (error && error.code !== "23505") assertDatabase(error, "Impossible de préparer la notification.")
}

async function hasNotificationAccess(request: Request) {
  const authorization = request.headers.get("authorization") || ""
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : ""
  if (!token) return false
  const expectedSecretHash = await notificationSecretHash()
  return constantTimeEqual(await sha256(token), expectedSecretHash)
}

type CreatePlace = {
  mapsUrl?: string
  name?: string
  rating?: string
  ratingLabel?: string
  address?: string
  category?: string
  hours?: string
  image?: string
}

type CreateDate = {
  startsAt?: string
  endsAt?: string | null
}

type NormalizedDate = {
  startsAt: string
  endsAt: string | null
}

function normalizeCreateDate(value: unknown): NormalizedDate | null {
  const rawStartsAt = typeof value === "string"
    ? value
    : value && typeof value === "object"
      ? (value as CreateDate).startsAt
      : null
  const rawEndsAt = value && typeof value === "object" ? (value as CreateDate).endsAt : null
  if (typeof rawStartsAt !== "string" || Number.isNaN(Date.parse(rawStartsAt))) return null
  if (rawEndsAt != null && (typeof rawEndsAt !== "string" || Number.isNaN(Date.parse(rawEndsAt)))) return null
  return {
    startsAt: new Date(rawStartsAt).toISOString(),
    endsAt: typeof rawEndsAt === "string" ? new Date(rawEndsAt).toISOString() : null,
  }
}

async function createEvent(request: Request) {
  const body = await request.json()
  if (cleanText(body.website, 200)) return json({ error: "Requête invalide." }, 400)
  const organizerName = cleanText(body.organizerName, 60)
  const organizerEmail = cleanText(body.organizerEmail, 254).toLowerCase()
  const title = cleanText(body.title, 120)
  const city = cleanText(body.city, 100)
  const maxPlaces = Math.round(Number(body.maxPlaces))
  const rawBudget = body.budgetEur == null ? null : Math.round(Number(body.budgetEur))
  const budgetEur = rawBudget == null || !Number.isFinite(rawBudget) ? null : Math.max(10, Math.round(rawBudget / 10) * 10)
  const responseDeadline = typeof body.responseDeadline === "string" && body.responseDeadline ? body.responseDeadline.slice(0, 10) : null
  const eventType = body.eventType === "stay" ? "stay" : "outing"
  const places = Array.isArray(body.places) ? (body.places as CreatePlace[]).slice(0, 2) : []
  const dates = Array.isArray(body.dates)
    ? body.dates.slice(0, 4).map(normalizeCreateDate).filter((date: NormalizedDate | null): date is NormalizedDate => Boolean(date))
    : []

  if (!organizerName || !title || !city) return json({ error: "Le prénom, le titre et la ville sont obligatoires." }, 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(organizerEmail)) return json({ error: "Ajoute une adresse e-mail valide pour recevoir ton lien de gestion." }, 400)
  if (!Number.isFinite(maxPlaces) || maxPlaces < 2 || maxPlaces > 200) return json({ error: "Le nombre de places doit être compris entre 2 et 200." }, 400)
  if (!places.length || !dates.length) return json({ error: "Ajoute au moins un lieu et une date." }, 400)
  const minimumStart = Date.now() + 5 * 60 * 1000
  const maximumStart = Date.now() + 2 * 365 * 24 * 60 * 60 * 1000
  if (dates.some((date) => {
    const timestamp = Date.parse(date.startsAt)
    return timestamp < minimumStart || timestamp > maximumStart
  })) return json({ error: "Les dates doivent être futures et situées dans les deux prochaines années." }, 400)
  if (eventType === "stay" && dates.some((date) => {
    if (!date.endsAt) return true
    const start = Date.parse(date.startsAt)
    const end = Date.parse(date.endsAt)
    return end < start || end - start > 30 * 24 * 60 * 60 * 1000
  })) return json({ error: "Chaque séjour doit avoir une date de fin, après le départ et dans une limite de 30 jours." }, 400)
  if (eventType === "outing") dates.forEach((date) => { date.endsAt = null })
  if (responseDeadline) {
    const deadlineTimestamp = Date.parse(`${responseDeadline}T23:59:59Z`)
    const firstDateTimestamp = Math.min(...dates.map((date) => Date.parse(date.startsAt)))
    if (!Number.isFinite(deadlineTimestamp) || deadlineTimestamp >= firstDateTimestamp) {
      return json({ error: "La date limite de réponse doit précéder la première proposition." }, 400)
    }
  }

  const normalizedPlaces = places.map((place, position) => {
    const mapsUrl = cleanText(place.mapsUrl, 2000)
    const name = cleanText(place.name, 160)
    const placeCity = cleanText(place.address, 100)
    if (!name || !placeCity) throw new Error(`Renseigne le nom et la ville du lieu ${position + 1}.`)
    if (mapsUrl) {
      let parsedUrl: URL
      try { parsedUrl = new URL(mapsUrl) } catch { throw new Error(`Le lien du lieu ${position + 1} est invalide.`) }
      if (!isGoogleMapsUrl(parsedUrl) || parsedUrl.hostname === "maps.app.goo.gl" || parsedUrl.hostname === "goo.gl") {
        throw new Error(`Le lien du lieu ${position + 1} doit être un lien Google Maps classique.`)
      }
    }
    return {
      id: crypto.randomUUID(),
      position,
      start_time: null,
      maps_url: mapsUrl,
      name,
      rating: cleanText(place.rating, 12) || null,
      rating_label: cleanText(place.ratingLabel, 80) || null,
      address: placeCity,
      category: cleanText(place.category, 160) || null,
      hours: cleanText(place.hours, 160) || null,
      image: cleanText(place.image, 2000) || null,
    }
  })

  const creationDiscriminator = await sha256(organizerEmail)
  const hourlyCreationPolicy = { ...rateLimitPolicies.createSuccess, discriminator: creationDiscriminator }
  const hourlyCreationLimit = await consumeRateLimit(request, hourlyCreationPolicy)
  if (!hourlyCreationLimit.allowed) return rateLimitResponse(hourlyCreationLimit, hourlyCreationPolicy)
  const dailyCreationPolicy = { ...rateLimitPolicies.createSuccessDaily, discriminator: creationDiscriminator }
  const dailyCreationLimit = await consumeRateLimit(request, dailyCreationPolicy)
  if (!dailyCreationLimit.allowed) return rateLimitResponse(dailyCreationLimit, dailyCreationPolicy)

  const eventId = crypto.randomUUID()
  const slug = makeSlug(title)
  const manageToken = makeToken()
  const organizerId = crypto.randomUUID()
  const now = new Date().toISOString()
  let inserted = false
  let manageShortCode = ""
  try {
    const { error: eventError } = await db.from("bima_events").insert({
      id: eventId, slug, manage_token_hash: await sha256(manageToken), organizer_name: organizerName, organizer_email: organizerEmail,
      title, city, max_places: maxPlaces, budget_eur: budgetEur, response_deadline: responseDeadline, event_type: eventType,
      notify_new_responses: true, notify_reminders: true, notifications_started_at: now,
      created_at: now, updated_at: now,
    })
    assertDatabase(eventError, "Impossible de créer la sortie.")
    inserted = true
    const [participantResult, placesResult, datesResult] = await Promise.all([
      db.from("bima_participants").insert({ id: organizerId, event_id: eventId, token_hash: await sha256(manageToken), name: organizerName, role: "organizer", created_at: now, updated_at: now }),
      db.from("bima_places").insert(normalizedPlaces.map((place) => ({ ...place, event_id: eventId }))),
      db.from("bima_date_options").insert(dates.map((date: NormalizedDate, position: number) => ({
        id: crypto.randomUUID(), event_id: eventId, position, starts_at: date.startsAt, ends_at: date.endsAt,
      }))),
    ])
    for (const result of [participantResult, placesResult, datesResult]) assertDatabase(result.error, "Impossible de compléter la sortie.")
    manageShortCode = await createShortLink("manage", eventId, organizerId)
  } catch (error) {
    if (inserted) await db.from("bima_events").delete().eq("id", eventId)
    throw error
  }

  return json({
    ...(await readEvent(slug, manageToken, manageToken, manageShortCode)),
    manageToken,
    organizerParticipantToken: manageToken,
    manageShortCode,
    organizerParticipantShortCode: manageShortCode,
    sharePath: `/e/${encodeURIComponent(slug)}`,
    managePath: `/m/${encodeURIComponent(manageShortCode)}`,
  }, 201)
}

type UpdatePlace = {
  id?: string
  name?: string
  address?: string
  mapsUrl?: string
}

async function updateEvent(request: Request, slug: string) {
  const body = await request.json()
  const manageToken = cleanText(body.manageToken, 128)
  const manageShortCode = cleanText(body.manageShortCode, 64)
  const event = await findEvent(slug)
  if (!event) return json({ error: "Cette sortie n’existe pas." }, 404)
  if (!await hasManageAccess(event, manageToken, manageShortCode)) return json({ error: "Lien de gestion invalide." }, 403)

  const title = cleanText(body.title, 120)
  const maxPlaces = Math.round(Number(body.maxPlaces))
  const budgetEur = body.budgetEur == null || body.budgetEur === "" ? null : Math.round(Number(body.budgetEur))
  const responseDeadline = typeof body.responseDeadline === "string" && body.responseDeadline ? body.responseDeadline.slice(0, 10) : null
  const submittedPlaces = Array.isArray(body.places) ? body.places as UpdatePlace[] : []

  if (!title) return json({ error: "Le nom de la sortie est obligatoire." }, 400)
  if (!Number.isFinite(maxPlaces) || maxPlaces < 2 || maxPlaces > 200) return json({ error: "Le nombre de places doit être compris entre 2 et 200." }, 400)
  if (budgetEur != null && (!Number.isFinite(budgetEur) || budgetEur < 10 || budgetEur % 10 !== 0)) return json({ error: "Le budget doit avancer de 10 € en 10 €, à partir de 10 €." }, 400)

  const [placesResult, datesResult, participantsResult] = await Promise.all([
    db.from("bima_places").select("id,position,maps_url").eq("event_id", event.id).order("position"),
    db.from("bima_date_options").select("starts_at").eq("event_id", event.id).order("starts_at"),
    db.from("bima_participants").select("id", { count: "exact", head: true }).eq("event_id", event.id),
  ])
  for (const result of [placesResult, datesResult, participantsResult]) assertDatabase(result.error, "Impossible de vérifier la sortie.")
  const existingPlaces = placesResult.data || []
  const participantCount = participantsResult.count || 0
  if (maxPlaces < participantCount) return json({ error: `Il y a déjà ${participantCount} participants. Le nombre de places ne peut pas être inférieur.` }, 400)
  if (submittedPlaces.length !== existingPlaces.length) return json({ error: "Le nombre d’étapes ne peut pas être modifié ici." }, 400)

  const existingIds = new Set(existingPlaces.map((place) => place.id))
  const submittedIds = submittedPlaces.map((place) => cleanText(place.id, 80))
  if (new Set(submittedIds).size !== existingIds.size || submittedIds.some((id) => !existingIds.has(id))) {
    return json({ error: "Une des étapes n’appartient pas à cette sortie." }, 400)
  }
  if (responseDeadline) {
    const deadlineTimestamp = Date.parse(`${responseDeadline}T23:59:59Z`)
    const firstDateTimestamp = Math.min(...(datesResult.data || []).map((date) => Date.parse(date.starts_at)))
    if (!Number.isFinite(deadlineTimestamp) || deadlineTimestamp >= firstDateTimestamp) {
      return json({ error: "La date limite de réponse doit précéder la première proposition." }, 400)
    }
  }

  const normalizedPlaces: Array<{ id: string; name: string; address: string; mapsUrl: string; mapsChanged: boolean }> = []
  for (const [position, place] of submittedPlaces.entries()) {
    const id = cleanText(place.id, 80)
    const name = cleanText(place.name, 160)
    const address = cleanText(place.address, 100)
    const mapsUrl = cleanText(place.mapsUrl, 2000)
    if (!name || !address) return json({ error: `Renseigne le nom et la ville du lieu ${position + 1}.` }, 400)
    if (mapsUrl) {
      let parsedUrl: URL
      try { parsedUrl = new URL(mapsUrl) } catch { return json({ error: `Le lien du lieu ${position + 1} est invalide.` }, 400) }
      if (!isGoogleMapsUrl(parsedUrl) || parsedUrl.hostname === "maps.app.goo.gl" || parsedUrl.hostname === "goo.gl") {
        return json({ error: `Le lien du lieu ${position + 1} doit être un lien Google Maps classique.` }, 400)
      }
    }
    const existingPlace = existingPlaces.find((candidate) => candidate.id === id)!
    normalizedPlaces.push({ id, name, address, mapsUrl, mapsChanged: mapsUrl !== (existingPlace.maps_url || "") })
  }

  const now = new Date().toISOString()
  for (const place of normalizedPlaces) {
    const changes: Record<string, string | null> = {
      name: place.name,
      address: place.address,
      maps_url: place.mapsUrl,
    }
    if (place.mapsChanged) {
      changes.rating = null
      changes.rating_label = null
      changes.category = null
      changes.hours = null
      changes.image = null
    }
    const { error } = await db.from("bima_places").update(changes).eq("id", place.id).eq("event_id", event.id)
    assertDatabase(error, "Impossible de modifier un lieu.")
  }
  const { error: updateError } = await db.from("bima_events").update({
    title,
    city: normalizedPlaces[0]?.address || event.city,
    max_places: maxPlaces,
    budget_eur: budgetEur,
    response_deadline: responseDeadline,
    updated_at: now,
  }).eq("id", event.id)
  assertDatabase(updateError, "Impossible de modifier cette sortie.")

  return json(await readEvent(slug, manageToken, manageToken, manageShortCode))
}

async function updateNotificationPreferences(request: Request, slug: string) {
  const body = await request.json()
  const manageToken = cleanText(body.manageToken, 128)
  const manageShortCode = cleanText(body.manageShortCode, 64)
  const event = await findEvent(slug)
  if (!event) return json({ error: "Cette sortie n’existe pas." }, 404)
  if (!await hasManageAccess(event, manageToken, manageShortCode)) return json({ error: "Lien de gestion invalide." }, 403)
  if (typeof body.newResponses !== "boolean" || typeof body.reminders !== "boolean") {
    return json({ error: "Préférences de notification invalides." }, 400)
  }
  const now = new Date().toISOString()
  const { error } = await db.from("bima_events").update({
    notify_new_responses: body.newResponses,
    notify_reminders: body.reminders,
    notifications_started_at: event.notifications_started_at || now,
    updated_at: now,
  }).eq("id", event.id)
  assertDatabase(error, "Impossible de modifier les notifications.")
  return json(await readEvent(slug, manageToken, manageToken, manageShortCode))
}

async function submitVote(request: Request, slug: string) {
  const body = await request.json()
  const event = await findEvent(slug)
  if (!event) return json({ error: "Cette sortie n’existe pas." }, 404)
  if (event.confirmed_date_id) return json({ error: "Le vote est clos : la date a déjà été confirmée." }, 409)

  const name = cleanText(body.name, 60)
  if (!name) return json({ error: "Indique ton prénom." }, 400)
  const requestedToken = cleanText(body.participantToken, 128)
  const requestedParticipantShortCode = cleanText(body.participantShortCode, 64)
  const requestedManageShortCode = cleanText(body.manageShortCode, 64)
  const availableDateIds = new Set(Array.isArray(body.availableDateIds) ? body.availableDateIds.filter((id: unknown): id is string => typeof id === "string") : [])
  const hasPlaceSelection = Array.isArray(body.availablePlaceIds)
  const availablePlaceIds = new Set(hasPlaceSelection ? body.availablePlaceIds.filter((id: unknown): id is string => typeof id === "string") : [])

  const [datesResult, placesResult] = await Promise.all([
    db.from("bima_date_options").select("id").eq("event_id", event.id).order("position"),
    db.from("bima_places").select("id").eq("event_id", event.id).order("position"),
  ])
  assertDatabase(datesResult.error, "Impossible de vérifier les dates.")
  assertDatabase(placesResult.error, "Impossible de vérifier les étapes.")
  const validDateIds = (datesResult.data || []).map((date) => date.id)
  const validPlaceIds = (placesResult.data || []).map((place) => place.id)
  if ([...availableDateIds].some((id) => !validDateIds.includes(id))) return json({ error: "Une des dates sélectionnées est invalide." }, 400)
  if ([...availablePlaceIds].some((id) => !validPlaceIds.includes(id))) return json({ error: "Une des étapes sélectionnées est invalide." }, 400)

  let participant = null
  let isNewParticipant = false
  let participantToken = requestedToken
  let participantShortCode = requestedParticipantShortCode || requestedManageShortCode
  let shortKind: "manage" | "participant" | null = requestedManageShortCode ? "manage" : requestedParticipantShortCode ? "participant" : null
  if (shortKind && participantShortCode) {
    const link = await findShortLink(participantShortCode, shortKind)
    if (link?.event_id === event.id && link.participant_id) {
      const { data, error } = await db.from("bima_participants").select("id,role").eq("event_id", event.id).eq("id", link.participant_id).maybeSingle()
      assertDatabase(error, "Impossible de retrouver ce participant.")
      participant = data
    }
  } else if (requestedToken) {
    const { data, error } = await db.from("bima_participants").select("id,role").eq("event_id", event.id).eq("token_hash", await sha256(requestedToken)).maybeSingle()
    assertDatabase(error, "Impossible de retrouver ce participant.")
    participant = data
  }
  if (shortKind && participantShortCode && !participant) return json({ error: "Ce lien personnel est invalide." }, 403)
  const now = new Date().toISOString()
  if (!participant) {
    const { count, error: countError } = await db
      .from("bima_participants")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
    assertDatabase(countError, "Impossible de vérifier le nombre de participants.")
    if ((count || 0) >= event.max_places) return json({ error: "Cette sortie a atteint son nombre maximum de participants." }, 409)
    participantToken = makeToken()
    const id = crypto.randomUUID()
    const { error } = await db.from("bima_participants").insert({ id, event_id: event.id, token_hash: await sha256(participantToken), name, role: "guest", created_at: now, updated_at: now })
    assertDatabase(error, "Impossible d’ajouter ce participant.")
    participant = { id, role: "guest" }
    isNewParticipant = true
    shortKind = "participant"
    participantShortCode = await createShortLink(shortKind, event.id, id)
  } else {
    const { error } = await db.from("bima_participants").update({ name, updated_at: now }).eq("id", participant.id)
    assertDatabase(error, "Impossible de mettre à jour ce participant.")
    if (!participantShortCode) {
      shortKind = participant.role === "organizer" ? "manage" : "participant"
      participantShortCode = await createShortLink(shortKind, event.id, participant.id)
    }
  }

  const dateRows = validDateIds.map((dateId) => ({ participant_id: participant.id, date_option_id: dateId, available: availableDateIds.has(dateId), updated_at: now }))
  const { error: dateVoteError } = await db.from("bima_date_votes").upsert(dateRows, { onConflict: "participant_id,date_option_id" })
  assertDatabase(dateVoteError, "Impossible d’enregistrer les dates.")
  if (hasPlaceSelection) {
    const stageRows = validPlaceIds.map((placeId) => ({ participant_id: participant.id, place_id: placeId, attending: availablePlaceIds.has(placeId), updated_at: now }))
    const { error: stageVoteError } = await db.from("bima_stage_votes").upsert(stageRows, { onConflict: "participant_id,place_id" })
    assertDatabase(stageVoteError, "Impossible d’enregistrer les étapes.")
  }

  if (isNewParticipant && event.notifications_started_at) {
    const { count, error: countError } = await db.from("bima_participants").select("id", { count: "exact", head: true }).eq("event_id", event.id)
    assertDatabase(countError, "Impossible de vérifier l’avancement de la sortie.")
    const participantCount = count || 0
    if (event.notify_new_responses !== false) {
      await enqueueNotification(event.id, "participant_joined", `participant_joined:${participant.id}`, {
        participantName: name,
        participantCount,
      })
    }
    if (event.notify_reminders !== false && participantCount >= event.max_places) {
      await enqueueNotification(event.id, "event_full", `event_full:${event.id}`, { participantCount })
    }
  }

  return json({
    participantToken,
    participantShortCode,
    manageShortCode: participant.role === "organizer" ? participantShortCode : undefined,
    role: participant.role,
    ...(await readEvent(
      slug,
      participant.role === "organizer" ? participantToken : null,
      participantToken,
      shortKind === "manage" ? participantShortCode : null,
      shortKind === "participant" ? participantShortCode : null,
    )),
  })
}

async function confirmDate(request: Request, slug: string) {
  const body = await request.json()
  const manageToken = cleanText(body.manageToken, 128)
  const manageShortCode = cleanText(body.manageShortCode, 64)
  const dateId = cleanText(body.dateId, 80)
  const event = await findEvent(slug)
  if (!event) return json({ error: "Cette sortie n’existe pas." }, 404)
  if (!await hasManageAccess(event, manageToken, manageShortCode)) return json({ error: "Lien de gestion invalide." }, 403)
  const { data: selectedDate, error } = await db.from("bima_date_options").select("id").eq("event_id", event.id).eq("id", dateId).maybeSingle()
  assertDatabase(error, "Impossible de vérifier cette date.")
  if (!selectedDate) return json({ error: "Cette date n’appartient pas à la sortie." }, 400)
  const { error: updateError } = await db.from("bima_events").update({ confirmed_date_id: dateId, updated_at: new Date().toISOString() }).eq("id", event.id)
  assertDatabase(updateError, "Impossible de confirmer cette date.")
  return json(await readEvent(slug, manageToken, manageToken, manageShortCode))
}

async function deleteEvent(request: Request, slug: string) {
  const body = await request.json()
  const manageToken = cleanText(body.manageToken, 128)
  const manageShortCode = cleanText(body.manageShortCode, 64)
  const event = await findEvent(slug)
  if (!event) return json({ error: "Cette sortie n’existe pas." }, 404)
  if (!await hasManageAccess(event, manageToken, manageShortCode)) {
    return json({ error: "Lien de gestion invalide." }, 403)
  }
  const { error } = await db.from("bima_events").delete().eq("id", event.id)
  assertDatabase(error, "Impossible de supprimer cette sortie.")
  return json({ ok: true })
}

async function deleteParticipant(request: Request, slug: string, participantId: string) {
  const body = await request.json()
  const manageToken = cleanText(body.manageToken, 128)
  const manageShortCode = cleanText(body.manageShortCode, 64)
  const event = await findEvent(slug)
  if (!event) return json({ error: "Cette sortie n’existe pas." }, 404)
  if (!await hasManageAccess(event, manageToken, manageShortCode)) {
    return json({ error: "Lien de gestion invalide." }, 403)
  }

  const { data: participant, error: participantError } = await db
    .from("bima_participants")
    .select("id,role")
    .eq("id", participantId)
    .eq("event_id", event.id)
    .maybeSingle()
  assertDatabase(participantError, "Impossible de retrouver ce participant.")
  if (!participant) return json({ error: "Ce participant n’existe plus." }, 404)
  if (participant.role === "organizer") return json({ error: "L’organisateur ne peut pas être supprimé." }, 400)

  const { error } = await db.from("bima_participants").delete().eq("id", participant.id).eq("event_id", event.id)
  assertDatabase(error, "Impossible de supprimer ce participant.")
  return json(await readEvent(slug, manageToken, manageToken, manageShortCode))
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

async function scheduleDueNotifications(referenceDate: string) {
  const reminderDate = addDays(referenceDate, 2)
  const { data: events, error } = await db.from("bima_events")
    .select("id,response_deadline")
    .is("confirmed_date_id", null)
    .eq("notify_reminders", true)
    .not("notifications_started_at", "is", null)
    .in("response_deadline", [referenceDate, reminderDate])
  assertDatabase(error, "Impossible de préparer les rappels.")
  for (const event of events || []) {
    const kind: NotificationKind = event.response_deadline === reminderDate ? "deadline_48h" : "deadline_reached"
    await enqueueNotification(event.id, kind, `${kind}:${event.response_deadline}`, { responseDeadline: event.response_deadline })
  }
}

async function claimNotificationJobs(eventId?: string) {
  const staleBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  let staleQuery = db.from("bima_notification_deliveries").update({ status: "failed", last_error: "Traitement interrompu.", updated_at: new Date().toISOString() }).eq("status", "processing").lt("updated_at", staleBefore)
  if (eventId) staleQuery = staleQuery.eq("event_id", eventId)
  assertDatabase((await staleQuery).error, "Impossible de reprendre les notifications interrompues.")

  let query = db.from("bima_notification_deliveries")
    .select("id,event_id,kind,payload,status,attempt_count")
    .in("status", ["pending", "failed"])
    .lt("attempt_count", 5)
    .order("created_at")
    .limit(20)
  if (eventId) query = query.eq("event_id", eventId)
  const { data: candidates, error } = await query
  assertDatabase(error, "Impossible de charger les notifications.")

  const claimed = []
  for (const candidate of candidates || []) {
    const { data, error: claimError } = await db.from("bima_notification_deliveries")
      .update({ status: "processing", attempt_count: candidate.attempt_count + 1, last_error: null, updated_at: new Date().toISOString() })
      .eq("id", candidate.id)
      .in("status", ["pending", "failed"])
      .select("id,event_id,kind,payload")
      .maybeSingle()
    assertDatabase(claimError, "Impossible de réserver une notification.")
    if (data) claimed.push(data)
  }
  return claimed
}

async function processNotifications(request: Request, authorization?: boolean) {
  const authorized = authorization ?? await hasNotificationAccess(request)
  if (!authorized) return json({ error: "Accès refusé." }, 401)
  const body = await request.json().catch(() => ({}))
  const slug = cleanText(body.slug, 100)
  const referenceDate = /^\d{4}-\d{2}-\d{2}$/.test(body.referenceDate || "") ? body.referenceDate : new Date().toISOString().slice(0, 10)
  let eventId: string | undefined
  if (slug) {
    const event = await findEvent(slug)
    if (!event) return json({ error: "Cette sortie n’existe pas." }, 404)
    eventId = event.id
  } else {
    await scheduleDueNotifications(referenceDate)
  }

  const jobs = []
  for (const delivery of await claimNotificationJobs(eventId)) {
    const { data: eventReference, error: eventReferenceError } = await db.from("bima_events").select("slug").eq("id", delivery.event_id).maybeSingle()
    assertDatabase(eventReferenceError, "Impossible de retrouver la sortie à notifier.")
    const event = eventReference ? await findEvent(eventReference.slug) : null
    if (!event?.organizer_email) {
      await db.from("bima_notification_deliveries").update({ status: "failed", last_error: "E-mail organisateur absent.", updated_at: new Date().toISOString() }).eq("id", delivery.id)
      continue
    }
    const [organizerResult, payload] = await Promise.all([
      db.from("bima_participants").select("id").eq("event_id", event.id).eq("role", "organizer").maybeSingle(),
      readEvent(event.slug),
    ])
    assertDatabase(organizerResult.error, "Impossible de retrouver l’organisateur.")
    if (!organizerResult.data || !payload) {
      await db.from("bima_notification_deliveries").update({ status: "failed", last_error: "Organisateur introuvable.", updated_at: new Date().toISOString() }).eq("id", delivery.id)
      continue
    }
    const manageShortCode = await createShortLink("manage", event.id, organizerResult.data.id)
    const bestDate = [...payload.event.dates].sort((a, b) => b.availableCount - a.availableCount)[0] || null
    jobs.push({
      id: delivery.id,
      kind: delivery.kind,
      to: event.organizer_email,
      organizerName: event.organizer_name,
      eventTitle: event.title,
      managePath: `/m/${encodeURIComponent(manageShortCode)}`,
      payload: delivery.payload || {},
      participantCount: payload.summary.participantCount,
      maxPlaces: event.max_places,
      bestDate,
      eventType: event.event_type === "stay" ? "stay" : "outing",
    })
  }
  return json({ jobs })
}

async function completeNotifications(request: Request, authorization?: boolean) {
  const authorized = authorization ?? await hasNotificationAccess(request)
  if (!authorized) return json({ error: "Accès refusé." }, 401)
  const body = await request.json().catch(() => ({}))
  const results = Array.isArray(body.results) ? body.results.slice(0, 50) : []
  for (const result of results) {
    const id = cleanText(result.id, 80)
    if (!id || typeof result.sent !== "boolean") continue
    const now = new Date().toISOString()
    const { error } = await db.from("bima_notification_deliveries").update({
      status: result.sent ? "sent" : "failed",
      sent_at: result.sent ? now : null,
      last_error: result.sent ? null : cleanText(result.error, 500) || "Échec de l’envoi.",
      updated_at: now,
    }).eq("id", id).eq("status", "processing")
    assertDatabase(error, "Impossible de finaliser une notification.")
  }
  return json({ ok: true, processed: results.length })
}

function escapeIcsText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("\r\n", "\\n").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;")
}

function toIcsTimestamp(value: Date) {
  return value.toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z")
}

function toIcsDate(value: string) {
  return value.slice(0, 10).replaceAll("-", "")
}

function addUtcDays(value: string, days: number) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

async function calendar(slug: string) {
  const payload = await readEvent(slug)
  if (!payload) return json({ error: "Cette sortie n’existe pas." }, 404)
  const event = payload.event
  const selectedDate = event.dates.find((date: { id: string }) => date.id === event.confirmedDateId)
  if (!selectedDate) return json({ error: "La date doit être confirmée avant de télécharger le calendrier." }, 409)
  const startsAt = new Date(selectedDate.startsAt)
  const endsAt = new Date(startsAt.getTime() + 3 * 60 * 60 * 1000)
  const isStay = event.eventType === "stay" && Boolean(selectedDate.endsAt)
  const firstPlace = event.places[0]
  const programme = event.places.map((place: { name: string; address?: string }, index: number) => `${index + 1}. ${place.name}${place.address ? ` — ${place.address}` : ""}`).join("\n")
  const description = [`Sortie organisée avec BIMA par ${event.organizerName}.`, programme ? `Programme :\n${programme}` : ""].filter(Boolean).join("\n\n")
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BIMA//Sorties//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${escapeIcsText(event.slug)}@bima.app`, `DTSTAMP:${toIcsTimestamp(new Date())}`,
    isStay ? `DTSTART;VALUE=DATE:${toIcsDate(selectedDate.startsAt)}` : `DTSTART:${toIcsTimestamp(startsAt)}`,
    isStay ? `DTEND;VALUE=DATE:${toIcsDate(addUtcDays(selectedDate.endsAt, 1))}` : `DTEND:${toIcsTimestamp(endsAt)}`,
    `SUMMARY:${escapeIcsText(event.title)}`, `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(firstPlace?.address || event.city)}`, firstPlace?.mapsUrl ? `URL:${firstPlace.mapsUrl}` : "",
    "STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR", "",
  ].filter(Boolean)
  return new Response(`${lines.join("\r\n")}\r\n`, {
    headers: { ...corsHeaders, "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="bima-${event.slug}.ics"`, "Cache-Control": "no-store" },
  })
}

let adminTokenHashCache: { value: string; expiresAt: number } | null = null

async function adminTokenHash() {
  if (adminTokenHashCache && adminTokenHashCache.expiresAt > Date.now()) return adminTokenHashCache.value
  const { data, error } = await db.from("bima_config").select("value").eq("key", "admin_token_sha256").maybeSingle()
  assertDatabase(error, "Impossible de vérifier l’accès administrateur.")
  const value = cleanText(data?.value, 128)
  adminTokenHashCache = { value, expiresAt: Date.now() + 60_000 }
  return value
}

async function isAdmin(request: Request) {
  const supplied = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim()
  if (!supplied) return false
  return constantTimeEqual(await sha256(supplied), await adminTokenHash())
}

async function adminData(request: Request, authorization?: boolean) {
  const authorized = authorization ?? await isAdmin(request)
  if (!authorized) return json({ error: "Clé administrateur invalide." }, 401)
  const [eventsResult, placesResult, datesResult, participantsResult, votesResult, stageVotesResult] = await Promise.all([
    db.from("bima_events").select("id,slug,title,organizer_name,organizer_email,city,max_places,budget_eur,response_deadline,confirmed_date_id,event_type,created_at,updated_at").order("created_at", { ascending: false }).limit(500),
    db.from("bima_places").select("id,event_id,position,start_time,name,address,category,maps_url").order("position").limit(1000),
    db.from("bima_date_options").select("id,event_id,position,starts_at,ends_at").order("position").limit(2000),
    db.from("bima_participants").select("id,event_id,name,role,created_at,updated_at").order("created_at", { ascending: false }).limit(2000),
    db.from("bima_date_votes").select("participant_id,date_option_id,available,updated_at").order("updated_at", { ascending: false }).limit(5000),
    db.from("bima_stage_votes").select("participant_id,place_id,attending,updated_at").order("updated_at", { ascending: false }).limit(5000),
  ])
  for (const result of [eventsResult, placesResult, datesResult, participantsResult, votesResult, stageVotesResult]) assertDatabase(result.error, "Impossible de charger les données administrateur.")
  const events = eventsResult.data || []
  const places = placesResult.data || []
  const dates = datesResult.data || []
  const participants = participantsResult.data || []
  const votes = votesResult.data || []
  const stageVotes = stageVotesResult.data || []
  const eventById = new Map(events.map((event) => [event.id, event]))
  const participantById = new Map(participants.map((participant) => [participant.id, participant]))
  const dateById = new Map(dates.map((date) => [date.id, date]))
  const placeById = new Map(places.map((place) => [place.id, place]))
  const participantsPerEvent = new Map<string, number>()
  for (const participant of participants) participantsPerEvent.set(participant.event_id, (participantsPerEvent.get(participant.event_id) || 0) + 1)
  const availablePerDate = new Map<string, number>()
  const responsesPerDate = new Map<string, number>()
  for (const vote of votes) {
    responsesPerDate.set(vote.date_option_id, (responsesPerDate.get(vote.date_option_id) || 0) + 1)
    if (vote.available) availablePerDate.set(vote.date_option_id, (availablePerDate.get(vote.date_option_id) || 0) + 1)
  }
  return json({
    generatedAt: new Date().toISOString(),
    summary: { events: events.length, places: places.length, dates: dates.length, participants: participants.length, votes: votes.length, stageVotes: stageVotes.length },
    events: events.map((event) => ({ ...event, participant_count: participantsPerEvent.get(event.id) || 0 })),
    places: places.map((place) => ({ ...place, event_title: eventById.get(place.event_id)?.title || "" })),
    dates: dates.map((date) => ({ ...date, event_title: eventById.get(date.event_id)?.title || "", confirmed: eventById.get(date.event_id)?.confirmed_date_id === date.id ? 1 : 0, available_count: availablePerDate.get(date.id) || 0, response_count: responsesPerDate.get(date.id) || 0 })),
    participants: participants.map((participant) => ({ ...participant, event_title: eventById.get(participant.event_id)?.title || "" })),
    votes: votes.map((vote) => {
      const participant = participantById.get(vote.participant_id)
      const date = dateById.get(vote.date_option_id)
      return { ...vote, event_title: participant ? eventById.get(participant.event_id)?.title || "" : "", participant_name: participant?.name || "", role: participant?.role || "guest", starts_at: date?.starts_at || null, ends_at: date?.ends_at || null }
    }),
    stageVotes: stageVotes.map((vote) => {
      const participant = participantById.get(vote.participant_id)
      const place = placeById.get(vote.place_id)
      return { ...vote, event_title: participant ? eventById.get(participant.event_id)?.title || "" : "", participant_name: participant?.name || "", role: participant?.role || "guest", stage_position: place?.position ?? null, stage_name: place?.name || "" }
    }),
  })
}

type AdminSection = "events" | "places" | "participants" | "votes" | "stageVotes" | "dates"
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function adminDelete(request: Request, authorization?: boolean) {
  const authorized = authorization ?? await isAdmin(request)
  if (!authorized) return json({ error: "Clé administrateur invalide." }, 401)
  const body = await request.json().catch(() => null) as { section?: AdminSection; id?: string; participantId?: string; relatedId?: string } | null
  const section = body?.section
  if (!section || !["events", "places", "participants", "votes", "stageVotes", "dates"].includes(section)) {
    return json({ error: "Type de donnée invalide." }, 400)
  }

  const id = cleanText(body?.id, 50)
  const participantId = cleanText(body?.participantId, 50)
  const relatedId = cleanText(body?.relatedId, 50)
  if ([id, participantId, relatedId].filter(Boolean).some((value) => !uuidPattern.test(value))) {
    return json({ error: "Identifiant invalide." }, 400)
  }

  if (section === "events") {
    if (!id) return json({ error: "Sortie introuvable." }, 400)
    const { error, count } = await db.from("bima_events").delete({ count: "exact" }).eq("id", id)
    assertDatabase(error, "Impossible de supprimer la sortie.")
    if (!count) return json({ error: "Cette sortie n’existe plus." }, 404)
    return json({ ok: true })
  }

  if (section === "participants") {
    if (!id) return json({ error: "Participant introuvable." }, 400)
    const { data: participant, error: readError } = await db.from("bima_participants").select("role").eq("id", id).maybeSingle()
    assertDatabase(readError, "Impossible de vérifier le participant.")
    if (!participant) return json({ error: "Ce participant n’existe plus." }, 404)
    if (participant.role === "organizer") return json({ error: "Supprime la sortie entière pour retirer son organisateur." }, 409)
    const { error } = await db.from("bima_participants").delete().eq("id", id)
    assertDatabase(error, "Impossible de supprimer le participant.")
    return json({ ok: true })
  }

  if (section === "places" || section === "dates") {
    if (!id) return json({ error: "Ligne introuvable." }, 400)
    const table = section === "places" ? "bima_places" : "bima_date_options"
    const { data: row, error: readError } = await db.from(table).select("event_id").eq("id", id).maybeSingle()
    assertDatabase(readError, "Impossible de vérifier la ligne.")
    if (!row) return json({ error: "Cette ligne n’existe plus." }, 404)
    const { count, error: countError } = await db.from(table).select("id", { count: "exact", head: true }).eq("event_id", row.event_id)
    assertDatabase(countError, "Impossible de vérifier la sortie.")
    if ((count || 0) <= 1) return json({ error: section === "places" ? "Une sortie doit conserver au moins un lieu." : "Une sortie doit conserver au moins une date." }, 409)
    const { error } = await db.from(table).delete().eq("id", id)
    assertDatabase(error, "Impossible de supprimer la ligne.")
    return json({ ok: true })
  }

  if (!participantId || !relatedId) return json({ error: "Réponse introuvable." }, 400)
  const table = section === "votes" ? "bima_date_votes" : "bima_stage_votes"
  const relatedColumn = section === "votes" ? "date_option_id" : "place_id"
  const { error, count } = await db.from(table).delete({ count: "exact" }).eq("participant_id", participantId).eq(relatedColumn, relatedId)
  assertDatabase(error, "Impossible de supprimer la réponse.")
  if (!count) return json({ error: "Cette réponse n’existe plus." }, 404)
  return json({ ok: true })
}

async function readShortLink(kind: "manage" | "participant", code: string) {
  const link = await findShortLink(code, kind)
  if (!link) return json({ error: "Ce lien court n’existe pas ou n’est plus disponible." }, 404)
  const { data: event, error } = await db.from("bima_events").select("slug").eq("id", link.event_id).maybeSingle()
  assertDatabase(error, "Impossible de charger ce lien court.")
  if (!event) return json({ error: "Cette sortie n’existe plus." }, 404)
  const payload = await readEvent(
    event.slug,
    null,
    null,
    kind === "manage" ? code : null,
    kind === "participant" ? code : null,
  )
  return json({
    ...payload,
    manageShortCode: kind === "manage" ? code : undefined,
    participantShortCode: code,
  })
}

const googleShortLinkHosts = new Set(["maps.app.goo.gl", "goo.gl"])
function isGoogleHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "")
  return googleShortLinkHosts.has(host) || /^(?:[a-z0-9-]+\.)*google\.(?:[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})$/.test(host)
}
function isGoogleMapsUrl(url: URL) {
  if (url.protocol !== "https:" || !isGoogleHost(url.hostname)) return false
  if (googleShortLinkHosts.has(url.hostname)) return false
  return url.hostname.startsWith("maps.google.") || url.pathname.startsWith("/maps") || url.searchParams.has("query") || url.searchParams.has("q")
}
function decodeHtml(value: string) { return value.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("\\u003d", "=").replaceAll("\\u0026", "&") }
function readMetaContent(html: string, key: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) || []
  for (const tag of tags) {
    const property = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1]
    if (property?.toLowerCase() !== key.toLowerCase()) continue
    return decodeHtml(tag.match(/content=["']([^"']*)["']/i)?.[1] || "")
  }
  return ""
}
function cleanPlaceName(value: string) {
  const cleaned = decodeURIComponent(value).replace(/\+/g, " ").replace(/\s+-\s+Google Maps.*$/i, "").trim()
  return /^EgR[a-z0-9_-]{40,}$/i.test(cleaned) ? "" : cleaned
}
function decodeMapName(url: URL) {
  const placeMatch = url.pathname.match(/\/maps\/place\/([^/]+)/)
  if (placeMatch) return cleanPlaceName(placeMatch[1])
  const queryName = url.searchParams.get("query") || url.searchParams.get("q")
  return queryName && !/^[-+]?\d+(?:\.\d+)?,\s*[-+]?\d+(?:\.\d+)?$/.test(queryName) ? cleanPlaceName(queryName.split(",")[0]) : ""
}
async function fetchMaps(url: URL, redirect: RequestRedirect = "follow") {
  return fetch(url, { redirect, headers: { "accept-language": "fr-FR,fr;q=0.9,en;q=0.7", "user-agent": "Mozilla/5.0 Chrome/126 Safari/537.36" }, signal: AbortSignal.timeout(15000) })
}
async function resolveMaps(initialUrl: URL) {
  let currentUrl = initialUrl
  for (let count = 0; count < 5; count += 1) {
    const response = await fetchMaps(currentUrl, "manual")
    const location = response.headers.get("location")
    if (response.status < 300 || response.status >= 400 || !location) return { response, resolvedUrl: currentUrl }
    const nextUrl = new URL(location, currentUrl)
    if (nextUrl.protocol !== "https:" || !isGoogleHost(nextUrl.hostname)) throw new Error("Redirection Google Maps invalide.")
    currentUrl = nextUrl
  }
  throw new Error("Trop de redirections Google Maps.")
}
async function resolvePlace(request: Request) {
  let submittedUrl: URL
  try { const body = await request.json(); submittedUrl = new URL(body.url?.trim() || "") } catch { return json({ error: "Colle un lien Google Maps classique." }, 400) }
  if (!isGoogleMapsUrl(submittedUrl)) return json({ error: "Ce lien n’est pas reconnu. Utilise un lien Google Maps classique, ou laisse le champ vide." }, 400)
  let resolvedUrl = submittedUrl
  let html = ""
  try {
    const result = await resolveMaps(submittedUrl)
    if (result.response.status === 404) return json({ error: "Ce lien Google Maps ne fonctionne plus. Ouvre le lieu dans Google Maps et partage un nouveau lien." }, 400)
    if (isGoogleMapsUrl(result.resolvedUrl)) resolvedUrl = result.resolvedUrl
    if (result.response.ok) html = await result.response.text()
  } catch { /* Return a partial card when Google blocks metadata. */ }
  const nameFromUrl = decodeMapName(resolvedUrl) || decodeMapName(submittedUrl)
  const ogTitle = readMetaContent(html, "og:title") || decodeHtml(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "")
  const ogImage = readMetaContent(html, "og:image")
  const rating = html.match(/([1-5](?:[.,]\d))\s*(?:étoiles|stars)/i)?.[1]?.replace(".", ",") || "—"
  return json({
    place: {
      name: nameFromUrl || cleanPlaceName(ogTitle) || "Lieu Google Maps",
      rating,
      ratingLabel: rating === "—" ? "Consulter la note" : "Note Google",
      price: "Google Maps",
      address: "Adresse disponible dans Google Maps",
      category: "Lieu Google Maps",
      hours: "Voir les horaires sur Maps",
      image: ogImage,
    },
    resolvedUrl: resolvedUrl.toString(),
  })
}

async function organizerRateLimited(
  request: Request,
  slug: string,
  operation: () => Promise<Response>,
) {
  const body = await request.clone().json().catch(() => ({}))
  const event = await findEvent(slug)
  const authorized = Boolean(event) && await hasManageAccess(
    event,
    cleanText(body.manageToken, 128),
    cleanText(body.manageShortCode, 64),
  )
  const policy = authorized
    ? { ...rateLimitPolicies.organizerMutation, discriminator: slug }
    : { ...rateLimitPolicies.organizerInvalid, discriminator: slug }
  return await rateLimited(request, policy, operation)
}

async function voteRateLimited(
  request: Request,
  slug: string,
  operation: () => Promise<Response>,
) {
  const body = await request.clone().json().catch(() => ({}))
  const personalCredential = cleanText(
    body.participantToken || body.participantShortCode || body.manageShortCode,
    128,
  )
  const networkPolicy = { ...rateLimitPolicies.voteNetwork, discriminator: slug }
  return await rateLimited(request, networkPolicy, async () => {
    if (!personalCredential) return await operation()
    const participantKey = await sha256(`${slug}:${personalCredential}`)
    return await rateLimited(
      request,
      { ...rateLimitPolicies.voteParticipant, discriminator: participantKey },
      operation,
    )
  })
}

async function adminRateLimited(
  request: Request,
  validPolicy: RateLimitPolicy,
  operation: (authorized: boolean) => Promise<Response>,
) {
  const authorized = await isAdmin(request)
  const policy = authorized ? validPolicy : rateLimitPolicies.adminInvalid
  return await rateLimited(request, policy, () => operation(authorized))
}

async function notificationRateLimited(
  request: Request,
  operation: (authorized: boolean) => Promise<Response>,
) {
  const authorized = await hasNotificationAccess(request)
  const policy = authorized ? rateLimitPolicies.notificationValid : rateLimitPolicies.notificationInvalid
  return await rateLimited(request, policy, () => operation(authorized))
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders })
  try {
    const url = new URL(request.url)
    const marker = "/bima-api"
    const markerIndex = url.pathname.indexOf(marker)
    const route = markerIndex >= 0 ? url.pathname.slice(markerIndex + marker.length) || "/" : url.pathname
    if (request.method === "GET" && route === "/health") return json({ ok: true, service: "bima-api" })
    if (request.method === "POST" && route === "/api/places") {
      return await rateLimited(request, rateLimitPolicies.placePreviewDaily, () => (
        rateLimited(request, rateLimitPolicies.placePreview, () => resolvePlace(request))
      ))
    }
    if (request.method === "POST" && route === "/api/events") {
      return await rateLimited(request, rateLimitPolicies.createAttemptDaily, () => (
        rateLimited(request, rateLimitPolicies.createAttempt, () => createEvent(request))
      ))
    }
    if (request.method === "POST" && route === "/api/notifications/process") {
      return await notificationRateLimited(request, (authorized) => processNotifications(request, authorized))
    }
    if (request.method === "POST" && route === "/api/notifications/complete") {
      return await notificationRateLimited(request, (authorized) => completeNotifications(request, authorized))
    }
    if (request.method === "GET" && route === "/api/admin/data") {
      return await adminRateLimited(
        request,
        rateLimitPolicies.adminRead,
        (authorized) => adminData(request, authorized),
      )
    }
    if (request.method === "POST" && route === "/api/admin/delete") {
      return await adminRateLimited(
        request,
        rateLimitPolicies.adminDelete,
        (authorized) => adminDelete(request, authorized),
      )
    }
    const shortMatch = route.match(/^\/api\/short\/(manage|participant)\/([^/]+)$/)
    if (request.method === "GET" && shortMatch) {
      return await rateLimited(request, rateLimitPolicies.shortLinkRead, () => (
        readShortLink(shortMatch[1] as "manage" | "participant", decodeURIComponent(shortMatch[2]))
      ))
    }
    const participantDeleteMatch = route.match(/^\/api\/events\/([^/]+)\/participants\/([^/]+)\/delete$/)
    if (request.method === "POST" && participantDeleteMatch) {
      const slug = decodeURIComponent(participantDeleteMatch[1])
      return await organizerRateLimited(
        request,
        slug,
        () => deleteParticipant(
          request,
          slug,
          decodeURIComponent(participantDeleteMatch[2]),
        ),
      )
    }
    const match = route.match(/^\/api\/events\/([^/]+)(?:\/(votes|confirm|calendar|delete|notifications))?$/)
    if (match) {
      const slug = decodeURIComponent(match[1])
      const action = match[2]
      if (request.method === "GET" && !action) {
        return await rateLimited(request, rateLimitPolicies.eventRead, async () => (
          json(await readEvent(
            slug,
            url.searchParams.get("manage"),
            url.searchParams.get("participant"),
            url.searchParams.get("manageShort"),
            url.searchParams.get("participantShort"),
          ))
        ))
      }
      if (request.method === "PATCH" && !action) {
        return await organizerRateLimited(
          request,
          slug,
          () => updateEvent(request, slug),
        )
      }
      if (request.method === "POST" && action === "votes") {
        return await voteRateLimited(
          request,
          slug,
          () => submitVote(request, slug),
        )
      }
      if (request.method === "POST" && action === "notifications") {
        return await organizerRateLimited(
          request,
          slug,
          () => updateNotificationPreferences(request, slug),
        )
      }
      if (request.method === "POST" && action === "confirm") {
        return await organizerRateLimited(
          request,
          slug,
          () => confirmDate(request, slug),
        )
      }
      if (request.method === "POST" && action === "delete") {
        return await organizerRateLimited(
          request,
          slug,
          () => deleteEvent(request, slug),
        )
      }
      if (request.method === "GET" && action === "calendar") {
        return await rateLimited(
          request,
          { ...rateLimitPolicies.calendar, discriminator: slug },
          () => calendar(slug),
        )
      }
    }
    return json({ error: "Route introuvable." }, 404)
  } catch (error) {
    console.error(error)
    return json({ error: error instanceof Error ? error.message : "Une erreur est survenue." }, 500)
  }
})
