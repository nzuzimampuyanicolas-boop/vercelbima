import { sendOrganizerNotificationEmail, type OrganizerNotificationKind } from "@/app/lib/gmail";

const DEFAULT_BIMA_API_URL = "https://ebilhzvgvinbpmmpezua.supabase.co/functions/v1/bima-api";
const DEFAULT_PUBLIC_URL = "https://bima-app-sigma.vercel.app";

type NotificationJob = {
  id: string;
  kind: OrganizerNotificationKind;
  to: string;
  organizerName: string;
  eventTitle: string;
  managePath: string;
  payload: { participantName?: string };
  participantCount: number;
  maxPlaces: number;
  bestDate: { startsAt: string; endsAt: string | null; availableCount: number } | null;
  eventType: "outing" | "stay";
};

function notificationSecret() {
  const value = (process.env.NOTIFICATION_SECRET || "").trim();
  if (!value) throw new Error("NOTIFICATION_SECRET is not configured.");
  return value;
}

function backendUrl(path: string) {
  const base = (process.env.BIMA_API_URL || DEFAULT_BIMA_API_URL).replace(/\/$/, "");
  return `${base}${path}`;
}

function bestDateLabel(job: NotificationJob) {
  if (!job.bestDate) return undefined;
  const start = new Date(job.bestDate.startsAt);
  if (job.eventType === "stay" && job.bestDate.endsAt) {
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", timeZone: "UTC" };
    return `du ${new Intl.DateTimeFormat("fr-FR", options).format(start)} au ${new Intl.DateTimeFormat("fr-FR", options).format(new Date(job.bestDate.endsAt))} (${job.bestDate.availableCount} disponible${job.bestDate.availableCount > 1 ? "s" : ""})`;
  }
  return `${new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(start)} (${job.bestDate.availableCount} disponible${job.bestDate.availableCount > 1 ? "s" : ""})`;
}

export async function processPendingNotifications(options: { slug?: string; referenceDate?: string } = {}) {
  const secret = notificationSecret();
  const response = await fetch(backendUrl("/api/notifications/process"), {
    method: "POST",
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify(options),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null) as { jobs?: NotificationJob[]; error?: string } | null;
  if (!response.ok || !payload) throw new Error(payload?.error || "Impossible de charger les notifications.");

  const results: Array<{ id: string; sent: boolean; error?: string }> = [];
  for (const job of payload.jobs || []) {
    try {
      const publicUrl = (process.env.BIMA_PUBLIC_URL || DEFAULT_PUBLIC_URL).replace(/\/$/, "");
      await sendOrganizerNotificationEmail({
        kind: job.kind,
        to: job.to,
        organizerName: job.organizerName,
        eventTitle: job.eventTitle,
        manageUrl: new URL(job.managePath, publicUrl).toString(),
        participantName: job.payload.participantName,
        participantCount: job.participantCount,
        maxPlaces: job.maxPlaces,
        bestDateLabel: bestDateLabel(job),
      });
      results.push({ id: job.id, sent: true });
    } catch (error) {
      results.push({ id: job.id, sent: false, error: error instanceof Error ? error.message : "Échec de l’envoi." });
    }
  }

  if (results.length) {
    const completeResponse = await fetch(backendUrl("/api/notifications/complete"), {
      method: "POST",
      headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
      body: JSON.stringify({ results }),
      cache: "no-store",
    });
    if (!completeResponse.ok) throw new Error("Impossible de finaliser les notifications.");
  }
  return {
    processed: results.length,
    sent: results.filter((result) => result.sent).length,
    failed: results.filter((result) => !result.sent).length,
  };
}
