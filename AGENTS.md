# AGENTS.md — Projet BIMA

## 1. Rôle de Codex

Tu travailles sur BIMA comme un partenaire produit et technique.

Tu dois :

- comprendre le problème utilisateur avant de coder ;
- respecter les décisions produit déjà validées ;
- challenger les demandes qui contredisent le positionnement ou complexifient inutilement le MVP ;
- privilégier une version simple, fiable et testable de bout en bout ;
- signaler clairement les hypothèses, risques et choix techniques ;
- ne jamais ajouter une fonctionnalité non demandée simplement parce qu’elle semble intéressante.

Pour toute modification importante, raisonne selon plusieurs angles :

- produit ;
- utilisateur ;
- UX/UI ;
- acquisition ;
- rentabilité ;
- technique ;
- sécurité ;
- risques.

## 2. Résumé du produit

BIMA est une application web mobile-first qui aide les groupes d’amis à organiser réellement leurs sorties.

Le problème actuel est dispersé entre plusieurs outils :

- WhatsApp, Instagram, Snapchat ou Messenger pour discuter ;
- des sondages pour choisir une date ;
- Google Maps pour partager un lieu ;
- des calendriers pour ne pas oublier ;
- différents liens pour les activités et réservations.

Une personne crée une sortie, partage un lien, puis les participants répondent directement depuis leur navigateur.

BIMA centralise les disponibilités et aide l’organisateur à confirmer une date, un lieu et les participants.

Le cycle principal du produit est :

> Créer → partager → répondre → décider → confirmer → ajouter au calendrier.

Tout ce qui ne contribue pas directement à ce cycle est secondaire pour le MVP.

## 3. Mission et positionnement

Le nom BIMA vient du lingala. Le verbe « kobima » signifie « sortir ».

BIMA utilise le digital pour aider les utilisateurs à passer moins de temps à essayer de s’organiser et plus de temps à réellement se retrouver.

BIMA ne doit pas être présenté comme :

- une simple copie de Doodle ;
- un réseau social ;
- une messagerie ;
- une plateforme événementielle exhaustive ;
- une application qui cherche à garder les utilisateurs longtemps devant leur écran.

Promesse principale :

> L’outil qui transforme « on fait quoi ? » en sortie réellement organisée.

Autres formulations compatibles :

- Décidez quand, où et quoi faire, sans passer trois jours sur WhatsApp.
- Parce qu’un « on se capte bientôt » devrait finir par arriver pour de vrai.
- BIMA. Sors. Vis. Recommence.

CTA principal validé :

> Je crée ma sortie

Ne jamais remplacer ce CTA par une formulation SaaS générique sans demande explicite.

## 4. Cible

### Utilisateur principal

L’utilisateur prioritaire est l’organisateur du groupe.

C’est la personne qui :

- propose les sorties ;
- cherche les dates ;
- relance les autres ;
- trouve les lieux ;
- crée les sondages ;
- centralise les informations ;
- réserve éventuellement l’activité.

BIMA doit lui faire gagner du temps.

### Participants

Les participants reçoivent un lien et doivent pouvoir répondre :

- depuis leur navigateur ;
- sans installer d’application ;
- sans créer de compte autant que possible ;
- idéalement en moins de 30 secondes.

### Cible initiale

Personnes de 21 à 36 ans, étudiantes en fin de parcours ou déjà dans la vie active, utilisant régulièrement :

- WhatsApp ;
- Instagram ;
- Snapchat ;
- TikTok ;
- Google Maps.

Ne pas élargir prématurément la cible à tout le monde.

## 5. Problèmes à résoudre

Les principales frustrations sont :

- ne pas trouver de date commune ;
- attendre les réponses ;
- devoir relancer ;
- recevoir des réponses vagues ;
- perdre les propositions dans les conversations ;
- ne plus retrouver l’heure ou l’adresse ;
- avoir trop de choix sans réussir à décider ;
- ne pas savoir clairement qui vient ;
- oublier la sortie ;
- reporter ou abandonner l’organisation.

Chaque fonctionnalité doit supprimer une friction réelle.

## 6. Principes produit obligatoires

Respecter systématiquement les principes suivants :

1. Mobile-first.
2. Aucune installation pour les invités.
3. Inscription minimale.
4. Réponse participant très rapide.
5. Une action principale claire par écran.
6. Décision plutôt que discussion.
7. Complémentarité avec les messageries existantes.
8. Utilité avant complexité.
9. Validation avant développement massif.
10. Expériences réelles avant temps d’écran.
11. L’organisateur conserve la décision finale.
12. Le succès se mesure par les sorties confirmées, pas par le temps passé dans l’application.

## 7. Parcours organisateur

### Landing page

L’organisateur peut :

- comprendre rapidement le produit ;
- se connecter ;
- créer un compte ;
- cliquer sur « Je crée ma sortie ».

### Authentification

L’authentification doit rester simple.

Une solution de connexion par e-mail ou lien magique est préférable à un système complexe pour le MVP, sauf contrainte technique contraire.

### Dashboard

Après connexion, l’organisateur arrive directement sur son dashboard.

Le dashboard affiche en priorité :

1. les sorties en attente de confirmation ;
2. leur état d’avancement ;
3. un bouton permettant d’ouvrir chaque sortie ;
4. les prochaines sorties confirmées ;
5. un bouton permettant de créer une sortie ;
6. un bouton permettant d’ajouter une sortie confirmée au calendrier.

Les sorties à confirmer doivent être plus visibles que les sorties terminées.

### Création d’une sortie

Champs du MVP :

- titre ;
- description facultative ;
- une ou plusieurs propositions de dates et horaires ;
- lien Google Maps ;
- nombre maximum de participants ;
- message d’invitation personnalisable.

Le nombre maximum de participants :

- inclut l’organisateur ;
- doit être supérieur ou égal à 1 ;
- ne peut pas être négatif.

### Partage

Après création, BIMA génère un lien public unique.

Canaux prioritaires :

- WhatsApp ;
- Instagram ;
- Snapchat ;
- partage natif du téléphone ;
- copie du lien.

TikTok pourra être envisagé plus tard.

Ne pas centrer le produit uniquement sur WhatsApp.

### Suivi des réponses

L’organisateur peut consulter :

- le nombre de réponses ;
- les participants disponibles ;
- les participants indisponibles ;
- les participants hésitants ;
- les disponibilités par date ;
- les remarques ;
- l’état général de la sortie.

### Confirmation

BIMA peut mettre en avant la date qui réunit le plus de disponibilités.

L’organisateur conserve la décision finale.

Lorsqu’une date est choisie, la sortie passe de « À confirmer » à « Confirmée ».

La sortie confirmée affiche clairement :

- la date ;
- l’heure ;
- le lieu ;
- les participants ;
- le lien Google Maps ;
- l’action « Ajouter au calendrier ».

## 8. Parcours participant

Le participant ouvre un lien public sans connexion.

Il peut :

1. consulter le titre et la description ;
2. voir le lieu proposé ;
3. saisir son prénom ou son nom ;
4. indiquer ses disponibilités ;
5. indiquer s’il vient, ne vient pas ou hésite ;
6. ajouter une remarque ;
7. valider sa réponse.

Après validation, afficher une confirmation claire.

Lorsqu’une sortie est confirmée, le participant doit pouvoir retrouver :

- la date définitive ;
- l’heure ;
- l’adresse ;
- l’itinéraire ;
- les informations utiles ;
- un bouton d’ajout au calendrier.

Le participant ne doit jamais accéder aux fonctions privées de l’organisateur.

## 9. Fonctionnalités du MVP

### Indispensables

- authentification organisateur ;
- création d’une sortie ;
- proposition de plusieurs dates ;
- ajout d’un lien Google Maps ;
- génération d’un lien public unique ;
- partage du lien ;
- réponse invité sans compte ;
- collecte des disponibilités ;
- affichage des participants ;
- synthèse des réponses ;
- confirmation manuelle de la sortie ;
- statuts « À confirmer » et « Confirmée » ;
- dashboard organisateur ;
- page publique participant ;
- ajout au calendrier ;
- interface responsive mobile-first.

### Utiles mais secondaires

- limite de participants ;
- réponses « Oui », « Non » et « Peut-être » ;
- message d’invitation personnalisable ;
- notifications organisateur validées : première réponse, capacité atteinte, rappel 48 heures avant l’échéance et échéance atteinte sans confirmation ;
- préférences permettant à l’organisateur de désactiver les notifications ;
- aperçu enrichi du lieu ;
- indicateur de progression des réponses ;
- API Web Share.

### Hors du premier MVP

Ne pas développer sans demande explicite :

- recommandations de sorties par intelligence artificielle ;
- recommandations selon la météo ;
- recherche automatique d’activités ;
- réservation intégrée ;
- paiement ;
- billetterie ;
- commissions ;
- chat interne ;
- réseau social ;
- application mobile native ;
- gamification complexe ;
- gestion avancée de voyages ;
- algorithme sophistiqué de décision ;
- abonnement premium complexe.

## 10. Google Maps

L’organisateur doit pouvoir coller un lien Google Maps partageable, notamment un lien court du type :

`https://maps.app.goo.gl/...`

BIMA peut essayer d’afficher :

- le nom du lieu ;
- l’adresse ;
- une image ;
- un lien vers Google Maps.

Ne jamais demander à l’utilisateur de fournir un code iframe.

La récupération automatique des données Google Maps doit respecter :

- les limites techniques ;
- les conditions d’utilisation des services utilisés ;
- la sécurité côté serveur ;
- la gestion des liens courts et redirections ;
- les erreurs lorsque l’aperçu ne peut pas être généré.

En cas d’échec de la prévisualisation, conserver le lien et afficher un état dégradé propre.

## 11. Statuts

Statuts possibles :

- `draft`
- `pending_confirmation`
- `confirmed`
- `completed`
- `cancelled`

Pour le MVP, les statuts prioritaires sont :

- `pending_confirmation`
- `confirmed`

Les libellés visibles en français sont :

- Brouillon
- À confirmer
- Confirmée
- Terminée
- Annulée

Centraliser les statuts dans des constantes ou des enums typés.

## 12. Modèle de données conceptuel

### User

- `id`
- `firstName`
- `lastName`
- `email`
- `avatarUrl?`
- `createdAt`
- `updatedAt`

### Event

- `id`
- `organizerId`
- `title`
- `description?`
- `status`
- `mapsUrl?`
- `placeName?`
- `placeAddress?`
- `placeImageUrl?`
- `maxParticipants?`
- `invitationMessage?`
- `publicSlug`
- `confirmedDateOptionId?`
- `createdAt`
- `updatedAt`

### DateOption

- `id`
- `eventId`
- `startDateTime`
- `endDateTime?`
- `createdAt`

### Participant

- `id`
- `eventId`
- `name`
- `responseStatus`
- `comment?`
- `createdAt`
- `updatedAt`

### Availability

- `id`
- `participantId`
- `dateOptionId`
- `status`

Valeurs possibles pour `Availability.status` :

- `available`
- `unavailable`
- `maybe`

Valeurs possibles pour `Participant.responseStatus` :

- `attending`
- `not_attending`
- `maybe`

Le modèle peut évoluer, mais toute modification doit être justifiée par un cas d’usage réel.

## 13. Règles métier

- Seul l’organisateur authentifié peut modifier, confirmer ou annuler sa sortie.
- Un invité peut répondre via le lien public.
- Une sortie doit avoir un titre.
- Une sortie doit avoir au moins une proposition de date avant d’être partagée.
- Le nombre maximum de participants doit être supérieur ou égal à 1.
- L’organisateur est compté parmi les participants.
- Une sortie confirmée doit avoir une date définitive.
- Le lien public ne doit pas exposer de données privées de l’organisateur.
- Les données publiques doivent être limitées aux informations nécessaires.
- Les validations doivent exister côté client et côté serveur.
- Les autorisations ne doivent jamais reposer uniquement sur l’interface.
- Toute donnée saisie par un utilisateur doit être validée et nettoyée.

## 14. Structure recommandée

Routes possibles :

- `/`
- `/connexion`
- `/inscription`
- `/dashboard`
- `/sorties/nouvelle`
- `/sorties/[id]`
- `/s/[slug]`
- `/s/[slug]/confirmation`

La route de création peut être remplacée par une modale ou un panneau si cela améliore réellement l’expérience mobile.

Composants possibles :

- `Header`
- `MobileStickyCTA`
- `EventCard`
- `EventStatusBadge`
- `CreateEventForm`
- `DateProposalPicker`
- `GoogleMapsLinkPreview`
- `ShareEventPanel`
- `ParticipantResponseForm`
- `AvailabilitySummary`
- `ParticipantList`
- `ConfirmEventPanel`
- `AddToCalendarButton`
- `EmptyState`
- `LoadingState`
- `ErrorState`

Ne pas créer tous les composants à l’avance. Les extraire lorsqu’ils sont réellement réutilisés ou lorsqu’ils clarifient nettement le code.

## 15. UX/UI

### Direction visuelle

L’identité doit être :

- chaleureuse ;
- vivante ;
- moderne ;
- accessible ;
- basée principalement sur l’orange ;
- inspirée discrètement de références africaines ;
- sans caricature culturelle ;
- composée de formes fluides et arrondies.

Centraliser les couleurs, espacements, rayons et styles typographiques.

### Règles d’interface

- Concevoir d’abord pour une largeur mobile.
- Utiliser de grands éléments tactiles.
- Garder les textes courts.
- Afficher une seule action dominante par écran.
- Prévoir les états vides, chargements, erreurs et succès.
- Éviter les modales imbriquées.
- Éviter les interfaces d’administration denses.
- Respecter les contrastes et la navigation clavier.
- Ajouter des labels accessibles.
- Ne pas transmettre une information uniquement par la couleur.
- Limiter les animations et respecter `prefers-reduced-motion`.

## 16. Ton éditorial

Le ton doit être :

- jeune ;
- naturel ;
- direct ;
- moderne ;
- humain ;
- légèrement humoristique.

Expressions compatibles :

- « On fait quoi ce week-end ? »
- « Comme vous voulez. »
- « Je vous confirme. »
- « Qui vient finalement ? »
- « C’était aujourd’hui ? »
- « Il faut vraiment qu’on se voie. »

À éviter :

- « solution innovante » ;
- « simplifiez votre quotidien » ;
- « révolutionnez vos sorties » ;
- le jargon marketing ;
- l’argot forcé ;
- les anglicismes inutiles ;
- les formulations génériques de SaaS.

## 17. Conventions de code

Sauf décision contraire déjà présente dans le dépôt :

- utiliser TypeScript en mode strict ;
- éviter `any` ;
- privilégier des fonctions et composants courts ;
- séparer la logique métier de l’interface ;
- centraliser les constantes et les types ;
- nommer clairement les variables et fonctions ;
- éviter la duplication ;
- ne pas sur-abstraire ;
- supprimer le code mort ;
- ne pas laisser de `console.log` inutile ;
- ne pas stocker de secrets dans le dépôt ;
- fournir un fichier `.env.example` pour les variables nécessaires ;
- traiter les erreurs côté serveur ;
- afficher des messages compréhensibles côté utilisateur.

Respecter les conventions déjà présentes dans le dépôt avant d’en introduire de nouvelles.

## 18. Base de données et sécurité

- Appliquer le principe du moindre privilège.
- Protéger les routes privées.
- Vérifier que l’utilisateur connecté possède la sortie qu’il modifie.
- Utiliser des slugs publics difficiles à deviner.
- Ne jamais exposer les identifiants internes inutilement.
- Limiter les données accessibles depuis la page publique.
- Prévoir une protection raisonnable contre le spam.
- Éviter de journaliser des données personnelles.
- Préparer la suppression des données si nécessaire.
- Ne pas affirmer qu’une solution est conforme au RGPD sans vérification juridique et technique.

## 19. Tests et validation

Toute fonctionnalité terminée doit être vérifiée sur le parcours complet concerné.

Tests prioritaires :

- création d’une sortie ;
- validation des champs ;
- génération du lien public ;
- ouverture de la page publique sans authentification ;
- réponse d’un participant ;
- affichage de la réponse côté organisateur ;
- calcul de la date réunissant le plus de disponibilités ;
- confirmation d’une date ;
- contrôle des autorisations ;
- ajout au calendrier ;
- affichage mobile.

Quand la stack le permet :

- ajouter des tests unitaires pour la logique métier ;
- ajouter des tests d’intégration pour les écritures en base ;
- ajouter un test end-to-end du parcours principal ;
- exécuter lint, typecheck, tests et build avant de déclarer une tâche terminée.

Ne jamais prétendre qu’un test a réussi sans l’avoir réellement exécuté.

## 20. Définition de terminé

Une fonctionnalité est terminée lorsque :

- le comportement demandé fonctionne ;
- le cas mobile fonctionne ;
- les erreurs principales sont gérées ;
- les autorisations sont vérifiées ;
- les validations existent côté serveur ;
- le code est typé ;
- aucun secret n’est ajouté au dépôt ;
- les tests pertinents passent ;
- le lint passe ;
- le build passe ;
- la documentation utile est mise à jour ;
- aucun élément hors périmètre n’a été ajouté.

## 21. Critères d’acceptation du MVP

Le MVP est considéré comme fonctionnel lorsqu’un utilisateur peut :

1. créer un compte ;
2. créer une sortie depuis son téléphone ;
3. proposer plusieurs dates ;
4. ajouter un lien Google Maps ;
5. partager un lien public ;
6. ouvrir ce lien sans connexion ;
7. répondre en tant que participant ;
8. retrouver cette réponse côté organisateur ;
9. visualiser la date réunissant le plus de disponibilités ;
10. confirmer une date ;
11. afficher la sortie comme confirmée ;
12. ajouter la sortie au calendrier.

## 22. Priorité de développement

Ordre recommandé :

1. structure du projet et navigation ;
2. authentification organisateur ;
3. modèle de données ;
4. création d’une sortie ;
5. génération du lien public ;
6. réponse participant ;
7. synthèse des disponibilités ;
8. confirmation d’une date ;
9. dashboard ;
10. ajout au calendrier ;
11. partage mobile ;
12. prévisualisation Google Maps ;
13. rappels simples ;
14. améliorations visuelles ;
15. animations légères.

Toujours privilégier un parcours complet fonctionnel à plusieurs fonctionnalités inachevées.

## 23. Méthode attendue pour chaque tâche

Avant une modification importante :

1. inspecter les fichiers concernés ;
2. identifier les conventions existantes ;
3. résumer brièvement le problème ;
4. proposer la solution la plus simple ;
5. signaler les risques ou hypothèses ;
6. implémenter ;
7. exécuter les vérifications disponibles ;
8. résumer les fichiers modifiés et les tests exécutés.

Lorsqu’une demande contredit une décision produit existante, ne pas l’ignorer silencieusement. Signaler la contradiction et proposer l’option la plus cohérente.

## 24. Points encore à tester

Ne pas considérer ces éléments comme validés :

- obligation de créer un compte avant la première sortie ;
- identité minimale demandée aux invités ;
- possibilité de modifier une réponse sans compte ;
- définition du lieu avant ou après le choix de la date ;
- propositions de lieux par les participants ;
- fréquence des rappels ;
- compréhension des statuts ;
- faisabilité de la prévisualisation Google Maps ;
- fréquence d’utilisation ;
- volonté de payer ;
- modèle économique.

## 25. Indicateurs produit

Indicateurs prioritaires :

- nombre de sorties créées ;
- pourcentage de sorties partagées ;
- taux de réponse des invités ;
- délai avant la première réponse ;
- pourcentage de sorties confirmées ;
- délai entre création et confirmation ;
- nombre moyen de participants ;
- taux d’ajout au calendrier ;
- taux de création d’une deuxième sortie.

L’indicateur principal doit rester lié aux sorties confirmées ou réellement organisées.

## 26. Documentation

Mettre à jour la documentation lorsque :

- l’installation change ;
- les variables d’environnement changent ;
- le modèle de données change ;
- les routes changent ;
- un comportement utilisateur important change ;
- une décision produit durable est prise.

Si Nicolas corrige une hypothèse ou une règle récurrente, proposer de mettre à jour ce fichier afin que les prochaines sessions Codex conservent la décision.

## 27. Transmission vers le chat Site vitrine

Après chaque modification fonctionnelle, produit, UX/UI ou éditoriale apportée à BIMA, créer un nouveau fichier Markdown dans `handoffs/site-vitrine/`.

Le fichier doit :

- être daté et porter un nom explicite au format `AAAA-MM-JJ-sujet.md` ;
- être directement transmissible au chat « Site vitrine » sans contexte supplémentaire ;
- résumer uniquement les changements réellement terminés et vérifiés ;
- expliquer le bénéfice utilisateur et l’impact éventuel sur la promesse du produit ;
- indiquer précisément les textes, sections ou démonstrations de la vitrine à mettre à jour ;
- préciser ce qui ne doit pas être annoncé lorsque la fonctionnalité est technique, privée, expérimentale ou non validée ;
- contenir l’URL publique à tester si elle est pertinente ;
- distinguer clairement les éléments obligatoires des suggestions facultatives.

Ne jamais annoncer sur la vitrine une fonctionnalité qui n’est pas publiée et vérifiée. Pour une modification purement interne sans effet visible ou commercial, créer tout de même le fichier en indiquant explicitement qu’aucune mise à jour publique de la vitrine n’est nécessaire.

À la fin de la tâche, fournir à Nicolas un lien cliquable vers ce fichier Markdown.
