import { proxyBima } from "../../../_shared";

export const preferredRegion = "lhr1";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  return proxyBima(request, `/api/events/${encodeURIComponent(slug)}/calendar`);
}
