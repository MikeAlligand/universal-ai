# Universal AI Platform 0.14.0 — Espace assistants & IA locale réelle

## Changements
- Nouvelle page `/assistants` : bibliothèque globale des assistants de tous les projets accessibles à l'utilisateur.
- Les liens de navigation « Assistants IA » ouvrent désormais cette page au lieu de renvoyer vers `/projects`.
- Configuration du fournisseur et du modèle accessible même en mode de configuration simplifié.
- Ollama est proposé par défaut pour les nouveaux assistants : `qwen2.5:3b`.
- L'endpoint `/system/providers` vérifie la disponibilité d'Ollama et expose les noms de modèles installés, sans secret.
- Le chat distingue les modes `mock`, `local` et `cloud`.
- OpenAI, Anthropic et Mistral restent sélectionnables.

## Activer l'IA locale réelle (gratuitement)
1. Installer Ollama pour macOS : https://ollama.com/download/mac
2. Démarrer Ollama puis télécharger un modèle : `ollama pull qwen2.5:3b`
3. Démarrer le backend avec `LLM_MODE=local python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`
4. Créer un assistant (ou modifier un existant) avec fournisseur `Ollama (local, gratuit)` et modèle `qwen2.5:3b`.
5. Ouvrir sa conversation et poser une question : la réponse est générée par le modèle local, pas par le mode démo.

Aucune clé API ni facturation par requête n'est nécessaire pour Ollama local. Le coût matériel/électricité et le téléchargement initial du modèle restent à la charge de l'exploitant.

## Fournisseurs cloud
OpenAI, Anthropic et Mistral restent disponibles avec les clés API du client. Gemini peut être ajouté comme fournisseur séparé après validation de ses conditions. Le niveau gratuit Gemini indique que les données peuvent être utilisées pour améliorer les produits Google ; ne pas l'utiliser avec des données clients confidentielles sans revue contractuelle et sécurité.

## Limites connues
- Ollama doit être installé et démarré sur la machine où tourne le backend. En hébergement distant, `localhost` désigne le serveur, pas le navigateur du client.
- Les limites de contexte et les performances dépendent du modèle et du matériel.
- Les clés des fournisseurs cloud ne sont pas encore gérées depuis une interface sécurisée d'administration ; elles restent côté backend.
