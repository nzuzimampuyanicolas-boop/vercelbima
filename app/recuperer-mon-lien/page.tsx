import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createPageMetadata } from "../lib/seo";
import RecoveryForm from "./RecoveryForm";

export const metadata: Metadata = createPageMetadata({
  title: "Récupérer mon lien privé",
  description: "Retrouve par e-mail le lien privé qui permet de gérer ta sortie BIMA.",
  path: "/recuperer-mon-lien",
  index: false,
});

export default function RecoverManagementLinkPage() {
  return (
    <main className="recovery-page">
      <Link className="brand" href="/">
        <Image src="/bima-logo.svg" alt="" width={46} height={46} priority />
        <span>BIMA</span>
      </Link>
      <section className="recovery-card">
        <span className="step-label">LIEN PRIVÉ PERDU ?</span>
        <h1>On te renvoie les clés.</h1>
        <p>Entre le mail utilisé lors de la création. Si une sortie correspond, tu recevras un nouveau lien de gestion.</p>
        <RecoveryForm />
        <Link className="text-link" href="/creer">Créer une nouvelle sortie →</Link>
      </section>
    </main>
  );
}
