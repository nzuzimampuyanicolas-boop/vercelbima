import type { Metadata } from "next";
import { createPageMetadata } from "../../lib/seo";
import BimaApp from "../../page";

type ManagePageProps = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: ManagePageProps): Promise<Metadata> {
  const { code } = await params;
  return createPageMetadata({
    title: "Gérer ma sortie",
    description: "Espace privé permettant à l’organisateur de suivre et confirmer sa sortie BIMA.",
    path: `/m/${encodeURIComponent(code)}`,
    index: false,
  });
}

export default async function ManageShortLinkPage({ params }: ManagePageProps) {
  const { code } = await params;
  return <BimaApp initialManageShortCode={code} />;
}
