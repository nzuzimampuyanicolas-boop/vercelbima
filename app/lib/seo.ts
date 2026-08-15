import type { Metadata } from "next";

const deploymentHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_URL ||
  "bima-app-sigma.vercel.app";

const deploymentUrl = deploymentHost.startsWith("http")
  ? deploymentHost
  : `https://${deploymentHost}`;

export const siteUrl = new URL(deploymentUrl).origin;

export const defaultDescription =
  "Propose des dates, récolte les disponibilités et confirme votre prochaine sortie.";

export const socialImage = {
  url: "/og.png",
  width: 1536,
  height: 1024,
  alt: "BIMA — La sortie qui sort du groupe.",
};

type PageMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  index?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  index = true,
}: PageMetadataOptions): Metadata {
  const fullTitle = `${title} | BIMA`;

  return {
    title,
    description,
    ...(path ? { alternates: { canonical: path } } : {}),
    robots: {
      index,
      follow: index,
      googleBot: {
        index,
        follow: index,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      ...(path ? { url: path } : {}),
      siteName: "BIMA",
      title: fullTitle,
      description,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [socialImage],
    },
  };
}
