import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createPageMetadata } from "../lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Confidentialité",
  description: "Découvre quelles données BIMA utilise pour organiser une sortie et comment elles peuvent être supprimées.",
  path: "/confidentialite",
});

export default function PrivacyPage() {
  return (
    <main className="privacy-page">
      <Link className="brand" href="/">
        <Image src="/bima-logo.svg" alt="" width={46} height={46} priority />
        <span>BIMA</span>
      </Link>
      <span className="step-label">CONFIDENTIALITÉ</span>
      <h1>Des données limitées à l’organisation de la sortie.</h1>
      <p>BIMA fonctionne sans compte. L’application enregistre uniquement les informations saisies par l’organisateur et les participants : prénom, disponibilités, étapes choisies, lieux et dates de la sortie. Après avoir répondu, un invité peut aussi choisir de laisser son e-mail pour recevoir la confirmation finale de cet événement précis.</p>
      <h2>Qui peut voir ces informations ?</h2>
      <p>Les personnes qui possèdent le lien invité voient les informations de la sortie et les totaux. Seule la personne qui possède le lien privé organisateur peut consulter le détail des réponses et confirmer une date.</p>
      <h2>Suppression</h2>
      <p>L’organisateur peut supprimer définitivement la sortie depuis sa page de gestion. Cette suppression efface également les participants et toutes leurs réponses.</p>
      <h2>E-mail de l’organisateur</h2>
      <p>L’adresse e-mail demandée lors de la création sert uniquement à envoyer ou récupérer le lien privé de gestion et, ponctuellement, à demander un retour sur l’utilisation de BIMA. Elle n’est pas ajoutée à une liste de diffusion marketing sans un consentement supplémentaire explicite.</p>
      <h2>E-mail facultatif du participant</h2>
      <p>Le participant n’a jamais besoin d’un e-mail pour répondre. Une fois sa réponse enregistrée, il peut facultativement demander à recevoir la date ou la période finale. Son adresse est alors liée uniquement à cette sortie ou ce séjour, n’est pas utilisée pour une newsletter et n’est pas transmise à l’organisateur.</p>
      <h2>Mises à jour produit</h2>
      <p>Une personne peut séparément demander à être prévenue des mises à jour de BIMA depuis la landing page. Son prénom et son adresse e-mail sont alors utilisés uniquement pour personnaliser et envoyer ces mises à jour, sur la base de son consentement, et conservés jusqu’à sa demande de désinscription ou de suppression. Elle peut exercer cette demande à l’adresse bima.sorties@gmail.com.</p>
      <h2>Liens personnels</h2>
      <p>Les liens organisateur et participant sont des accès privés. Ne les publiez pas sur un site ouvert et transmettez-les uniquement aux personnes concernées.</p>
      <Link className="primary share-link" href="/">Revenir à BIMA</Link>
    </main>
  );
}
