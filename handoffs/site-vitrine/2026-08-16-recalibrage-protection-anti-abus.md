# Transmission Site vitrine — recalibrage de la protection anti-abus

Date : 16 août 2026  
Application à tester : https://bima-app-sigma.vercel.app/

## Changement terminé

La protection anti-abus de l’API BIMA a été recalibrée pour mieux protéger le service sans bloquer les usages normaux, notamment les groupes connectés au même Wi-Fi ou au même réseau mobile.

Les quotas distinguent désormais :

- les tentatives de création des créations réellement valides ;
- le trafic partagé d’un réseau des modifications effectuées avec un lien personnel ;
- les actions authentifiées de l’organisateur ou de l’administrateur des essais avec un mauvais lien ou une mauvaise clé ;
- les limites de courte durée de plafonds journaliers sur les opérations les plus coûteuses.

Les erreurs de limitation indiquent maintenant un délai concret avant de pouvoir réessayer. Les en-têtes techniques de quota sont également transmis correctement par le frontend Vercel.

## Bénéfice utilisateur

- Un groupe nombreux a moins de risque d’être bloqué parce que plusieurs personnes utilisent le même réseau.
- L’administrateur peut laisser le tableau ouvert avec son actualisation automatique sans être bloqué après quelques minutes.
- Une erreur de formulaire ne consomme plus immédiatement le quota des créations réussies.
- En cas de trafic excessif, l’utilisateur sait combien de temps attendre.

## Impact sur la promesse BIMA

La promesse ne change pas. Cette évolution fiabilise le parcours existant « créer → partager → répondre → décider → confirmer » et prépare une ouverture plus sereine au grand public.

## Mise à jour obligatoire de la vitrine

Aucune modification visible ou éditoriale n’est nécessaire sur la page vitrine. Il s’agit d’une amélioration technique de fiabilité et de sécurité.

## À ne pas annoncer publiquement

- Ne pas publier les seuils exacts de limitation.
- Ne pas présenter cette protection comme une garantie contre toutes les attaques.
- Ne pas annoncer la règle d’observation Vercel comme active : elle reste volontairement en brouillon tant que son impact n’a pas été observé et validé.

## Suggestion facultative

Si une section « Fiabilité » ou « Sécurité » est ajoutée plus tard, une formulation sobre peut être utilisée : « BIMA applique des protections contre les usages automatisés et excessifs afin de préserver la disponibilité du service. »
