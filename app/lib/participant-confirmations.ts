import { sendParticipantConfirmationEmail } from "@/app/lib/gmail";

const DEFAULT_BIMA_API_URL = "https://ebilhzvgvinbpmmpezua.supabase.co/functions/v1/bima-api";
const DEFAULT_PUBLIC_URL = "https://bima-app-sigma.vercel.app";

type ConfirmationJob = {
  id: string;
  to: string;
  participantName: string;
  eventTitle: string;
  eventType: "outing" | "stay";
  startsAt: string;
  endsAt: string | null;
  places: Array<{ name: string; address?: string | null; maps_url?: string | null }>;
  participantPath: string;
  calendarPath: string;
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

function confirmationDateLabel(job: ConfirmationJob) {
  if (job.eventType === "stay" && job.endsAt) {
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" };
    const formatter = new Intl.DateTimeFormat("fr-FR", options);
    return `Du ${formatter.format(new Date(job.startsAt))} au ${formatter.format(new Date(job.endsAt))}`;
  }
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(new Date(job.startsAt));
}

export async function processParticipantConfirmations(slug: string) {
  const secret = notificationSecret();
  const claimResponse = await fetch(backendUrl("/api/participant-confirmations/claim"), {
    method: "POST",
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify({ slug }),
    cache: "no-store",
  });
  const payload = await claimResponse.json().catch(() => null) as { jobs?: ConfirmationJob[]; error?: string } | null;
  if (!claimResponse.ok || !payload) throw new Error(payload?.error || "Impossible de charger les confirmations participant.");

  const publicUrl = (process.env.BIMA_PUBLIC_URL || DEFAULT_PUBLIC_URL).replace(/\/$/, "");
  const results: Array<{ id: string; sent: boolean; error?: string }> = [];
  for (const job of payload.jobs || []) {
    try {
      await sendParticipantConfirmationEmail({
        to: job.to,
        participantName: job.participantName,
        eventTitle: job.eventTitle,
        eventType: job.eventType,
        dateLabel: confirmationDateLabel(job),
        places: job.places,
        participantUrl: new URL(job.participantPath, publicUrl).toString(),
        calendarUrl: new URL(job.calendarPath, publicUrl).toString(),
      });
      results.push({ id: job.id, sent: true });
    } catch (error) {
      results.push({ id: job.id, sent: false, error: error instanceof Error ? error.message : "Échec de l’envoi." });
    }
  }

  if (results.length) {
    const completeResponse = await fetch(backendUrl("/api/participant-confirmations/complete"), {
      method: "POST",
      headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
      body: JSON.stringify({ results }),
      cache: "no-store",
    });
    if (!completeResponse.ok) throw new Error("Impossible de finaliser les confirmations participant.");
  }

  return {
    processed: results.length,
    sent: results.filter((result) => result.sent).length,
    failed: results.filter((result) => !result.sent).length,
  };
}
