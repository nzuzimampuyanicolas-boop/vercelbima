# BIMA — Correction de la création des sorties

Date : 29 août 2026

## Changement terminé et vérifié

La base Supabase de production a été synchronisée avec l’API BIMA afin de rétablir la création des sorties. Les champs techniques d’attribution utilisés pour mesurer l’origine des créations sont désormais présents dans `bima_events`.

La correction a été vérifiée sur le parcours réel :

- création d’une sortie via l’API publique : succès `201` ;
- relecture de la sortie créée : succès `200` ;
- suppression de la sortie technique de vérification : succès `200` ;
- aucune donnée de test ne reste en production.

URL publique vérifiée : https://bima-app-sigma.vercel.app/creer

## Bénéfice utilisateur

L’organisateur peut de nouveau valider la création de sa sortie sans rencontrer l’erreur liée à la colonne `attribution_campaign`.

## Mise à jour obligatoire de la vitrine

Aucune. Il s’agit d’une correction technique qui restaure un comportement déjà annoncé, et non d’une nouvelle fonctionnalité.

## À ne pas annoncer

- Ne pas présenter les champs d’attribution comme une fonctionnalité utilisateur.
- Ne pas ajouter de promesse marketing liée au suivi des campagnes.
- Ne pas mentionner l’incident technique sur la page vitrine.

## Suggestion facultative

Aucune modification éditoriale ou visuelle n’est nécessaire.
