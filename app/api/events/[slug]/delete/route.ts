import { proxyBima } from "../../../_shared";

export const dynamic = "force-dynamic";
export const preferredRegion = "lhr1";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  return proxyBima(request, `/api/events/${encodeURIComponent(slug)}/delete`);
}
