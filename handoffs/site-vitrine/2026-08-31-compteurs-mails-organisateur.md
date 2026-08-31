# BIMA — Compteurs corrigés dans les e-mails organisateur

Date : 31 août 2026

## Changement terminé

Les e-mails envoyés à l’organisateur après une nouvelle réponse ne présentent plus le nombre total de personnes enregistrées comme un nombre de réponses.

Le message distingue maintenant clairement :

- le nombre d’invités ayant répondu ;
- le nombre de personnes disponibles à au moins une date.

Exemple de formulation :

> 4 invités ont répondu. 3 personnes sont disponibles à au moins une date.

La même distinction est appliquée au rappel envoyé 48 heures avant la date limite de réponse.

## Bénéfice utilisateur

L’organisateur comprend immédiatement combien de proches ont réellement répondu et combien ont proposé au moins une disponibilité. Le compteur ne laisse plus penser que toute personne inscrite est nécessairement disponible.

## Vérifications effectuées

- lint : réussi ;
- TypeScript : réussi ;
- tests automatisés : 24 sur 24 réussis ;
- build Next.js de production avec Webpack : réussi ;
- backend Supabase `bima-api` version 26 : actif ;
- vérification sur la sortie Bowling : 4 invités ont répondu, 4 personnes sont disponibles à au moins une date.

URL publique : https://bima-app-sigma.vercel.app/

## Mise à jour obligatoire de la vitrine

Aucune. Ce changement corrige un message transactionnel privé et ne modifie pas la promesse publique du produit.

## À ne pas annoncer

- Ne pas présenter ce correctif comme une nouvelle fonctionnalité.
- Ne pas afficher les données de la sortie Bowling sur la vitrine.
- Ne pas promettre de nouveaux types de notifications.

## Suggestion facultative

Si la vitrine montre plus tard une capture d’un e-mail organisateur, utiliser uniquement la nouvelle formulation distinguant réponses et disponibilités.
