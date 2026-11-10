# Roadmap

## Stage 0 — Local foundation (included)
- Docker Compose
- Next.js shell
- FastAPI shell
- PostgreSQL + pgvector
- Redis
- MinIO
- Basic health and project endpoints

## Stage 1 — Identity and tenancy
- OIDC integration
- organizations, memberships and roles
- organization-scoped repositories
- PostgreSQL RLS
- cross-tenant security tests

## Stage 2 — Assistant configuration
- assistant CRUD
- prompt/config versioning
- simple/advanced builder UI

## Stage 3 — Knowledge ingestion
- upload endpoint and signed object storage
- PDF, DOCX, XLSX extraction
- normalization, chunking, deduplication
- asynchronous ingestion jobs

## Stage 4 — RAG
- embedding provider interface
- pgvector indexing
- full-text + vector hybrid retrieval
- reranking and source citations
- evaluation dataset

## Stage 5 — Chat and multi-agent quality
- streaming chat
- persisted workflow runs
- claim extraction
- two independent reviewers
- evidence-based arbitration and abstention

## Stage 6 — Connectors
- website crawler with SSRF protection
- read-only SQL connector
- REST/OpenAPI connector
- Google Drive OAuth and incremental sync

## Stage 7 — SaaS readiness
- billing and quotas
- analytics
- audit logs
- privacy and deletion workflows
- backup/restore tests
- production deployment


## 0.4.0 — Assistants IA
- Gestion CRUD des assistants par projet.
- Instructions système, rôle, fournisseur, modèle et température.
- Fournisseurs préparés : OpenAI, Anthropic, Mistral et Ollama.
- Les appels réels aux fournisseurs seront ajoutés dans une version ultérieure.
