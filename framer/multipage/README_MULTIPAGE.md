# BIMA — version Framer multipages

Cette version remplace le gros composant unique par quatre composants de page
et un fichier partagé.

## Fichiers

- `BimaKit.tsx` : API, types, styles et petits composants communs ;
- `BimaHome.tsx` : page d’accueil ;
- `BimaCreate.tsx` : création et partage d’une sortie ;
- `BimaGuest.tsx` : programme et vote des invités ;
- `BimaManage.tsx` : vote et tableau de bord de l’organisateur.

Le backend reste inchangé et déjà publié.

## 1. Ajouter les fichiers dans Framer

Dans **Assets → Code**, créez les cinq fichiers avec exactement les noms
ci-dessus. Copiez d’abord `BimaKit.tsx`, puis les quatre composants de page.

Les quatre derniers fichiers importent automatiquement le fichier partagé avec :

```tsx
from "./BimaKit"
```

Les cinq fichiers doivent donc rester au même niveau dans Framer.

## 2. Créer les pages Framer

Créez quatre pages avec ces chemins exacts :

| Page Framer | Chemin | Composant à déposer |
|---|---|---|
| Accueil | `/` | `BimaHome` |
| Création | `/creer` | `BimaCreate` |
| Sortie invitée | `/sortie` | `BimaGuest` |
| Gestion | `/gestion` | `BimaManage` |

Sur chaque page :

1. ajoutez un **Stack vertical** à l’intérieur du breakpoint de la page ;
2. réglez ce Stack sur **Width: Fill**, **Height: Fit Content** et `Gap: 0` ;
3. déposez le composant indiqué **dans ce Stack**, et non directement sur le
   canvas libre de la page ;
4. sélectionnez le composant : le type **Relative** devient disponible ;
5. réglez sa largeur sur **Fill** et sa hauteur sur **Fit Content** ;
6. donnez au Stack ou au composant une hauteur minimale de `100vh`.

Framer désactive **Relative** pour un élément placé directement dans un parent
en positionnement libre. Les annotations de taille présentes dans les
composants permettent `Fill` et `Fit Content`, mais le parent doit tout de même
être un Stack.

Ne créez pas de page Framer dynamique : l’identifiant de la sortie et le jeton
organisateur passent dans les paramètres de l’URL.

## 3. API

Dans la propriété **API BIMA**, conservez :

`https://bima-prototype-v1.nzuzimampuyanicolas.chatgpt.site`

Les liens produits automatiquement ont cette forme :

- invité : `/sortie?event=identifiant` ;
- organisateur : `/gestion?event=identifiant&manage=jeton`.

## 4. Personnalisation

Chaque composant de page possède les mêmes contrôles Framer pour :

- le logo ou le nom de marque ;
- la couleur d’accent ;
- le fond et les cartes ;
- les textes principaux et secondaires ;
- les boutons et les états de succès.

La page `BimaHome` ajoute les contrôles des textes du grand titre et de la carte
de démonstration.

Pour garder une identité identique partout, configurez d’abord `BimaHome`, puis
reportez les mêmes couleurs et le même logo sur les trois autres composants.

## 5. Test rapide

1. publiez les quatre pages ;
2. créez une sortie depuis `/creer` ;
3. ouvrez le lien invité dans une fenêtre privée ;
4. votez comme invité ;
5. ouvrez le lien organisateur et votez ;
6. confirmez une date ;
7. vérifiez le téléchargement du fichier `.ics`.

## Si les chemins Framer sont différents

Modifiez uniquement l’objet `PATHS` au début de `BimaKit.tsx`. Par exemple :

```tsx
export const PATHS = {
    home: "/",
    create: "/nouvelle-sortie",
    guest: "/invitation",
    manage: "/organisateur",
}
```

Les boutons et les liens générés utiliseront automatiquement ces nouveaux
chemins.
