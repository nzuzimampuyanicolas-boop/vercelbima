import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("lets every participant choose any combination of itinerary stages", async () => {
  const [page, css] = await Promise.all([
    source("app/page.tsx"),
    source("app/globals.css"),
  ]);

  assert.match(page, /availablePlaceIds\.length === event\.places\.length/);
  assert.match(page, /setAvailablePlaceIds/);
  assert.match(page, /availablePlaceIds\.filter/);
  assert.match(page, /voter\.stageAnswers\[place\.id\]/);
  assert.match(page, /onSaveVote/);
  assert.match(css, /\.stage-vote-card/);
  assert.match(css, /\.stage-matrix \.matrix-row/);
});

test("makes the guest invitation unmistakable and keeps the organizer URL private", async () => {
  const page = await source("app/page.tsx");

  assert.match(page, /LIEN À ENVOYER AU GROUPE/);
  assert.match(page, /Partager l’invitation/);
  assert.match(page, /Copier le lien d’invitation/);
  assert.match(page, /Ils n’auront pas accès à la gestion/);
  assert.match(page, /TON ESPACE ORGANISATEUR/);
  assert.match(page, /Accéder à ma page de gestion/);
  assert.doesNotMatch(page, /LIEN PRIVÉ ORGANISATEUR/);
  assert.doesNotMatch(page, /Lien organisateur copié/);
});

test("accepts optional full Google Maps links and manual places", async () => {
  const [page, edgeApi] = await Promise.all([
    source("app/page.tsx"),
    source("supabase/functions/bima-api/index.ts"),
  ]);

  assert.match(page, /Lien Google Maps \(optionnel\)/);
  assert.match(page, /Nom du lieu/);
  assert.match(page, /placeholder="Ville"/);
  assert.doesNotMatch(page, /stage-time-input/);
  assert.match(edgeApi, /googleShortLinkHosts\.has\(url\.hostname\)\) return false/);
  assert.match(edgeApi, /Renseigne le nom et la ville du lieu/);
  assert.match(edgeApi, /Ce lien Google Maps ne fonctionne plus/);
  assert.doesNotMatch(page, /share\.google/);
  assert.doesNotMatch(edgeApi, /share\.google/);
});

test("persists stage attendance independently from date availability", async () => {
  const [shared, votesRoute, migration, edgeApi] = await Promise.all([
    source("app/api/_shared.ts"),
    source("app/api/events/[slug]/votes/route.ts"),
    source("supabase/migrations/202608020001_bima_backend.sql"),
    source("supabase/functions/bima-api/index.ts"),
  ]);

  assert.match(shared, /proxyBima/);
  assert.match(shared, /BIMA_API_URL/);
  assert.match(votesRoute, /\/votes/);
  assert.match(migration, /bima_stage_votes/i);
  assert.match(migration, /idx_bima_stage_votes_place_id/);
  assert.match(edgeApi, /availablePlaceIds/);
  assert.match(edgeApi, /stageAnswers/);
});

test("exposes stage attendance in the protected admin dashboard", async () => {
  const [adminApi, adminDeleteApi, adminPage, edgeApi] = await Promise.all([
    source("app/api/admin/data/route.ts"),
    source("app/api/admin/delete/route.ts"),
    source("app/admin/page.tsx"),
    source("supabase/functions/bima-api/index.ts"),
  ]);

  assert.match(adminApi, /proxyBima/);
  assert.match(adminApi, /\/api\/admin\/data/);
  assert.match(adminDeleteApi, /\/api\/admin\/delete/);
  assert.match(adminPage, /Présence aux étapes/);
  assert.match(adminPage, /organizer_email/);
  assert.match(adminPage, /mailto:/);
  assert.match(adminPage, /\/api\/admin\/delete/);
  assert.match(adminPage, /window\.confirm/);
  assert.match(edgeApi, /async function adminDelete/);
  assert.match(edgeApi, /Supprime la sortie entière pour retirer son organisateur/);
  assert.match(edgeApi, /Une sortie doit conserver au moins un lieu/);
  assert.match(adminPage, /key: "attending"/);
});

test("keeps the Framer guest and organizer pages aligned with the backend", async () => {
  const [kit, guest, manage, admin] = await Promise.all([
    source("framer/multipage/BimaKit.tsx"),
    source("framer/multipage/BimaGuest.tsx"),
    source("framer/multipage/BimaManage.tsx"),
    source("framer/multipage/BimaAdmin.tsx"),
  ]);

  assert.match(kit, /ebilhzvgvinbpmmpezua\.supabase\.co\/functions\/v1\/bima-api/);
  assert.match(kit, /stageAnswers: Record<string, boolean>/);
  assert.match(guest, /availablePlaceIds/);
  assert.match(guest, /À quelles étapes seras-tu là \?/);
  assert.match(manage, /availablePlaceIds/);
  assert.match(manage, /Présence à chaque étape/);
  assert.match(admin, /"stageVotes"/);
  assert.match(admin, /Présence aux étapes/);
});

test("ships the Supabase schema and Edge API used by Framer", async () => {
  const [migration, edgeApi] = await Promise.all([
    source("supabase/migrations/202608020001_bima_backend.sql"),
    source("supabase/functions/bima-api/index.ts"),
  ]);

  assert.match(migration, /create table if not exists public\.bima_events/i);
  assert.match(migration, /create table if not exists public\.bima_stage_votes/i);
  assert.match(migration, /enable row level security/i);
  assert.match(edgeApi, /availablePlaceIds/);
  assert.match(edgeApi, /api\/admin\/data/);
  assert.match(edgeApi, /text\/calendar/);
  assert.match(edgeApi, /Access-Control-Allow-Origin/);
});

test("adds stays without changing historical outings", async () => {
  const [page, adminPage, migration, edgeApi] = await Promise.all([
    source("app/page.tsx"),
    source("app/admin/page.tsx"),
    source("supabase/migrations/20260806120414_add_stay_date_ranges.sql"),
    source("supabase/functions/bima-api/index.ts"),
  ]);

  assert.match(migration, /event_type text not null default 'outing'/i);
  assert.match(migration, /ends_at timestamptz/i);
  assert.match(migration, /ends_at is null or ends_at >= starts_at/i);
  assert.match(page, /Une sortie/);
  assert.match(page, /Un séjour/);
  assert.match(page, /Départ/);
  assert.match(page, /Retour/);
  assert.match(page, /formatEventDate/);
  assert.match(adminPage, /event_type/);
  assert.match(adminPage, /ends_at/);
  assert.match(edgeApi, /typeof value === "string"/);
  assert.match(edgeApi, /eventType === "stay"/);
  assert.match(edgeApi, /DTSTART;VALUE=DATE/);
  assert.match(edgeApi, /addUtcDays\(selectedDate\.endsAt, 1\)/);
});

test("lets only the organizer edit event details without replacing dates or votes", async () => {
  const [page, proxyRoute, shared, edgeApi] = await Promise.all([
    source("app/page.tsx"),
    source("app/api/events/[slug]/route.ts"),
    source("app/api/_shared.ts"),
    source("supabase/functions/bima-api/index.ts"),
  ]);

  assert.match(page, /Modifier les informations/);
  assert.match(page, /Les dates proposées, les participants et leurs votes restent inchangés/);
  assert.match(page, /method: "PATCH"/);
  assert.match(proxyRoute, /export async function PATCH/);
  assert.match(shared, /GET, POST, PATCH, OPTIONS/);
  assert.match(edgeApi, /async function updateEvent/);
  assert.match(edgeApi, /hasManageAccess\(event, manageToken, manageShortCode\)/);
  assert.match(edgeApi, /maxPlaces < participantCount/);
  assert.match(edgeApi, /Le nombre d’étapes ne peut pas être modifié ici/);
  assert.match(edgeApi, /submittedIds\.some\(\(id\) => !existingIds\.has\(id\)\)/);
  assert.match(edgeApi, /request\.method === "PATCH" && !action/);
  assert.match(edgeApi, /GET, POST, PATCH, OPTIONS/);
});

test("queues idempotent organizer notifications and exposes explicit preferences", async () => {
  const [migration, edgeApi, page, gmail, notificationLib, cronRoute, votesRoute, vercel] = await Promise.all([
    source("supabase/migrations/20260811144303_organizer_notifications.sql"),
    source("supabase/functions/bima-api/index.ts"),
    source("app/page.tsx"),
    source("app/lib/gmail.ts"),
    source("app/lib/notifications.ts"),
    source("app/api/cron/notifications/route.ts"),
    source("app/api/events/[slug]/votes/route.ts"),
    source("vercel.json"),
  ]);

  assert.match(migration, /bima_notification_deliveries/);
  assert.match(migration, /unique \(event_id, dedupe_key\)/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /notifications_started_at timestamptz/);
  assert.match(edgeApi, /isNewParticipant && event\.notifications_started_at/);
  assert.match(edgeApi, /participant_joined:\$\{participant\.id\}/);
  assert.match(edgeApi, /event_full:\$\{event\.id\}/);
  assert.match(edgeApi, /deadline_48h/);
  assert.match(edgeApi, /deadline_reached/);
  assert.match(edgeApi, /hasNotificationAccess/);
  assert.match(page, /Nouvelles réponses/);
  assert.match(page, /Moments importants/);
  assert.match(gmail, /sendOrganizerNotificationEmail/);
  assert.match(notificationLib, /processPendingNotifications/);
  assert.match(cronRoute, /process\.env\.CRON_SECRET/);
  assert.match(votesRoute, /after\(async/);
  assert.match(vercel, /\/api\/cron\/notifications/);
});

test("publishes the BIMA image in social preview metadata", async () => {
  const [layout, seo, image] = await Promise.all([
    source("app/layout.tsx"),
    source("app/lib/seo.ts"),
    stat(new URL("public/og.png", root)),
  ]);

  assert.match(seo, /url: "\/og\.png"/);
  assert.match(seo, /width: 1536/);
  assert.match(seo, /height: 1024/);
  assert.match(layout, /images: \[socialImage\]/);
  assert.match(layout, /card: "summary_large_image"/);
  assert.match(seo, /alt: "BIMA — La sortie qui sort du groupe\."/);
  assert.ok(image.size > 0);
});

test("publishes crawl rules, a focused sitemap, and route-specific metadata", async () => {
  const [
    layout,
    seo,
    robots,
    sitemap,
    privacy,
    eventPage,
    adminLayout,
    managePage,
    participantPage,
  ] = await Promise.all([
    source("app/layout.tsx"),
    source("app/lib/seo.ts"),
    source("app/robots.ts"),
    source("app/sitemap.ts"),
    source("app/confidentialite/page.tsx"),
    source("app/e/[slug]/page.tsx"),
    source("app/admin/layout.tsx"),
    source("app/m/[code]/page.tsx"),
    source("app/p/[code]/page.tsx"),
  ]);

  assert.match(layout, /template: "%s \| BIMA"/);
  assert.match(layout, /default: "BIMA \| Organisez vos sorties entre amis"/);
  assert.equal(layout.match(/title: "BIMA \| Organisez vos sorties entre amis"/g)?.length, 2);
  assert.match(layout, /alternates: \{ canonical: "\/" \}/);
  assert.match(seo, /max-image-preview/);
  assert.match(robots, /disallow: \["\/admin", "\/api\/", "\/m\/", "\/p\/", "\/recuperer-mon-lien"\]/);
  assert.match(robots, /sitemap: `\$\{siteUrl\}\/sitemap\.xml`/);
  assert.match(sitemap, /`\$\{siteUrl\}\/confidentialite`/);
  assert.doesNotMatch(sitemap, /\/admin|\/api\/|\/m\/|\/p\/|\/e\//);
  assert.match(privacy, /path: "\/confidentialite"/);
  assert.match(eventPage, /generateMetadata/);
  assert.match(eventPage, /index: false/);
  assert.match(eventPage, /Indique tes disponibilités/);
  assert.match(adminLayout, /path: "\/admin"/);
  assert.match(adminLayout, /index: false/);
  assert.match(managePage, /path: `\/m\/\$\{encodeURIComponent\(code\)\}`/);
  assert.match(managePage, /index: false/);
  assert.match(participantPage, /path: `\/p\/\$\{encodeURIComponent\(code\)\}`/);
  assert.match(participantPage, /index: false/);
});

test("rate limits public API abuse without storing client IP addresses in clear text", async () => {
  const [migration, edgeApi, proxy, createRoute, envExample, readme] = await Promise.all([
    source("supabase/migrations/20260815181616_add_api_rate_limits.sql"),
    source("supabase/functions/bima-api/index.ts"),
    source("app/api/_shared.ts"),
    source("app/api/events/route.ts"),
    source(".env.example"),
    source("README.md"),
  ]);

  assert.match(migration, /create table if not exists public\.bima_rate_limits/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /on conflict \(bucket\) do update/i);
  assert.match(migration, /security invoker/i);
  assert.match(migration, /revoke execute on function public\.bima_consume_rate_limit[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.bima_consume_rate_limit[\s\S]*to service_role/i);
  assert.match(edgeApi, /const identity = identityOverride \|\| await requestIdentity\(request\)/);
  assert.match(edgeApi, /sha256\(`\$\{serviceRoleKey\}:\$\{identity\}`\)/);
  assert.match(edgeApi, /db\.rpc\("bima_consume_rate_limit"/);
  assert.match(edgeApi, /code: "rate_limit_exceeded"/);
  assert.match(edgeApi, /"Retry-After": String\(result\.retry_after\)/);
  assert.match(edgeApi, /createAttempt: \{ scope: "event-create-attempt", limit: 20, windowSeconds: 3600 \}/);
  assert.match(edgeApi, /createAttemptDaily: \{ scope: "event-create-attempt-daily", limit: 50, windowSeconds: 86400 \}/);
  assert.match(edgeApi, /createSuccess: \{ scope: "event-create-success", limit: 5, windowSeconds: 3600 \}/);
  assert.match(edgeApi, /createSuccessDaily: \{ scope: "event-create-success-daily", limit: 10, windowSeconds: 86400 \}/);
  assert.match(edgeApi, /rateLimitPolicies\.placePreview/);
  assert.match(edgeApi, /placePreviewDaily: \{ scope: "place-preview-daily", limit: 50, windowSeconds: 86400 \}/);
  assert.match(edgeApi, /voteNetwork: \{ scope: "event-vote-network", limit: 100, windowSeconds: 600 \}/);
  assert.match(edgeApi, /voteParticipant: \{ scope: "event-vote-participant", limit: 10, windowSeconds: 600 \}/);
  assert.match(edgeApi, /organizerInvalid: \{ scope: "organizer-invalid", limit: 5, windowSeconds: 900 \}/);
  assert.match(edgeApi, /adminRead: \{ scope: "admin-read", limit: 90, windowSeconds: 900 \}/);
  assert.match(edgeApi, /adminDelete: \{ scope: "admin-delete", limit: 30, windowSeconds: 900 \}/);
  assert.match(edgeApi, /adminInvalid: \{ scope: "admin-invalid", limit: 5, windowSeconds: 900 \}/);
  assert.match(edgeApi, /notificationInvalid: \{ scope: "notification-invalid", limit: 5, windowSeconds: 900 \}/);
  assert.match(edgeApi, /async function organizerRateLimited/);
  assert.match(edgeApi, /async function voteRateLimited/);
  assert.match(edgeApi, /async function adminRateLimited/);
  assert.match(edgeApi, /event: "rate_limit_exceeded"/);
  assert.match(edgeApi, /Réessaie dans \$\{retryLabel\}/);
  assert.doesNotMatch(migration, /client_ip|ip_address/i);
  assert.match(proxy, /process\.env\.NOTIFICATION_SECRET/);
  assert.match(proxy, /headers\.set\("x-bima-client-ip", requesterIp\)/);
  assert.match(proxy, /"retry-after"/);
  assert.match(createRoute, /bimaProxyRequestHeaders\(request\)/);
  assert.match(createRoute, /bimaUpstreamResponseHeaders\(upstream\)/);
  assert.doesNotMatch(envExample, /BIMA_PROXY_SECRET=/);
  assert.match(readme, /NOTIFICATION_SECRET/);
});

test("opens the creation flow from a stable landing-page CTA URL", async () => {
  const [app, createPage] = await Promise.all([
    source("app/page.tsx"),
    source("app/creer/page.tsx"),
  ]);

  assert.match(app, /window\.location\.pathname === "\/creer" \? "create" : "home"/);
  assert.match(app, /window\.history\.pushState\(\{\}, "", "\/creer"\)/);
  assert.match(createPage, /return <BimaApp \/>/);
  assert.match(createPage, /path: "\/creer"/);
  assert.match(createPage, /index: false/);
});

test("recovers organizer management links without adding email to the guest flow", async () => {
  const [
    app,
    recoveryPage,
    recoveryForm,
    recoveryRoute,
    gmail,
    edgeApi,
    migration,
    admin,
    privacy,
    readme,
  ] = await Promise.all([
    source("app/page.tsx"),
    source("app/recuperer-mon-lien/page.tsx"),
    source("app/recuperer-mon-lien/RecoveryForm.tsx"),
    source("app/api/recover-management-link/route.ts"),
    source("app/lib/gmail.ts"),
    source("supabase/functions/bima-api/index.ts"),
    source("supabase/migrations/20260816175035_add_organizer_email_recovery_index.sql"),
    source("app/admin/page.tsx"),
    source("app/confidentialite/page.tsx"),
    source("README.md"),
  ]);

  assert.match(app, /Ton mail pour récupérer ton lien si tu le perds\. On pourra aussi te demander ce que t&apos;en as pensé — pas de spam, promis\./);
  assert.match(app, /href="\/recuperer-mon-lien"/);
  const guestFlow = app.slice(app.indexOf("function RespondPage"), app.indexOf("function SavedPage"));
  assert.doesNotMatch(guestFlow, /type="email"|organizerEmail/);
  assert.match(recoveryPage, /index: false/);
  assert.match(recoveryPage, /<RecoveryForm \/>/);
  assert.match(recoveryForm, /fetch\("\/api\/recover-management-link"/);
  assert.match(recoveryForm, /BIMA ne dira jamais si cette adresse est enregistrée/);
  assert.match(recoveryRoute, /process\.env\.NOTIFICATION_SECRET/);
  assert.match(recoveryRoute, /bimaBackendUrl\("\/api\/recovery\/manage"\)/);
  assert.match(recoveryRoute, /Si cette adresse correspond à une sortie BIMA/);
  assert.match(recoveryRoute, /sendManagementRecoveryEmail/);
  assert.match(gmail, /export async function sendManagementRecoveryEmail/);
  assert.match(edgeApi, /async function recoverManagementLinks/);
  assert.match(edgeApi, /createShortLink\("manage", event\.id, organizerId\)/);
  assert.match(edgeApi, /recoveryNetwork: \{ scope: "management-recovery-network", limit: 5, windowSeconds: 900 \}/);
  assert.match(edgeApi, /recoveryEmail: \{ scope: "management-recovery-email", limit: 3, windowSeconds: 3600 \}/);
  assert.match(edgeApi, /consumeRateLimit\(request, rateLimitPolicies\.recoveryEmail, emailIdentity\)/);
  assert.match(edgeApi, /notificationRateLimited\(request, \(authorized\) => recoverManagementLinks\(request, authorized\)\)/);
  assert.match(migration, /idx_bima_events_organizer_email/);
  assert.match(admin, /planned_date/);
  assert.match(admin, /feedback_status/);
  assert.match(admin, /Abandonnée/);
  assert.match(privacy, /n’est pas demandée aux invités/);
  assert.match(privacy, /liste de diffusion marketing sans un consentement supplémentaire explicite/);
  assert.match(readme, /Les invités ne fournissent ni compte ni e-mail/);
});

test("uses the white BIMA logo in every transactional email header", async () => {
  const gmail = await source("app/lib/gmail.ts");
  const logo = await stat(new URL("public/bima-logo-white.png", root));

  assert.ok(logo.size > 0);
  assert.match(gmail, /EMAIL_LOGO_URL = `\$\{BIMA_PUBLIC_URL\}\/bima-logo-white\.png`/);
  assert.match(gmail, /<img src="\$\{EMAIL_LOGO_URL\}" alt="BIMA" width="54" height="54"/);
  assert.equal(gmail.match(/\$\{emailHeader\(\)\}/g)?.length, 3);
  assert.doesNotMatch(gmail, />BIMA <span style=/);
});
