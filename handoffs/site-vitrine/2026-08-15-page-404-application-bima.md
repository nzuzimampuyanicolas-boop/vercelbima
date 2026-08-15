# BIMA — page 404 de l’application

Date : 15 août 2026

## Statut

La page 404 personnalisée de l’application BIMA est publiée et vérifiée sur l’URL publique Vercel.

## Changements terminés et vérifiés

- remplacement de la page 404 générique de Next.js par une page aux couleurs de BIMA ;
- message principal : « On s’est perdus en chemin. » ;
- explication courte lorsqu’un lien est incorrect ou qu’une sortie n’est plus disponible ;
- CTA principal unique : « Retour à l’accueil » ;
- logo et signature « BIMA · Sors. Vis. Recommence. » ;
- titre de page spécifique « Page introuvable — BIMA » ;
- consigne `noindex` pour empêcher l’indexation de la page d’erreur ;
- rendu vérifié à 1280 × 720 et 390 × 844, sans débordement horizontal et avec le CTA visible sans défilement ;
- build de production, TypeScript et tests fonctionnels validés.

## Bénéfice utilisateur

Une personne qui ouvre un lien erroné, incomplet ou devenu indisponible comprend immédiatement ce qui se passe et peut revenir à l’accueil sans rester bloquée.

## Impact sur la promesse du produit

Aucun nouveau bénéfice produit. Cette modification renforce seulement la cohérence, la confiance et la qualité perçue de BIMA jusque dans les erreurs de navigation.

## Mise à jour obligatoire de la vitrine

Aucune nouvelle section ni nouveau texte commercial ne sont nécessaires.

Vérifier simplement que les liens erronés de la vitrine qui pointent vers BIMA affichent bien cette nouvelle page plutôt qu’une erreur générique.

## Suggestion facultative

La vitrine Framer possède déjà une proposition de page 404 au message proche. Il est possible d’aligner exactement ses couleurs, sa ponctuation et son CTA sur la version de l’application pour garder une expérience homogène entre les deux sites.

## À ne pas annoncer

- Ne pas présenter la page 404 comme une nouvelle fonctionnalité BIMA.
- Ne pas transformer cette finition technique en argument commercial principal.

## URL publique vérifiée

`https://bima-app-sigma.vercel.app/une-page-qui-nexiste-pas`

## Fichiers de l’application concernés

- `app/not-found.tsx`
- `app/globals.css`
