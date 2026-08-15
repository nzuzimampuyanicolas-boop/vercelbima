# BIMA

BIMA aide un groupe à créer une sortie ou un séjour, partager un lien, recueillir les disponibilités, confirmer le meilleur moment et l’ajouter au calendrier.

## Stack

- Next.js 16 et TypeScript ;
- Vercel pour l’application publique ;
- Supabase Postgres et Edge Functions pour les données et l’API ;
- Gmail SMTP pour envoyer le lien privé de gestion.

## Développement

Prérequis : Node.js 22.

```bash
pnpm install
pnpm dev
pnpm run lint
pnpm test
```

Variables nécessaires dans `.env.local` et dans Vercel :

```env
BIMA_API_URL=https://<projet>.supabase.co/functions/v1/bima-api
GMAIL_USER=
GMAIL_APP_PASSWORD=
NOTIFICATION_SECRET=
CRON_SECRET=
BIMA_PUBLIC_URL=https://bima-app-sigma.vercel.app
```

Les secrets Supabase de rôle service restent exclusivement dans l’Edge Function et ne doivent jamais être exposés au navigateur. `NOTIFICATION_SECRET` protège aussi les échanges serveur-à-serveur utilisés pour transmettre l’identité réseau au limiteur ; sa valeur reste uniquement dans Vercel et son empreinte est stockée dans Supabase.

## Notifications organisateur

Les notifications de suivi sont stockées dans une file durable Supabase puis envoyées par Gmail depuis Vercel. Quatre moments sont pris en charge :

- première réponse d’un participant ;
- capacité maximale atteinte ;
- rappel 48 heures avant la date limite de réponse ;
- date limite atteinte tant que la sortie n’est pas confirmée.

Chaque notification possède une clé d’idempotence unique afin d’éviter les doublons. Un échec d’envoi est retenté au maximum cinq fois. Le Cron Vercel appelle `/api/cron/notifications` chaque jour à 07:00 UTC ; `CRON_SECRET` protège cette route et `NOTIFICATION_SECRET` protège les échanges entre Vercel et l’Edge Function.

Les nouvelles sorties activent automatiquement ces notifications. Les sorties créées avant la migration restent inactives afin qu’aucun ancien organisateur ne reçoive un message rétroactif ; l’organisateur peut les activer depuis sa page de gestion. Il peut y désactiver séparément les nouvelles réponses et les moments importants.

La table `bima_notification_deliveries` ne stocke pas l’adresse e-mail : elle conserve uniquement le type, l’état technique et les données minimales nécessaires à l’envoi. L’adresse est relue depuis la sortie au moment du traitement.

## Protection anti-abus

Toutes les interfaces passent par la même limitation dans l’Edge Function Supabase. Les compteurs Postgres sont incrémentés atomiquement et regroupés par type d’action. Les créations sont limitées à 5 par heure et par connexion ; les aperçus de lieux, votes, lectures et actions privées utilisent des seuils adaptés à leur coût et à leur usage normal.

L’identité réseau est hachée avec un secret serveur avant la création du compteur. Une empreinte technique minimale est utilisée uniquement lorsque l’adresse réseau est indisponible. Aucune adresse IP n’est conservée en clair. Les compteurs expirés sont supprimés automatiquement. Une requête refusée reçoit le statut HTTP `429`, un message compréhensible et l’en-tête `Retry-After`.

## Modèle temporel

Deux formats d’événement sont pris en charge :

- `outing` : comportement historique, avec une date et une heure ;
- `stay` : période inclusive avec une date de départ et une date de retour.

La colonne `bima_events.event_type` vaut `outing` par défaut afin de conserver toutes les sorties existantes. La colonne `bima_date_options.ends_at` reste `NULL` pour ces sorties historiques et contient le retour d’un séjour.

Les invités votent de la même façon sur une date ou une période. Lorsqu’un séjour est confirmé, son fichier `.ics` utilise un événement sur journées entières ; la date de fin iCalendar est calculée au lendemain du retour, conformément au format ICS.

## Modification après création

Depuis son lien privé de gestion, l’organisateur peut modifier le titre, les lieux existants, la capacité, le budget et la date limite de réponse. L’API vérifie le lien de gestion, interdit de réduire la capacité sous le nombre de participants déjà inscrits et conserve les propositions de dates ainsi que tous les votes. Le format `outing`/`stay` et la liste des dates restent verrouillés après la création.

## Déploiement

Les migrations sont versionnées dans `supabase/migrations/`. L’API se trouve dans `supabase/functions/bima-api/` et l’application Next.js dans `app/`.

Parcours critique à vérifier avant publication : création, partage, vote invité, modification par l’organisateur, vote organisateur, confirmation, ajout au calendrier et ouverture d’une sortie historique.
