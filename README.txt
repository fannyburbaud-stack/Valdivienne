V6.1 — IMPORT AUTOMATIQUE BLOGGER
==================================
Cette version récupère les articles publics via le flux JSONP Blogger, sans clé API.
Elle extrait les images <img>, srcset et certains liens d'images depuis le HTML des articles.
Le maximum d'images est configuré à 250 par article.
Elle stocke la base dans localStorage et utilise un Service Worker pour le cache.

IMPORTANT :
- La synchronisation doit être faite en ligne.
- GitHub Pages fournit HTTPS automatiquement sur github.io.
- Le mode hors connexion dépend du cache du navigateur et des ressources déjà consultées.
- Pour une vraie base locale complète avec toutes les images téléchargées, une étape V6.2 pourra télécharger/emballer les images dans le dépôt.

INSTALLATION :
Remplacer index.html, style.css, app.js, sw.js, config.js et manifest.json dans le dépôt GitHub Pages.
Puis attendre le nouveau déploiement et actualiser avec Ctrl+F5 sur ordinateur ou vider le cache sur tablette.


V6.1.1 — DIAGNOSTIC
===================
Ajout du bouton « Tester Blogger » et d'un diagnostic visible.
La synchronisation est paginée (jusqu'à 20 lots de 50 articles).
En cas d'échec, l'écran indique si le navigateur reçoit ou non le flux Blogger.
