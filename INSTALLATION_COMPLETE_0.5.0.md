# Universal AI Platform 0.5.0 — Installation

Cette version ajoute la messagerie des assistants, l'historique des conversations et la passerelle vers les fournisseurs IA.

## Mise à jour du projet existant

1. Arrêter le backend et le frontend avec `Ctrl+C`.
2. Faire une copie de sécurité de `backend/data/universal_ai.db`.
3. Décompresser l'archive dans le dossier `universal-ai-platform` existant et accepter le remplacement des fichiers.
4. Conserver impérativement `.venv`, `node_modules`, `backend/.env` et `backend/data`.
5. Dans PowerShell :

```powershell
cd "$HOME\Desktop\universal-ai-platform\backend"
$env:DATABASE_URL = "sqlite:///./data/universal_ai.db"
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

6. Dans un second terminal, relancer le frontend :

```powershell
cd "$HOME\Desktop\universal-ai-platform\frontend"
$env:Path = "C:\Program Files\nodejs;$env:Path"
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" run dev
```

## Premier essai — sans clé API

Le mode `LLM_MODE=mock` est activé par défaut. Depuis un projet, ouvrez Assistants IA, cliquez sur **Tester** sur une carte, puis envoyez un message. Vous verrez une réponse de démonstration. Les messages et conversations sont réellement conservés en base ; aucun fournisseur externe n'est appelé.

## Activer OpenAI

1. Copier `backend/.env.example` vers `backend/.env` si ce fichier n'existe pas.
2. Renseigner `OPENAI_API_KEY` avec votre clé.
3. Modifier `LLM_MODE=cloud`.
4. Redémarrer le backend.
5. Sélectionner OpenAI et un modèle accessible dans les paramètres de l'assistant.

La clé est lue uniquement par le backend, jamais exposée au navigateur. Les appels à un fournisseur peuvent être facturés par celui-ci. Ne partagez jamais votre clé et ne la commitez pas dans Git.

Les fournisseurs Mistral, Anthropic et Ollama sont également câblés côté backend ; ils nécessitent leurs variables d'environnement respectives. Ollama doit être lancé et accessible sur l'URL configurée.

## Tests réalisés sur cette livraison

- Compilation syntaxique Python.
- Migration Alembic complète de la base vide jusqu'à `0003_create_conversations`.
- 4 tests backend automatisés, dont création d'une conversation en mode démo, persistance des messages et suppression en cascade.
- Vérification de syntaxe TSX sur les pages modifiées.

La compilation Next.js complète doit être faite sur le poste de développement après `npm install`.
