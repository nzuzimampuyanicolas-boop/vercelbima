import type { Metadata } from "next";
import "./globals.css";

const deploymentHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_URL ||
  "bima-app-sigma.vercel.app";

const socialImage = {
  url: "/og.png",
  width: 1536,
  height: 1024,
  alt: "BIMA — La sortie qui sort du groupe.",
};

export const metadata: Metadata = {
  metadataBase: new URL(`https://${deploymentHost}`),
  title: "Bima — Enfin, on se décide",
  description: "Propose des dates, récolte les disponibilités et confirme votre prochaine sortie.",
  referrer: "no-referrer",
  icons: { icon: "/bima-logo.svg", shortcut: "/bima-logo.svg", apple: "/bima-logo.svg" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: "BIMA",
    title: "Bima — Enfin, on se décide",
    description: "Propose des dates, découvre le lieu et confirme votre prochaine sortie.",
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bima — Enfin, on se décide",
    description: "Propose des dates, découvre le lieu et confirme votre prochaine sortie.",
    images: [socialImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
