import type { Metadata } from "next";
import { notFound } from "next/navigation";
export const metadata: Metadata = { title: "BIMA | Exemple d’invitation", robots: { index: false, follow: false } };
export default function PreviewLayout({ children }: { children: React.ReactNode }) { if (process.env.VERCEL_ENV === "production") notFound(); return children; }
