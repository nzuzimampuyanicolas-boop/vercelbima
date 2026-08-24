import { apiOptions, proxyBima } from "../../../_shared";
import { processParticipantConfirmations } from "@/app/lib/participant-confirmations";
import { after } from "next/server";

export const preferredRegion = "lhr1";

export function OPTIONS() {
  return apiOptions();
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const response = await proxyBima(request, `/api/events/${encodeURIComponent(slug)}/participant-email`);
  if (response.ok) {
    after(async () => {
      try {
        await processParticipantConfirmations(slug);
      } catch (error) {
        console.error("BIMA participant confirmation after email opt-in failed", error instanceof Error ? error.message : error);
      }
    });
  }
  return response;
}
