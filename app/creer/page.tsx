import type { Metadata } from "next";
import { BimaApp } from "../page";
import { createPageMetadata } from "../lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Créer une sortie",
  description: "Propose des dates, partage le lien et organise ta prochaine sortie avec BIMA.",
  path: "/creer",
  index: false,
});

export default function CreateEventPage() {
  return <BimaApp />;
}
