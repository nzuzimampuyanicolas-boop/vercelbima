# BIMA — propositions de lieux par les invités (preview privée)

## Statut

La fonctionnalité est développée derrière deux interrupteurs techniques, mais elle n’est pas publiée en production. Elle doit d’abord être testée sur une Preview Vercel reliée à une branche Supabase de test.

## Ce qui est prêt à tester

- L’organisateur peut autoriser ou fermer les propositions de lieux pour une sortie.
- Après avoir enregistré sa réponse, un invité peut proposer un autre lieu pour une étape : nom, ville et lien Google Maps facultatif.
- L’organisateur reçoit un e-mail lorsqu’une nouvelle proposition est créée.
- Depuis son espace privé, il peut choisir ou refuser chaque proposition.
- L’organisateur reste le seul décisionnaire : une proposition ne modifie jamais la sortie automatiquement.
- Si une proposition est choisie, elle remplace le lieu de l’étape et les éventuels votes de présence propres à cette étape sont remis à zéro.

## Bénéfice utilisateur visé

Le groupe peut apporter des idées sans recréer une discussion désordonnée dans la messagerie, tout en conservant une décision simple et centralisée côté organisateur.

## Mise à jour de la vitrine

### Obligatoire maintenant

Aucune. Ne pas annoncer cette fonctionnalité sur la vitrine tant que le test privé et le parcours complet n’ont pas été validés.

### À envisager après validation et publication

- Ajouter une mention courte dans la démonstration : « Ton groupe peut proposer un autre lieu, tu gardes le dernier mot. »
- Montrer une seule contre-proposition dans la page de gestion, avec les actions « Choisir » et « Refuser ».

## URL publique

La production reste inchangée : https://bima-app-sigma.vercel.app/

L’URL de Preview sera ajoutée seulement après création de l’environnement de test isolé.
