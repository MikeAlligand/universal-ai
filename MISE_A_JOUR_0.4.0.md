# Universal AI Platform — Mise à jour 0.4.0

Cette version ajoute la gestion des assistants IA dans chaque projet, sans remplacer la base de données SQLite existante.

## Installation

1. Arrête le backend et le frontend (Ctrl+C dans leurs terminaux).
2. Fais une copie de sécurité du dossier `backend/data` de ton projet actuel. Il contient la base `universal_ai.db`.
3. Décompresse cette archive dans un nouveau dossier `universal-ai-platform` (ou remplace les fichiers du dossier actuel après sauvegarde).
4. Si tu repars dans un dossier neuf, recopie ton ancien `backend/data/universal_ai.db` dans `backend/data/` du nouveau dossier. Ne remplace jamais cette base par une base vide.
5. Ouvre PowerShell dans `backend` et exécute :

```powershell
$env:DATABASE_URL = "sqlite:///./data/universal_ai.db"
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

6. Dans un deuxième terminal, démarre le frontend comme avant :

```powershell
$env:Path = "C:\Program Files\nodejs;$env:Path"
& "C:\Program Files\nodejs\npm.cmd" run dev
```

Si tu as créé un nouveau dossier sans `node_modules`, lance d'abord `& "C:\Program Files\nodejs\npm.cmd" install`.

## Accès

Ouvre `http://localhost:3000`, va dans **Mes projets**, ouvre un projet puis clique sur **Configurer** dans la section Assistants IA.

## Ce qui est inclus

- Création, affichage, modification et suppression des assistants.
- Persistance SQLite via une nouvelle migration Alembic (`0002_create_assistants`).
- Paramètres : nom, description, spécialité, instructions système, fournisseur, modèle et température.
- Fournisseurs préparés : OpenAI, Anthropic, Mistral AI et Ollama.
- Suppression en cascade des assistants si leur projet est supprimé.

**Important :** cette version enregistre la configuration des fournisseurs et modèles. Les appels réels aux API, les clés API et l'écran de conversation ne sont pas encore implémentés.
