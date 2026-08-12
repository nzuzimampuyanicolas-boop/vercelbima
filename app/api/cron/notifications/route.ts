import { NextResponse } from "next/server";
import { processPendingNotifications } from "@/app/lib/notifications";

export const preferredRegion = "lhr1";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
  }
  try {
    const referenceDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    return NextResponse.json({ ok: true, ...(await processPendingNotifications({ referenceDate })) });
  } catch (error) {
    console.error("BIMA notification cron failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Le traitement des notifications a échoué." }, { status: 503 });
  }
}
