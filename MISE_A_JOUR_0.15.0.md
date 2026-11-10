# Universal AI Platform 0.15.0 — RAG hybride & centre fournisseurs IA

## Objectifs
Cette mise à jour relie le Knowledge Hub au chat des assistants et ajoute un écran de supervision des fournisseurs IA.

## RAG documentaire
- Recherche limitée aux sources explicitement autorisées dans `source_ids` pour l'assistant et au projet auquel il appartient.
- Découpage du contenu extrait en passages de taille bornée avec chevauchement.
- Recherche lexicale avec normalisation des accents et pondération de couverture des termes.
- Recherche sémantique Ollama via `/api/embed` si `LLM_MODE=local` et si le modèle d'embeddings est installé.
- Combinaison des scores lexicaux et sémantiques ; repli lexical automatique si le modèle d'embeddings n'est pas disponible.
- Cache mémoire des vecteurs indexés par identifiant de source, empreinte du contenu et modèle.
- Les réponses citent les noms exacts des documents consultés. Les documents sont traités comme des données non fiables, jamais comme des instructions.
- Si aucune source n'est autorisée ou si aucun passage pertinent n'est trouvé, le système l'indique au modèle au lieu de prétendre avoir lu les documents.

## Activer les embeddings locaux
Dans le terminal :
```bash
ollama pull nomic-embed-text
```
Le modèle de génération (par exemple `qwen2.5:3b`) reste distinct du modèle d'embeddings. Le paramètre est configurable avec `OLLAMA_EMBEDDING_MODEL` (défaut : `nomic-embed-text`). Si ce modèle n'est pas installé, le RAG utilise automatiquement la recherche lexicale.

## Centre des fournisseurs
- Nouvelle page `/settings/providers`.
- État de connexion Ollama, modèles installés et état du modèle d'embeddings.
- État de configuration des clés OpenAI, Anthropic et Mistral sans exposer les secrets.
- Instructions pour configurer les clés uniquement dans `backend/.env`.
- Actualisation manuelle des états.

## Configuration des sources
- Bouton Tout sélectionner / Tout désélectionner dans la configuration d'un assistant.
- Compteur de sources autorisées.
- Avertissement dans le chat si aucune source n'est autorisée.
- Les sources ne sont jamais activées implicitement : le périmètre reste explicite et limité au projet.

## Fichiers de configuration
Ajouter au `backend/.env` si nécessaire :
```env
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

## Validation technique
- Suite backend : 21 tests réussis dans l’environnement de développement de cette livraison.
- Compilation Python (`compileall`) réussie.
- Le build Next.js complet n’a pas été exécuté dans cet environnement ; il reste à valider sur la machine de développement.

## Limites
- Le cache d'embeddings est en mémoire du processus ; il se reconstruit après redémarrage.
- Le modèle `nomic-embed-text` doit être téléchargé séparément.
- La recherche lexicale de secours est moins performante pour les synonymes et les formulations très éloignées du document.
- Les clés cloud restent configurées côté backend ; cette page ne permet pas de les saisir ni de les stocker.
