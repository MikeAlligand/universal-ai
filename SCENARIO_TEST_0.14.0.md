# Scénario de tests 0.14.0

## A. Navigation assistants
1. Depuis Vue d'ensemble, cliquer « Assistants IA » : la page `/assistants` doit s'ouvrir.
2. Répéter depuis Mes projets, la page d'un projet, les réglages et le chat.
3. Vérifier que les assistants de plusieurs projets apparaissent avec le bon nom de projet.
4. Vérifier qu'un assistant ouvre son chat et sa configuration dans son projet d'origine.
5. Vérifier qu'un utilisateur ne voit que les projets/assistants auxquels l'API lui donne accès.

## B. Fournisseur Ollama
1. Installer et démarrer Ollama.
2. `ollama pull qwen2.5:3b`.
3. Vérifier `GET /system/providers` : `providers.ollama.available=true` et le modèle dans `models`.
4. Démarrer FastAPI avec `LLM_MODE=local`.
5. Créer un assistant Ollama `qwen2.5:3b`, lui envoyer une question nouvelle et vérifier une réponse générée.
6. Arrêter Ollama et vérifier que le chat renvoie une erreur explicite sans faire croire à une réponse démo.
7. Remettre `LLM_MODE=mock` et vérifier que le mode démonstration est clairement indiqué.

## C. Non-régression
- Création, modification et suppression d'assistants.
- Historique des conversations.
- RAG lexical et isolation des sources du projet.
- Création et consultation de projets.
- `npm run build` et `pytest -q`.
