# Invitation extras — preview only

Verified deployment: https://bima-7gcoh0dcq-bima6.vercel.app/creer

This branch contains review-only UI examples plus the integrated invitation summary,
optional external ticket URL, and opt-in available first names per date.
Production approved by Nicolas and released on 2026-10-10.
Public URL: https://bima-app-sigma.vercel.app/creer
Production uses the normal `bima-api` function in `ebilhzvgvinbpmmpezua`.
The additive migration is applied in production; existing events retain false/null defaults.
New web creations enable first names by default, with an explicit opt-out.
Prototype-only routes return 404 in production.

Backend: Supabase Preview BIMA `msmnpgoggvogslvkfgwu`, separate function
`bima-ux-preview`. Never deploy it to the production project.
Migration `20261008152902_invitation_extras.sql` was applied only to Preview.
Server runtime must set:
`BIMA_API_URL=https://msmnpgoggvogslvkfgwu.supabase.co/functions/v1/bima-ux-preview`.
Preview refuses a production backend fallback. Preview emails and notification
processing are disabled. Preserve your management link for testing.

Tests:
- `node --test tests/invitation-extras.test.mjs`
- `node tests/invitation-extras.integration.mjs` (writes then deletes isolated QA events in Preview)
- `BIMA_TEST_URL` + `node tests/invitation-extras.browser.mjs` (real browser flow; Windows bundled Playwright path)
- `node tests/invitation-extras.deployment.mjs` (specific protected deployment, requires local Vercel CLI auth)

Production verification: `BIMA_PRODUCTION_QA=1 node tests/invitation-extras.production.mjs`.
This creates and deletes an isolated QA event and disables its notifications.
