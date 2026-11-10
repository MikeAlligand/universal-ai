# Universal AI Platform 0.7.0

## Objectif
Première brique du Knowledge Hub et fondation d'une architecture dont les données restent sous le contrôle de l'infrastructure configurée par l'exploitant.

## Nouveautés
- Gestion des sources par projet.
- Import local de fichiers TXT, Markdown, CSV, JSON, XML et HTML (5 Mo maximum).
- Récupération d'une URL HTTP(S) publique par le backend.
- Consultation de la liste, recherche côté interface et suppression des sources.
- Migration Alembic `0005_data_sources`.
- Accès direct au Knowledge Hub depuis la page projet.

## Installation
Depuis `backend` :

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```
Depuis `frontend` :

```powershell
npm.cmd install
npm.cmd run dev
```

## Limites connues — ne pas confondre avec une version production
- L'import conserve le texte brut en base ; il ne réalise pas encore de découpage, embeddings, indexation vectorielle ni recherche RAG.
- Les formats PDF et DOCX ne sont pas encore pris en charge.
- L'URL est récupérée côté serveur : en production, il faudra ajouter une protection SSRF stricte (résolution DNS, IP privées, redirections, ports, taille, délais) avant d'exposer cette fonction à des utilisateurs.
- Pas encore d'authentification, d'isolation multi-tenant, de chiffrement applicatif des contenus ou de contrôle d'accès par source.
- La route URL nécessite un accès réseau sortant depuis le backend.
- Cette version est un MVP local de gestion des sources, pas une plateforme sécurisée ou commercialisable.

## Prochaine tranche
Extraction PDF/DOCX, pipeline asynchrone, découpage et embeddings, pgvector, recherche avec citations, liaison explicite des sources autorisées à chaque assistant, puis tests d'évaluation.
