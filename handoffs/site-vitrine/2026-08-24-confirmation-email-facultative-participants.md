# BIMA — confirmation facultative par e-mail pour les participants

Date : 24 août 2026  
Statut : publié et vérifié  
URL publique à tester : https://bima-app-sigma.vercel.app/

## Changement terminé

Après avoir enregistré ses disponibilités, un participant peut désormais laisser facultativement son adresse e-mail afin que BIMA puisse le prévenir de la confirmation finale de la sortie ou du séjour.

Le vote reste inchangé : l’invité répond toujours sans compte et sans e-mail. Le champ apparaît uniquement sur l’écran de succès, après l’enregistrement de la réponse. Une erreur d’e-mail ne peut donc pas annuler le vote.

Cette livraison couvre la collecte et le stockage de l’adresse. L’envoi automatique de la confirmation n’est pas encore branché et ne doit pas être annoncé comme disponible.

## Bénéfice utilisateur

Le participant n’a plus besoin de surveiller la conversation du groupe pour savoir ce qui a finalement été décidé. L’organisateur bénéficie indirectement de moins de questions et de relances après sa décision.

Cette évolution renforce le cycle produit BIMA : créer → partager → répondre → décider → confirmer → ajouter au calendrier.

## Mise à jour obligatoire de la vitrine

Dans une section présentant l’étape de confirmation ou les bénéfices participants, ajouter une formulation courte comme :

> Après leur réponse, les invités peuvent choisir de laisser leur e-mail pour être prévenus de la confirmation.

Si une démonstration du parcours invité est présente, montrer que :

1. le participant valide d’abord ses disponibilités ;
2. l’e-mail est proposé ensuite comme option ;
3. le parcours principal reste sans compte.

## Suggestion facultative

Ajouter près de la promesse « réponse en 20 secondes » une précision discrète :

> Toujours sans compte. L’e-mail de confirmation reste facultatif.

## À ne pas annoncer

- Ne pas présenter cette adresse comme une inscription à une newsletter.
- Ne pas dire que l’organisateur récupère les e-mails des invités : l’adresse reste une donnée fonctionnelle privée de BIMA.
- Ne pas dire que l’e-mail de confirmation est déjà envoyé automatiquement : cette livraison prépare la collecte, pas encore l’envoi.
- Ne pas promettre de rappels automatiques supplémentaires aux participants.
- Ne pas annoncer une fonctionnalité de compte participant.

## Vérifications réalisées

- interface mobile de création et parcours public chargés sur le site de production ;
- champ e-mail absent avant le vote dans le parcours participant ;
- endpoint public séparé du vote et protégé par limitation de requêtes ;
- stockage Supabase facultatif et rétrocompatible ;
- stockage indépendant du vote, prêt pour un futur envoi fonctionnel ;
- analytics produits sans adresse e-mail ni identité participant ;
- build Next.js réussi et 23 tests sur 23 validés.
