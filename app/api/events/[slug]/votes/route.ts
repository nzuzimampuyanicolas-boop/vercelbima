import { apiOptions, proxyBima } from "../../../_shared";
import { processPendingNotifications } from "@/app/lib/notifications";
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
  const response = await proxyBima(request, `/api/events/${encodeURIComponent(slug)}/votes`);
  if (response.ok) {
    after(async () => {
      try {
        await processPendingNotifications({ slug });
      } catch (error) {
        console.error("BIMA immediate notification failed", error instanceof Error ? error.message : error);
      }
    });
  }
  return response;
}
