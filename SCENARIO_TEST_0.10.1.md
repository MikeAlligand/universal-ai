# Recette de test — Universal AI Platform 0.10.1

Objectif : vérifier le parcours de bout en bout et surtout qu'un compte ne peut pas consulter les données d'un autre compte.

## A. Préparation

1. Faire une copie de sauvegarde du dossier `backend/data` si une base existe déjà.
2. Installer les dépendances du backend : `python -m pip install -r requirements.txt`.
3. Appliquer les migrations : `python -m alembic upgrade head`.
4. Démarrer le backend et le frontend selon `README.md`.
5. Ouvrir `http://localhost:3000/login`.

## B. Parcours utilisateur (compte A)

- [ ] Créer le premier compte administrateur (mot de passe de 12 caractères minimum).
- [ ] Se connecter et arriver sur le tableau de bord.
- [ ] Créer un projet nommé `Client A - Démonstration`.
- [ ] Ouvrir ce projet et vérifier que son nom et sa description sont conservés après actualisation.
- [ ] Ajouter un fichier TXT contenant : `La garantie standard est de deux ans. Le support répond du lundi au vendredi.`
- [ ] Vérifier que la source apparaît dans le Knowledge Hub du projet.
- [ ] Créer un assistant `Support Client A` et lui donner le rôle support.
- [ ] Sélectionner explicitement la source TXT dans les sources autorisées de l'assistant.
- [ ] Enregistrer, actualiser la page et vérifier que la sélection est conservée.
- [ ] Ouvrir le chat et demander : `Quelle est la durée de la garantie ?`
- [ ] En mode démo, vérifier que la conversation est enregistrée. Avec un fournisseur IA configuré, vérifier que la réponse s'appuie sur le passage documentaire.
- [ ] Revenir à la liste des projets et vérifier que le projet est toujours présent.

## C. Contrôle d'isolation (API)

Ce contrôle nécessite deux comptes de test et doit être réalisé sur une base de test, pas sur des données de production.

1. Créer deux utilisateurs distincts A et B dans la base de test (ou utiliser deux environnements de test isolés).
2. Avec A, créer un projet, un assistant et une source. Conserver leurs identifiants.
3. Obtenir un jeton de connexion pour B.
4. Avec le jeton B, appeler les routes suivantes en remplaçant les identifiants :
   - `GET /api/v1/projects/{project_id}`
   - `PATCH /api/v1/projects/{project_id}`
   - `DELETE /api/v1/projects/{project_id}`
   - `GET /api/v1/assistants/{assistant_id}`
   - `GET /api/v1/sources/{source_id}`
   - `GET /api/v1/assistants/{assistant_id}/conversations`
5. Résultat attendu : `404` pour chaque ressource appartenant à A. La liste `GET /api/v1/projects` de B ne doit pas contenir le projet de A.
6. Revenir avec A et vérifier que ses ressources sont intactes.

## D. Contrôles négatifs

- [ ] Sans jeton, `GET /api/v1/projects` répond `401`.
- [ ] Avec un jeton expiré ou invalide, une route protégée répond `401`.
- [ ] Un compte déjà initialisé ne peut pas créer un deuxième compte via l'inscription initiale (`403`).
- [ ] Un fichier non pris en charge est refusé.
- [ ] Une URL HTTP ou une URL locale est refusée par l'import URL.

## E. Résultats automatisés de cette version

- Compilation Python : réussie.
- Tests backend : 11 réussis.
- Migrations Alembic de `0001` à `0008` sur une base SQLite vierge : réussies.
- Schéma vérifié : colonne `projects.owner_id`, index et clé étrangère vers `users` présents.
- Build frontend : non exécuté dans cet environnement ; à vérifier sur le PC personnel avec `npm install` puis `npm run build`.

## Limite importante

La version 0.10.1 implémente l'isolation des ressources par propriétaire, mais n'offre pas encore la gestion complète des organisations, invitations, membres et rôles. Elle reste une version de développement local et ne doit pas être exposée publiquement ni recevoir de données client confidentielles avant les étapes de sécurité restantes.
