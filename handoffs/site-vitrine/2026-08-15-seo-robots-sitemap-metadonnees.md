# BIMA — robots.txt, sitemap.xml et métadonnées des pages

Date : 15 août 2026

## Statut

La configuration SEO de l’application BIMA a été structurée et vérifiée localement. La publication doit être confirmée sur Vercel avant d’annoncer le changement comme disponible.

## Changements terminés et vérifiés

- création de `/robots.txt` ;
- création de `/sitemap.xml` ;
- ajout d’un titre global avec le modèle `%s | BIMA` ;
- ajout d’une URL canonique pour l’accueil et la page Confidentialité ;
- ajout de métadonnées françaises propres à l’accueil et à la page Confidentialité ;
- ajout de métadonnées sociales dynamiques pour les invitations publiques : le titre de la sortie ou du séjour apparaît dans l’aperçu lorsque les données sont disponibles ;
- passage en `noindex` des invitations, de l’administration, des liens privés organisateur et des liens personnels participant ;
- exclusion de l’administration, des API et des liens privés dans `robots.txt` ;
- sitemap volontairement limité à l’accueil et à la page Confidentialité ;
- conservation de l’image Open Graph officielle BIMA ;
- build Next.js réussi, lint ciblé réussi et 12 tests automatisés réussis.

## Bénéfice utilisateur

Les liens BIMA sont mieux présentés dans les moteurs et les messageries, tandis que les pages contenant des informations de groupe ou des accès personnels restent hors des résultats de recherche.

## Impact sur la promesse

La promesse produit ne change pas. La marque est présentée plus proprement et la confidentialité des parcours organisateur et participant est renforcée.

## Mise à jour obligatoire de la vitrine

Vérifier que la vitrine utilise les formulations suivantes ou des formulations cohérentes :

- titre principal : `BIMA — Enfin, on se décide` ;
- description : `Propose des dates, récolte les disponibilités et confirme votre prochaine sortie.` ;
- image sociale : l’image Open Graph officielle BIMA déjà fournie.

Si la vitrine dispose de son propre `robots.txt` ou `sitemap.xml`, elle doit conserver uniquement ses pages réellement publiques et ne jamais référencer des URLs d’administration, de gestion, de participant ou d’invitation privée.

## Suggestions facultatives

- Prévisualiser le partage de la vitrine sur WhatsApp, iMessage, LinkedIn et Facebook.
- Connecter le domaine définitif à Google Search Console lorsque ce domaine aura été choisi.

## À ne pas annoncer

- Ne pas présenter ce travail comme une nouvelle fonctionnalité utilisateur.
- Ne pas promettre que les invitations ou liens privés apparaîtront dans Google : ils sont volontairement exclus de l’indexation.
- Ne pas annoncer une optimisation complète du référencement tant que la vitrine et son futur domaine définitif n’ont pas été audités séparément.

## URLs publiques à vérifier après déploiement

- `https://bima-app-sigma.vercel.app/robots.txt`
- `https://bima-app-sigma.vercel.app/sitemap.xml`
- `https://bima-app-sigma.vercel.app/`
- `https://bima-app-sigma.vercel.app/confidentialite`

## Fichiers principaux concernés

- `app/lib/seo.ts`
- `app/layout.tsx`
- `app/robots.ts`
- `app/sitemap.ts`
- `app/confidentialite/page.tsx`
- `app/e/[slug]/page.tsx`
- `app/admin/layout.tsx`
- `app/m/[code]/page.tsx`
- `app/p/[code]/page.tsx`
