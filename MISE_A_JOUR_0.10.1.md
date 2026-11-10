# Universal AI Platform — mise à jour 0.10.1

## Isolation des projets par propriétaire
- Ajout de `owner_id` sur les projets avec clé étrangère vers `users`.
- Migration Alembic `0008_project_owner`; les projets déjà présents sont rattachés au premier compte local lors de la migration lorsqu'il existe. Les projets historiques sans compte sont rattachés au premier compte créé.
- Un nouveau projet est automatiquement créé sous le compte connecté.
- Les listes, lectures, modifications et suppressions de projets sont filtrées par propriétaire.
- Les routes assistants, sources, documents et conversations vérifient que le projet parent appartient au compte connecté.
- Les ressources d'un autre compte répondent `404` afin de ne pas révéler leur existence.

## Mise à niveau
1. Sauvegarder `backend/data` si la base existe déjà.
2. Dans `backend`, exécuter `python -m pip install -r requirements.txt`.
3. Exécuter `python -m alembic upgrade head`.
4. Redémarrer backend et frontend.

## Vérification
Voir `SCENARIO_TEST_0.10.1.md` pour la recette complète. Compilation Python réussie, 11 tests backend réussis et migrations SQLite de 0001 à 0008 vérifiées.

## Limites
L'inscription reste fermée après le premier compte. Le multi-tenant SaaS complet nécessite encore organisations, membres, invitations, rôles et partage de ressources. Le build Next.js n'a pas été vérifié dans cet environnement. Ne pas exposer cette version directement sur Internet ni y charger des données client confidentielles avant audit et durcissement complémentaires.
