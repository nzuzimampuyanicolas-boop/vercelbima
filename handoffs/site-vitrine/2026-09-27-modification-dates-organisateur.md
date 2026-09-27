# Transmission Site vitrine — modification des dates par l’organisateur

Date : 28 septembre 2026

## Statut

La fonctionnalité est publiée et vérifiée en production sur BIMA.

## Changement terminé

Depuis sa page privée de gestion, l’organisateur peut désormais effectuer les actions suivantes :

- corriger une date ou une période de séjour ;
- ajouter une nouvelle proposition, dans la limite de quatre ;
- supprimer une proposition en conservant toujours au moins une date ;
- rouvrir explicitement les réponses lorsqu’une sortie déjà confirmée doit changer de date.

Les réponses associées aux dates inchangées sont conservées. Seules les réponses liées à une date modifiée ou supprimée sont invalidées. Une nouvelle date apparaît comme « à répondre » et non comme une indisponibilité.

## Bénéfice utilisateur

L’organisateur peut corriger une erreur ou adapter la sortie sans devoir supprimer puis recréer tout l’événement. Les réponses déjà valables ne sont pas perdues.

## Mise à jour obligatoire de la vitrine

La vitrine peut désormais indiquer que l’organisateur peut corriger, ajouter ou supprimer les dates proposées depuis son lien privé de gestion, sans recréer la sortie.

Formulation recommandée :

> Un changement de programme ? Ajuste les dates depuis ta page de gestion. Les réponses encore valables sont conservées.

## Suggestion facultative

Dans une démonstration du parcours organisateur, montrer brièvement que les propositions de dates restent ajustables depuis le lien privé de gestion.

## URL publique à tester

https://bima-app-sigma.vercel.app

## À ne pas annoncer

Ne pas annoncer les propositions de lieux par les invités : cette expérimentation n’a pas été incluse dans cette mise en production.
