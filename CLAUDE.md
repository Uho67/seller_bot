# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (NestJS — from `backend/`)
```bash
npm run start:dev     # Dev server with file watch (port 3006)
npm run build         # Compile TypeScript to dist/
npm run start         # Run compiled production build
npm run admin -- list                         # List admin users
npm run admin -- create <name> <password>     # Create admin user
npm run admin -- update-password <name> <pw>  # Update password
npm run admin -- delete <name>                # Delete admin user
```

### Admin Panel (React/Vite — from `admin/`)
```bash
npm run dev           # Dev server (port 5173, proxies /flow/api → localhost:3006)
npm run build         # tsc + vite build (output to dist/)
```

### Docker (from repo root)
```bash
docker compose up -d --build   # Build and start everything
docker compose logs -f         # Stream logs
docker exec steam_bot sh        # Shell into container
# Or use the Makefile shortcuts: make deploy, make logs, make shell
```

### Admin CLI inside container (production)
```bash
docker exec steam_bot node scripts/admin-cli.js list
docker exec steam_bot node scripts/admin-cli.js create <name> <password>
docker exec steam_bot node scripts/admin-cli.js update-password <name> <pw>
docker exec steam_bot node scripts/admin-cli.js delete <name>
docker exec steam_bot node scripts/admin-cli.js reset-file-ids   # Clear cached Telegram file IDs
```

## Architecture

### Monorepo layout
- `backend/` — NestJS API + Telegram bot, serves static files in production
- `admin/` — React + Vite admin panel, built output copied into `backend/public/` in Docker
- `backend/data/database.sqlite` — SQLite DB (persisted via Docker volume)
- `backend/uploads/` — User-uploaded images (persisted via Docker volume)

### Backend structure
```
backend/src/
├── app.module.ts           # Root module, TypeORM config, ServeStaticModule
├── main.ts                 # Global prefix /api, CORS, ValidationPipe, port 3006
├── modules/
│   ├── auth/               # JWT login, bcrypt, Passport strategy
│   ├── products/           # Product CRUD + enable/disable + category assignment
│   ├── categories/         # Category CRUD; built-in types protected from deletion
│   ├── welcome-post/       # Single-row entity for /start Telegram message
│   ├── sale-post/          # Single-row entity for sale announcement
│   ├── buttons/            # 4 button configs: order, admin, channel, main-menu
│   ├── users/              # Telegram users: upsert on /start, mark inactive on 403
│   ├── mailout/            # Scheduled bulk-send to all active users
│   ├── bot/                # Telegraf integration (see below)
│   └── backup/             # Scheduled DB backups
└── database/
    ├── entities/           # 11 TypeORM entities (all use synchronize — no migrations)
    └── seeds/seeder.service.ts  # Creates 6 default categories on first boot
```

**TypeORM**: `synchronize: true` — adding a column to an entity auto-applies to the DB on next start. No migration files exist or are needed.

### Bot module
Four `@Update()` classes handle all Telegram interactions via `nestjs-telegraf`:

| Handler | Triggers | Purpose |
|---|---|---|
| `MainMenuUpdate` | `@Start()`, `@Action('main_menu')` | Welcome post + main menu keyboard |
| `CatalogUpdate` | `@Action('catalog')`, `@Action(/^category_(\d+)$/)`, `@Action('all_products')` | Catalog nav, product grid by category |
| `SalePostUpdate` | `@Action('sale_post')` | Sale post display |
| `ProductUpdate` | `@Action(/^product_(\d+)/)` | Product detail view |

`bot.helpers.ts` contains shared utilities: `sendOrEditWithMedia()` (edit vs. send new message), `buildProductGrid()` (2-column layout), button builders, and `getImagePath()`. The bot caches Telegram `file_id` after first upload to avoid re-sending image bytes on subsequent sends.

### Category types
`CategoryType` enum has 7 values. Three rules govern them:
- `CATALOG` and `ALL_PRODUCTS`: cannot be deleted (only toggled via `is_enabled`); `CATALOG` is the catalog "home" screen, `ALL_PRODUCTS` controls the "Все фото" button
- `KING_SIZE`, `SLIMS`, `DEMY`, `BF`, `CUSTOM`: can be deleted; only `CUSTOM` types can be created via the admin panel
- `findAllExceptCatalog()` filters `is_enabled = true` — disabling a category hides it from the bot keyboard

### Admin panel
React 18 + Ant Design + React Query. All API calls go through `admin/src/api/client.ts` (axios instance), which adds `Authorization: Bearer` from localStorage and redirects to `/login` on 401.

**Base path system**: `VITE_BASE_PATH` env var controls both the Vite `base` and the React Router `basename`. In dev, Vite proxies `${BASE}/api/*` → `localhost:3006/api/*`. In production, Nginx rewrites `/flow/` → `/` before proxying to the container.

### Authentication
Admin-only via JWT. `POST /api/auth/login` returns a 7-day token stored in localStorage. All mutating category/product/etc. routes are guarded with `JwtAuthGuard`.

### Image uploads
Multer saves to `backend/uploads/`. The filename is stored in the entity's `image` column. On update or delete, the old file is deleted from disk. `telegram_file_id` is stored per entity so the bot can resend without re-uploading.
