# BIMA — statistiques Vercel

Date : 19 août 2026
Application : https://bima-app-sigma.vercel.app/

## Changement terminé

BIMA transmet désormais à Vercel deux catégories de mesures sur toutes les pages :

- Web Analytics : visites, pages consultées, sources de trafic et informations techniques agrégées ;
- Speed Insights : performances réelles telles que LCP, INP, CLS, FCP et TTFB.

L’instrumentation utilise les composants officiels `@vercel/analytics` et `@vercel/speed-insights` dans le layout global Next.js.

## Bénéfice

L’équipe BIMA peut suivre l’usage général de la webapp et repérer les pages lentes depuis le tableau de bord Vercel, sans modifier le parcours de l’organisateur ou des invités.

## Mise à jour de la vitrine

Aucune modification publique de la vitrine n’est nécessaire. Cette instrumentation est interne et n’ajoute aucune fonctionnalité visible pour les visiteurs.

## À ne pas annoncer

- Ne pas présenter ces mesures comme une fonctionnalité utilisateur.
- Ne pas publier de chiffres avant d’avoir collecté un volume de données suffisant.
- Ne pas affirmer une conformité juridique globale sur la seule base de cette intégration.
