# Universal AI Platform — mise à jour 0.10.0

## Authentification locale
- Création du premier compte administrateur via `/login`.
- Connexion par e-mail et mot de passe (12 caractères minimum).
- Hachage Argon2 des mots de passe.
- Jetons d'accès JWT signés en HS256 et expirant après 8 heures par défaut.
- Protection de l'API métier : les routes projets, assistants, sources et conversations exigent un jeton Bearer valide.
- Déconnexion depuis la page d'accueil.
- Endpoint `/api/v1/auth/me` pour consulter le compte connecté.
- Endpoint `/api/v1/auth/setup-status` pour déterminer si le premier compte doit être créé.

## Installation / mise à niveau
1. Extraire la nouvelle archive dans un nouveau dossier ou sauvegarder le dossier existant.
2. Dans `backend`, mettre à jour les dépendances : `python -m pip install -r requirements.txt`.
3. Copier `.env.example` vers `.env` si ce n'est pas déjà fait. Dans `backend/.env`, définir `JWT_SECRET` avec une chaîne aléatoire unique d'au moins 32 caractères. Ne jamais partager ce secret ni le committer.
4. Appliquer les migrations : `python -m alembic upgrade head`.
5. Démarrer le backend : `python -m uvicorn app.main:app --reload --port 8000`.
6. Démarrer le frontend : `npm install` puis `npm run dev`.
7. Ouvrir `http://localhost:3000/login` et créer le premier compte administrateur.

## Tests et limites connues
- Suite backend : 10 tests passés.
- Migration Alembic jusqu'à `0007_users_auth` testée sur SQLite.
- Le build Next.js n'a pas pu être vérifié dans cet environnement (installation npm interrompue par timeout).
- Cette version est un mode local mono-administrateur : l'inscription publique est fermée après la création du premier compte. Les espaces ne sont pas encore multi-tenant avec rôles/partage entre plusieurs utilisateurs.
- Le jeton est conservé dans localStorage côté navigateur. Pour une mise en production, prévoir cookies HttpOnly/Secure/SameSite, protection CSRF, renouvellement/révocation des sessions, limitation de débit, MFA éventuelle, et audit de sécurité.
- Ne pas exposer cette version directement sur Internet ni y charger des données client confidentielles avant la mise en place de l'isolation multi-tenant et des contrôles de sécurité de production.
