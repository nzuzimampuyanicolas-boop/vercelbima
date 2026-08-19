import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { defaultDescription, siteUrl, socialImage } from "./lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "BIMA",
  title: {
    default: "BIMA | Organisez vos sorties entre amis",
    template: "%s | BIMA",
  },
  description: defaultDescription,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  referrer: "no-referrer",
  icons: { icon: "/bima-logo.svg", shortcut: "/bima-logo.svg", apple: "/bima-logo.svg" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: "BIMA",
    title: "BIMA | Organisez vos sorties entre amis",
    description: "Propose des dates, découvre le lieu et confirme votre prochaine sortie.",
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "BIMA | Organisez vos sorties entre amis",
    description: "Propose des dates, découvre le lieu et confirme votre prochaine sortie.",
    images: [socialImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
