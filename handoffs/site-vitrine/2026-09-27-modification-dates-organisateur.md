# Transmission Site vitrine — modification des dates par l’organisateur

Date : 27 septembre 2026

## Statut

La fonctionnalité est implémentée dans une branche de prévisualisation et vérifiée sur la base Supabase `Preview BIMA`. Elle n’est pas publiée en production à ce stade.

## Changement terminé

Depuis sa page privée de gestion, l’organisateur peut désormais préparer les actions suivantes :

- corriger une date ou une période de séjour ;
- ajouter une nouvelle proposition, dans la limite de quatre ;
- supprimer une proposition en conservant toujours au moins une date ;
- rouvrir explicitement les réponses lorsqu’une sortie déjà confirmée doit changer de date.

Les réponses associées aux dates inchangées sont conservées. Seules les réponses liées à une date modifiée ou supprimée sont invalidées. Une nouvelle date apparaît comme « à répondre » et non comme une indisponibilité.

## Bénéfice utilisateur

L’organisateur peut corriger une erreur ou adapter la sortie sans devoir supprimer puis recréer tout l’événement. Les réponses déjà valables ne sont pas perdues.

## Mise à jour obligatoire de la vitrine

Aucune pour le moment. Ne pas annoncer cette fonctionnalité tant que la prévisualisation frontend n’a pas été validée puis publiée en production.

## Suggestion facultative après publication

Dans une démonstration du parcours organisateur, montrer brièvement que les propositions de dates restent ajustables depuis le lien privé de gestion.

## URL publique à tester

Pas encore disponible. Le backend de prévisualisation est prêt, mais le frontend Vercel de test n’a pas été déployé.
