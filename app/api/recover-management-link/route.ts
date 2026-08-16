import { NextResponse } from "next/server";
import { sendManagementRecoveryEmail } from "@/app/lib/gmail";
import {
  apiOptions,
  bimaBackendUrl,
  bimaProxyRequestHeaders,
  bimaResponseHeaders,
  bimaUpstreamResponseHeaders,
} from "../_shared";

export const preferredRegion = "lhr1";
export const maxDuration = 30;

const genericMessage =
  "Si cette adresse correspond à une sortie BIMA, tes liens privés arrivent par e-mail. Pense à vérifier tes spams.";

type RecoveryEvent = {
  title: string;
  organizerName: string;
  eventType: "outing" | "stay";
  managePath: string;
};

export function OPTIONS() {
  return apiOptions();
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { email?: string } | null;
    const email = (body?.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Ajoute une adresse e-mail valide." },
        { status: 400, headers: bimaResponseHeaders },
      );
    }

    const secret = (process.env.NOTIFICATION_SECRET || "").trim();
    if (!secret) throw new Error("NOTIFICATION_SECRET is not configured.");
    const headers = bimaProxyRequestHeaders(request);
    headers.set("authorization", `Bearer ${secret}`);
    headers.set("content-type", "application/json");
    const upstream = await fetch(bimaBackendUrl("/api/recovery/manage"), {
      method: "POST",
      headers,
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
    const payload = await upstream.json().catch(() => null) as { events?: RecoveryEvent[]; error?: string } | null;

    if (upstream.status === 429) {
      return NextResponse.json(
        payload || { error: "Trop de demandes. Réessaie un peu plus tard." },
        { status: 429, headers: bimaUpstreamResponseHeaders(upstream) },
      );
    }
    if (!upstream.ok || !payload) throw new Error(payload?.error || "Recovery backend unavailable.");

    const events = (payload.events || []).slice(0, 10);
    if (events.length) {
      const origin = new URL(request.url).origin;
      try {
        await sendManagementRecoveryEmail({
          to: email,
          organizerName: events[0].organizerName,
          events: events.map((event) => ({
            title: event.title,
            eventType: event.eventType,
            manageUrl: new URL(event.managePath, origin).toString(),
          })),
        });
      } catch (error) {
        // Keep the public response indistinguishable to avoid revealing
        // whether an organizer address exists in the database.
        console.error(
          "BIMA management-link recovery delivery failed",
          error instanceof Error ? error.message : error,
        );
      }
    }

    return NextResponse.json(
      { ok: true, message: genericMessage },
      { headers: bimaUpstreamResponseHeaders(upstream) },
    );
  } catch (error) {
    console.error("BIMA management-link recovery failed", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Impossible de traiter la demande pour le moment. Réessaie un peu plus tard." },
      { status: 503, headers: bimaResponseHeaders },
    );
  }
}
