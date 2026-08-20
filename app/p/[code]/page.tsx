import type { Metadata } from "next";
import { createPageMetadata } from "../../lib/seo";
import BimaApp from "../../page";

type ParticipantPageProps = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: ParticipantPageProps): Promise<Metadata> {
  const { code } = await params;
  return createPageMetadata({
    title: "Ma réponse",
    description: "Lien personnel permettant de consulter ou modifier une réponse à une sortie BIMA.",
    path: `/p/${encodeURIComponent(code)}`,
    index: false,
  });
}

export default async function ParticipantShortLinkPage({ params }: ParticipantPageProps) {
  const { code } = await params;
  return <BimaApp initialParticipantShortCode={code} />;
}
