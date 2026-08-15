import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page introuvable — BIMA",
  description: "Cette page BIMA n’existe pas ou n’est plus disponible.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-shape not-found-shape-left" aria-hidden="true" />
      <div className="not-found-shape not-found-shape-right" aria-hidden="true" />

      <section className="not-found-card" aria-labelledby="not-found-title">
        <Link className="brand not-found-brand" href="/" aria-label="Revenir à l’accueil BIMA">
          <Image src="/bima-logo.svg" alt="" width={52} height={52} priority />
          <span>BIMA</span>
        </Link>

        <div className="not-found-mark" aria-hidden="true">?</div>

        <div className="not-found-heading">
          <span className="step-label">CETTE SORTIE N’EXISTE PAS</span>
          <p aria-hidden="true">404</p>
        </div>

        <h1 id="not-found-title">On s’est perdus en chemin.</h1>
        <p className="not-found-copy">
          Le lien est peut-être incorrect ou cette sortie n’est plus disponible.
          Reviens à l’accueil pour organiser la prochaine.
        </p>

        <Link className="primary large share-link not-found-cta" href="/">
          Retour à l’accueil <span aria-hidden="true">→</span>
        </Link>

        <p className="not-found-signature">BIMA · Sors. Vis. Recommence.</p>
      </section>
    </main>
  );
}
