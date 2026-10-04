// Run against an already-built local server. No production data is written.
// Set BIMA_PLAYWRIGHT_MODULE to a bundled playwright/index.mjs when not installed locally.
import assert from "node:assert/strict";

const { chromium } = await import(process.env.BIMA_PLAYWRIGHT_MODULE || "playwright");
const baseUrl = process.env.BIMA_TEST_URL || "http://localhost:3014";
const slug = "calendar-sharing-test";
const privateToken = "test-private-token-not-to-share";
const calendarUrl = `${baseUrl}/api/events/${slug}/calendar`;
const browser = await chromium.launch({ headless: true, ...(process.env.BIMA_BROWSER_CHANNEL ? { channel: process.env.BIMA_BROWSER_CHANNEL } : {}) });
const errors = [];
let confirmed = false;
let isStay = false;
let confirmationRequests = 0;
const date = () => ({ id: "date-a", position: 1, startsAt: "2026-10-10T17:30:00.000Z", endsAt: isStay ? "2026-10-12T17:30:00.000Z" : null, availableCount: 2 });
const organizer = { id: "organizer", name: "Orga Test", role: "organizer", answers: { "date-a": true }, stageAnswers: {} };
const guest = { id: "guest", name: "Invité Test", role: "guest", answers: { "date-a": true }, stageAnswers: {} };
const payload = (manage) => ({
  event: {
    slug, eventType: isStay ? "stay" : "outing", organizerName: organizer.name,
    title: isStay ? "Week-end test calendrier" : "Bowling test calendrier", city: "Paris", maxPlaces: 8,
    budgetEur: 20, responseDeadline: null, confirmedDateId: confirmed ? "date-a" : null,
    status: confirmed ? "confirmed" : "collecting", createdAt: "2026-10-04T08:00:00.000Z",
    places: [{ id: "place-a", position: 1, startTime: null, mapsUrl: "", name: "Lieu Test", address: "Paris", image: "", rating: "", ratingLabel: "", category: "", hours: "", attendingCount: 2 }],
    dates: [date()],
  },
  summary: { participantCount: 2, guestCount: 1 }, manage,
  ...(manage ? { me: organizer, voters: [organizer, guest], notificationPreferences: { newResponses: true, reminders: true, active: false } } : {}),
});

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "fr-FR", timezoneId: "Europe/Paris" });
  await context.addInitScript(() => {
    window.__copiedText = "";
    window.__shareData = null;
    window.__shareMode = "success";
    window.__denyClipboard = false;
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text) => {
      if (window.__denyClipboard) throw new DOMException("Denied", "NotAllowedError");
      window.__copiedText = text;
    } } });
    Object.defineProperty(navigator, "share", { configurable: true, value: async (data) => {
      window.__shareData = data;
      if (window.__shareMode === "cancel") throw new DOMException("Cancelled", "AbortError");
      if (window.__shareMode === "error") throw new DOMException("Denied", "NotAllowedError");
    } });
  });
  await context.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === `/api/events/${slug}/confirm`) {
      assert.equal(request.method(), "POST");
      assert.equal(request.postDataJSON().manageToken, privateToken);
      confirmationRequests += 1;
      confirmed = true;
      return route.fulfill({ json: payload(true) });
    }
    if (url.pathname === `/api/events/${slug}`) return route.fulfill({ json: payload(url.searchParams.get("manage") === privateToken) });
    throw new Error(`Unexpected API request: ${url.pathname}`);
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.setDefaultTimeout(15000);
  await page.goto(`${baseUrl}/?event=${slug}&manage=${privateToken}`);
  await page.getByRole("button", { name: "↗ Partager la relance", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Copier le lien du calendrier", exact: true }).count(), 0);
  await page.getByRole("button", { name: "Confirmer", exact: true }).click();
  await page.getByRole("button", { name: "Copier le lien du calendrier", exact: true }).waitFor();
  assert.equal(confirmationRequests, 1);
  assert.equal(await page.getByRole("button", { name: "↗ Partager la relance", exact: true }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "Copier le lien", exact: true }).count(), 0);
  await page.getByRole("button", { name: "Copier le lien du calendrier", exact: true }).click();
  assert.equal(await page.evaluate(() => window.__copiedText), calendarUrl);
  await page.locator(".calendar-sharing-status").filter({ hasText: "Lien copié · colle-le dans ton groupe" }).waitFor();
  assert.equal(await page.getByRole("link", { name: "＋ Ajouter à mon calendrier", exact: true }).getAttribute("href"), `/api/events/${slug}/calendar`);
  console.log("PASS confirmation -> copy direct calendar link; no vote/private link; individual calendar action retained");

  await page.getByRole("button", { name: "↗ Partager le lien du calendrier", exact: true }).click();
  const data = await page.evaluate(() => window.__shareData);
  assert.equal(data.url, calendarUrl);
  assert.match(data.text, /Bowling test calendrier/);
  assert.doesNotMatch(JSON.stringify(data), /test-private-token|manage=|participant=|\/e\//);
  await page.evaluate(() => { window.__shareMode = "cancel"; });
  await page.getByRole("button", { name: "↗ Partager le lien du calendrier", exact: true }).click();
  assert.equal(await page.locator(".calendar-sharing-fallback").count(), 0);
  await page.evaluate(() => { window.__shareMode = "error"; });
  await page.getByRole("button", { name: "↗ Partager le lien du calendrier", exact: true }).click();
  await page.getByRole("button", { name: "Copier le message et le lien", exact: true }).waitFor();
  await page.getByRole("button", { name: "Copier le message et le lien", exact: true }).click();
  assert.match(await page.evaluate(() => window.__copiedText), new RegExp(`${slug}/calendar$`));
  await page.evaluate(() => { window.__denyClipboard = true; });
  await page.getByRole("button", { name: "Copier le lien du calendrier", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "La copie automatique n’est pas disponible" }).waitFor();
  assert.equal(await page.getByRole("textbox", { name: "Lien du calendrier", exact: true }).inputValue(), calendarUrl);
  console.log("PASS native sharing, user cancellation, failed sharing, message fallback, and denied clipboard");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Copier le lien du calendrier", exact: true }).scrollIntoViewIfNeeded();
  const layout = await page.locator(".manage-confirmed").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const buttons = [...element.querySelectorAll(".calendar-sharing-actions > *")].map((button) => button.getBoundingClientRect());
    return { left: rect.left, right: rect.right, viewport: innerWidth, noOverflow: element.scrollWidth <= element.clientWidth, tapTargets: buttons.every((button) => button.height >= 44), stacked: buttons[1].top >= buttons[0].bottom };
  });
  assert.ok(layout.left >= 0 && layout.right <= layout.viewport && layout.noOverflow && layout.tapTargets && layout.stacked, JSON.stringify(layout));
  if (process.env.BIMA_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.BIMA_SCREENSHOT_DIR}/calendar-sharing-mobile.png` });
  await page.evaluate(() => { Object.defineProperty(navigator, "share", { configurable: true, value: undefined }); window.__denyClipboard = false; });
  await page.getByRole("button", { name: "↗ Partager le lien du calendrier", exact: true }).click();
  await page.getByRole("button", { name: "Copier le message et le lien", exact: true }).waitFor();
  console.log("PASS mobile 390px layout, touch target sizes, and browser without native sharing");

  await page.reload();
  await page.getByRole("button", { name: "Copier le lien du calendrier", exact: true }).waitFor();
  isStay = true;
  await page.reload();
  await page.getByRole("heading", { name: "Le séjour est confirmé 🎉", exact: true }).waitFor();
  await page.getByRole("button", { name: "Copier le lien du calendrier", exact: true }).click();
  assert.equal(await page.evaluate(() => window.__copiedText), calendarUrl);
  console.log("PASS already-confirmed outings and stays without data migration");

  const guestPage = await context.newPage();
  guestPage.on("pageerror", (error) => errors.push(error.message));
  await guestPage.goto(`${baseUrl}/?event=${slug}`);
  await guestPage.getByRole("link", { name: "＋ Ajouter au calendrier (.ics)", exact: true }).waitFor();
  assert.equal(await guestPage.getByRole("button", { name: "Modifier les informations", exact: true }).count(), 0);
  assert.equal(await guestPage.locator('input[type="email"]').count(), 0);
  assert.deepEqual(errors, []);
  console.log("PASS guest calendar remains available without login/email or organizer controls; no page runtime errors");
} finally {
  await browser.close();
}
