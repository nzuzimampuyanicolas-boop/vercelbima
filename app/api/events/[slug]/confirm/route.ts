import { apiOptions, proxyBima } from "../../../_shared";

export const preferredRegion = "lhr1";

export function OPTIONS() {
  return apiOptions();
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  return proxyBima(request, `/api/events/${encodeURIComponent(slug)}/confirm`);
}
