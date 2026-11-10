# Universal AI Platform — version 0.12.0

## Objectif
Passer des organisations « annuaire de membres » à un premier espace de travail réellement collaboratif, avec rattachement des projets et contrôle des permissions côté API.

## Fonctionnalités
- Ajout de `organization_id` aux projets.
- Migration des projets existants vers l'espace personnel de leur propriétaire (création d'une organisation personnelle si nécessaire).
- Liste des projets accessibles via l'appartenance à une organisation.
- Accès aux projets, assistants, sources et conversations vérifié à partir de l'appartenance à l'organisation.
- Rôles `admin`, `member`, `viewer` appliqués côté API.
- Les lecteurs peuvent consulter mais ne peuvent pas modifier les projets ou lancer des conversations.
- Les membres peuvent créer et modifier des projets dans leur organisation.
- Seuls les administrateurs peuvent supprimer un projet partagé.
- Gestion des rôles et retrait des membres, avec protection contre la suppression du dernier administrateur.

## API ajoutée
- `PATCH /api/v1/organizations/{org_id}/members/{member_user_id}` — modifier un rôle.
- `DELETE /api/v1/organizations/{org_id}/members/{member_user_id}` — retirer un membre (un membre peut aussi quitter l'organisation).
- `POST /api/v1/projects` accepte désormais `organization_id`.
- `GET /api/v1/projects` retourne les projets des organisations auxquelles l'utilisateur appartient.

## Migration
Alembic `0010_project_orgs` ajoute le rattachement organisationnel et rétro-propage les projets existants. Migration vérifiée sur une base SQLite neuve jusqu'à `0010_project_orgs`.

## Vérifications
- Compilation Python : OK.
- Tests backend : 13 réussis.
- Migration Alembic complète : OK.
- Build frontend : non exécuté (dépendances frontend non installées dans l'environnement de validation).

## Limites connues
- Les invitations retournent encore un jeton à transmettre manuellement : aucun service e-mail n'est configuré.
- La gestion des organisations est disponible via API ; l'interface d'administration des membres reste à réaliser.
- Le système reste une base de développement : avant exposition publique, il faut notamment renforcer les secrets de déploiement, la limitation de débit, les journaux d'audit, la gestion de sessions et les contrôles réseau.
