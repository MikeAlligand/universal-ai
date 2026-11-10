# Universal AI Platform — mise à jour 0.17.0

## Assistant Studio et Agent Orchestra

- La bibliothèque globale et les cartes des assistants exposent désormais la mission et les principales responsabilités.
- Chaque assistant possède un contrat métier configurable : mission, responsabilités (liste), limites/exclusions, livrables et règles de transfert.
- Les champs sont persistés dans la base via la migration Alembic `0011_assistant_roles`.
- Le contrat de responsabilité est injecté dans le prompt système lors des générations réelles.
- L'espace `/orchestra` cartographie les assistants d'un projet ou de tous les projets, avec leurs rôles et règles de transfert.
- Les liens de navigation vers Agent Orchestra sont activés.

## Limite fonctionnelle explicitement affichée

La page Orchestra est une cartographie de l'organisation et des contrats d'agents. Elle ne prétend pas exécuter des workflows ni transférer automatiquement des tâches. Le moteur d'orchestration (planification, exécution, suivi, reprise, arbitrage et traçabilité) reste un chantier ultérieur.

## Migration

La migration `0011_assistant_roles` ajoute cinq colonnes à `assistants`. Elle est exécutée au démarrage par le mécanisme Alembic déjà en place. Les anciens assistants reçoivent des valeurs vides et restent compatibles.

## Vérifications

- `python -m compileall -q app alembic/versions` : OK.
- `python -m pytest -q --disable-warnings` : 21 tests réussis, 1 avertissement.
- Build TypeScript/Next.js : non vérifié dans cet environnement, l'installation npm a dépassé le délai disponible.
