# Scénario de tests — 0.13.0

## A. Consultation des documents
1. Ouvrir un projet puis Sources.
2. Cliquer une seule fois sur « Ouvrir » pour un TXT ou Markdown.
3. Vérifier l'indicateur de chargement puis l'ouverture de l'aperçu.
4. Vérifier que le texte est lisible, que les retours à la ligne sont conservés et que le contenu long défile.
5. Fermer avec la croix, le bouton Fermer et un clic sur le fond.
6. Répéter avec un PDF et un DOCX déjà importés.

Résultat attendu : un seul clic ouvre le document ; aucun double-clic n'est nécessaire.

## B. Import de dossier
1. Préparer un dossier de test contenant des fichiers TXT, PDF, DOCX et MD, répartis dans au moins deux sous-dossiers.
2. Dans Sources, cliquer sur « Choisir un dossier » et sélectionner ce répertoire.
3. Vérifier le message de résultat et le nombre de fichiers importés.
4. Vérifier dans la bibliothèque que les fichiers apparaissent et que les chemins relatifs des sous-dossiers sont visibles/recherchables.
5. Ouvrir plusieurs documents importés.
6. Ajouter un fichier au format non pris en charge dans un autre dossier de test : l'import des fichiers valides doit réussir et le fichier rejeté doit apparaître dans le rapport d'erreur.

Résultat attendu : import groupé, sous-dossiers conservés, erreurs individuelles signalées.

## C. Limites et sécurité
1. Vérifier le rejet d'un fichier de plus de 5 Mo.
2. Vérifier le rejet d'une sélection de plus de 100 fichiers.
3. Vérifier le rejet d'un import dépassant 50 Mo au total.
4. Vérifier qu'un utilisateur sans droit d'écriture sur le projet ne peut pas importer de dossier.
5. Vérifier qu'un chemin relatif malveillant (`../...`) est rejeté.

## D. Non-régression
1. Vérifier la liste des sources existantes.
2. Importer un fichier seul.
3. Ajouter une URL HTTPS publique.
4. Ouvrir puis supprimer une source de test.
5. Vérifier que les projets et assistants existants restent accessibles.

## Résultats automatisés
Les tests backend couvrent l'import unitaire, l'import de dossier avec chemins relatifs, la gestion d'un fichier rejeté et le rejet d'un chemin traversant. Lancer depuis `backend/` :

```bash
PYTHONPATH=. pytest -q
```
