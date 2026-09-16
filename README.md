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
NEXT_PUBLIC_BIMA_PLACE_SUGGESTIONS_ENABLED=false
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

Toutes les interfaces passent par la même limitation dans l’Edge Function Supabase. Les compteurs Postgres sont incrémentés atomiquement et regroupés par type d’action. Le recalibrage distingue les tentatives des actions valides et évite qu’un réseau partagé bloque trop vite un groupe :

- lieux : 20 tentatives par 10 minutes et 50 par jour ;
- création : 20 tentatives par heure et 50 par jour, puis 5 formulaires valides par heure et 10 par jour pour une même connexion et un même e-mail ;
- votes : 100 par 10 minutes pour le réseau et la sortie, avec 10 modifications par lien personnel ;
- organisateur : 30 actions valides par 10 minutes, contre 5 liens invalides par 15 minutes ;
- administration : 90 lectures et 30 suppressions par 15 minutes avec une clé valide, contre 5 essais avec une clé invalide ;
- calendrier : 30 téléchargements par 10 minutes ;
- lectures et liens courts : 120 par minute.

L’identité réseau est hachée avec un secret serveur avant la création du compteur. Une empreinte technique minimale est utilisée uniquement lorsque l’adresse réseau est indisponible. Aucune adresse IP n’est conservée en clair. Les compteurs expirés sont supprimés automatiquement. Une requête refusée reçoit le statut HTTP `429`, un compte à rebours compréhensible et l’en-tête `Retry-After`. Seuls le type de limite et le délai sont journalisés, jamais l’identité ou son empreinte.

## E-mail organisateur et récupération du lien

L’e-mail de l’organisateur est demandé pendant la création. Il est stocké sur `bima_events` et sert à envoyer le lien privé, à générer un nouveau lien depuis `/recuperer-mon-lien` en cas de perte, et à permettre une demande ponctuelle de feedback. Les invités répondent toujours sans compte et sans e-mail. Après l’enregistrement du vote seulement, un invité peut facultativement laisser une adresse liée à cet événement précis afin de recevoir la date ou la période finale. Cette adresse n’est pas synchronisée avec la liste des mises à jour produit.

La récupération ne révèle jamais si une adresse existe. La route publique transmet la demande au backend avec le secret serveur, génère de nouveaux liens courts hashés, puis les envoie via le Gmail déjà configuré. Les demandes sont limitées par réseau et par e-mail haché. L’adresse n’est pas inscrite à une liste marketing sans consentement supplémentaire explicite.

La vue administrateur expose le statut dérivé du système existant : `En cours`, `Confirmée` ou `Abandonnée` lorsque toutes les dates sont passées sans confirmation. Elle affiche aussi la date prévue et indique les sorties confirmées prêtes pour une relance feedback deux jours après leur fin.

## Modèle temporel

Deux formats d’événement sont pris en charge :

- `outing` : comportement historique, avec une date et une heure ;
- `stay` : période inclusive avec une date de départ et une date de retour.

La colonne `bima_events.event_type` vaut `outing` par défaut afin de conserver toutes les sorties existantes. La colonne `bima_date_options.ends_at` reste `NULL` pour ces sorties historiques et contient le retour d’un séjour.

Les invités votent de la même façon sur une date ou une période. Lorsqu’un séjour est confirmé, son fichier `.ics` utilise un événement sur journées entières ; la date de fin iCalendar est calculée au lendemain du retour, conformément au format ICS.

## Modification après création

Depuis son lien privé de gestion, l’organisateur peut modifier le titre, les lieux existants, la capacité, le budget et la date limite de réponse. L’API vérifie le lien de gestion, interdit de réduire la capacité sous le nombre de participants déjà inscrits et conserve les propositions de dates ainsi que tous les votes. Le format `outing`/`stay` et la liste des dates restent verrouillés après la création.

## Test des propositions de lieux

La contre-proposition d’un lieu par un invité est préparée comme une expérimentation et reste désactivée par défaut. Elle ne doit pas être activée sur la production avant validation du parcours complet.

Deux interrupteurs indépendants protègent la fonctionnalité :

- `NEXT_PUBLIC_BIMA_PLACE_SUGGESTIONS_ENABLED=true` dans une Preview Vercel affiche l’interface expérimentale ;
- `BIMA_PLACE_SUGGESTIONS_ENABLED=true` dans une branche Supabase autorise les routes et les nouvelles colonnes de l’API.

La migration `20260916120656_guest_place_suggestions.sql` doit être appliquée uniquement sur une branche Supabase de test. Dans cette version, l’organisateur active ou non les suggestions pour sa sortie. Après avoir répondu, un invité authentifié par son lien personnel peut proposer un nom de lieu, une ville et facultativement un lien Google Maps. L’organisateur reçoit un e-mail pour une nouvelle proposition, puis peut la choisir ou la refuser depuis sa page privée. Choisir une proposition remplace le lieu de l’étape concernée ; les votes de présence liés à cette étape sont alors remis à zéro parce qu’ils portaient sur l’ancien lieu.

Tant que les deux variables restent à `false`, l’application et l’API conservent leur comportement actuel, y compris si le code de la branche est déployé par erreur.

## Déploiement

Les migrations sont versionnées dans `supabase/migrations/`. L’API se trouve dans `supabase/functions/bima-api/` et l’application Next.js dans `app/`.

Parcours critique à vérifier avant publication : création, partage, vote invité, modification par l’organisateur, vote organisateur, confirmation, ajout au calendrier et ouverture d’une sortie historique.
