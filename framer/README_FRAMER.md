# BIMA — installation dans Framer

Ce kit contient un composant Framer autonome et un backend déjà prévu pour les
tests utilisateurs.

## 1. Créer la page Framer

1. Créez un nouveau projet Framer avec une page vide.
2. Ouvrez **Assets → Code → New Code File**.
3. Nommez le fichier `BimaApp.tsx`.
4. Remplacez son contenu par celui du fichier `BimaApp.tsx` de ce dossier.
5. Déposez le composant **BimaApp** sur la page.
6. Réglez sa largeur sur **Fill**, sa hauteur sur **Fit Content** et sa hauteur
   minimale sur `100vh`.

Le champ **API BIMA** du panneau Framer doit contenir :

`https://bima-prototype-v1.nzuzimampuyanicolas.chatgpt.site`

## 2. Personnaliser sans toucher au code

Sélectionnez le composant **BimaApp** sur la page. Tous les réglages suivants
apparaissent dans le panneau de droite de Framer.

### Logo et marque

- **Logo** : importez une image PNG, JPG, WebP ou SVG depuis Framer ;
- **Texte logo** : texte alternatif utilisé pour l’accessibilité ;
- **Nom marque** : texte affiché lorsqu’aucune image de logo n’est fournie.

Si un logo est importé, il remplace automatiquement le mot `bima` dans
l’en-tête.

### Textes de la page d’accueil

- Sur-titre ;
- trois parties du grand titre ;
- description ;
- texte du bouton principal ;
- texte sous le bouton ;
- badge, titre, détail et dates de la carte de démonstration.

Les trois champs du grand titre permettent de choisir précisément quelle partie
apparaît dans la couleur d’accent.

### Couleurs

- Accent ;
- fond général ;
- fond des cartes ;
- texte principal ;
- texte secondaire ;
- boutons ;
- texte des boutons ;
- états de succès.

Les changements sont visibles immédiatement sur le canvas Framer et sont
réutilisés sur les formulaires, les cartes, les votes et le tableau de bord.

## 3. Publier

Publiez la page Framer. Le composant utilise les paramètres d’URL :

- `?event=identifiant` pour les invités ;
- `?event=identifiant&manage=jeton-prive` pour l’organisateur.

Il faut donc conserver les paramètres d’URL lors de toute redirection ou
configuration de domaine.

## 4. Parcours de test conseillé

1. L’organisateur crée une sortie et copie les deux liens.
2. Il ouvre le lien invité dans une fenêtre privée pour vérifier le parcours.
3. Il partage ce lien à 3 à 8 testeurs.
4. Chaque testeur renseigne son prénom et vote depuis son propre appareil.
5. L’organisateur ouvre son lien privé, vote lui aussi puis confirme la date.
6. Les invités rechargent leur lien : la sortie confirmée s’affiche.
7. L’organisateur et les invités utilisent **Ajouter au calendrier (.ics)**,
   puis vérifient que le titre, la date, l’adresse et le programme sont corrects
   dans leur application de calendrier.

## 5. Données et sécurité

- Les sorties, participants et votes sont enregistrés dans une base persistante.
- Aucun compte n’est demandé aux invités.
- Le lien organisateur contient un jeton privé : ne le partagez pas avec les
  invités.
- Les liens Google Maps acceptés comprennent `maps.app.goo.gl`, `goo.gl/maps`
  et les URL longues `google.*/maps`.
- Ce montage est destiné à une phase de test. Avant une ouverture commerciale,
  ajoutez une politique de confidentialité, une durée de conservation et une
  suppression des données.

## 6. Mesures à suivre pendant le test

- taux de création terminée ;
- nombre moyen de participants par sortie ;
- taux de vote après ouverture du lien ;
- temps entre création et premier vote ;
- part des organisateurs qui confirment une date ;
- problèmes rencontrés avec les liens Google Maps.
