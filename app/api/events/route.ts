import { NextResponse } from "next/server";
import { sendManagementEmail } from "@/app/lib/gmail";
import { apiOptions, bimaBackendUrl, bimaResponseHeaders } from "../_shared";

export const preferredRegion = "lhr1";

export function OPTIONS() {
  return apiOptions();
}

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const body = JSON.parse(bodyText) as {
      organizerEmail?: string;
      organizerName?: string;
      title?: string;
    };
    const upstream = await fetch(bimaBackendUrl("/api/events"), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: bodyText,
      cache: "no-store",
    });
    const payload = await upstream.json().catch(() => null) as Record<string, unknown> | null;

    if (!upstream.ok || !payload) {
      return NextResponse.json(
        payload || { error: "Le service BIMA est momentanément indisponible." },
        { status: upstream.status || 502, headers: bimaResponseHeaders },
      );
    }

    const origin = new URL(request.url).origin;
    const managePath = typeof payload.managePath === "string" ? payload.managePath : "";
    const emailResult = await sendManagementEmail({
      to: (body.organizerEmail || "").trim().toLowerCase(),
      organizerName: (body.organizerName || "").trim(),
      eventTitle: (body.title || "").trim(),
      manageUrl: new URL(managePath, origin).toString(),
    });

    return NextResponse.json(
      {
        ...payload,
        organizerEmail: (body.organizerEmail || "").trim().toLowerCase(),
        emailSent: emailResult.sent,
        emailWarning: emailResult.warning,
      },
      { status: 201, headers: bimaResponseHeaders },
    );
  } catch (error) {
    console.error("BIMA event creation failed", error);
    return NextResponse.json(
      { error: "Le service BIMA est momentanément indisponible." },
      { status: 502, headers: bimaResponseHeaders },
    );
  }
}
