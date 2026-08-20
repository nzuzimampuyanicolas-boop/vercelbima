import type { Metadata } from "next";
import { bimaBackendUrl } from "../../api/_shared";
import { createPageMetadata } from "../../lib/seo";
import BimaApp from "../../page";

type EventPageProps = { params: Promise<{ slug: string }> };

type PublicEventMetadata = {
  event?: {
    title?: unknown;
    eventType?: unknown;
  };
};

async function readPublicEvent(slug: string) {
  try {
    const response = await fetch(
      bimaBackendUrl(`/api/events/${encodeURIComponent(slug)}`),
      { cache: "no-store", headers: { accept: "application/json" } },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as PublicEventMetadata;
    const title = typeof payload.event?.title === "string"
      ? payload.event.title.trim().slice(0, 80)
      : "";
    if (!title) return null;
    return {
      title,
      eventType: payload.event?.eventType === "stay" ? "stay" : "outing",
    } as const;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await readPublicEvent(slug);
  const title = event?.title || "Invitation à une sortie";
  const description = event?.eventType === "stay"
    ? `Choisis tes dates pour le séjour « ${title} » avec BIMA.`
    : `Indique tes disponibilités pour « ${title} » et aide le groupe à se décider.`;

  return createPageMetadata({
    title,
    description,
    path: `/e/${encodeURIComponent(slug)}`,
    index: false,
  });
}

export default async function PublicEventPage({ params }: EventPageProps) {
  const { slug } = await params;
  return <BimaApp initialEventSlug={slug} />;
}
