# Scénario de recette — 0.11.0 Organisations et invitations

Prérequis : base migrée (`alembic upgrade head`), backend lancé, compte administrateur initial créé.

1. Se connecter avec le compte administrateur et récupérer le JWT.
2. `POST /api/v1/organizations` avec `{"name":"Equipe pilote"}`. Attendu : 201 et rôle `admin`.
3. `GET /api/v1/organizations`. Attendu : organisation visible avec le rôle `admin`.
4. `POST /api/v1/organizations/{id}/invitations` avec un e-mail et rôle `member`. Attendu : 201, jeton d'invitation et expiration à 7 jours.
5. Accepter le jeton via `POST /api/v1/organizations/invitations/accept` avec un mot de passe d'au moins 12 caractères. Attendu : 201 et JWT du nouveau membre.
6. Consulter `GET /api/v1/organizations/{id}/members` avec le JWT du membre. Attendu : les deux membres sont listés.
7. Tenter de créer une invitation avec le JWT du membre. Attendu : 403.
8. Réutiliser le jeton accepté. Attendu : 400.
9. Tenter de consulter une organisation dont le compte n'est pas membre. Attendu : 404.

Automatisé : `backend/tests/test_organizations.py` couvre le cycle nominal, le contrôle de rôle et le caractère à usage unique du jeton.
