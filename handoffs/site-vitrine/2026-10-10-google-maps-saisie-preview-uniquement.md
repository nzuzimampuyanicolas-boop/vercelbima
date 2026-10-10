# Google Maps : saisie réservée à la preview

Publication du 10 octobre 2026 : https://bima-app-sigma.vercel.app/creer

## Changement vérifié

Le champ de lien Google Maps et le bouton de prévisualisation ne sont plus proposés dans les formulaires de création et de modification en production. L’utilisateur indique le nom du lieu et la ville. Le texte d’aide ne propose plus de coller un lien.

La saisie et la prévisualisation restent disponibles dans l’environnement preview pour les futurs travaux Google Maps. La configuration est calculée au build, sans dépendre du navigateur de l’utilisateur.

Aucune suppression des anciens liens enregistrés. Les liens et itinéraires des sorties existantes restent consultables. Aucune modification du schéma de base ni restriction nouvelle de l’API : ce changement concerne les formulaires de l’application.

## Validation

Lint ciblé, build/TypeScript et 32 tests réussis. Parcours navigateur sur la production : champ absent à la création et dans la gestion, nom du lieu et ville présents, réponse positive/négative, billetterie, confirmation et calendrier fonctionnels. Sortie QA supprimée après le test.

## Consignes Site vitrine

Actualiser les captures de création : montrer « Nom du lieu » et « Ville », sans champ de lien Maps ni bouton de prévisualisation. Ne pas annoncer une récupération automatique du nom, de l’adresse ou de la photo via Google Maps. L’intégration enrichie reste expérimentale en preview.
