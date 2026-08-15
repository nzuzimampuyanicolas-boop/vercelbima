import type { Metadata } from "next";
import "./globals.css";
import { defaultDescription, siteUrl, socialImage } from "./lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "BIMA",
  title: {
    default: "BIMA — Enfin, on se décide",
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
    title: "BIMA — Enfin, on se décide",
    description: "Propose des dates, découvre le lieu et confirme votre prochaine sortie.",
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "BIMA — Enfin, on se décide",
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
