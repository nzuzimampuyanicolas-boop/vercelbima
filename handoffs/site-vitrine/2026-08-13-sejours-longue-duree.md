# Mise à jour de la vitrine BIMA — Sorties longue durée et séjours

Date : 13 août 2026  
Statut : publié et vérifié en production  
Application : https://bima-app-sigma.vercel.app/

## Contexte à transmettre au chat « Site vitrine »

BIMA permet désormais d’organiser deux formats depuis le même parcours : une sortie sur une date et une heure, ou un séjour comprenant une date de départ et une date de retour.

Cette évolution répond au même problème que les sorties classiques : trouver le moment où le groupe peut réellement être présent. BIMA ne devient pas une agence de voyage ni un outil complet de planification touristique.

## Fonctionnalités réellement disponibles

- L’organisateur choisit entre « Une sortie » et « Un séjour » au moment de la création.
- Pour un séjour, il propose entre 1 et 4 périodes comprenant chacune une date de départ et une date de retour.
- Une période peut durer jusqu’à 30 jours.
- Les participants ouvrent le lien sans compte et indiquent les périodes pendant lesquelles ils peuvent partir.
- L’organisateur vote également et consulte le nombre de personnes disponibles pour chaque période.
- BIMA met en avant la période qui réunit le plus de disponibilités, mais l’organisateur garde la décision finale.
- Après confirmation, la page récapitule le séjour et permet de télécharger un fichier calendrier `.ics` couvrant toute la période.
- Les sorties créées avant cette évolution sont conservées et continuent de fonctionner comme auparavant.

## Bénéfice utilisateur à faire comprendre

Le groupe peut choisir les dates d’un week-end ou d’un séjour avec la même simplicité qu’une soirée, sans multiplier les sondages et les messages.

Formulation courte recommandée :

> Une soirée, un week-end ou quelques jours ailleurs : propose les périodes et laisse le groupe cocher ses disponibilités.

Alternative plus directe :

> Pour un verre comme pour un séjour, trouvez enfin les dates qui conviennent au groupe.

## Modifications obligatoires de la vitrine

1. Faire apparaître clairement que BIMA permet d’organiser une sortie ponctuelle **ou un séjour**.
2. Dans la présentation du choix des dates, préciser que l’organisateur peut proposer plusieurs dates ou plusieurs périodes « départ → retour ».
3. Dans l’explication du vote, employer « dates ou périodes » lorsque le texte concerne les deux formats.
4. Dans l’étape de confirmation, préciser que le séjour confirmé peut être ajouté au calendrier sur toute sa durée.
5. Conserver le CTA principal validé : « Je crée ma sortie ». Ne pas le remplacer par un CTA centré uniquement sur le voyage.
6. Conserver la promesse centrale de BIMA : aider un groupe à décider et à confirmer, pas gérer tout le séjour.

## Suggestions facultatives

### Exemple de cas d’usage

Ajouter une carte ou une courte ligne parmi les exemples :

> Week-end entre amis : propose 3 périodes, chacun coche quand il peut partir, puis confirmez la meilleure.

### Formulation pour une section fonctionnalités

> **Une date ou plusieurs jours**  
> Organise une soirée, un week-end ou un séjour de quelques jours avec le même lien simple à partager.

### Démonstration visuelle

Montrer trois propositions sous la forme :

- Du 5 au 7 septembre
- Du 12 au 14 septembre
- Du 19 au 21 septembre

avec un nombre de personnes disponibles pour chaque période.

## À ne pas annoncer

- Ne pas présenter BIMA comme un planificateur de voyage complet.
- Ne pas promettre la réservation d’un hébergement, d’un transport ou d’une activité.
- Ne pas annoncer de paiement partagé, de cagnotte ou de gestion des dépenses.
- Ne pas annoncer de recommandations automatiques de destinations.
- Ne pas annoncer de collaboration sur un programme détaillé jour par jour.
- Ne pas parler de séjours de plus de 30 jours.
- Ne pas dire que BIMA choisit automatiquement à la place de l’organisateur.

## Parcours à montrer

1. L’organisateur sélectionne « Un séjour ».
2. Il propose jusqu’à quatre périodes de départ et de retour.
3. Il partage le lien au groupe.
4. Chaque participant coche les périodes où il peut partir.
5. L’organisateur compare les disponibilités et confirme la période finale.
6. Le groupe peut ajouter le séjour confirmé au calendrier.

## Ton à conserver

Jeune, naturel et concret. Parler de week-end ou de séjour entre amis, sans employer le vocabulaire d’une plateforme touristique ou d’un logiciel professionnel de gestion de voyage.

## Vérification

- URL : https://bima-app-sigma.vercel.app/
- Choisir « Je crée ma sortie », puis sélectionner « Un séjour » dans le formulaire.
- Contrôles déjà présents dans le projet : création des périodes, validation départ/retour, vote participant, confirmation et génération du calendrier `.ics`.
