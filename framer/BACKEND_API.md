# API BIMA

Base de production :

`https://bima-prototype-v1.nzuzimampuyanicolas.chatgpt.site`

Toutes les réponses sont en JSON. Les routes acceptent les appels provenant
d’un site Framer grâce aux en-têtes CORS.

## Prévisualiser un lieu

`POST /api/places`

```json
{
  "url": "https://maps.app.goo.gl/eTx2ryAgN2yK7XDBA"
}
```

La réponse contient `place.name`, `place.rating`, `place.address`,
`place.category` et `place.image`.

## Créer une sortie

`POST /api/events`

```json
{
  "organizerName": "Camille",
  "title": "Brunch d'été",
  "city": "Paris",
  "maxPlaces": 8,
  "budgetEur": 30,
  "responseDeadline": "2026-08-12",
  "places": [
    {
      "mapsUrl": "https://maps.app.goo.gl/eTx2ryAgN2yK7XDBA",
      "name": "Loulou",
      "rating": "4,6",
      "address": "90 Bd Saint-Germain, 75005 Paris"
    }
  ],
  "dates": [
    "2026-08-16T17:30:00.000Z",
    "2026-08-22T18:00:00.000Z"
  ]
}
```

La réponse renvoie :

- `event.slug` : identifiant public ;
- `manageToken` : jeton privé de l’organisateur ;
- `sharePath` : chemin à partager ;
- `managePath` : chemin privé de gestion.

## Lire une sortie

Invité :

`GET /api/events/{slug}`

Organisateur :

`GET /api/events/{slug}?manage={manageToken}`

La version organisateur inclut la matrice détaillée des votes.

## Voter

`POST /api/events/{slug}/votes`

```json
{
  "name": "Alex",
  "participantToken": null,
  "availableDateIds": ["date-id-1", "date-id-2"]
}
```

La première réponse fournit `participantToken`. Il doit être réutilisé si la
personne modifie son vote.

L’organisateur vote sur la même route en envoyant son `manageToken` comme
`participantToken`.

## Confirmer une date

`POST /api/events/{slug}/confirm`

```json
{
  "manageToken": "jeton-prive",
  "dateId": "date-id-1"
}
```

Seul le jeton organisateur peut confirmer. Une fois la date confirmée, les votes
sont clos.

## Télécharger le calendrier

`GET /api/events/{slug}/calendar`

Une fois la date confirmée, cette route télécharge un vrai fichier
`bima-{slug}.ics`. Il contient le titre, la date, une durée de trois heures,
l’adresse et l’itinéraire de la sortie. Le fichier peut être ouvert dans Google
Agenda, Apple Calendrier ou Outlook.

Si aucune date n’est encore confirmée, la route répond avec le statut `409`.

## Persistance

Les tables utilisées sont :

- `events` ;
- `places` ;
- `date_options` ;
- `participants` ;
- `votes`.

Le schéma et la migration se trouvent dans le projet backend. La base est la
source de vérité ; le stockage local du navigateur sert uniquement à reconnaître
un invité lorsqu’il revient modifier son vote.
