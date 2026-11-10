# Correctif 0.12.1 — démarrage frontend

Cette mise à jour corrige deux défauts présents dans 0.12.0 :

1. `apiFetch` ajoutait systématiquement l'URL de base, alors que les pages lui transmettaient déjà des URL absolues. Cela produisait `http://localhost:8000http://localhost:8000/...`. Le helper accepte maintenant les URL absolues et les chemins relatifs.
2. Les directives `"use client"` ont été déplacées en première instruction de chaque page client Next.js.

## Installation

Remplacer le dossier frontend par celui de cette archive, ou appliquer les fichiers modifiés. Conserver `frontend/.env.local` s'il existe. Vérifier `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`, arrêter Next.js puis relancer `npm.cmd run dev`.
