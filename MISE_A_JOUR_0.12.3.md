# Mise à jour 0.12.3 — Initialisation SQLite

## Correctif

Le backend appliquait les migrations Alembic uniquement sur demande explicite, alors que le démarrage local ne les exécutait pas. Une base SQLite fraîche ne contenait donc pas la table `users`, provoquant une erreur HTTP 500 sur `/api/v1/auth/setup-status`.

En mode local (`APP_ENV=local`), le cycle de vie FastAPI applique désormais automatiquement `alembic upgrade head` avant d'accepter les requêtes. Les environnements de production conservent les migrations comme étape explicite de déploiement.

## Installation

Remplacer le dossier `backend` par celui de cette archive, conserver le fichier `.env` local et la base SQLite existante. Au prochain démarrage, les migrations en attente seront appliquées automatiquement.
