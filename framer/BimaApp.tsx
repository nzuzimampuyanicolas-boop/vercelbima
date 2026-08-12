import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

type Place = {
    id?: string
    position?: number
    startTime?: string | null
    mapsUrl: string
    name: string
    rating?: string | null
    ratingLabel?: string | null
    address?: string | null
    category?: string | null
    hours?: string | null
    image?: string | null
}

type DateOption = {
    id: string
    position: number
    startsAt: string
    availableCount: number
}

type EventData = {
    slug: string
    organizerName: string
    title: string
    city: string
    maxPlaces: number
    budgetEur: number | null
    responseDeadline: string | null
    confirmedDateId: string | null
    status: "collecting" | "confirmed"
    places: Place[]
    dates: DateOption[]
}

type Voter = {
    id: string
    name: string
    role: "organizer" | "guest"
    answers: Record<string, boolean>
}

type EventPayload = {
    event: EventData
    summary: { participantCount: number; guestCount: number }
    manage: boolean
    voters?: Voter[]
    manageToken?: string
    sharePath?: string
    managePath?: string
}

type BimaAppProps = {
    apiBaseUrl: string
    logo?: string
    logoAlt: string
    brandText: string
    eyebrowText: string
    heroTitleLine1: string
    heroTitleLine2: string
    heroTitleAccent: string
    heroDescription: string
    primaryCta: string
    microcopy: string
    demoBadge: string
    demoTitle: string
    demoMeta: string
    demoDate1: string
    demoDate2: string
    demoDate3: string
    accent: string
    backgroundColor: string
    surfaceColor: string
    textColor: string
    mutedColor: string
    buttonColor: string
    buttonTextColor: string
    successColor: string
}

const DEFAULT_API = "https://ebilhzvgvinbpmmpezua.supabase.co/functions/v1/bima-api"
const joyaId = "kJWq5w12eQCtk3628"
const loulouId = "eTx2ryAgN2yK7XDBA"

const knownPlaces: Array<{ id: string; place: Place }> = [
    {
        id: joyaId,
        place: {
            mapsUrl: `https://maps.app.goo.gl/${joyaId}`,
            name: "JOYA",
            rating: "4,7",
            ratingLabel: "Note Google",
            address: "47 Rue Saint-Charles, 75015 Paris",
            category: "Trattoria · Pizza italienne",
            hours: "Voir les horaires sur Maps",
            image: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnwZ2ITemhSgKDYMcP8cFxXhOyriV3D2wpkWOcmkP3A7GeWL1e72gwK8RGtD9IyFsj6Gvz1jwGv7G6jlLATi2D6gdwAV3SVS2z4fcigF3K_PVtPHUOvm_69V3Om_GRDUfGldMKh=w408-h271-k-no",
        },
    },
    {
        id: loulouId,
        place: {
            mapsUrl: `https://maps.app.goo.gl/${loulouId}`,
            name: "Loulou",
            rating: "4,6",
            ratingLabel: "Note Google",
            address: "90 Bd Saint-Germain, 75005 Paris",
            category: "Restaurant australien",
            hours: "Voir les horaires sur Maps",
            image: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlue1qC-x0WO-2b88mGYXgfOcAHZu_uEL80eAuzsdJ2MD1f-XU-JPXQGiKkRREQN1-OSpS-G_-J4vyVXeLgktYnmasy5DhYGHnmI-AUvI4uyOdY5zQHmzXTU_f0rVLOZ01lxqQbmw=w408-h271-k-no",
        },
    },
]

function apiUrl(base: string, path: string) {
    return `${base.replace(/\/$/, "")}${path}`
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...init,
        headers: { "content-type": "application/json", ...(init?.headers || {}) },
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || "Une erreur est survenue.")
    return payload
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value))
}

function initialDate(days: number, hour: number) {
    const date = new Date()
    date.setDate(date.getDate() + days)
    date.setHours(hour, 30, 0, 0)
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 16)
}

function getCurrentUrl(path: string) {
    if (typeof window === "undefined") return path
    return `${window.location.origin}${window.location.pathname}${path}`
}

function Brand({
    logo,
    logoAlt,
    brandText,
}: {
    logo?: string
    logoAlt: string
    brandText: string
}) {
    if (logo) return <img className="brand-logo" src={logo} alt={logoAlt} />
    if (brandText.toLowerCase() === "bima") {
        return <div className="bima-brand">bi<span>ma</span><i>.</i></div>
    }
    return <div className="bima-brand custom">{brandText}</div>
}

function Button({
    children,
    secondary,
    disabled,
    onClick,
    type = "button",
}: {
    children: React.ReactNode
    secondary?: boolean
    disabled?: boolean
    onClick?: () => void
    type?: "button" | "submit"
}) {
    return (
        <button
            type={type}
            className={`bima-button ${secondary ? "secondary" : ""}`}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    )
}

function PlaceCard({ place, step }: { place: Place; step?: number }) {
    return (
        <article className="place-card">
            {place.image ? <img src={place.image} alt="" /> : <div className="place-fallback">G</div>}
            <div className="place-copy">
                <small>{step ? `ÉTAPE ${step} · ` : ""}GOOGLE MAPS</small>
                <h3>{place.name}</h3>
                <div className="rating">
                    <b>{place.rating || "—"}</b><span>★★★★★</span>
                    <em>{place.ratingLabel || "Consulter la note"}</em>
                </div>
                <p>{place.address || "Adresse disponible dans Google Maps"}</p>
                <strong>{place.category || "Lieu Google Maps"}</strong>
            </div>
            <a href={place.mapsUrl} target="_blank" rel="noreferrer">↗</a>
        </article>
    )
}

export default function BimaApp({
    apiBaseUrl = DEFAULT_API,
    logo,
    logoAlt = "Logo BIMA",
    brandText = "bima",
    eyebrowText = "● ENFIN, ON SE DÉCIDE",
    heroTitleLine1 = "La sortie qui",
    heroTitleLine2 = "sort du",
    heroTitleAccent = "groupe.",
    heroDescription = "Propose des dates, partage le lien et laisse chacun voter. Sans compte et sans 147 messages.",
    primaryCta = "Créer une sortie",
    microcopy = "Gratuit · Aucun compte requis",
    demoBadge = "4 RÉPONSES",
    demoTitle = "Brunch d'été ☀️",
    demoMeta = "Paris · 8 personnes max.",
    demoDate1 = "Samedi 16 août",
    demoDate2 = "Vendredi 22 août",
    demoDate3 = "Samedi 23 août",
    accent = "#E65E38",
    backgroundColor = "#F4F1E8",
    surfaceColor = "#FFFDF8",
    textColor = "#161714",
    mutedColor = "#68675F",
    buttonColor = "#161714",
    buttonTextColor = "#FFFFFF",
    successColor = "#237433",
}: BimaAppProps) {
    const [route, setRoute] = React.useState<"home" | "create" | "share" | "guest" | "manage">("home")
    const [slug, setSlug] = React.useState("")
    const [manageToken, setManageToken] = React.useState("")
    const [payload, setPayload] = React.useState<EventPayload | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState("")
    const [toast, setToast] = React.useState("")

    const [organizerName, setOrganizerName] = React.useState("Camille")
    const [title, setTitle] = React.useState("Brunch d'été ☀️")
    const [city, setCity] = React.useState("Paris")
    const [maxPlaces, setMaxPlaces] = React.useState(8)
    const [budget, setBudget] = React.useState(30)
    const [deadline, setDeadline] = React.useState(() => initialDate(5, 18).slice(0, 10))
    const [mapsUrls, setMapsUrls] = React.useState([
        `https://maps.app.goo.gl/${joyaId}`,
        `https://maps.app.goo.gl/${loulouId}`,
    ])
    const [places, setPlaces] = React.useState<Array<Place | null>>([
        knownPlaces[0].place,
        knownPlaces[1].place,
    ])
    const [dates, setDates] = React.useState([initialDate(10, 19), initialDate(16, 20)])
    const [guestName, setGuestName] = React.useState("")
    const [answers, setAnswers] = React.useState<Record<string, boolean>>({})

    const showToast = React.useCallback((message: string) => {
        setToast(message)
        window.setTimeout(() => setToast(""), 2200)
    }, [])

    const loadEvent = React.useCallback(async (eventSlug: string, token?: string) => {
        setLoading(true)
        setError("")
        try {
            const data = await requestJson<EventPayload>(
                apiUrl(apiBaseUrl, `/api/events/${encodeURIComponent(eventSlug)}${token ? `?manage=${encodeURIComponent(token)}` : ""}`)
            )
            setPayload(data)
            setSlug(eventSlug)
            setManageToken(token || "")
            setRoute(token ? "manage" : "guest")
            if (!token && typeof window !== "undefined") {
                const savedToken = window.localStorage.getItem(`bima:${eventSlug}:participant`)
                if (savedToken) {
                    const savedName = window.localStorage.getItem(`bima:${eventSlug}:name`)
                    if (savedName) setGuestName(savedName)
                }
            }
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Sortie introuvable.")
        } finally {
            setLoading(false)
        }
    }, [apiBaseUrl])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const params = new URLSearchParams(window.location.search)
        const eventSlug = params.get("event")
        const token = params.get("manage")
        if (eventSlug) void loadEvent(eventSlug, token || undefined)
    }, [loadEvent])

    async function previewPlace(index: number) {
        const value = mapsUrls[index].trim()
        if (!value) return
        const known = knownPlaces.find((candidate) => value.includes(candidate.id))
        if (known) {
            const next = [...places]
            next[index] = { ...known.place, mapsUrl: value }
            setPlaces(next)
            showToast(`${known.place.name} reconnu`)
            return
        }
        setLoading(true)
        setError("")
        try {
            const data = await requestJson<{ place: Place }>(apiUrl(apiBaseUrl, "/api/places"), {
                method: "POST",
                body: JSON.stringify({ url: value }),
            })
            const next = [...places]
            next[index] = { ...data.place, mapsUrl: value }
            setPlaces(next)
            showToast(`${data.place.name} reconnu`)
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Lien Google Maps invalide.")
        } finally {
            setLoading(false)
        }
    }

    async function createEvent(event: React.FormEvent) {
        event.preventDefault()
        setLoading(true)
        setError("")
        try {
            const validPlaces = places.filter((place): place is Place => Boolean(place))
            if (!validPlaces.length) throw new Error("Prévisualise au moins un lieu.")
            const data = await requestJson<EventPayload>(apiUrl(apiBaseUrl, "/api/events"), {
                method: "POST",
                body: JSON.stringify({
                    organizerName,
                    title,
                    city,
                    maxPlaces: Math.max(2, Math.round(maxPlaces)),
                    budgetEur: Math.max(10, Math.round(budget / 10) * 10),
                    responseDeadline: deadline,
                    places: validPlaces.map((place, index) => ({
                        ...place,
                        startTime: index === 0 ? "12:30" : "15:30",
                    })),
                    dates: dates.map((date) => new Date(date).toISOString()),
                }),
            })
            setPayload(data)
            setSlug(data.event.slug)
            setManageToken(data.manageToken || "")
            setRoute("share")
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Création impossible.")
        } finally {
            setLoading(false)
        }
    }

    async function submitVote(participantToken?: string) {
        if (!payload || (!participantToken && !guestName.trim())) {
            setError("Indique ton prénom.")
            return
        }
        setLoading(true)
        setError("")
        try {
            const data = await requestJson<EventPayload & { participantToken: string; role: "organizer" | "guest" }>(
                apiUrl(apiBaseUrl, `/api/events/${payload.event.slug}/votes`),
                {
                    method: "POST",
                    body: JSON.stringify({
                        name:
                            participantToken && payload.manage
                                ? guestName.trim() || payload.event.organizerName
                                : guestName,
                        participantToken,
                        availableDateIds: payload.event.dates
                            .filter((date) => answers[date.id])
                            .map((date) => date.id),
                    }),
                }
            )
            if (typeof window !== "undefined" && data.role !== "organizer") {
                window.localStorage.setItem(`bima:${payload.event.slug}:participant`, data.participantToken)
                window.localStorage.setItem(`bima:${payload.event.slug}:name`, guestName)
            }
            setPayload(data)
            showToast("Disponibilités enregistrées")
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Vote impossible.")
        } finally {
            setLoading(false)
        }
    }

    async function submitOrganizerVote() {
        await submitVote(manageToken)
        if (slug) await loadEvent(slug, manageToken)
    }

    async function confirmDate(dateId: string) {
        if (!payload) return
        setLoading(true)
        setError("")
        try {
            const data = await requestJson<EventPayload>(
                apiUrl(apiBaseUrl, `/api/events/${payload.event.slug}/confirm`),
                {
                    method: "POST",
                    body: JSON.stringify({ manageToken, dateId }),
                }
            )
            setPayload(data)
            showToast("La date est confirmée")
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Confirmation impossible.")
        } finally {
            setLoading(false)
        }
    }

    async function copy(text: string) {
        await navigator.clipboard.writeText(text)
        showToast("Lien copié")
    }

    const eventData = payload?.event
    const publicUrl = slug ? getCurrentUrl(`?event=${encodeURIComponent(slug)}`) : ""
    const manageUrl = slug && manageToken
        ? getCurrentUrl(`?event=${encodeURIComponent(slug)}&manage=${encodeURIComponent(manageToken)}`)
        : ""

    return (
        <div
            className="bima-root"
            style={{
                "--accent": accent,
                "--paper": backgroundColor,
                "--card": surfaceColor,
                "--ink": textColor,
                "--muted": mutedColor,
                "--button": buttonColor,
                "--button-text": buttonTextColor,
                "--success": successColor,
            } as React.CSSProperties}
        >
            <style>{styles}</style>
            <header className="bima-header">
                <Brand logo={logo} logoAlt={logoAlt} brandText={brandText} />
                {route !== "home" && <button className="text-button" onClick={() => setRoute("home")}>Accueil</button>}
            </header>

            {route === "home" && (
                <main className="hero-screen">
                    <div className="hero-copy">
                        <small className="eyebrow">{eyebrowText}</small>
                        <h1>{heroTitleLine1}<br />{heroTitleLine2}<br /><em>{heroTitleAccent}</em></h1>
                        <p>{heroDescription}</p>
                        <Button onClick={() => setRoute("create")}>{primaryCta} <span>→</span></Button>
                        <small>{microcopy}</small>
                    </div>
                    <div className="hero-card">
                        <span className="tag">{demoBadge}</span>
                        <h2>{demoTitle}</h2>
                        <p>{demoMeta}</p>
                        {[demoDate1, demoDate2, demoDate3].map((date, index) => (
                            <div className={`demo-date ${index === 2 ? "winner" : ""}`} key={date}>
                                <b>{date}</b><span>{index === 2 ? "5/5" : `${index + 2}/5`}</span>
                            </div>
                        ))}
                    </div>
                </main>
            )}

            {route === "create" && (
                <main className="content-page">
                    <div className="page-heading">
                        <small className="eyebrow">CRÉER UNE SORTIE</small>
                        <h1>On organise quoi ?</h1>
                        <p>Tout ce formulaire sera réellement enregistré.</p>
                    </div>
                    <form className="form-card" onSubmit={createEvent}>
                        <div className="form-grid">
                            <label><span>Ton prénom</span><input value={organizerName} onChange={e => setOrganizerName(e.target.value)} /></label>
                            <label><span>Nom de la sortie</span><input value={title} onChange={e => setTitle(e.target.value)} /></label>
                            <label><span>Ville</span><input value={city} onChange={e => setCity(e.target.value)} /></label>
                            <label><span>Nombre de places</span><input type="number" min={2} value={maxPlaces} onChange={e => setMaxPlaces(Math.max(2, Number(e.target.value)))} /></label>
                            <label><span>Budget par personne</span><input type="number" min={10} step={10} value={budget} onChange={e => setBudget(Math.max(10, Number(e.target.value)))} /></label>
                            <label><span>Répondre avant</span><input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} /></label>
                        </div>

                        <div className="section-title"><small>ITINÉRAIRE</small><h2>Jusqu'à deux lieux</h2></div>
                        {mapsUrls.map((url, index) => (
                            <div className="place-builder" key={index}>
                                <label>
                                    <span>{index + 1}. Lien Google Maps</span>
                                    <div className="input-action">
                                        <input
                                            value={url}
                                            placeholder="https://maps.app.goo.gl/..."
                                            onChange={e => {
                                                const nextUrls = [...mapsUrls]
                                                nextUrls[index] = e.target.value
                                                setMapsUrls(nextUrls)
                                                const nextPlaces = [...places]
                                                nextPlaces[index] = null
                                                setPlaces(nextPlaces)
                                            }}
                                        />
                                        <button type="button" onClick={() => void previewPlace(index)}>Prévisualiser</button>
                                    </div>
                                </label>
                                {places[index] && <PlaceCard place={places[index]!} step={index + 1} />}
                            </div>
                        ))}

                        <div className="section-title"><small>DATES</small><h2>Quand peut-on se retrouver ?</h2></div>
                        {dates.map((date, index) => (
                            <label className="date-field" key={index}>
                                <span>Proposition {index + 1}</span>
                                <input
                                    type="datetime-local"
                                    value={date}
                                    onChange={e => {
                                        const next = [...dates]
                                        next[index] = e.target.value
                                        setDates(next)
                                    }}
                                />
                            </label>
                        ))}
                        {dates.length < 4 && <button type="button" className="add-link" onClick={() => setDates([...dates, initialDate(20 + dates.length * 3, 19)])}>＋ Ajouter une date</button>}
                        {error && <div className="error-box">{error}</div>}
                        <Button type="submit" disabled={loading}>{loading ? "Création…" : "Créer et obtenir mes liens →"}</Button>
                    </form>
                </main>
            )}

            {route === "share" && eventData && (
                <main className="center-page">
                    <div className="success">✓</div>
                    <small className="eyebrow">C'EST PARTI</small>
                    <h1>Ta sortie est créée.</h1>
                    <p>Envoie le premier lien aux invités. Garde le second pour toi.</p>
                    <div className="link-card">
                        <small>LIEN À PARTAGER</small><code>{publicUrl}</code>
                        <Button onClick={() => void copy(publicUrl)}>Copier le lien invité</Button>
                    </div>
                    <div className="link-card private">
                        <small>LIEN PRIVÉ ORGANISATEUR</small><code>{manageUrl}</code>
                        <Button secondary onClick={() => void copy(manageUrl)}>Copier mon lien de gestion</Button>
                    </div>
                    <Button secondary onClick={() => void loadEvent(slug, manageToken)}>Ouvrir le tableau de bord</Button>
                </main>
            )}

            {route === "guest" && eventData && (
                <main className="event-page">
                    <section className="event-banner">
                        <small>{eventData.organizerName.toUpperCase()} T'INVITE</small>
                        <h1>{eventData.title}</h1>
                        <p>{eventData.city} · {eventData.budgetEur ? `${eventData.budgetEur} €` : "Budget libre"} · {eventData.maxPlaces} places</p>
                    </section>
                    <section className="event-body">
                        <div className="itinerary">
                            {eventData.places.map((place, index) => <PlaceCard key={place.id || index} place={place} step={index + 1} />)}
                        </div>
                        {eventData.status === "confirmed" ? (
                            <Confirmed
                                event={eventData}
                                calendarUrl={apiUrl(apiBaseUrl, `/api/events/${eventData.slug}/calendar`)}
                            />
                        ) : (
                            <div className="vote-card">
                                <small className="eyebrow">TES DISPONIBILITÉS</small>
                                <h2>Quand peux-tu venir ?</h2>
                                <label><span>Ton prénom</span><input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Alex" /></label>
                                <div className="date-options">
                                    {eventData.dates.map(date => (
                                        <button
                                            key={date.id}
                                            className={answers[date.id] ? "selected" : ""}
                                            onClick={() => setAnswers({ ...answers, [date.id]: !answers[date.id] })}
                                        >
                                            <span>{formatDate(date.startsAt)}</span>
                                            <b>{answers[date.id] ? "✓ Disponible" : "Pas disponible"}</b>
                                        </button>
                                    ))}
                                </div>
                                {error && <div className="error-box">{error}</div>}
                                <Button disabled={loading} onClick={() => {
                                    const token = typeof window !== "undefined" ? window.localStorage.getItem(`bima:${slug}:participant`) || undefined : undefined
                                    void submitVote(token)
                                }}>{loading ? "Enregistrement…" : "Valider mes réponses →"}</Button>
                            </div>
                        )}
                    </section>
                </main>
            )}

            {route === "manage" && eventData && (
                <main className="content-page manage-page">
                    <div className="management-heading">
                        <div><small className="eyebrow">PAGE PRIVÉE · ORGANISATEUR</small><h1>{eventData.title}</h1><p>{eventData.city} · {payload.summary.participantCount} participant(s)</p></div>
                        <span className="status">{eventData.status === "confirmed" ? "CONFIRMÉE" : "VOTES EN COURS"}</span>
                    </div>

                    <div className="organizer-card">
                        <div><b>Mon vote</b><small>Il compte comme celui des invités.</small></div>
                        <input value={guestName || eventData.organizerName} onChange={e => setGuestName(e.target.value)} />
                        <div className="date-options horizontal">
                            {eventData.dates.map(date => (
                                <button key={date.id} className={answers[date.id] ? "selected" : ""} onClick={() => setAnswers({ ...answers, [date.id]: !answers[date.id] })}>
                                    <span>{formatDate(date.startsAt)}</span><b>{answers[date.id] ? "✓ Oui" : "Non"}</b>
                                </button>
                            ))}
                        </div>
                        <Button secondary disabled={loading || eventData.status === "confirmed"} onClick={() => void submitOrganizerVote()}>Mettre à jour mon vote</Button>
                    </div>

                    <div className="matrix-card">
                        <div className="matrix-head"><h2>Choisis la meilleure date</h2><Button secondary onClick={() => void copy(publicUrl)}>Copier le lien invité</Button></div>
                        <div className="matrix-scroll">
                            <div className="matrix" style={{ gridTemplateColumns: `minmax(150px, 1.4fr) repeat(${eventData.dates.length}, minmax(130px, 1fr))` }}>
                                <div className="cell heading">PARTICIPANTS</div>
                                {eventData.dates.map(date => <div className="cell heading" key={date.id}>{formatDate(date.startsAt)}</div>)}
                                {(payload.voters || []).map(voter => (
                                    <React.Fragment key={voter.id}>
                                        <div className="cell person"><b>{voter.name}</b><small>{voter.role === "organizer" ? "Organisateur" : "Invité"}</small></div>
                                        {eventData.dates.map(date => <div className="cell answer" key={date.id}>{voter.answers[date.id] ? "✓" : "×"}</div>)}
                                    </React.Fragment>
                                ))}
                                <div className="cell total">DISPONIBLES</div>
                                {eventData.dates.map(date => <div className="cell total" key={date.id}>{date.availableCount}/{payload.summary.participantCount}</div>)}
                                <div className="cell" />
                                {eventData.dates.map(date => (
                                    <div className="cell" key={date.id}>
                                        <Button disabled={loading || eventData.status === "confirmed"} onClick={() => void confirmDate(date.id)}>
                                            {eventData.confirmedDateId === date.id ? "Confirmée ✓" : "Confirmer"}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {eventData.status === "confirmed" && (
                        <Confirmed
                            event={eventData}
                            calendarUrl={apiUrl(apiBaseUrl, `/api/events/${eventData.slug}/calendar`)}
                        />
                    )}
                    {error && <div className="error-box">{error}</div>}
                </main>
            )}

            {loading && !eventData && <div className="loading">Chargement…</div>}
            {error && route === "home" && <div className="error-box floating">{error}</div>}
            {toast && <div className="toast">{toast}</div>}
        </div>
    )
}

function Confirmed({ event, calendarUrl }: { event: EventData; calendarUrl: string }) {
    const selected = event.dates.find(date => date.id === event.confirmedDateId)
    return (
        <div className="confirmed-card">
            <small>SORTIE CONFIRMÉE</small>
            <h2>Rendez-vous {selected ? formatDate(selected.startsAt) : "bientôt"} !</h2>
            <p>Le vote est clos. Il ne reste plus qu'à en profiter.</p>
            <a className="bima-button calendar-button" href={calendarUrl}>
                ＋ Ajouter au calendrier (.ics)
            </a>
        </div>
    )
}

addPropertyControls(BimaApp, {
    apiBaseUrl: {
        type: ControlType.String,
        title: "API BIMA",
        defaultValue: DEFAULT_API,
    },
    logo: {
        type: ControlType.Image,
        title: "Logo",
    },
    logoAlt: {
        type: ControlType.String,
        title: "Texte logo",
        defaultValue: "Logo BIMA",
    },
    brandText: {
        type: ControlType.String,
        title: "Nom marque",
        defaultValue: "bima",
    },
    eyebrowText: {
        type: ControlType.String,
        title: "Sur-titre",
        defaultValue: "● ENFIN, ON SE DÉCIDE",
    },
    heroTitleLine1: {
        type: ControlType.String,
        title: "Titre ligne 1",
        defaultValue: "La sortie qui",
    },
    heroTitleLine2: {
        type: ControlType.String,
        title: "Titre ligne 2",
        defaultValue: "sort du",
    },
    heroTitleAccent: {
        type: ControlType.String,
        title: "Titre accent",
        defaultValue: "groupe.",
    },
    heroDescription: {
        type: ControlType.String,
        title: "Description",
        displayTextArea: true,
        defaultValue: "Propose des dates, partage le lien et laisse chacun voter. Sans compte et sans 147 messages.",
    },
    primaryCta: {
        type: ControlType.String,
        title: "Bouton",
        defaultValue: "Créer une sortie",
    },
    microcopy: {
        type: ControlType.String,
        title: "Sous bouton",
        defaultValue: "Gratuit · Aucun compte requis",
    },
    demoBadge: {
        type: ControlType.String,
        title: "Badge démo",
        defaultValue: "4 RÉPONSES",
    },
    demoTitle: {
        type: ControlType.String,
        title: "Titre démo",
        defaultValue: "Brunch d'été ☀️",
    },
    demoMeta: {
        type: ControlType.String,
        title: "Détail démo",
        defaultValue: "Paris · 8 personnes max.",
    },
    demoDate1: {
        type: ControlType.String,
        title: "Date démo 1",
        defaultValue: "Samedi 16 août",
    },
    demoDate2: {
        type: ControlType.String,
        title: "Date démo 2",
        defaultValue: "Vendredi 22 août",
    },
    demoDate3: {
        type: ControlType.String,
        title: "Date démo 3",
        defaultValue: "Samedi 23 août",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#E65E38",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Fond",
        defaultValue: "#F4F1E8",
    },
    surfaceColor: {
        type: ControlType.Color,
        title: "Cartes",
        defaultValue: "#FFFDF8",
    },
    textColor: {
        type: ControlType.Color,
        title: "Texte",
        defaultValue: "#161714",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Texte léger",
        defaultValue: "#68675F",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Boutons",
        defaultValue: "#161714",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Texte bouton",
        defaultValue: "#FFFFFF",
    },
    successColor: {
        type: ControlType.Color,
        title: "Succès",
        defaultValue: "#237433",
    },
})

const styles = `
*{box-sizing:border-box}.bima-root{--ink:#161714;--paper:#f4f1e8;--card:#fffdf8;--line:#d9d5ca;min-height:100%;width:100%;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}.bima-header{height:76px;padding:0 clamp(20px,5vw,72px);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);background:rgba(244,241,232,.92);position:relative;z-index:4}.bima-brand{font-size:31px;font-weight:900;letter-spacing:-2.5px}.bima-brand span{color:var(--accent)}.bima-brand i{color:#f48b5e}.text-button,.add-link{border:0;background:none;font-weight:750;cursor:pointer;color:var(--ink)}.bima-button{border:1px solid var(--ink);background:var(--ink);color:white;border-radius:999px;padding:14px 20px;font-weight:800;font-size:15px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:16px;transition:.2s}.bima-button:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,0,0,.12)}.bima-button.secondary{background:transparent;color:var(--ink)}.bima-button:disabled{opacity:.45;cursor:not-allowed;transform:none}.hero-screen{min-height:calc(100vh - 76px);padding:clamp(48px,8vw,110px) clamp(20px,8vw,120px);display:grid;grid-template-columns:1.05fr .95fr;gap:8vw;align-items:center}.hero-copy h1{font-size:clamp(52px,7vw,104px);line-height:.88;letter-spacing:-.075em;margin:18px 0 30px}.hero-copy h1 em{color:var(--accent);font-style:normal}.hero-copy p{max-width:600px;font-size:clamp(18px,2vw,24px);line-height:1.45;color:#5c5b54;margin-bottom:34px}.hero-copy>.bima-button{font-size:17px;padding:18px 26px;margin:0 0 16px}.hero-copy>small:last-child{display:block;color:#77756d}.eyebrow{font-size:12px;font-weight:900;letter-spacing:.13em;color:var(--accent)}.hero-card{background:var(--card);border:1px solid var(--line);border-radius:28px;padding:34px;box-shadow:0 25px 70px rgba(44,40,31,.12);transform:rotate(1.5deg)}.hero-card .tag{float:right;background:#dff3db;color:#237433;border-radius:99px;padding:7px 10px;font-size:10px;font-weight:900}.hero-card h2{font-size:30px;margin:26px 0 5px}.hero-card>p{color:#77756d}.demo-date{display:flex;justify-content:space-between;border:1px solid var(--line);border-radius:14px;padding:18px;margin-top:12px}.demo-date.winner{background:#edf0ff;border-color:var(--accent)}.content-page{width:min(1120px,calc(100% - 32px));margin:auto;padding:56px 0 100px}.page-heading{text-align:center;margin-bottom:36px}.page-heading h1,.center-page h1{font-size:clamp(38px,5vw,64px);letter-spacing:-.055em;margin:10px 0}.page-heading p,.center-page>p{color:#6d6b64;font-size:18px}.form-card,.vote-card,.organizer-card,.matrix-card{background:var(--card);border:1px solid var(--line);border-radius:24px;padding:clamp(22px,4vw,44px);box-shadow:0 12px 40px rgba(40,36,28,.06)}.form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}.form-card label,.vote-card label{display:flex;flex-direction:column;gap:8px;font-weight:750}.form-card input,.vote-card input,.organizer-card input{width:100%;border:1px solid var(--line);border-radius:12px;background:white;padding:14px;font:inherit;outline:none}.form-card input:focus,.vote-card input:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 12%,transparent)}.section-title{border-top:1px solid var(--line);padding-top:30px;margin-top:34px}.section-title small{font-weight:900;letter-spacing:.12em;color:var(--accent)}.section-title h2{margin:5px 0 18px}.place-builder{margin:18px 0 24px}.input-action{display:grid;grid-template-columns:1fr auto;gap:8px}.input-action button{border:0;background:var(--accent);color:white;border-radius:12px;padding:0 16px;font-weight:800;cursor:pointer}.place-card{display:grid;grid-template-columns:180px 1fr 38px;background:white;border:1px solid var(--line);border-radius:18px;overflow:hidden;margin-top:14px;min-height:150px}.place-card img,.place-fallback{width:100%;height:100%;object-fit:cover;background:#edf0ff;display:grid;place-items:center;font-size:40px;font-weight:900;color:var(--accent)}.place-copy{padding:18px 20px}.place-copy small{font-size:10px;font-weight:900;letter-spacing:.1em;color:#74726a}.place-copy h3{font-size:25px;margin:6px 0}.rating{display:flex;align-items:center;gap:8px}.rating span{color:#f4a019;letter-spacing:-2px}.rating em{font-size:12px;color:#77756d;font-style:normal}.place-copy p{margin:10px 0 5px;color:#56554f}.place-copy strong{font-size:12px;color:#77756d}.place-card>a{margin:14px 14px 0 0;width:34px;height:34px;border:1px solid var(--line);border-radius:50%;display:grid;place-items:center;text-decoration:none;color:var(--accent)}.date-field{margin:12px 0}.add-link{color:var(--accent);padding:12px 0;margin-bottom:24px}.form-card>.bima-button{width:100%;margin-top:24px}.center-page{width:min(720px,calc(100% - 32px));margin:auto;text-align:center;padding:70px 0}.success{width:70px;height:70px;border-radius:50%;background:#dff3db;color:#237433;font-size:38px;display:grid;place-items:center;margin:0 auto 22px}.link-card{background:white;border:1px solid var(--line);border-radius:20px;padding:24px;margin:22px 0;text-align:left}.link-card.private{background:#eceef8}.link-card small{display:block;font-weight:900;letter-spacing:.1em;margin-bottom:10px}.link-card code{display:block;overflow-wrap:anywhere;padding:14px;background:rgba(255,255,255,.8);border-radius:10px;margin-bottom:15px}.event-banner{background:#171816;color:white;padding:48px clamp(20px,8vw,120px)}.event-banner small{color:#aab7ff;font-weight:900;letter-spacing:.12em}.event-banner h1{font-size:clamp(36px,5vw,64px);letter-spacing:-.05em;margin:10px 0}.event-banner p{color:#c7c6c0}.event-body{width:min(900px,calc(100% - 32px));margin:auto;padding:36px 0 100px}.itinerary{display:grid;gap:12px;margin-bottom:28px}.vote-card h2{font-size:34px;margin:8px 0 24px}.date-options{display:grid;gap:10px;margin:20px 0}.date-options button{border:1px solid var(--line);background:white;border-radius:14px;padding:16px;display:flex;justify-content:space-between;text-align:left;font:inherit;cursor:pointer}.date-options button.selected{background:#edf0ff;border-color:var(--accent)}.date-options button b{color:#77756d}.date-options button.selected b{color:var(--accent)}.vote-card>.bima-button{width:100%}.management-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}.management-heading h1{font-size:44px;letter-spacing:-.05em;margin:8px 0}.status{background:#dff3db;color:#237433;font-weight:900;font-size:11px;letter-spacing:.1em;border-radius:99px;padding:10px 14px}.organizer-card{margin-bottom:20px}.organizer-card>div:first-child{display:flex;flex-direction:column;margin-bottom:12px}.organizer-card small{color:#77756d}.horizontal{grid-template-columns:repeat(4,1fr)}.horizontal button{flex-direction:column;gap:6px}.matrix-card{padding:0;overflow:hidden}.matrix-head{display:flex;align-items:center;justify-content:space-between;padding:26px 28px;border-bottom:1px solid var(--line)}.matrix-scroll{overflow-x:auto}.matrix{display:grid;min-width:650px}.cell{padding:16px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:center}.cell.heading{font-size:11px;font-weight:900;letter-spacing:.05em;background:#f3f0e8;text-align:center}.cell.person{align-items:flex-start;flex-direction:column}.cell.person small{color:#88857d}.cell.answer{font-size:24px;font-weight:900;color:var(--accent)}.cell.total{font-weight:900;background:#edf0ff}.cell .bima-button{padding:9px 12px;font-size:12px}.confirmed-card{background:var(--accent);color:white;border-radius:24px;padding:34px;margin-top:24px;text-align:center}.confirmed-card small{font-weight:900;letter-spacing:.12em}.confirmed-card h2{font-size:34px;margin:10px 0}.error-box{background:#fff0ed;color:#a93b25;border:1px solid #efb9ac;border-radius:12px;padding:13px 15px;margin:14px 0}.error-box.floating{position:fixed;bottom:20px;left:20px}.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#171816;color:white;border-radius:99px;padding:12px 20px;font-weight:800;z-index:20}.loading{padding:80px;text-align:center;font-weight:800}@media(max-width:760px){.hero-screen{grid-template-columns:1fr;padding-top:48px}.hero-card{transform:none}.form-grid{grid-template-columns:1fr}.place-card{grid-template-columns:100px 1fr 30px}.place-copy h3{font-size:20px}.place-copy p{font-size:13px}.horizontal{grid-template-columns:1fr 1fr}.management-heading,.matrix-head{align-items:flex-start;flex-direction:column;gap:14px}.input-action{grid-template-columns:1fr}.input-action button{padding:13px}.bima-header{height:64px}.hero-screen{min-height:calc(100vh - 64px)}}@media(max-width:520px){.place-card{grid-template-columns:1fr 34px}.place-card img,.place-fallback{grid-column:1/-1;height:160px}.place-copy{padding:16px}.place-card>a{grid-column:2;grid-row:2}.hero-copy h1{font-size:50px}.form-card,.vote-card{padding:20px}.content-page{padding-top:34px}}
.brand-logo{display:block;max-width:180px;width:auto;height:34px;object-fit:contain;object-position:left center}.bima-brand.custom{letter-spacing:-1.5px}.bima-root .bima-button{border-color:var(--button);background:var(--button);color:var(--button-text)}.bima-root .bima-button.secondary{background:transparent;color:var(--ink);border-color:var(--ink)}.bima-root .hero-copy p,.bima-root .hero-copy>small:last-child,.bima-root .hero-card>p,.bima-root .page-heading p,.bima-root .center-page>p,.bima-root .place-copy small,.bima-root .rating em,.bima-root .place-copy p,.bima-root .place-copy strong,.bima-root .date-options button b,.bima-root .organizer-card small,.bima-root .cell.person small{color:var(--muted)}.bima-root .hero-card .tag,.bima-root .status,.bima-root .success{background:color-mix(in srgb,var(--success) 15%,var(--card));color:var(--success)}.bima-root .bima-header{background:color-mix(in srgb,var(--paper) 92%,transparent)}.bima-root .demo-date.winner,.bima-root .date-options button.selected,.bima-root .cell.total{background:color-mix(in srgb,var(--accent) 10%,var(--card))}.bima-root .form-card input,.bima-root .vote-card input,.bima-root .organizer-card input,.bima-root .place-card,.bima-root .date-options button,.bima-root .link-card{background:var(--card)}.bima-root .calendar-button{display:inline-flex;margin-top:18px;background:var(--card);border-color:var(--card);color:var(--accent);text-decoration:none}@media(max-width:760px){.brand-logo{height:28px;max-width:150px}}
`
