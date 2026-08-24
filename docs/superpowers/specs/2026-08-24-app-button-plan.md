# App Button — Implementation Plan

Spec: `docs/superpowers/specs/2026-08-24-app-button-design.md`

## Steps

### 1. Create entity
**File:** `backend/src/database/entities/app-button.entity.ts`

Mirror `extra-button.entity.ts` exactly but table name `app_button`.

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('app_button')
export class AppButton {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  text: string;

  @Column({ default: '' })
  url: string;

  @Column({ default: false })
  is_enabled: boolean;
}
```

---

### 2. Create DTO
**File:** `backend/src/modules/app-button/dto/update-app-button.dto.ts`

Mirror `update-extra-button.dto.ts`.

```typescript
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateAppButtonDto {
  @IsOptional() @IsString() text?: string;
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsBoolean() is_enabled?: boolean;
}
```

---

### 3. Create service
**File:** `backend/src/modules/app-button/app-button.service.ts`

Mirror `extra-button.service.ts`, replace `ExtraButton` → `AppButton`.

---

### 4. Create controller
**File:** `backend/src/modules/app-button/app-button.controller.ts`

Mirror `extra-button.controller.ts`, route `app-button`.

---

### 5. Create module
**File:** `backend/src/modules/app-button/app-button.module.ts`

Mirror `extra-button.module.ts`, export `AppButtonService`.

---

### 6. Register in DatabaseModule
**File:** `backend/src/database/database.module.ts`

- Import `AppButton` entity
- Add to `TypeOrmModule.forFeature([..., AppButton])`

---

### 7. Add seeding
**File:** `backend/src/database/seeds/seeder.service.ts`

- Import `AppButton` entity and inject `@InjectRepository(AppButton)`
- In `seedButtons()`, add:
```typescript
const appBtn = await this.appBtnRepo.findOne({ where: { id: 1 } });
if (!appBtn) {
  await this.appBtnRepo.save(this.appBtnRepo.create({ id: 1 }));
}
```

---

### 8. Register AppButtonModule in AppModule
**File:** `backend/src/app.module.ts`

- Import `AppButtonModule`
- Add to `imports: [...]` array (alongside `ExtraButtonModule`)

---

### 9. Import AppButtonModule into BotModule
**File:** `backend/src/modules/bot/bot.module.ts`

- Import `AppButtonModule`
- Add to `imports: [...]` array

---

### 10. Wire into bot handler
**File:** `backend/src/modules/bot/updates/main-menu.update.ts`

- Inject `AppButtonService` in constructor
- In `onStart()` only (before `renderMainMenu`), fetch `AppButton` and send Reply keyboard:

```typescript
// In onStart(), after usersService.upsertUser:
const appButton = await this.appButtonService.get();
if (appButton?.is_enabled && appButton?.url) {
  await ctx.reply('📱', {
    reply_markup: {
      keyboard: [[{ text: appButton.text || '📱', web_app: { url: appButton.url } }]],
      resize_keyboard: true,
      persistent: true,
    },
  });
} else {
  await ctx.reply('\u200B', {  // zero-width space
    reply_markup: { remove_keyboard: true },
  }).then(msg => ctx.deleteMessage(msg.message_id)).catch(() => {});
}
```

Note: `renderMainMenu` is NOT changed — Reply keyboard only fires on `/start`.

---

### 11. Create admin API client
**File:** `admin/src/api/app-button.ts`

Mirror `extra-button.ts`:

```typescript
import client from './client';

export const appButtonApi = {
  get: () => client.get('/app-button'),
  update: (data: any) => client.patch('/app-button', data),
};
```

---

### 12. Add admin UI card
**File:** `admin/src/pages/Buttons.tsx`

- Import `appButtonApi` and add `useQuery`/`useMutation` hooks following the same pattern as ExtraButton card
- Add new `<Card title="Кнопка приложения (Reply)">` with fields: Text, URL, Enabled toggle
- Place card between the Extra button card and Channel button card (or at the end)

---

## File change summary

| File | Action |
|---|---|
| `backend/src/database/entities/app-button.entity.ts` | CREATE |
| `backend/src/modules/app-button/dto/update-app-button.dto.ts` | CREATE |
| `backend/src/modules/app-button/app-button.service.ts` | CREATE |
| `backend/src/modules/app-button/app-button.controller.ts` | CREATE |
| `backend/src/modules/app-button/app-button.module.ts` | CREATE |
| `backend/src/database/database.module.ts` | EDIT — add AppButton |
| `backend/src/database/seeds/seeder.service.ts` | EDIT — seed AppButton |
| `backend/src/app.module.ts` | EDIT — register AppButtonModule |
| `backend/src/modules/bot/bot.module.ts` | EDIT — import AppButtonModule |
| `backend/src/modules/bot/updates/main-menu.update.ts` | EDIT — Reply keyboard logic |
| `admin/src/api/app-button.ts` | CREATE |
| `admin/src/pages/Buttons.tsx` | EDIT — add card |
