# Universal AI Platform

Plateforme SaaS modulaire de création, configuration et déploiement d'assistants IA et de chatbots.

## Objectif

Permettre de créer des assistants IA connectés à des sources de données, de les orchestrer et de les déployer sous forme de chatbots hébergés ou intégrables sur des sites tiers.

## Architecture cible

- `backend/` — API Python / FastAPI, authentification, assistants, RAG, déploiements et workflows.
- `frontend/` — interface Next.js / TypeScript.
- `demo-client-site/` — site de démonstration pour tester le widget.
- `docs/` — architecture, installation, exploitation et décisions techniques.
- `scripts/` — tests et outils de développement.

## Principes

- `main` est réservée aux versions stables.
- Les évolutions sont développées sur des branches dédiées et intégrées par Pull Request.
- Les tests backend et frontend doivent être exécutés avant fusion.
- Les secrets, fichiers `.env`, bases de données locales, environnements virtuels et dépendances générées ne doivent jamais être versionnés.

## État du dépôt

Initialisation du dépôt distant. Le code source applicatif sera ajouté après synchronisation du projet local.
