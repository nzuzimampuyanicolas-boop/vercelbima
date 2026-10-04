# BIMA — Partage direct du calendrier après confirmation

Date : 4 octobre 2026.

## État vérifié

La modification est publiée sur https://bima-app-sigma.vercel.app/. Le déploiement de production `dpl_EJ3xfczwwYRP9xBhyhZ5DF3f2fTQ` est READY ; le commit fonctionnel est `1b81a89` dans `nzuzimampuyanicolas-boop/vercelbima`. La compilation distante a duré 28 secondes.

Les nouveaux boutons ont été vérifiés sur l’application publique avec une sortie fictive et des réponses API simulées dans le navigateur. Aucune sortie réelle n’a été créée, modifiée ou supprimée pour ces tests. Cela ne constitue pas un essai d’importation dans Apple Calendar ou Google Calendar sur téléphone.

## Changement terminé

Après confirmation, la page privée de gestion affiche immédiatement un bloc dédié, avant les préférences de notification et la liste des participants :

- « Copier le lien du calendrier » : action principale ; copie directement l’URL publique du fichier calendrier.
- « ↗ Partager le lien du calendrier » : ouvre le partage natif lorsqu’il est disponible, sans imposer WhatsApp.
- « ＋ Ajouter à mon calendrier » : action distincte pour l’organisateur.

Le lien transmis pointe vers `/api/events/<slug>/calendar`, pas vers le sondage ni vers la gestion privée. Aucun jeton de gestion ou lien personnel n’est transmis. Le partage propose un court message contenant le titre et la date ou la période confirmée.

Après une copie réussie : « Lien copié · colle-le dans ton groupe ».

Si le partage est indisponible ou échoue, l’utilisateur peut copier le message et le lien. Si la copie automatique est refusée, un champ sélectionnable permet de copier manuellement le lien. Une annulation du partage ne provoque pas de message d’erreur. Les boutons de copie du lien de vote et de relance du vote sont masqués après confirmation ; ils restent disponibles avant confirmation.

Aucune migration de données, nouvelle dépendance de production, modification de l’API calendrier ou nouvel e-mail n’a été ajouté. Les nouvelles actions sont disponibles pour les sorties et séjours déjà confirmés comme pour les nouvelles confirmations. Les votes et les informations des sorties existantes sont conservés.

## Bénéfice utilisateur

L’organisateur n’a plus à faire un appui long pour récupérer le lien du bouton calendrier. Il peut l’envoyer au groupe sans renvoyer une page perçue comme un nouveau sondage. Chaque destinataire ouvre le lien et accepte l’ajout dans son propre calendrier.

La promesse reste : créer → partager → répondre → décider → confirmer → ajouter au calendrier.

## Mises à jour obligatoires pour le chat Site vitrine

- Dans les sections « Comment ça marche » ou « Confirmation », préciser : « Une fois la date confirmée, copie le lien du calendrier et envoie-le au groupe. Chacun peut ajouter la sortie à son calendrier. »
- Si une démonstration montre un appui long sur « Télécharger le calendrier », la remplacer par un clic sur « Copier le lien du calendrier », puis le collage dans une messagerie.
- Distinguer les deux moments : lien d’invitation pour les votes ; lien calendrier après confirmation.
- Conserver le CTA principal validé « Je crée ma sortie » ; aucune modification de ce CTA n’est demandée.

## Suggestions facultatives

- Montrer les trois actions dans une capture mobile du bloc de confirmation.
- Illustrer un collage dans la messagerie utilisée par le groupe, sans centrer la démonstration uniquement sur WhatsApp.

## Ne pas annoncer

- Aucun ajout automatique au calendrier de tous les participants.
- Aucune synchronisation continue ni mise à jour automatique des événements déjà importés.
- Aucune garantie que Snapchat, Instagram ou une autre messagerie conserve le message accompagnant le lien.
- Aucune garantie d’ouverture du fichier ICS dans tous les navigateurs intégrés. Des essais sur de vrais téléphones restent nécessaires ; certains utilisateurs peuvent devoir ouvrir le lien dans leur navigateur habituel.
- Ne pas présenter cette modification comme la résolution vérifiée de tous les anciens cas d’écran noir.
- Les propositions de lieux expérimentales ne font pas partie de cette publication.

## Vérifications exécutées

- 28 tests automatisés de logique et de non-régression réussis.
- TypeScript : aucune erreur.
- Lint des fichiers modifiés : aucune erreur.
- Compilation locale et compilation de production Vercel : réussies.
- Tests navigateur Chromium/Edge : transition confirmation → nouveaux boutons, URL copiée sans données privées, partage natif simulé, annulation, erreur, presse-papiers refusé, solution de secours, largeur mobile 390 px et cibles tactiles, sortie déjà confirmée, séjour et accès calendrier invité sans compte/e-mail obligatoire.
- Même scénario navigateur exécuté sur le site public avec données simulées, sans erreur JavaScript de page.
- Le lint global reste en échec sur 8 erreurs et 5 avertissements préexistants dans les anciens composants Framer ; ils n’ont pas été modifiés.

## URL à tester manuellement

https://bima-app-sigma.vercel.app/

Ouvrir le lien privé de gestion d’une sortie confirmée, copier le lien du calendrier, le coller dans la messagerie du groupe, puis tester son ouverture et son importation sur iPhone et Android. Ne jamais publier le lien privé de gestion dans une capture ou sur la vitrine.
