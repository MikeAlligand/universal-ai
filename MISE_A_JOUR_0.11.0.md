# Universal AI Platform 0.11.0 — Organisations et invitations

## Nouveautés
- Création d'organisations et attribution du rôle administrateur au créateur.
- Membres d'organisation avec rôles `admin`, `member` et `viewer`.
- Invitations par e-mail avec jeton aléatoire, stockage uniquement de son empreinte SHA-256 et expiration à 7 jours.
- Acceptation d'une invitation avec création du compte et émission d'un JWT.
- Seuls les administrateurs peuvent inviter. Les membres peuvent consulter la liste des membres.
- Une invitation est à usage unique et les doublons actifs sont refusés.

## Limites assumées
- Les organisations et invitations constituent la première brique du multi-tenant. Les projets restent encore dans leur périmètre propriétaire individuel (owner_id) : les partager entre membres n'est pas encore activé.
- Le jeton d'invitation est renvoyé une seule fois par l'API pour les tests et la livraison manuelle. Aucun e-mail n'est envoyé automatiquement.
- Pas encore d'interface de gestion des organisations, de révocation d'invitation, de modification de rôle ni de journal d'audit.
- Avant une ouverture publique : ajouter limitation de débit, politique de renouvellement/révocation des sessions, livraison e-mail fiable, tests de concurrence et durcissement de la configuration secrète.

## Mise à niveau
Depuis 0.10.1, remplacer le dossier du projet par cette version puis exécuter les migrations Alembic :

```powershell
cd backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m pytest -q
```

La base SQLite existante est conservée. La migration 0009 ajoute uniquement les tables d'organisation, de membres et d'invitations.
