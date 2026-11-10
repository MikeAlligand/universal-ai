# Scénario de recette — 0.12.0 : collaboration multi-utilisateur

## Préparation
1. Extraire la version 0.12.0.
2. Suivre `README.md` pour démarrer le backend.
3. Exécuter `alembic upgrade head` dans le dossier `backend`.
4. Créer un premier compte administrateur et se connecter depuis Swagger (`/docs`) ou l'interface.

## Parcours nominal
1. Créer une organisation « Société Démo ».
2. Créer un projet dans cette organisation en renseignant `organization_id`.
3. Ajouter une source documentaire au projet.
4. Créer un assistant et lui associer la source.
5. Créer une invitation pour `collaborateur@example.test` avec le rôle `member`.
6. Accepter l'invitation avec un mot de passe d'au moins 12 caractères.
7. Se connecter avec le compte collaborateur.
8. Vérifier que le projet apparaît dans `GET /api/v1/projects`.
9. Ouvrir le projet, consulter ses assistants et ses sources.
10. Modifier le projet et créer un deuxième projet dans la même organisation.
11. Vérifier que le collaborateur ne peut pas supprimer le projet partagé (403).

## Parcours lecteur
1. Depuis le compte administrateur, inviter `lecteur@example.test` avec le rôle `viewer`.
2. Accepter l'invitation et se connecter avec ce compte.
3. Vérifier que le lecteur peut consulter le projet.
4. Tenter de modifier le projet : l'API doit refuser l'opération (404 pour une ressource non modifiable dans ce périmètre).
5. Tenter de créer un assistant, d'importer un document ou de démarrer une conversation : l'API doit refuser l'écriture.

## Administration des membres
1. Avec un compte administrateur, consulter `GET /api/v1/organizations/{org_id}/members`.
2. Passer un membre de `member` à `viewer` avec `PATCH /api/v1/organizations/{org_id}/members/{user_id}`.
3. Vérifier que ses droits d'écriture sont retirés.
4. Tenter de rétrograder le dernier administrateur : l'API doit répondre 409.
5. Ajouter un deuxième administrateur (via promotion d'un membre), puis retirer le premier administrateur : l'opération doit être possible.
6. Vérifier qu'un membre peut quitter l'organisation avec `DELETE` sur son propre `user_id`.

## Contrôle d'isolation
1. Créer une deuxième organisation avec un compte distinct.
2. Vérifier que ses membres ne voient aucun projet de la première organisation.
3. Tenter d'accéder directement à l'identifiant d'un projet de la première organisation : l'API doit répondre 404.
4. Répéter le test avec les identifiants d'un assistant, d'une source et d'une conversation.

## Tests automatisés
Dans `backend` :

```powershell
$env:PYTHONPATH = "."
python -m pytest -q
```

Résultat attendu au moment de la livraison : **13 tests réussis**.
