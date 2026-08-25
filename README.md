# Siga Bot

Telegram bot shop system with NestJS backend and React admin panel.

## Stack
- **Backend**: NestJS + TypeORM + SQLite
- **Telegram Bot**: nestjs-telegraf (Telegraf v4)
- **Admin Panel**: React (Vite) + Ant Design

## Default credentials
- Admin login: `admin` / `admin` — **change this in production**

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set BOT_TOKEN to your Telegram bot token
npm run start:dev
```

Backend runs on `http://localhost:3006`

### Admin Panel

```bash
cd admin
npm install
npm run dev
```

Admin panel runs on `http://localhost:5173`

## Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| `BOT_TOKEN` | Telegram bot token from @BotFather |
| `JWT_SECRET` | Secret key for JWT signing |
| `PORT` | Backend port (default: 3006) |
| `ADMIN_PANEL_ORIGIN` | Admin panel origin for CORS |

## API Routes

All API routes are prefixed with `/api`:

- `POST /api/auth/login` — admin login
- `GET/POST/PATCH/DELETE /api/products` — product management
- `GET/POST/PATCH/DELETE /api/categories` — category management
- `GET/PATCH /api/welcome-post` — welcome post
- `GET/PATCH /api/sale-post` — sale post
- `GET/PATCH /api/buttons/*` — button config
- `GET /api/users` — user list
- `POST /api/mailout/send` — send mailout

## Admin management (production / Docker)

Container name: `podhub`. Run inside the container via `docker exec`:

```bash
docker exec podhub node scripts/admin-cli.js list
docker exec podhub node scripts/admin-cli.js create <name> <password>
docker exec podhub node scripts/admin-cli.js update-password <name> <new-password>
docker exec podhub node scripts/admin-cli.js delete <name>
docker exec podhub node scripts/admin-cli.js reset-file-ids
```

Example — replace the default `admin` account:

```bash
docker exec podhub node scripts/admin-cli.js create owner 'strong-password'
docker exec podhub node scripts/admin-cli.js delete admin
docker exec podhub node scripts/admin-cli.js list
```

## Bot Navigation

- `/start` → Welcome post with main menu
- Catalog → Browse all categories
- Category → Browse products in 2-column grid
- Product → Full product view with order button
- Sale post → Sale post with order button
