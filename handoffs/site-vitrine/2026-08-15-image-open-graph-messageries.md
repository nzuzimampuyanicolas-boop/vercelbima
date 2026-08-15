# BIMA — image Open Graph pour les partages

Date : 15 août 2026

## Statut

L’image Open Graph existante de BIMA est maintenant reliée aux métadonnées sociales de l’application. La modification est publiée et vérifiée sur l’URL publique.

## Changements terminés et vérifiés

- déclaration de l’image `/og.png` dans les métadonnées Open Graph ;
- déclaration de la même image pour Twitter/X ;
- activation du format de carte `summary_large_image` ;
- ajout du nom du site, de la locale française et de l’URL canonique Open Graph ;
- ajout du texte alternatif « BIMA — La sortie qui sort du groupe. » ;
- déclaration des dimensions réelles de l’image : 1536 × 1024 pixels ;
- correction de l’adresse de repli vers `bima-app-sigma.vercel.app` pour générer une URL absolue fiable.
- ajout d’un test de non-régression couvrant l’image, ses dimensions, son texte alternatif et le format de carte sociale.

## Bénéfice utilisateur

Lorsqu’un lien BIMA est partagé dans une messagerie ou sur un réseau compatible, il peut désormais afficher un aperçu visuel identifiable au lieu d’un simple lien texte.

## Impact sur la promesse du produit

La promesse ne change pas. Le partage des sorties devient simplement plus reconnaissable et plus rassurant pour les invités.

## Mise à jour obligatoire de la vitrine

Aucun nouveau texte commercial ni aucune nouvelle section ne sont nécessaires.

Si la vitrine Framer utilise ses propres paramètres sociaux, utiliser le même visuel Open Graph afin d’unifier les aperçus entre la vitrine et l’application.

## À ne pas annoncer

- Ne pas présenter l’aperçu social comme une nouvelle fonctionnalité centrale.
- Ne pas garantir que toutes les messageries affichent immédiatement l’image : certaines conservent les anciens aperçus en cache.
- Ne pas promettre un affichage identique dans toutes les messageries, qui peuvent appliquer leur propre recadrage.

## URL publique vérifiée

`https://bima-app-sigma.vercel.app/`

## Image utilisée

`public/og.png`
