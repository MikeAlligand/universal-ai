# Scénarios de validation — 0.17.0

1. Démarrer l'API : Alembic applique `0011_assistant_roles`.
2. Ouvrir un projet puis Assistants IA et créer un assistant.
3. Renseigner mission, responsabilités (une par ligne), limites, livrables et règles de transfert ; enregistrer.
4. Recharger la page : les champs doivent être conservés.
5. Vérifier la bibliothèque `/assistants` : mission et responsabilités apparaissent sur la carte.
6. Ouvrir Assistant Studio depuis Configurer : modifier un champ et enregistrer.
7. Ouvrir `/orchestra` : l'assistant apparaît avec son contrat de responsabilité.
8. Filtrer Orchestra par projet : seuls les assistants du projet sélectionné apparaissent.
9. Tester une conversation en mode réel : le contrat de responsabilité doit guider la réponse.
10. En mode Mock, vérifier que le parcours d'interface et la persistance restent accessibles ; le Mock ne valide pas le comportement du modèle.

Note : Orchestra est une cartographie déclarative en 0.17.0, pas encore un moteur d'exécution multi-agents.
