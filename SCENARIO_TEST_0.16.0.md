# Scénario de validation 0.16.0

## Installation et démarrage
1. Installer les dépendances backend et frontend selon le README.
2. Démarrer FastAPI puis Next.js.
3. Vérifier la connexion et l'accès aux pages principales.

## Contrôle visuel
1. Vue d'ensemble : fond sombre, navigation, statistiques, formulaires et listes lisibles.
2. Projets : création, recherche, ouverture et suppression ; vérifier les états vide/chargement/erreur.
3. Assistants : bibliothèque, recherche, cartes, configuration et lancement du chat.
4. Chat : historique, nouvelle conversation, suggestions, envoi, réponse, affichage des sources RAG et état d'erreur.
5. Knowledge Hub : import, liste des sources, prévisualisation et suppression.
6. Fournisseurs : état Ollama, modèles et statut des fournisseurs cloud.
7. Responsive : vérifier les pages à 1440 px, 1024 px et 390 px.

## Non-régression backend
Depuis `backend/` :
```bash
python -m pytest -q
python -m compileall -q app tests
```

## Build frontend
Depuis `frontend/` :
```bash
npm ci
npm run build
```

Le build frontend doit être validé dans l'environnement cible avant déploiement.
