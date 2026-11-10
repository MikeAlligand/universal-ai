# Universal AI Platform — 0.16.0

## Refonte visuelle premium

Cette version reprend la base fonctionnelle 0.15.0 et applique une nouvelle identité visuelle sombre à l'ensemble du frontend :
- palette navy profonde, surfaces glass, bordures translucides et accents bleus/cyan ;
- navigation latérale et panneaux de travail harmonisés ;
- cartes projets, assistants et fournisseurs retravaillées ;
- espace de chat, historique, suggestions et composeur adaptés au thème ;
- formulaires, états, alertes, fenêtres de prévisualisation et composants Knowledge Hub harmonisés ;
- responsive conservé avec adaptation mobile.

## Fonctionnel préservé

Aucune route API ni logique métier backend n'a été volontairement modifiée dans cette version. Le RAG et le tableau de bord fournisseurs de la 0.15.0 sont conservés.

## Installation

Cette archive est une version complète. Extraire son contenu dans un nouveau dossier, puis suivre `README.md`. Pour remplacer une installation existante, sauvegarder d'abord `.env`, la base SQLite et les éventuels fichiers locaux, puis copier le projet et restaurer les données/configurations.

## Vérifications

- `python -m pytest -q --disable-warnings` : 21 tests passés.
- `python -m compileall -q app tests` : OK.
- Compilation Next.js / TypeScript : non exécutée dans cet environnement, car les dépendances frontend n'étaient pas installées. À vérifier localement avec `npm ci` puis `npm run build`.
