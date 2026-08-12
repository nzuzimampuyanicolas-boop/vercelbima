import { apiOptions, proxyBima } from "../../../../../_shared";

export const dynamic = "force-dynamic";
export const preferredRegion = "lhr1";

export function OPTIONS() {
  return apiOptions();
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string; participantId: string }> },
) {
  const { slug, participantId } = await context.params;
  return proxyBima(
    request,
    `/api/events/${encodeURIComponent(slug)}/participants/${encodeURIComponent(participantId)}/delete`,
  );
}
