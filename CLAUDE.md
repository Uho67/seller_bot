# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Siga Bot** is a Telegram bot e-commerce platform. Users browse and order products through Telegram; managers control everything via a React admin panel. The backend serves both the REST API and the compiled admin panel from a single container.

## Commands

### Backend (NestJS)
```bash
cd backend
npm run start:dev     # Development with hot reload
npm run build         # Compile TypeScript → dist/
npm run start         # Run compiled build
npm run admin -- list                              # List admin accounts
npm run admin -- create <name> <password>          # Create admin
npm run admin -- update-password <name> <password> # Change password
npm run admin -- delete <name>                     # Delete admin
```

### Admin Panel (React/Vite)
```bash
cd admin
npm run dev      # Dev server at http://localhost:5173
npm run build    # Production bundle
```

### Docker (primary deployment method)
```bash
make first-deploy  # Initial deploy
make deploy        # Redeploy after git pull
make shell         # Shell into backend container (pachka)
make logs          # Follow container logs

# Direct docker commands
docker compose up -d --build
docker exec smoke node scripts/admin-cli.js list
```

## Architecture

### Single-container production model
The Dockerfile has three stages: (1) builds the React admin panel, (2) compiles the NestJS backend, (3) creates a lean runtime image. The NestJS app serves both the API at `/pachka/api/` and the static admin panel at `/pachka/` via an Express static middleware pointed at `public/`.

### Backend module structure (`backend/src/modules/`)
Each feature follows the NestJS module pattern (module → controller → service → dto). Key modules:
- **auth** — JWT login for admin panel; `jwt-auth.guard.ts` protects all admin endpoints
- **bot** — Telegram bot logic split into `updates/` (handlers per bot screen: main-menu, catalog, sale-post, product)
- **mailout** — Three services: `mailout.service.ts` (orchestrator), `mailout-sender.service.ts` (Telegram dispatch), `mailout-post.service.ts` (post formatting)
- **backup** — Scheduled SQLite backups via `@nestjs/schedule`

### Database
SQLite via TypeORM with `synchronize: true` (schema auto-syncs on startup). All entities live in `backend/src/database/entities/`. No migrations — schema changes apply automatically.

### Frontend (`admin/src/`)
- `api/client.ts` — Axios instance; all domain API modules import from here
- `store/auth.ts` — Auth state (JWT token)
- `pages/` — One page component per admin section
- Vite dev server proxies `/api` and `/uploads` to the backend

## Environment Variables

**Backend (`backend/.env`):**
```
BOT_TOKEN=      # Telegram bot token from @BotFather
JWT_SECRET=     # Random secret for JWT signing
PORT=3009
ADMIN_PANEL_ORIGIN=  # CORS allowed origin for admin panel
```

**Admin (`admin/.env`):**
```
VITE_API_URL=        # Backend URL (empty = same origin in prod)
VITE_BASE_PATH=/pachka
```

## Key Conventions

- TypeORM entities use `synchronize: true` — never add a column with a NOT NULL constraint and no default without handling existing rows first.
- The bot's category system has special built-in slugs: `catalog`, `all_products`, `king_size`, `slims`, `demy`, `bf`. Avoid deleting or renaming these.
- Image uploads go to `backend/uploads/` and are served at `/uploads/*`. In Docker, this directory is a named volume so images survive container rebuilds.
- The seeder (`database/seeds/seeder.service.ts`) runs on startup and creates default buttons and categories if they don't exist.
