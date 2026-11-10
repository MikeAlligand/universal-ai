# Universal AI Platform — repository complet 0.4.0

Ce ZIP contient le repository complet, pas seulement un correctif.

## Contenu
- Frontend Next.js avec le thème global restauré et la page Mes projets.
- Page de détail `/projects/[id]`.
- Création, lecture, modification et suppression des projets.
- Backend FastAPI.
- SQLAlchemy + SQLite pour le développement local.
- Alembic pour les migrations.
- Documentation et configuration de déploiement initiales.

## Installation recommandée si ton dossier actuel est devenu incohérent

1. Arrête le frontend et le backend (`Ctrl+C` dans chacun des terminaux).
2. Renomme ton dossier actuel `universal-ai-platform` en `universal-ai-platform-backup`.
3. Décompresse ce ZIP dans `Desktop` et vérifie que le dossier obtenu s'appelle `universal-ai-platform`.
4. Copie ton ancien fichier `.env` dans le nouveau dossier si tu avais des paramètres personnels. Ne copie pas les anciens dossiers `node_modules` ou `.venv`.
5. Pour conserver ta base SQLite, copie le fichier :
   `backend/data/universal_ai.db`
   depuis l'ancien dossier vers le même emplacement dans le nouveau dossier, si ce fichier existe.
   Si ton ancien dossier utilisait un autre chemin SQLite, ne devine pas : demande de l'aide avant de le déplacer.
6. Ouvre le nouveau dossier dans VS Code.

## Démarrage backend (PowerShell)

```powershell
cd "$HOME\Desktop\universal-ai-platform\backend"
$env:DATABASE_URL = "sqlite:///./data/universal_ai.db"
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Si `.venv` existe déjà et que les dépendances sont installées, tu peux omettre la création du venv et le `pip install`.

## Démarrage frontend (deuxième PowerShell)

```powershell
cd "$HOME\Desktop\universal-ai-platform\frontend"
$env:Path = "C:\Program Files\nodejs;$env:Path"
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" run dev
```

Adresses :
- Interface : http://localhost:3000
- Mes projets : http://localhost:3000/projects
- Documentation API : http://localhost:8000/docs
- Santé API : http://localhost:8000/health

## Validation CRUD

1. Crée un projet depuis Mes projets.
2. Clique sur sa ligne pour ouvrir `/projects/<id>`.
3. Modifie le nom ou la description puis enregistre.
4. Reviens à la liste et vérifie la mise à jour.
5. Supprime uniquement un projet de test, après confirmation.
6. Redémarre le backend et vérifie que les projets sont toujours présents.

## Important
- Ce ZIP est un socle de développement, pas une version prête pour la production.
- L'authentification, le cloisonnement multi-tenant, les connecteurs de données, le RAG et les agents IA ne sont pas encore implémentés.
- SQLite est utilisé pour le développement local. PostgreSQL/pgvector sera utilisé pour les déploiements SaaS/entreprise.
- Ne supprime pas l'ancien dossier de sauvegarde avant d'avoir validé le nouveau projet.


## Mise à jour 0.4.0 — Assistants IA

La version 0.4.0 ajoute la gestion des assistants par projet. Après avoir remplacé les fichiers, relancez le backend puis exécutez la migration Alembic :

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
```

La migration ajoute uniquement la table `assistants` et conserve les projets existants. Ouvrez un projet puis cliquez sur **Configurer** dans la section Assistants IA. Les fournisseurs et modèles sont enregistrés comme configuration ; les appels aux API ne sont pas encore activés.
