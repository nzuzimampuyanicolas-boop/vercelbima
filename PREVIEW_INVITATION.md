# Invitation extras — preview only

Verified deployment: https://bima-7gcoh0dcq-bima6.vercel.app/creer

This branch contains review-only UI examples plus the integrated invitation summary,
optional external ticket URL, and opt-in available first names per date.
No production approval has been given.

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

Before a future production release, consolidate the tested API additions into the
normal backend, apply the additive migration, review visibility defaults, and remove
prototype-only routes. This is not yet authorized.
