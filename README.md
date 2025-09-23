# Casapp

Real estate asset management app (monorepo: Django backend + Next.js frontend). Built with TDD and 100% coverage gates in CI.

## Features
- User authentication (JWT)
- Manage assets (CRUD, per-user isolation)
- File uploads per asset (bills, certifications, documents)
- Market values over time
- Tenants and rental contracts (track occupancy)
- Asset performance (annual rent / latest market value)
- Admin overview (totals and occupancy rate)

## Stack
- Backend: Django + DRF + SimpleJWT, Postgres
- Frontend: Next.js (TypeScript)
- CI: GitHub Actions with coverage 100% thresholds

## Local Development

Backend:
```bash
cd backend
poetry install
poetry run python manage.py migrate
make run
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Testing

Backend:
```bash
cd backend
poetry run pytest
```

Frontend:
```bash
cd frontend
npm test
```

## Deployment
- Backend runs on `0.0.0.0:8003` and expects to be mounted by Caddy under `/casapp`.
  - Set env `DJANGO_USE_FORCE_SCRIPT_NAME=true` and `DJANGO_FORCE_SCRIPT_NAME=/casapp`.
  - Set `DATABASE_URL` to your Postgres connection string.
  - Collect static and configure media storage as needed.
- Frontend `basePath` is `/casapp`.
- Public URL: `https://apps.francescovigni.com/casapp/`.

### Caddy
Use `deploy/Caddyfile.example` as a starting point. It proxies `/casapp/api` to Django (`localhost:8003`) and the rest to Next.js (`localhost:3000`).