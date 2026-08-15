import type { Metadata } from "next";
import { createPageMetadata } from "../lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Administration",
  description: "Espace privé d’administration des données BIMA.",
  path: "/admin",
  index: false,
});

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
