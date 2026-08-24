# App Button (Reply Keyboard Mini App) — Design Spec

**Date:** 2026-08-24  
**Branch:** flow_vape

## Overview

Add a new `AppButton` entity to the bot. When enabled and configured with a URL, a persistent Reply keyboard button appears at the bottom of the chat on `/start`. Tapping it opens a Telegram Mini App at the configured URL via `web_app: { url }`.

This is separate from `ExtraButton` (which is an unrelated concept) and from the existing inline keyboard buttons.

---

## Data Layer

New TypeORM entity `app-button.entity.ts`:

| Field | Type | Notes |
|---|---|---|
| `id` | number | Always 1 (single-record pattern) |
| `text` | string | Button label shown in Reply keyboard |
| `url` | string | HTTPS URL of the Mini App |
| `is_enabled` | boolean | Toggle — false by default |

Follows the identical single-record pattern used by all other button entities (`OrderButton`, `AdminButton`, etc.). Seeder creates a default disabled record on first boot.

---

## Backend

New module at `backend/src/modules/app-button/` with:

- `app-button.entity.ts` — TypeORM entity (as above)
- `app-button.module.ts` — imports entity, exports `AppButtonService`
- `app-button.service.ts` — `get()` and `update()`, always target id=1
- `app-button.controller.ts`:
  - `GET /app-button` — public, returns current config
  - `PATCH /app-button` — JWT-guarded, updates config
- `dto/update-app-button.dto.ts` — `text`, `url`, `is_enabled` with class-validator decorators
- Registered in `app.module.ts`

---

## Bot Handler

Changes in `backend/src/modules/bot/main-menu.update.ts`, `@Start()` handler only:

1. Inject `AppButtonService` via `BotModule` (add `AppButtonModule` to `BotModule` imports)
2. Fetch `AppButton` record alongside other button fetches
3. **If `is_enabled === true` AND `url` is non-empty** — send a separate Reply keyboard message before the main photo/menu message:

```typescript
await ctx.reply('📱', {
  reply_markup: {
    keyboard: [[{ text: appButton.text, web_app: { url: appButton.url } }]],
    resize_keyboard: true,
    persistent: true,
  },
})
```

4. **Otherwise** — send `ReplyKeyboardRemove` to clean up any previously shown Reply keyboard:

```typescript
await ctx.reply('👋', {
  reply_markup: { remove_keyboard: true },
})
// Then delete this cleanup message immediately after
```

The `@Action('main_menu')` callback handler is **not changed** — Reply keyboard is only sent/removed on `/start`.

---

## Admin UI

New card in `admin/src/pages/Buttons.tsx`:

- **Card title:** "Кнопка приложения (Reply)"
- **Fields:** Text (input), URL (input), Enabled (switch/toggle)
- **New file:** `admin/src/api/app-button.ts` — axios calls to `GET /app-button` and `PATCH /app-button`
- Follows the same React Query pattern as existing button cards

---

## Initialization

`SeederService` creates a default `AppButton` record (`id=1, is_enabled=false, text='', url=''`) on first boot if it does not exist. Follows the same guard pattern used for other seeded entities.

---

## Out of Scope

- No changes to `ExtraButton` — it remains as-is
- `@Action('main_menu')` handler unchanged
- No changes to catalog, product, or sale-post handlers
- No migration files (TypeORM `synchronize: true` handles schema)
