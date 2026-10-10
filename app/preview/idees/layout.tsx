import type { Metadata } from "next";
import { notFound } from "next/navigation";
export const metadata: Metadata = { title: "BIMA | Le labo", robots: { index: false, follow: false } };
export default function Layout({children}: {children: React.ReactNode}) { if (process.env.VERCEL_ENV === "production") notFound(); return children; }
