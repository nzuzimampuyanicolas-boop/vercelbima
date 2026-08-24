# BIMA — pilotage privé et attribution des créations

## Changements terminés et vérifiés

- L’espace administrateur privé BIMA comporte désormais une section « Pilotage BIMA ».
- Elle affiche le tunnel réel : sorties créées → sorties ayant reçu une réponse invitée → sorties confirmées.
- Elle affiche des courbes superposées sur six mois : créations de sorties, arrivées d’invités et disponibilités renseignées.
- Les nouvelles créations BIMA enregistrent les paramètres UTM reçus (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`) et le domaine référent quand il est disponible.
- Le tableau privé répartit les créations par source. Les données historiques sans UTM restent regroupées dans « Direct / inconnu ».

## Bénéfice utilisateur et produit

Nicolas peut identifier les canaux qui amènent des sorties réellement engagées et confirmées, plutôt que de se limiter aux visites de la vitrine. Cela aide à privilégier les contenus et canaux qui font vraiment passer du « on se capte » à une sortie organisée.

## Mise à jour obligatoire dans Framer

Sur chaque CTA qui envoie vers l’application BIMA — en priorité « Je crée ma sortie » — ajouter des paramètres UTM cohérents au lien :

```text
https://bima-app-sigma.vercel.app/?utm_source=framer&utm_medium=website&utm_campaign=site-vitrine
```

Pour une vidéo, une publication ou une campagne, remplacer `utm_source`, `utm_medium` et `utm_campaign` par les valeurs qui décrivent réellement le canal. Exemple Instagram :

```text
https://bima-app-sigma.vercel.app/?utm_source=instagram&utm_medium=social&utm_campaign=lancement-aout
```

## Suggestions facultatives

- Ajouter une convention UTM courte dans le CMS ou un document d’équipe afin que les sources restent lisibles dans le pilotage.
- Distinguer les CTA de sections importantes avec `utm_content`, par exemple `hero` ou `footer`.

## À ne pas annoncer publiquement

- Ne pas présenter le tableau de pilotage comme une fonctionnalité pour les organisateurs : il est réservé à l’administration BIMA.
- Ne pas promettre un suivi individuel des visiteurs. L’attribution est agrégée et liée à une création, pas à l’identité d’un participant.

## URL à tester après publication

`https://bima-app-sigma.vercel.app/admin`

Créer une sortie depuis une URL UTM de test, puis vérifier que la source apparaît dans la section « Pilotage BIMA » de l’administration.

## Publication

L’interface de pilotage est publiée sur l’application BIMA le 22 août 2026. La migration Supabase d’attribution doit encore être appliquée avant que les nouvelles sources UTM soient enregistrées ; le tunnel et les courbes utilisent déjà les données produit existantes.
