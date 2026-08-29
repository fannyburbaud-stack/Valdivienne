# Valdivienne — Patrimoine & mémoire

## Ce que fait l'application
- ouvre sur une carte interactive ;
- fonctionne en ligne avec OpenStreetMap ;
- conserve les données (articles, index, marqueurs) dans le cache du téléphone/tablette ;
- géolocalisation du visiteur ;
- index des lieux ;
- index des noms ;
- bibliothèque des articles ;
- installation comme application PWA ;
- synchronisation automatique du blog via GitHub Actions.

## IMPORTANT — carte Google My Maps
Google My Maps permet d'exporter une carte au format KML/KMZ. L'application ne dépend pas de l'interface Google My Maps pour fonctionner hors ligne.
1. Ouvrir la carte My Maps.
2. Menu ⋮ / Plus > Exporter au format KML/KMZ.
3. Pour une première version, décompresser le KMZ s'il y en a un et placer le KML dans `data/map.kml`.
4. Dans l'application, appuyer sur « 📥 Importer ma carte My Maps » et choisir le fichier KML. Les repères sont enregistrés localement pour le mode hors connexion.

Le fond OpenStreetMap est chargé en ligne. Hors ligne, les marqueurs et données restent consultables ; pour un fond cartographique détaillé totalement hors ligne, il faut fournir un paquet de tuiles/vector tiles adapté à la zone, ce qui est séparé des données de la carte.

## Déploiement
Publier le dépôt avec GitHub Pages depuis `main` et `/` (racine).

## Synchronisation
GitHub Actions lance `scripts/sync_blog.py` chaque jour et peut être lancé manuellement dans l'onglet Actions.
