# Universal AI Platform — version 0.6.0

## Nouveautés

- Refonte visuelle globale des écrans de projets, de détail projet et de configuration des assistants : palette cohérente, navigation sombre, surfaces claires, formulaires et cartes harmonisés.
- Ajout de deux modes de configuration d'assistant :
  - **Par défaut** : instructions et paramètres recommandés pour démarrer rapidement.
  - **Personnalisé** : instructions système, fournisseur, modèle et température réglables.
- Nouvelle page de réglages dédiée à chaque assistant, accessible depuis le bouton de configuration dans son espace de chat.
- Conservation des fonctionnalités existantes : projets, CRUD des assistants, conversations, historique et mode de démonstration.
- Ajout de la migration Alembic `0004_assistant_configuration_mode`.

## Mise à jour locale

Depuis le dossier `backend` (après activation de l'environnement virtuel) :

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Depuis le dossier `frontend` :

```powershell
npm.cmd install
npm.cmd run dev
```

## Important

- Les choix fournisseur/modèle sont enregistrés, mais le branchement des clés API et le routage réel vers les fournisseurs restent à finaliser.
- Le mode par défaut utilise le mode de démonstration actuellement configuré côté backend ; ce n'est pas un modèle génératif réel.
- Les modules Sources de connaissance, publication/embedding du chatbot, authentification multi-utilisateur, facturation et déploiement production ne sont pas encore finalisés.
- La compilation backend Python a été vérifiée. Le build Next.js n'a pas pu être exécuté ici, car l'installation des dépendances frontend a dépassé le délai disponible.
