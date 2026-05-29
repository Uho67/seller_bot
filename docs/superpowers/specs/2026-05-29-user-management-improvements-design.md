# User Management Improvements — Design Spec

**Date:** 2026-05-29
**Scope:** Delete users (single + mass action) and import users from CSV file

---

## Overview

Two improvements to the existing Users page in the admin panel:

1. **Delete** — checkboxes on the existing table for single and mass delete (hard delete from DB)
2. **Import** — a new "Импорт" tab on the Users page for uploading a CSV file

---

## 1. Delete

### Behavior

- Hard delete: rows are permanently removed from the database.
- **Single delete**: each row has an "Actions" column with a delete button wrapped in `<Popconfirm>` ("Удалить пользователя?").
- **Mass delete**: Ant Design `rowSelection` on the `<Table>` gives checkboxes + select-all. When ≥1 row is selected, a "Удалить выбранных (N)" danger button appears in the toolbar. Clicking it shows `Modal.confirm` before proceeding.
- After deletion, the `['users']` React Query cache is invalidated to refresh the list.

### Backend

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| DELETE | `/users/:id` | — | Delete single user by DB id |
| DELETE | `/users` | `{ ids: number[] }` | Bulk delete by DB ids |

Both endpoints are protected by `JwtAuthGuard`.

---

## 2. Import

### UI (new "Импорт" tab)

The Users page gains two Ant Design `<Tabs>`:
- **"Список"** — existing table, filters, mailout, and delete
- **"Импорт"** — file upload area

The Import tab contains:
- A `<Upload>` drag-and-drop component restricted to `.csv` files
- On file selection, the file is sent directly to `POST /users/import` (no client-side preview/parsing)
- A result message is shown after the request: "Добавлено: X, Пропущено (дубликаты): Y"
- A reset button to upload another file

### CSV Format

Expected columns (matches `user_siga.csv`):

```
id, name, username, chat_id, status, created_at, updated_at, bot_identifier
```

Field mapping:

| CSV column | DB field | Notes |
|------------|----------|-------|
| `name` | `first_name` + `last_name` | Split on first space: word[0] → first_name, rest → last_name |
| `username` | `user_name` | May be empty |
| `chat_id` | `chat_id` | Uniqueness key — skip row if already exists |
| `status` | `is_active` | `"active"` → `true`, anything else → `false` |
| `id`, `created_at`, `updated_at`, `bot_identifier` | — | Ignored on import |

### Conflict resolution

If a row's `chat_id` already exists in the database, the row is **skipped** (existing record is not modified).

### Backend

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/users/import` | `multipart/form-data` with `file` field | Parse CSV and insert new users |

- Protected by `JwtAuthGuard`
- Parsed with `csv-parse` npm package
- Returns `{ inserted: number, skipped: number }`
- Dependency: add `csv-parse` to `backend/package.json`

---

## Files Changed

### Backend
- `backend/src/modules/users/users.controller.ts` — add `DELETE /:id`, `DELETE /`, `POST /import`
- `backend/src/modules/users/users.service.ts` — add `deleteOne`, `deleteMany`, `importFromCsv`
- `backend/package.json` — add `csv-parse` dependency

### Frontend (admin)
- `admin/src/pages/Users.tsx` — add tabs, `rowSelection`, delete buttons, import tab UI
- `admin/src/api/users.ts` — add `deleteOne`, `deleteMany`, `importCsv` API calls
