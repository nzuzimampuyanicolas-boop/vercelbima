# BIMA — Protection anti-abus de l’API

Date : 15 août 2026

Statut : terminé, publié et vérifié

URL publique : https://bima-app-sigma.vercel.app/

## Changement terminé

L’API BIMA applique désormais une véritable limitation de requêtes, en complément du honeypot déjà présent dans le formulaire.

La protection couvre notamment :

- la création de sorties ;
- les réponses des participants ;
- la prévisualisation des lieux ;
- les lectures des sorties et liens courts ;
- les actions privées de l’organisateur ;
- l’administration et la génération de calendriers.

Les compteurs sont gérés de manière atomique dans Supabase. L’adresse réseau n’est jamais enregistrée en clair : seule une empreinte hachée temporaire est utilisée. Lorsqu’une limite est atteinte, l’API répond avec le statut `429`, un délai de reprise et un message compréhensible.

## Bénéfice utilisateur

BIMA est mieux protégé contre les robots, le spam, la création massive de fausses sorties et la surconsommation des services externes. Cela améliore la disponibilité de l’application pour les vrais organisateurs et participants.

## Mise à jour obligatoire de la vitrine

Aucune modification publique n’est obligatoire. Il s’agit d’une protection technique invisible qui ne change ni la promesse principale ni le parcours utilisateur.

Ne pas publier les seuils précis de limitation sur la vitrine et ne pas présenter BIMA comme « inviolable » ou « totalement protégé ».

## Suggestion facultative

Si une section « Fiabilité » ou « Confiance » existe plus tard, il sera possible d’ajouter une formulation sobre :

> Des protections techniques limitent le spam et les usages automatisés abusifs.

Cette mention reste secondaire et ne doit pas remplacer un bénéfice produit visible.

## Vérifications effectuées

- migration Supabase appliquée ;
- compteur atomique validé en base ;
- fonction Edge Supabase publiée ;
- frontend Vercel publié ;
- blocage réel observé avec une réponse HTTP `429` et l’en-tête `Retry-After` ;
- page d’accueil publique toujours disponible en HTTP `200` ;
- tests automatisés : 13 sur 13 réussis ;
- build de production réussi.
