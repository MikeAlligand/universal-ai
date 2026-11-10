# Installation propre — Universal AI Platform 0.17.0 (macOS)

## Prérequis
- Python 3.11 ou 3.12 recommandé (vérifier `python3 --version`).
- Node.js LTS et npm.
- Ollama installé si vous souhaitez utiliser l'IA locale.

## Backend
Depuis le dossier du projet :

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
# Generate a private JWT secret in a local, ignored .env file.
printf "APP_ENV=local\nLLM_MODE=local\nDEFAULT_LLM_PROVIDER=ollama\nOLLAMA_BASE_URL=http://localhost:11434\nOLLAMA_EMBEDDING_MODEL=nomic-embed-text\nJWT_SECRET=%s\n" "$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')" > .env
```

Le fichier `.env` local utilise Ollama; gardez-le hors de Git :
- `LLM_MODE=local`
- `DEFAULT_LLM_PROVIDER=ollama`
- `OLLAMA_BASE_URL=http://localhost:11434`
- `OLLAMA_EMBEDDING_MODEL=nomic-embed-text`

Lancer Ollama et télécharger les modèles :

```bash
ollama pull qwen2.5:3b
ollama pull nomic-embed-text
```

Le modèle de génération doit ensuite être sélectionné sur l'assistant dans l'interface (par exemple `qwen2.5:3b`). L'embedding `nomic-embed-text` est utilisé pour la recherche sémantique du Knowledge Hub.

Vérifier Ollama :

```bash
curl http://localhost:11434/api/tags
```

Démarrer l'API :

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Swagger : http://127.0.0.1:8000/docs

## Frontend
Dans un second Terminal :

```bash
cd frontend
npm install
npm run dev
```

Interface : http://localhost:3000

## Vérification
- API : http://127.0.0.1:8000/health
- Fournisseurs : http://127.0.0.1:8000/system/providers
- Swagger : http://127.0.0.1:8000/docs

La base SQLite est créée/initialisée au premier démarrage. Les migrations Alembic sont exécutées au démarrage par l'application.

## Important
- Ne pas utiliser le mode `mock` si vous attendez une vraie génération IA : le mode mock renvoie des réponses de démonstration.
- Ollama doit tourner sur la même machine que le backend, sauf configuration réseau explicite.
- Les modèles Ollama sont téléchargés séparément et ne sont pas inclus dans l'archive.
- Cette archive est une installation vierge : elle ne contient pas de base de données utilisateur ni de fichier `.env` avec secrets.
