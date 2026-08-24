# Telegram Mini App — Implementation Plan

**Spec:** [2026-08-23-telegram-mini-app-design.md](./2026-08-23-telegram-mini-app-design.md)
**Approach:** ship in vertical slices that each leave the app in a runnable state. Backend + admin changes land first (small, decoupled), then the webapp is built screen by screen, then Docker + Nginx wire-up.

Each step lists **files touched**, **what to do**, and **manual verification** so you can stop and check between steps.

---

## Step 1 — Backend: `MainMenuButton` gains bot fields

**Files**
- `backend/src/database/entities/main-menu-button.entity.ts`
- `backend/src/modules/buttons/dto/update-main-menu-button.dto.ts`
- `backend/src/modules/buttons/buttons.service.ts` (if it constructs response shape)

**Do**
- Add columns `bot_text: string` (default `""`), `bot_url: string` (default `""`), `bot_is_enabled: boolean` (default `false`) to the entity.
- Extend the update DTO with the three optional fields (`class-validator`: `@IsOptional() @IsString()` / `@IsBoolean()`).
- No service logic change: existing update method spreads the DTO onto the row.

**Verify**
- `npm run start:dev` — TypeORM `synchronize` adds columns without error.
- `curl http://localhost:3006/api/buttons/main-menu` returns the three new fields.
- `curl -X PATCH -H "Authorization: Bearer <token>" -d '{"bot_text":"Бот","bot_url":"https://t.me/x","bot_is_enabled":true}' -H "Content-Type: application/json" http://localhost:3006/api/buttons/main-menu` — refetch shows the values.

---

## Step 2 — Backend: new `ExtraButton` module

**Files (new)**
- `backend/src/database/entities/extra-button.entity.ts`
- `backend/src/modules/extra-button/extra-button.module.ts`
- `backend/src/modules/extra-button/extra-button.controller.ts`
- `backend/src/modules/extra-button/extra-button.service.ts`
- `backend/src/modules/extra-button/dto/update-extra-button.dto.ts`

**Files touched**
- `backend/src/app.module.ts` — register `ExtraButtonModule`.
- `backend/src/database/seeds/seeder.service.ts` — insert a disabled empty row on first boot.

**Do**
- Copy the shape of `main-menu-button` module: entity with `id`, `text`, `url`, `is_enabled`; service with `get()` and `update(dto)` (find first row, update, save); controller with public `GET /api/extra-button` and JWT-guarded `PATCH /api/extra-button`.

**Verify**
- `GET /api/extra-button` returns the seeded row (`is_enabled: false`, empty strings).
- `PATCH` with a token updates it; without a token returns 401.

---

## Step 3 — Backend: webapp session endpoint

**Files (new)**
- `backend/src/modules/webapp/webapp.module.ts`
- `backend/src/modules/webapp/webapp.controller.ts`
- `backend/src/modules/webapp/webapp.service.ts`
- `backend/src/modules/webapp/dto/session.dto.ts`

**Files touched**
- `backend/src/app.module.ts` — register `WebappModule`.
- `backend/src/database/entities/user.entity.ts` — add `init_data_hash: string | null` column if not already present.

**Do**
- `POST /api/webapp/session` accepts `{ initData: string }`.
- Service parses initData with `URLSearchParams(initData)`, extracts the `user` JSON field, extracts `hash`.
- Upsert into `users`: find by `telegram_id`, update or create. Fields: `telegram_id`, `first_name`, `last_name`, `username`, `init_data_hash`.
- **No HMAC validation.** Wrap parse errors in a try/catch; on failure, log and return 200 anyway (fire-and-forget contract).

**Verify**
- POST with a real-looking initData string upserts a row.
- POST with garbage returns 200, no crash, error logged.
- Existing `users` upsert-on-`/start` flow still works (no regression).

---

## Step 4 — Backend: CORS + menu-button bootstrap

**Files touched**
- `backend/src/main.ts` — add `https://app.aromagood.at` to CORS allow-list.
- `backend/src/modules/bot/bot.module.ts` (or a new `OnApplicationBootstrap` provider inside `bot/`) — read `WEBAPP_URL` from `ConfigService`, if set call `bot.telegram.setChatMenuButton({ menu_button: { type: 'web_app', text: 'Відкрити каталог', web_app: { url: WEBAPP_URL } } })`.
- `backend/.env.example` — add `WEBAPP_URL=` line with a comment.

**Do**
- Guard the setChatMenuButton call so it runs once, logs the outcome, and doesn't throw on failure.

**Verify**
- With `WEBAPP_URL` set to an https URL, restart the container, open the bot in Telegram — menu button appears labelled "Відкрити каталог".
- With `WEBAPP_URL` unset, no crash, no menu button change, log confirms skip.

---

## Step 5 — Admin panel: extra-button + bot-button fields

**Files touched**
- `admin/src/api/client.ts` — add `getExtraButton`, `updateExtraButton`; extend main-menu-button methods to include `bot_text`, `bot_url`, `bot_is_enabled`.
- `admin/src/pages/MainMenuButton.tsx` — add a "Bot button" form section (text + url + enabled).
- `admin/src/components/Layout.tsx` — add sidebar entry "Extra button".
- `admin/src/App.tsx` — register `/extra-button` route.

**Files (new)**
- `admin/src/pages/ExtraButton.tsx` — form with text / url / enabled toggle; save via `updateExtraButton`.

**Verify**
- `cd admin && npm run dev` — pages render, save, refetch shows values.

---

## Step 6 — Scaffold `webapp/` project

**Files (new)**
- `webapp/package.json`, `webapp/tsconfig.json`, `webapp/vite.config.ts`, `webapp/index.html`, `webapp/src/main.tsx`, `webapp/src/App.tsx`, `webapp/.gitignore`.

**Do**
- `npm create vite@latest webapp -- --template react-ts` (or hand-write to match existing style).
- Install: `react-router-dom`, `@tanstack/react-query`, `axios`.
- `vite.config.ts`: `base: '/'`, dev server on port `5174`, proxy `/api` and `/uploads` to `http://localhost:3006`.
- `index.html`: `<script src="https://telegram.org/js/telegram-web-app.js"></script>` in `<head>`.
- `main.tsx`: `QueryClientProvider` + `BrowserRouter` + `<App />`.
- `App.tsx`: bare "hello" page.

**Verify**
- `cd webapp && npm run dev` — page loads on `http://localhost:5174`.
- Network tab shows `telegram-web-app.js` loading successfully.

---

## Step 7 — Telegram SDK wrapper + DEV mock

**Files (new)**
- `webapp/src/telegram/webApp.ts` — exports `webApp` (typed wrapper around `window.Telegram?.WebApp`), `initWebApp()` calling `ready()` + `expand()` + wiring theme CSS vars from `themeParams`.
- `webapp/src/telegram/mock.ts` — in DEV, if `window.Telegram?.WebApp` is absent, install a shim with no-op `ready/expand/BackButton/openLink/openTelegramLink` and a stubbed `initDataUnsafe`.
- `webapp/src/telegram/useBackButton.ts` — React hook: `useEffect` that shows the BackButton on mount, hides on unmount, calls a handler on click.

**Files touched**
- `webapp/src/main.tsx` — import mock in DEV, call `initWebApp()` before render.

**Verify**
- Dev browser: `window.Telegram.WebApp.ready` is callable (shim in place), theme CSS vars exist on `<html>` (`--tg-theme-bg-color` etc.).

---

## Step 8 — Age gate

**Files (new)**
- `webapp/src/components/AgeGate.tsx` — reads `localStorage.age_confirmed`; if missing, renders full-screen modal with "Вам є 18 років?" and Так/Ні buttons. If `Ні` was previously clicked (stored as `denied`), renders permanent block screen. Wraps `children` when confirmed.
- `webapp/src/i18n/uk.ts` — start the strings file with age-gate copy.

**Files touched**
- `webapp/src/App.tsx` — wrap the router in `<AgeGate>`.

**Verify**
- Fresh localStorage → modal appears, "Так" → app renders, refresh → renders directly.
- Click "Ні" (in a fresh session) → permanent block, refresh → still blocked.

---

## Step 9 — Routing, Home tile grid, main-menu data

**Files (new)**
- `webapp/src/api/client.ts` — axios instance with `baseURL: '/api'`; typed methods for `getCategories`, `getProducts`, `getProduct`, `getWelcomePost`, `getSalePost`, `getButtons`, `getExtraButton`, `postSession`.
- `webapp/src/pages/Home.tsx` — welcome text (from `welcome-post`), tile grid of 6 tiles (Каталог, Всі фото, Акції, Канал, Бот, Extra), bottom "Замовити" CTA. Hide Bot tile when `bot_is_enabled === false` or url empty. Hide Extra tile when `is_enabled === false` or url empty.
- `webapp/src/components/TileGrid.tsx`, `webapp/src/components/OrderButton.tsx`.
- `webapp/src/styles/theme.css`, `webapp/src/styles/home.css`.

**Files touched**
- `webapp/src/App.tsx` — routes: `/`, `/categories`, `/categories/:id`, `/products`, `/products/:id`, `/sale`. All except `/` render placeholders for now.
- `webapp/src/main.tsx` — call `postSession(Telegram.WebApp.initData)` fire-and-forget (only if initData non-empty).

**Verify**
- Home renders welcome text, all tiles, order CTA. Toggle Bot / Extra `is_enabled` in the admin panel → tiles appear/disappear on refresh.
- `POST /api/webapp/session` fires (visible in backend logs or network tab).

---

## Step 10 — Categories, All Products, Category detail

**Files (new)**
- `webapp/src/pages/Categories.tsx` — list of enabled categories (excludes `CATALOG`), tapping one navigates to `/categories/:id`.
- `webapp/src/pages/CategoryProducts.tsx` — 2-col product grid for that category. Empty state: "Товари не знайдено".
- `webapp/src/pages/AllProducts.tsx` — 2-col grid of all enabled products.
- `webapp/src/components/ProductCard.tsx` — image + name tile, navigates to `/products/:id`.
- `webapp/src/styles/products.css`.

**Files touched**
- `webapp/src/App.tsx` — wire the three new routes.
- All three pages call `useBackButton(() => navigate(-1))`.

**Verify**
- Navigation from Home → Categories → CategoryProducts → back works; images render from `/uploads/`.
- All Products lists everything; disabling a product in admin removes it on refresh.

---

## Step 11 — Product detail + Sale post

**Files (new)**
- `webapp/src/pages/ProductDetail.tsx` — image, title, description, Замовити button (opens `t.me/<admin>` from `order-button.url` via `openTelegramLink`).
- `webapp/src/pages/SalePost.tsx` — image + text from `sale-post`, Замовити CTA.

**Files touched**
- `webapp/src/App.tsx` — wire routes.

**Verify**
- Tapping a product tile shows detail; Замовити opens Telegram chat (in real Telegram) or logs the URL (in DEV mock).
- Акції tile from Home opens the sale post.

---

## Step 12 — Docker build

**Files touched**
- `Dockerfile` — add a Stage 1.5 "webapp-builder": `FROM node:20-alpine AS webapp-builder`, `WORKDIR /webapp`, copy `webapp/package*.json`, `npm install --legacy-peer-deps`, copy rest, `npm run build`. Final stage: `COPY --from=webapp-builder /webapp/dist ./public/webapp`.
- `docker-compose.yml` — no structural change; `.env` already passthrough. Verify `WEBAPP_URL` env is present.
- `backend/.env` (local) — set `WEBAPP_URL` for the developer's environment.

**Verify**
- `docker compose up -d --build` succeeds.
- `docker exec aromagood ls public/webapp` shows `index.html` + assets.
- `curl http://localhost:3012/webapp/` returns the webapp HTML.

---

## Step 13 — DNS + Nginx + HTTPS (manual, on server)

**Files (new on server)**
- `/etc/nginx/sites-available/app.aromagood.at.conf`

**Do (documented in `DEPLOY.md`)**
1. Register `aromagood.at`; add DNS `A` record `app` → server IP.
2. Add Nginx server block:
   ```nginx
   server {
     listen 80;
     server_name app.aromagood.at;
     location / { proxy_pass http://127.0.0.1:3012/webapp/; proxy_set_header Host $host; }
     location /api/ { proxy_pass http://127.0.0.1:3012/api/; proxy_set_header Host $host; }
     location /uploads/ { proxy_pass http://127.0.0.1:3012/uploads/; }
   }
   ```
3. `sudo ln -s ... /etc/nginx/sites-enabled/`, `sudo nginx -t`, `sudo systemctl reload nginx`.
4. `sudo certbot --nginx -d app.aromagood.at` — enables HTTPS.
5. Set `WEBAPP_URL=https://app.aromagood.at` in `backend/.env` on server.
6. `make deploy`.

**Files touched**
- `DEPLOY.md` — append a "Mini App deployment" section with the above.

**Verify**
- `https://app.aromagood.at/` loads.
- `https://app.aromagood.at/api/categories` returns JSON.
- `https://app.aromagood.at/uploads/<any-existing-file>` returns the image.
- Bot's menu button opens the Mini App inside Telegram.

---

## Step 14 — QA pass against the spec's checklist

Run the manual QA checklist from the design doc top-to-bottom in a real Telegram client. Fix regressions before declaring done.

---

## Roll-back plan

Every change is additive:
- Backend column additions are non-breaking (defaults on new columns).
- New modules can be dropped without touching existing routes.
- Nginx config can be removed independently.
- Menu button can be reset via BotFather.

If the Mini App misbehaves in production, delete the Nginx server block and remove `WEBAPP_URL` from `.env`; the bot returns to its previous behaviour with no menu button.
