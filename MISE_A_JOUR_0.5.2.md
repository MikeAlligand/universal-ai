# Universal AI Platform — mise à jour 0.5.2

## Objectif
Fiabiliser le mode démonstration afin de poursuivre les tests fonctionnels sans clé API ni appel réseau vers un fournisseur IA.

## Modifications
- Réponses de démonstration différenciées selon le type de message (salutation, demande d’explication, demande de synthèse, message général).
- Prise en compte du dernier message utilisateur précédent pour restituer un élément de contexte dans les réponses de suivi.
- Aucun appel HTTP externe n’est effectué lorsque `LLM_MODE=mock`.
- Version de l’API et libellé de build mis à jour en 0.5.2.

## Limites explicites
Le mode démonstration n’est pas un modèle génératif : il simule quelques comportements pour tester l’interface, l’enregistrement et la navigation des conversations. Il ne faut pas considérer ses réponses comme une analyse réelle du contenu.

## Vérification
Tests backend : `5 passed`.
