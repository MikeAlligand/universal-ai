# Universal AI Platform — mise à jour 0.13.0

## Knowledge Hub : consultation documentaire et import de dossiers

### Améliorations de l'interface
- Refonte visuelle de la page Sources dans la continuité de l'identité de l'application : hero Knowledge Hub, indicateurs, cartes d'import et bibliothèque.
- Ouverture d'un document en un clic depuis la bibliothèque.
- Chargement explicite pendant la récupération du contenu, aperçu dans une fenêtre modale, fermeture accessible et contenu avec défilement.
- Recherche dans les noms et chemins relatifs des sources.

### Import de dossiers
- Sélection d'un répertoire depuis le navigateur, y compris ses sous-répertoires.
- Envoi groupé vers `POST /api/v1/projects/{project_id}/sources/upload-folder`.
- Conservation du chemin relatif dans `origin` (ex. `RH/Guides/conges.pdf`).
- Rapport d'import indiquant le nombre de fichiers importés et les fichiers rejetés.
- Limites : 100 fichiers par opération, 5 Mo par fichier, 50 Mo au total.
- Formats pris en charge : TXT, MD, CSV, JSON, XML, HTML, PDF et DOCX.
- Contrôle des chemins pour empêcher les traversées de répertoires.
- Contrôle d'accès projet en écriture avant import.

### Limite fonctionnelle connue
L'import de dossier réalise une copie des fichiers sélectionnés dans la base documentaire. Il ne s'agit pas encore d'une synchronisation permanente avec un dossier local ou réseau. La synchronisation incrémentale et les connecteurs Drive/OneDrive/SharePoint feront l'objet d'une évolution dédiée.

### Fichiers modifiés
- `frontend/app/projects/[id]/sources/page.tsx`
- `frontend/app/globals.css`
- `backend/app/api/v1/routes/sources.py`
- `backend/app/main.py`
- `backend/tests/test_sources.py`
