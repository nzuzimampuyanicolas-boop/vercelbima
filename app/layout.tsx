import type { Metadata } from "next";
import "./globals.css";

const deploymentHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_URL ||
  "bima.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(`https://${deploymentHost}`),
  title: "Bima — Enfin, on se décide",
  description: "Propose des dates, récolte les disponibilités et confirme votre prochaine sortie.",
  referrer: "no-referrer",
  icons: { icon: "/bima-logo.svg", shortcut: "/bima-logo.svg", apple: "/bima-logo.svg" },
  openGraph: {
    title: "Bima — Enfin, on se décide",
    description: "Propose des dates, découvre le lieu et confirme votre prochaine sortie.",
  },
  twitter: {
    card: "summary",
    title: "Bima — Enfin, on se décide",
    description: "Propose des dates, découvre le lieu et confirme votre prochaine sortie.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
