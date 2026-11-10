# Universal AI Platform

Plateforme modulaire pour créer, enrichir, orchestrer et déployer des assistants IA.

## Composants
- `backend/` : API FastAPI, comptes, projets, assistants, documents/RAG lexical, chat, workflows et déploiements.
- `frontend/` : interface d’accueil Next.js + TypeScript.
- `widget/` : widget JavaScript à intégrer avec une URL de chatbot.
- `demo-client-site/` : exemple d’intégration.
- `docs/CONFIGURATION.md` : installation, configuration, flux API et limites.

## Démarrer
Consulter [docs/CONFIGURATION.md](docs/CONFIGURATION.md). La documentation OpenAPI est servie sur `/docs`. Aucun secret n’est inclus; utiliser les variables documentées dans `env.example`.

## Vérifications
Backend : `cd backend && pip install -e '.[dev]' && pytest`.
Frontend : `cd frontend && npm install && npm test && npm run typecheck && npm run build`.

## Statut et limites
Première version fonctionnelle orientée démonstration. Elle utilise SQLite, une recherche lexicale sans embeddings, un adaptateur OpenAI compatible et des workflows synchrones. Lire la section sécurité et limites de la documentation avant tout déploiement public.
