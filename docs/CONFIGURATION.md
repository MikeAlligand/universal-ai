# Installation et configuration

## Prérequis
Python 3.11+, Node.js 20+, npm. Docker Compose est facultatif.

## Démarrage local
1. Copier `.env.example` vers `.env`, définir un `APP_SECRET` aléatoire (minimum 32 caractères recommandé), puis remplir `OPENAI_API_KEY` si nécessaire.
2. API : `cd backend && python -m venv .venv && . .venv/bin/activate && pip install -e '.[dev]' && uvicorn app.main:app --reload`.
3. Frontend : `cd frontend && npm install && npm run dev`.
4. API interactive : http://localhost:8000/docs. Interface : http://localhost:3000.
La base SQLite est créée automatiquement. Pour Docker : `docker compose up --build` après création du fichier .env.

## Flux API
Créer un compte via POST /auth/register (email en paramètre), puis envoyer le jeton Bearer. Créer un projet, un assistant et charger des fichiers .txt/.md/.csv (2 Mo max). Déployer avec POST /assistants/{id}/deployments, mode public/authenticated/invitation/signed. Le résultat fournit le slug et, selon le mode, le code d’invitation ou le secret d’identité. Signer l’identité avec HMAC-SHA256 du texte de l’identité. Le widget se charge avec `<script src=".../universal-ai.js" data-api="..." data-slug="..."></script>`.

## Sécurité et limites
Cette première version est un socle fonctionnel, pas une version SaaS prête à héberger des données sensibles. L’inscription est ouverte, les jetons durent 24 h et il n’y a pas de renouvellement, révocation, vérification d’email, rôles d’équipe ni quotas. Les secrets d’invitation/signature sont renvoyés une seule fois à la création mais stockés en clair dans SQLite. Les assistants utilisent une recherche lexicale simple, pas d’embeddings ni de base vectorielle; seuls fichiers texte/Markdown/CSV sont acceptés. Le fournisseur OpenAI compatible est implémenté; les autres fournisseurs nécessitent un adaptateur. Les workflows sont synchrones et limités à trois étapes intégrées (prompt, uppercase, append). Le mode authenticated vérifie actuellement uniquement la présence d’un Bearer, pas l’identité ni les droits du visiteur. Le frontend est une page d’accueil de démonstration; l’administration passe par l’API Swagger, le site demo et le widget n’apportent pas encore de gestion UI/invitation. HTTPS, stockage externe, antivirus et limites de débit sont à configurer avant exposition publique.
