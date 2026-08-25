# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (NestJS — from `backend/`)
```bash
npm run start:dev     # watch mode, port 3012
npm run build
npm run start         # run compiled dist/
npm run admin -- list
npm run admin -- create <name> <password>
npm run admin -- update-password <name> <pw>
npm run admin -- delete <name>
```

### Admin panel (React/Vite — from `admin/`)
```bash
npm run dev           # port 5173, proxies /api and /uploads → localhost:3012
npm run build         # outputs to dist/ (Docker copies to backend/public-admin/)
```

### Webapp (React/Vite — from `webapp/`)
```bash
npm run dev           # port 5174, proxies /api and /uploads → localhost:3012
npm run build         # outputs to dist/ (Docker copies to backend/public-webapp/)
```

### Docker (from repo root)
```bash
DOCKER_BUILDKIT=0 docker compose build   # sequential build (avoids OOM on low-RAM servers)
docker compose up -d
docker compose logs -f
# Makefile shortcuts:
make deploy           # build then up -d (DOCKER_BUILDKIT=0 already set)
make logs
make shell            # exec into aromagood container
```

### Admin CLI inside container
```bash
docker exec aromagood node scripts/admin-cli.js list
docker exec aromagood node scripts/admin-cli.js create <name> <password>
docker exec aromagood node scripts/admin-cli.js update-password <name> <pw>
docker exec aromagood node scripts/admin-cli.js delete <name>
docker exec aromagood node scripts/admin-cli.js reset-file-ids   # clear Telegram file_id cache
```

## Architecture

Three independent Vite/React apps served by one NestJS backend on **port 3012**:

```
backend/        NestJS API + Telegraf bot
  public-webapp/ → served at /             (Telegram Mini App)
  public-admin/  → served at /uds2_badmin  (JWT-gated admin panel)
  uploads/       → served at /uploads
admin/          React 18 + Ant Design (admin panel)
webapp/         React 18 (Telegram Mini App, public — no auth)
```

`ServeStaticModule` in `app.module.ts` handles all three paths; nginx only does SSL termination and proxies everything to port 3012.

### Modules

| Module | Purpose |
|--------|---------|
| `auth` | JWT login (7-day token), bcrypt |
| `bot` | Telegraf integration; 4 `@Update()` handlers |
| `users` | Upsert on /start; mark inactive on Telegram 403 |
| `categories` | CRUD; `CategoryType` enum guards built-in types |
| `products` | CRUD + enable/disable + category assignment |
| `welcome-post` | Bot /start message (singleton id=1) |
| `app-welcome-post` | Webapp home screen content (singleton id=1) |
| `sale-post` | Telegram sale announcement (singleton id=1) |
| `buttons` | 4 button configs + `BotSettings` (order, admin, channel, main-menu) |
| `app-button` | Reply-keyboard web_app button shown persistently in Telegram chat |
| `extra-button` | Optional extra URL button (singleton id=1) |
| `webapp` | Single endpoint: `POST /api/webapp/session` (records Mini App opens) |
| `mailout` | Scheduled bulk-send `@Cron('*/3 * * * *')`, 1000/batch at 20 msg/s |
| `backup` | Scheduled SQLite DB backups |

### Bot modes

`BotSettings.mode` (stored in DB, editable via admin panel Buttons page):

- **`catalog`** (default): full keyboard — catalog, sale post, channel, order+admin row
- **`mini_app`**: minimal keyboard — only Mini App button + Admin button

This mode is checked in `MainMenuUpdate.renderMainMenu()` and `MailoutSenderService.buildKeyboard()`. When mode is `mini_app`, both use the same two-button layout, bypassing all post-type logic.

The `app-button` is separate: it sets a persistent Telegram **reply keyboard** (web_app type) that appears below the text input, regardless of bot mode.

### Key patterns

**Singleton entities**: `welcome-post`, `app-welcome-post`, `sale-post`, `app-button`, `extra-button`, `buttons/*`, `bot-settings` — all use `findOne({ where: { id: 1 } })`. Services always update the single row.

**TypeORM `synchronize: true`**: adding a column to an entity is enough; no migrations needed.

**Image caching**: every entity with an image stores `telegram_file_id`. On first send the bot uploads the file and caches the returned ID; subsequent sends use the cached ID. Set `telegram_file_id = null` when the image is replaced.

**`bot.helpers.ts`**: all button builder functions (`buildOrderButtonRow`, `buildAdminButtonInline`, `buildChannelButtonInline`, `buildMiniAppButton`, etc.) and `sendOrEditWithMedia()` live here, shared between all `@Update()` handlers and `MailoutSenderService`. When the main menu keyboard changes, also update the mailout keyboard.

**Admin panel base path**: `VITE_BASE_PATH` env var (set to `/uds2_badmin` in Docker build args) controls both Vite `base` and React Router `basename`.

### Adding a new singleton feature

Seven places to touch (see parent `www/CLAUDE.md` for the full pattern).
