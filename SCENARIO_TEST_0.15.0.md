# Scénario de tests — Universal AI Platform 0.15.0

## A. Configuration RAG
1. Dans un projet, importer un fichier texte ou PDF contenant des faits distinctifs.
2. Ouvrir la configuration d'un assistant de ce projet.
3. Vérifier le compteur de sources autorisées.
4. Cliquer sur « Tout sélectionner », enregistrer.
5. Vérifier que le compteur reflète le nombre de sources du projet.

## B. RAG lexical
1. Démarrer le backend en mode cloud ou mock (sans embeddings Ollama).
2. Envoyer une question reprenant des termes présents dans le document.
3. Vérifier que la réponse utilise le passage du document et affiche « Sources consultées » avec le nom exact.
4. Poser une question sans rapport avec le document.
5. Vérifier que l'assistant ne prétend pas que le document répond à cette question.

## C. RAG sémantique Ollama
1. Installer/démarrer Ollama et télécharger un modèle de génération.
2. Exécuter `ollama pull nomic-embed-text`.
3. Démarrer avec `LLM_MODE=local`.
4. Poser une question formulée avec un synonyme du contenu documentaire.
5. Vérifier que la recherche hybride retourne un passage pertinent et cite le document.
6. Arrêter Ollama ou retirer le modèle d'embeddings ; vérifier le repli lexical.

## D. Cloisonnement
1. Créer deux projets distincts avec des documents différents.
2. Associer au premier assistant uniquement les sources du premier projet.
3. Vérifier qu'aucune source du second projet n'est injectée dans le contexte.
4. Vérifier que la sélection d'un identifiant de source d'un autre projet reste rejetée par l'API de configuration.

## E. Centre fournisseurs
1. Ouvrir `/settings/providers`.
2. Vérifier les états Ollama/OpenAI/Anthropic/Mistral.
3. Vérifier que les modèles Ollama installés sont affichés.
4. Vérifier que les clés API ne sont jamais retournées ni affichées.
5. Actualiser les états et vérifier l'absence d'erreur bloquante si Ollama est arrêté.

## F. Non-régression
- `python -m pytest -q` dans `backend`.
- Vérifier création/modification/suppression de projet et assistant.
- Vérifier historique des conversations.
- Vérifier import individuel et import de dossier du Knowledge Hub.
- Vérifier que les sources ne sont consultées que lorsqu'elles sont explicitement autorisées.


## Résultats automatisés de la livraison
- 21 tests backend réussis.
- Compilation des modules Python réussie.
- Build Next.js non exécuté dans l'environnement de livraison ; effectuer `npm run build` avant un déploiement.
