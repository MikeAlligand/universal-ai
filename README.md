# Universal AI Platform

Version 0.17.0 — plateforme locale et modulaire pour assistants IA, bases de connaissances, collaboration et workflows.

## État actuel — version 0.17.0

La version 0.17 inclut l’Assistant Studio et Agent Orchestra : mission, responsabilités, limites et règles de transfert des assistants sont persistées par migration Alembic. La page Orchestra cartographie ces rôles; elle ne réalise pas de transfert automatique. Les workflows persistés sont disponibles via l’API, sans moteur de planification/arbitrage multi-agent complet. L’historique des versions et les scénarios de recette sont conservés dans les fichiers `MISE_A_JOUR_*.md` et `SCENARIO_TEST_*.md`.

## Included in this starter

- Next.js + TypeScript frontend (`http://localhost:3000`)
- FastAPI backend (`http://localhost:8000`, Swagger at `/docs`)
- PostgreSQL with pgvector (`localhost:5432`)
- Redis (`localhost:6379`)
- MinIO object storage (`localhost:9001` console)
- Docker Compose orchestration
- Health checks and a first project/assistant API
- Provider abstraction and a simple RAG-ready document ingestion scaffold
- Claude Code project instructions in `CLAUDE.md`

This is a development foundation, not a production-ready SaaS. Authentication, tenant isolation/RLS, real document parsing, embeddings, OAuth connectors, billing and robust agent arbitration are intentionally staged for subsequent implementation.

## Prerequisites

- Docker Desktop with Docker Compose v2
- Git
- VS Code
- Claude Code extension/CLI (optional)

No local Python or Node installation is required to run the stack because Docker builds the services.

## Quick start (Windows PowerShell)

1. Extract this ZIP.
2. Open the `universal-ai-platform` folder in VS Code.
3. Create a local `.env` file (ignored by Git) with `POSTGRES_PASSWORD`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, and `DATABASE_URL`. Use strong values and set `DATABASE_URL` to the PostgreSQL service using the same database user and password.

4. Start the stack:

```powershell
docker compose up --build
```

5. Open:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Swagger: http://localhost:8000/docs
   - MinIO console: http://localhost:9001 (credentials in `.env`)

Stop with `Ctrl+C`, then:

```powershell
docker compose down
```

To remove local database and object-storage data as well:

```powershell
docker compose down -v
```

**Warning:** `down -v` deletes the local development database and MinIO data.

## Quick start (macOS/Linux)

Create the same local `.env` file described above, then run:

```bash
docker compose up --build
```

## Verify the backend

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/projects
```

Create a project:

```bash
curl -X POST http://localhost:8000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo project","description":"First local project"}'
```

The API currently uses a development-only local mode and does not implement production authentication. Do not expose it to the public internet.

## Useful commands

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose restart backend
docker compose down
```

Rebuild after dependency or Dockerfile changes:

```bash
docker compose up --build
```

## Repository layout

```text
backend/       FastAPI application and domain modules
frontend/      Next.js application
docs/          Architecture and development notes
infra/         Local infrastructure configuration
```

## Development roadmap

1. Foundation and local stack (included)
2. Identity, organizations, memberships and PostgreSQL RLS
3. PDF/DOCX/XLSX ingestion and document lifecycle
4. Embeddings and hybrid retrieval
5. Chat endpoint with citations and SSE
6. Independent reviewers and evidence-based arbitration
7. Website, SQL, REST API and Google Drive connectors
8. Evaluation lab, usage metering and billing
9. Production security, compliance and cloud deployment

See `docs/ARCHITECTURE.md` and `docs/ROADMAP.md`.

## Claude Code

Open this repository in VS Code and start Claude Code from the repository root. The root `CLAUDE.md` contains project rules and the first implementation tasks.

Recommended first instruction:

> Read CLAUDE.md, README.md and docs/ARCHITECTURE.md. Inspect the existing code before changing anything. Run the local stack and tests, report any failures, then propose the next small implementation step. Do not implement the entire roadmap at once.

## Version 0.5.0 — Conversations

- Persistent conversations and message history per assistant.
- Provider gateway supporting OpenAI, Anthropic, Mistral and Ollama-compatible APIs.
- `LLM_MODE=mock` keeps local development functional without credentials.
- To call a real model, create `backend/.env` locally, set `LLM_MODE=cloud` and add the provider key. Set a persistent random `JWT_SECRET` for deployments that must preserve sessions between restarts.
- Never expose API keys in frontend code or commit them to Git.

Run the new database migration from the `backend` directory:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
```

## Version 0.7.0 — Knowledge Hub MVP

La version 0.7 introduit la gestion des sources documentaires par projet. Voir `MISE_A_JOUR_0.7.0.md` pour les formats pris en charge, l'installation et les limites de sécurité/fonctionnelles.


## Démarrage IA réelle (SQLite)

1. Installer les dépendances backend : `pip install -r requirements.txt`.
2. Créer localement `backend/.env` (ignoré par Git) et y renseigner les variables nécessaires, notamment `JWT_SECRET` et les clés du fournisseur si besoin.
3. Renseigner `LLM_MODE=cloud` et la clé du fournisseur choisi (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY` ou `MISTRAL_API_KEY`).
4. Démarrer le backend depuis le dossier `backend`.
5. Importer des documents PDF, DOCX, TXT ou Markdown dans les sources d'un projet.
6. Créer un assistant dans ce même projet et lui poser des questions sur les documents.

Le premier moteur de récupération documentaire utilise une recherche lexicale locale (pas d'embeddings). Les documents ne sont pas envoyés au fournisseur de modèle ; seuls les extraits sélectionnés et le message sont transmis au modèle externe lorsque le mode cloud est activé. Une recherche vectorielle et les contrôles de sécurité de production restent à mettre en place.


## Version 0.9.0 — Assistant source permissions

- Each assistant can be explicitly linked to one or more knowledge sources in its project.
- Chat retrieval is restricted to the sources selected for that assistant.
- Assistant settings expose source selection.
- `GET /system/providers` reports provider configuration state without exposing API keys.
- PDF and DOCX extraction are supported through `pypdf` and `python-docx`.
- SQLite remains the default database. Apply Alembic migration `0006_assistant_sources` before starting this version.


## Version 0.9.1 — Security hardening (development baseline)

- URL ingestion now requires HTTPS, rejects localhost/private/reserved IP targets and does not follow redirects.
- Remote page response size and extracted document text are bounded.
- Security response headers are applied.
- CORS is restricted to configured origins, methods and headers; credentials are disabled.
- Assistant retrieval remains restricted to explicitly selected sources.
- SQLite remains the default.

### Important security status

This remains a local development build, not a production-secure multi-user service. The current API does not yet implement user authentication, tenant authorization, per-user RBAC, encrypted secret storage, audit-grade logging, malware scanning, or a hardened egress proxy. DNS validation before fetch is a mitigation, not a complete defense against DNS rebinding. Do not expose this backend publicly or upload confidential customer documents yet. Before production, add authentication/authorization and enforce outbound network policy at the infrastructure layer.


## Version 0.9.2 — Retrieval guardrails

- Chat context is capped to the latest 20 messages, with each message bounded to 12,000 characters.
- Retrieved document passages are explicitly treated as untrusted data in the model instructions to reduce document-based prompt injection.
- SQLite remains the default; no database migration is required for this patch.

### Current security boundary (read before exposing the service)

The API is still a single-user local development application. Project, assistant, source and conversation endpoints do not yet require authentication. Do not expose it to the public Internet or use it for confidential customer data. The URL ingestion checks are defense-in-depth only; robust SSRF protection needs an egress proxy/network policy and DNS pinning. A production release must include identity, per-tenant authorization, rate limiting, secret management, backups, malware scanning and security testing.

## Organisations et invitations (0.11.0)

La première brique d'administration d'équipe est disponible via l'API : `GET/POST /api/v1/organizations`, `GET /api/v1/organizations/{id}/members` et `POST /api/v1/organizations/{id}/invitations`. L'acceptation d'invitation est publique via `POST /api/v1/organizations/invitations/accept` (le jeton d'invitation fait office de preuve). Les invitations expirent après 7 jours et sont à usage unique. En local, l'API retourne le jeton pour permettre un test manuel ; aucun e-mail n'est envoyé.

Cette brique ne signifie pas encore que les projets sont partagés entre membres : le cloisonnement actuel par propriétaire reste inchangé jusqu'à la prochaine étape.


## État fonctionnel — version 0.12.0

- Authentification locale par JWT et mots de passe hachés Argon2.
- Organisations, invitations, membres et rôles `admin`, `member`, `viewer`.
- Projets rattachés aux organisations et permissions appliquées côté API.
- Sources documentaires, assistants, conversations et RAG lexical de première génération.
- Migration SQLite/Alembic jusqu'à `0010_project_orgs`.

Pour le détail des évolutions et la recette collaborative, consulter `MISE_A_JOUR_0.12.0.md` et `SCENARIO_TEST_0.12.0.md`. Le produit n'est pas encore prêt pour une exposition Internet ou des données clients sensibles : l'interface de gestion des organisations, l'envoi d'e-mails, l'audit et plusieurs protections d'exploitation restent à terminer.
