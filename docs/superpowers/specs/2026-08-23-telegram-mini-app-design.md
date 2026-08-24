# Telegram Mini App (Storefront Web App) — Design

**Date:** 2026-08-23
**Status:** Design approved, ready for implementation planning

## Goal

Build a public Telegram Mini App that mirrors the existing bot's catalog. Users open it from the bot's menu button, browse categories and products in a mobile web UI, and tap "Замовити" to open the admin's Telegram chat for placing an order.

The Mini App is a nicer visual surface for the same content the bot exposes — no new commerce model, no cart, no payments. Orders still happen out-of-band in the admin's DMs, exactly as today.

## Scope

**In:**
- New public web app served on a dedicated subdomain (`https://app.aromagood.at/`).
- Ukrainian UI. Mobile-first. Loads inside Telegram via `Telegram.WebApp` SDK.
- Mirrors all bot surfaces: welcome/home, categories list, category products grid, product detail, all-products view, sale post, channel link, bot link.
- Two new admin-configurable buttons on the main menu: **Extra** (fully custom) and **Bot** (link back to the bot itself).
- One-time 18+ age gate on first visit (device-scoped).
- Auto-registration of the Mini App URL as the bot's menu button on startup.

**Out:**
- Cart, checkout, payments, inventory.
- Order tracking, user accounts, favourites.
- Retranslating the bot itself into Ukrainian (bot stays Russian; only the Mini App is Ukrainian).
- Any change to how orders reach the admin (still just `t.me/<admin>`).
- Automated tests (matches existing repo convention — no test suite exists in `backend/` or `admin/`).

## Architecture

### High-level

```
Telegram user
    │
    ▼  taps bot's Menu Button
https://app.aromagood.at/  ─────►  Nginx (server)
                                     │
                        subdomain server block, HTTPS via Let's Encrypt
                                     │
                          proxy_pass to container :3012
                                     │
                                     ▼
                             NestJS container
                          ┌──────────────────────┐
                          │ ServeStaticModule    │
                          │   /webapp/*  ← new   │
                          │   /admin/*   (JWT)   │
                          │   /uploads/*         │
                          │ /api/*  (existing)   │
                          │ Telegraf bot         │
                          └──────────────────────┘
                                     │
                                     ▼
                       SQLite (persisted volume)
```

### Repo layout addition

```
webapp/                        # NEW
├── package.json
├── vite.config.ts             # base: '/', proxy /api and /uploads → :3006
├── tsconfig.json
├── index.html                 # loads telegram-web-app.js from Telegram CDN
└── src/
    ├── main.tsx
    ├── App.tsx                # router + AgeGate wrapper
    ├── api/
    │   └── client.ts          # axios, no auth headers (public endpoints)
    ├── telegram/
    │   ├── webApp.ts          # WebApp.ready(), expand(), theme sync, BackButton wiring
    │   └── mock.ts            # DEV-only shim so it runs in a normal browser
    ├── components/
    │   ├── AgeGate.tsx
    │   ├── TileGrid.tsx
    │   ├── ProductCard.tsx
    │   └── OrderButton.tsx    # persistent bottom CTA
    ├── pages/
    │   ├── Home.tsx
    │   ├── Categories.tsx
    │   ├── CategoryProducts.tsx
    │   ├── AllProducts.tsx
    │   ├── ProductDetail.tsx
    │   └── SalePost.tsx
    ├── i18n/uk.ts             # all Ukrainian strings in one file
    └── styles/                # plain CSS, Telegram theme vars
```

### Tech stack

React 18 + Vite + TypeScript (same as `admin/`). React Router for navigation. React Query for data fetching. Plain CSS (no Ant Design — it is desktop-oriented and heavy for a Mini App). `telegram-web-app.js` loaded from `https://telegram.org/js/telegram-web-app.js` in `index.html`.

### Serving & URL

- Vite `base: '/'` (webapp lives at the subdomain root).
- NestJS `ServeStaticModule` serves `backend/public/webapp` at `/webapp/*`.
- Nginx server block for `app.aromagood.at`:
  - `location /`     → `proxy_pass http://localhost:3012/webapp/;`
  - `location /api/` → `proxy_pass http://localhost:3012/api/;`
  - `location /uploads/` → `proxy_pass http://localhost:3012/uploads/;`
- HTTPS via Let's Encrypt (`certbot --nginx`).

## Screens & navigation

| # | Screen | Route | Data source |
|---|---|---|---|
| 1 | AgeGate modal | intercepts app mount | localStorage `age_confirmed` |
| 2 | Home (main menu) | `/` | `welcome-post`, `buttons`, `extra-button` |
| 3 | Categories | `/categories` | `GET /api/categories` (enabled, excluding `CATALOG`) |
| 4 | Category products | `/categories/:id` | `GET /api/products` filtered by category |
| 5 | All products | `/products` | `GET /api/products` (all enabled) |
| 6 | Product detail | `/products/:id` | `GET /api/products/:id` |
| 7 | Sale post | `/sale` | `GET /api/sale-post` |

**Home tile grid (order):** Каталог, Всі фото, Акції, Канал, Бот, Extra (only if enabled and url non-empty). Persistent **Замовити** CTA fixed at the bottom of the viewport, using the URL from `order-button`.

**Navigation controls:**
- `Telegram.WebApp.BackButton.show()` on every non-home screen; wired to `navigate(-1)`. Hidden on Home.
- External links (Channel, Bot, Extra, Замовити) open via `Telegram.WebApp.openTelegramLink()` for `t.me/*` URLs, else `openLink()`.

## Age gate

- On first mount, read `localStorage.age_confirmed`. If missing, render a full-screen modal blocking the app.
- Modal text (Ukrainian): "Вам є 18 років?" · buttons "Так" / "Ні".
- **Так** → `localStorage.age_confirmed = '1'`, dismiss modal, render app.
- **Ні** → replace with a permanent blocking screen: "Вибачте, доступ дозволено лише з 18 років." No back button, no close button, no way forward.
- Device-scoped only (no backend flag). Users switching devices see the gate again — accepted trade-off.

## Telegram initData handling

- On app mount, if `Telegram.WebApp.initDataUnsafe.user` is present, POST it to a new endpoint `POST /api/webapp/session` with the raw `initData` string.
- Backend parses `initData` and **upserts** into the existing `users` table using the Telegram user id as the natural key. Stores: `telegram_id`, `first_name`, `username`, plus the raw `hash` from initData for reference.
- **HMAC signature is NOT validated.** Trade-off accepted: values are informational only; no privileged action is performed with them. Orders go via external `t.me` link — no server-side capability is granted based on the user's identity.
- Endpoint is idempotent; returns 200 with an empty body. Failures are logged but do not block the UI (fire-and-forget from the client).

## Backend changes

1. **Add columns to `MainMenuButton` entity** (`backend/src/database/entities/main-menu-button.entity.ts`):
   - `bot_text: string` (default `""`)
   - `bot_url: string` (default `""`)
   - `bot_is_enabled: boolean` (default `false`)
   TypeORM `synchronize: true` will apply the columns automatically on next boot.

2. **New entity + module `ExtraButton`** (single-row, mirrors the existing button entities):
   - Fields: `id`, `text`, `url`, `is_enabled`.
   - `backend/src/modules/extra-button/` with `extra-button.entity.ts`, `extra-button.controller.ts`, `extra-button.service.ts`, `extra-button.module.ts`.
   - Routes: `GET /api/extra-button` (public), `PATCH /api/extra-button` (JwtAuthGuard).
   - Seed a disabled empty row on first boot (via `seeder.service.ts`).

3. **Update `ButtonsService`/DTOs** to include the three new `bot_*` fields in the main-menu-button update DTO and the `GET /api/buttons` response.

4. **New endpoint `POST /api/webapp/session`** in a new module `backend/src/modules/webapp/`:
   - Accepts `{ initData: string }` in body.
   - Parses initData query-string, extracts `user` JSON, upserts into `users`.
   - No auth guard. Rate-limit is out of scope for v1.

5. **CORS**: add `https://app.aromagood.at` to the allow-list in `backend/src/main.ts`.

6. **Menu-button auto-registration** on bot startup:
   - Read `WEBAPP_URL` from `.env`. If set, call `bot.telegram.setChatMenuButton({ menu_button: { type: 'web_app', text: 'Відкрити каталог', web_app: { url: WEBAPP_URL } } })` once at boot.
   - If `WEBAPP_URL` is empty or unset, skip silently. Manual BotFather config still works.

## Admin panel changes

1. **`admin/src/pages/MainMenuButton.tsx`** — extend the existing page with a new "Bot button" section (text / url / enabled toggle).
2. **`admin/src/pages/ExtraButton.tsx`** — new page, single form (text / url / enabled toggle), following the pattern of the existing button pages.
3. **`admin/src/components/Layout.tsx`** — new sidebar entry "Extra button".
4. **`admin/src/api/client.ts`** — new methods: `getExtraButton`, `updateExtraButton`; extend main-menu-button methods to carry the `bot_*` fields.

## Deployment

### Docker

- **`Dockerfile`**: add a `webapp` build stage: `npm ci` in `/webapp`, `npm run build`, copy `webapp/dist/` into `backend/public/webapp/` in the final stage.
- **`docker-compose.yml`**: add `WEBAPP_URL` to the env passthrough (via `backend/.env`). No new services, no new volumes.

### Manual prerequisites (documented, executed by human)

1. Purchase `aromagood.at` domain.
2. Create DNS `A` record: `app.aromagood.at` → server IP.
3. On server: create Nginx server block for `app.aromagood.at` (config snippet included in `DEPLOY.md`), issue Let's Encrypt cert via `certbot --nginx -d app.aromagood.at`.
4. Set `WEBAPP_URL=https://app.aromagood.at` in `backend/.env`.
5. `make deploy` — rebuilds container with the webapp bundle, restarts.
6. Verify the bot's menu button appears and opens the Mini App.

## Local development

- `cd webapp && npm run dev` → Vite dev server on port **5174**, proxying `/api/*` and `/uploads/*` to `http://localhost:3006`.
- `webapp/src/telegram/mock.ts` provides a no-op `Telegram.WebApp` shim (initData stub, default theme, `BackButton.show/hide` as no-ops) when `import.meta.env.DEV` and the real SDK is absent. Lets you iterate in a normal desktop browser.
- Testing the real integration: `ngrok http 5174`, register the ngrok URL as a test bot's menu button in BotFather.

## Manual QA checklist

- [ ] Fresh device: age gate appears, "Так" dismisses it, app opens. Refresh → app opens directly.
- [ ] "Ні" → blocking screen. Refresh → still blocked.
- [ ] Home renders welcome text, all enabled tiles, Extra tile hidden when disabled or url empty, Bot tile hidden when disabled or url empty.
- [ ] Categories list matches bot's (respects `is_enabled`, excludes `CATALOG`).
- [ ] Category products grid displays 2 columns, images load from `/uploads/`.
- [ ] Product detail renders image, title, description. "Замовити" opens `t.me/<admin>` via `openTelegramLink`.
- [ ] All-products view lists every enabled product.
- [ ] Sale post renders image + text; "Замовити" CTA opens admin chat.
- [ ] Channel / Bot / Extra tiles open the configured URLs.
- [ ] BackButton visible and functional on every non-home screen; hidden on Home.
- [ ] All UI text is Ukrainian; bot's Russian text is unchanged when using the bot directly.
- [ ] Nginx: `https://app.aromagood.at/` loads the app, `/api/categories` returns JSON, `/uploads/foo.jpg` serves.
- [ ] `POST /api/webapp/session` upserts a user row (verify via `docker exec … node scripts/admin-cli.js` or a DB inspection).
- [ ] Admin panel: Bot-button fields save and read back; Extra-button page saves and toggles.

## Open questions / follow-ups (post-v1)

- Server-side age gate (per-Telegram-user), if device-scoped becomes a UX pain.
- HMAC validation on initData, if any privileged endpoint is ever added.
- Analytics dashboard: "how many users opened the Mini App this week".
- Ukrainian translation of the bot itself.
