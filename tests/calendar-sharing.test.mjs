import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { calendarPath, calendarShareData, shareCalendar } from "../app/lib/calendar-sharing.ts";

test("builds a direct public calendar URL, never a voting or management URL", () => {
  assert.equal(calendarPath("bowling-123"), "/api/events/bowling-123/calendar");
  assert.equal(calendarPath("sortie / été?manage=secret"), "/api/events/sortie%20%2F%20%C3%A9t%C3%A9%3Fmanage%3Dsecret/calendar");
  const url = new URL(calendarPath("bowling-123"), "https://bima-app-sigma.vercel.app/?manage=private");
  assert.equal(url.href, "https://bima-app-sigma.vercel.app/api/events/bowling-123/calendar");
  assert.equal(url.search, "");
  const data = calendarShareData("Bowling", "samedi 10 octobre, 19:30", url.href);
  assert.equal(data.url, url.href);
  assert.match(data.title, /Bowling/);
  assert.match(data.text, /samedi 10 octobre, 19:30/);
  assert.match(data.text, /Ajoute la sortie à ton calendrier/);
  assert.doesNotMatch(data.text, /vote|manage=|participant=/);
});

test("shares the calendar without forcing a messaging app", async () => {
  const data = calendarShareData("Week-end", "du 10 au 12 octobre", "https://bima.example/api/events/weekend/calendar");
  let received;
  assert.equal(await shareCalendar(data, async (value) => { received = value; }), "shared");
  assert.deepEqual(received, data);
  assert.equal(await shareCalendar(data), "fallback");
  assert.equal(await shareCalendar(data, async () => { throw new Error("Unavailable"); }), "fallback");
  assert.equal(await shareCalendar(data, async () => { throw new DOMException("Cancelled", "AbortError"); }), "cancelled");
});

test("provides manual copying and hides vote reminders after confirmation", async () => {
  const root = new URL("../", import.meta.url);
  const [page, component, css] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/components/CalendarSharingActions.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);
  assert.match(page, /event.status === "confirmed" && selectedDate && <CalendarSharingActions/);
  assert.match(page, /event.status !== "confirmed" && shareFallbackVisible/);
  assert.match(component, /Copier le lien du calendrier/);
  assert.match(component, /Partager le lien du calendrier/);
  assert.match(component, /Ajouter à mon calendrier/);
  assert.match(component, /new URL\(path, window.location.origin\)/);
  assert.match(component, /navigator.share\(data\)/);
  assert.match(component, /Copier le message et le lien/);
  assert.match(component, /readOnly value=\{absoluteCalendarUrl\(\)\}/);
  assert.match(page, /role="status"/);
  assert.match(component, /role="alert"/);
  assert.doesNotMatch(component, /manageToken|manageShortCode|participantToken|wa.me|eventSharePath/);
  assert.match(css, /\.manage-confirmed \{ grid-template-columns: minmax\(0,1fr\); \}/);
});
