# Local development guide

## Windows + VS Code
1. Install Docker Desktop and ensure the WSL2 backend is enabled.
2. Extract the project.
3. Open the repository root in VS Code.
4. Create a local `.env` file (never commit it) and set strong values for `POSTGRES_PASSWORD`, `MINIO_ROOT_USER`, and `MINIO_ROOT_PASSWORD`. Set `DATABASE_URL` to use the same PostgreSQL username and password.
5. Run `docker compose up --build` in the integrated terminal.
6. Visit http://localhost:3000.

## macOS/Linux
Create the local `.env` file with those values, then run `docker compose up --build`.

## First smoke test
- Open http://localhost:8000/health. Expect `{"status":"ok","environment":"local"}`.
- Open http://localhost:8000/docs.
- Open http://localhost:3000.
- Create a project from the dashboard.

## Troubleshooting
### Port already in use
Change the host port in `.env` (for example `FRONTEND_PORT=3001`) and restart Compose. Note that the frontend API URL remains `http://localhost:8000` unless you also change `BACKEND_PORT` and `NEXT_PUBLIC_API_BASE_URL` in the Compose configuration.

### Frontend cannot reach backend
The browser calls the backend through `http://localhost:8000`; the backend CORS allowlist includes `http://localhost:3000`. If you change ports, update both.

### Database extension
The Postgres image includes pgvector. The init script enables the extension on first database creation. If the database volume already existed before adding the init script, run `CREATE EXTENSION IF NOT EXISTS vector;` manually or recreate the development volume (which deletes local data).

### Docker build is slow
The first build downloads Python and Node dependencies. Later builds use cached layers.

## Data reset
`docker compose down -v` deletes all local persisted data. Use only when you intentionally want a clean environment.


## Base SQLite et migrations (0.12.3)

En environnement local (`APP_ENV=local`, valeur par défaut), le démarrage de FastAPI applique automatiquement les migrations Alembic jusqu'à `head`. Cela crée notamment la table `users` avant que `/api/v1/auth/setup-status` soit appelée. Les migrations déjà appliquées ne sont pas rejouées.

Pour les environnements de production, conserver l'exécution des migrations comme étape explicite du déploiement : `alembic upgrade head` depuis le dossier `backend`.
