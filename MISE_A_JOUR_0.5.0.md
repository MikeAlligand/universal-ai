# Universal AI Platform — Mise à jour 0.5.0

Cette version ajoute une interface de conversation, un historique persistant et une passerelle LLM.

## Installation

1. Arrêter le backend et le frontend (`Ctrl+C`).
2. Sauvegarder `backend/data/universal_ai.db`.
3. Décompresser le ZIP dans le dossier du projet en conservant `.venv`, `node_modules`, `backend/.env` et `backend/data`.
4. Dans PowerShell, exécuter la migration :

```powershell
cd "$HOME\Desktop\universal-ai-platform\backend"
$env:DATABASE_URL = "sqlite:///./data/universal_ai.db"
.\.venv\Scripts\python.exe -m alembic upgrade head
```

5. Démarrer le backend comme auparavant.
6. Dans un second terminal, démarrer le frontend comme auparavant.

## Essayer sans clé API

Par défaut, `LLM_MODE=mock`. La page de conversation fonctionne et enregistre les messages, mais la réponse est une réponse de démonstration. Aucun appel externe n'est effectué.

## Activer un véritable modèle OpenAI

1. Créer `backend/.env` à partir de `backend/.env.example`.
2. Renseigner `OPENAI_API_KEY` avec une clé personnelle valide.
3. Modifier `LLM_MODE=cloud`.
4. Redémarrer le backend.
5. Dans la configuration de l'assistant, choisir OpenAI et un modèle auquel la clé donne accès.

La clé reste côté backend et n'est jamais envoyée au navigateur. Ne pas la mettre dans le code frontend, ne pas la partager et ne pas la committer dans Git. Les appels réels à une API peuvent être facturés par le fournisseur.

## Fournisseurs

- OpenAI : `OPENAI_API_KEY`, API Chat Completions.
- Anthropic : `ANTHROPIC_API_KEY`, API Messages.
- Mistral : `MISTRAL_API_KEY`, API compatible OpenAI.
- Ollama : `OLLAMA_BASE_URL`, API locale compatible OpenAI (par défaut `http://localhost:11434`).

## Ce qui est inclus

- Conversations persistées en SQLite.
- Historique par assistant.
- Réutilisation du contexte de la conversation lors des messages suivants.
- Suppression en cascade des conversations lorsqu'un assistant est supprimé.
- Mode démo sans clé API.

Le streaming des réponses, les pièces jointes/RAG, l'authentification et le cloisonnement multi-utilisateur restent à développer.
