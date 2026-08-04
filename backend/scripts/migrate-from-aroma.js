#!/usr/bin/env node
/**
 * Migrates data from aroma_bot (Express/Prisma/SQLite) into seller_bot (NestJS/TypeORM/SQLite).
 *
 * What is migrated:
 *   - 3 CUSTOM categories: Рідини, Поди, Картриджи
 *   - 17 Posts → ProductPost (15 with category links, 2 uncategorized)
 *   - Post 72 (sales_menu) → sale_post singleton (is_enabled=1)
 *   - StartMessageSettings → welcome_post singleton
 *   - ButtonSettings (order, admin, channel) → singleton button updates
 *   - Admin → renamed from seeded default with fresh bcrypt hash
 *   - 27,667 Users (is_active = !is_blocked)
 *   - 61 media files copied (filename preserved)
 *
 * What is NOT migrated:
 *   - SalesRule, CouponCode, UserSalesRule, PostQueue (all empty in source)
 *   - Post.video / StartMessageSettings.video (no video support in seller_bot)
 *   - User fields: is_in_chat, is_subscriber, attention_needed
 *   - AdminSession (fresh JWT auth in target)
 *
 * Usage:
 *   node scripts/migrate-from-aroma.js [--dry-run]
 *
 * Prerequisites:
 *   - Run seller_bot once (npm run start:dev) so TypeORM creates schema + seeded rows.
 *   - npm install must have been run in seller_bot/backend/.
 *
 * Env vars (all optional):
 *   SOURCE_DB       path to aroma_bot dev.db
 *   SOURCE_UPLOADS  path to aroma_bot uploads dir
 *   TARGET_DB       path to seller_bot database.sqlite
 *   TARGET_UPLOADS  path to seller_bot uploads dir
 *   ADMIN_PASSWORD  temporary password for migrated admin (default: admin123)
 */

'use strict';

const path = require('path');
const fs   = require('fs');
const Database = require('better-sqlite3');
const bcrypt   = require('bcrypt');

const DRY_RUN = process.argv.includes('--dry-run');

const BACKEND_DIR    = path.join(__dirname, '..');
const SOURCE_DB      = process.env.SOURCE_DB
  || path.join(BACKEND_DIR, '..', '..', 'aroma_bot', 'backend', 'prisma', 'dev.db');
const SOURCE_UPLOADS = process.env.SOURCE_UPLOADS
  || path.join(BACKEND_DIR, '..', '..', 'aroma_bot', 'backend', 'src', 'uploads');
const TARGET_DB      = process.env.TARGET_DB
  || path.join(BACKEND_DIR, 'data', 'database.sqlite');
const TARGET_UPLOADS = process.env.TARGET_UPLOADS
  || path.join(BACKEND_DIR, 'uploads');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// aroma_bot Post.link_to_button value → seller_bot category name
const BUTTON_TO_CATEGORY = {
  chaser_menu:     'Рідини',
  up_menu:         'Рідини',
  lux_menu:        'Рідини',
  berry_menu:      'Рідини',
  mymint_menu:     'Рідини',
  mini_menu:       'Поди',
  xros3_menu:      'Поди',
  '4mini_menu':    'Поди',
  '5mini_menu':    'Поди',
  xros5_menu:      'Поди',
  pro_menu:        'Поди',
  pro2_menu:       'Поди',
  '6mini_menu':    'Поди',
  xros6_menu:      'Поди',
  'картридж_menu': 'Картриджи',
};

// Posts routed to sale_post singleton rather than product_post
const SALE_POST_BUTTONS = new Set(['sales_menu']);

function log(...a) { console.log('[migrate-from-aroma]', ...a); }

function toFilename(p) { return p ? path.basename(p) : null; }

function copyMedia(aromaPath) {
  const filename = toFilename(aromaPath);
  if (!filename) return null;
  const src = path.join(SOURCE_UPLOADS, filename);
  const dst = path.join(TARGET_UPLOADS, filename);
  if (!fs.existsSync(src)) { log(`WARN missing: ${src}`); return null; }
  if (!DRY_RUN && !fs.existsSync(dst)) fs.copyFileSync(src, dst);
  return filename;
}

function extractName(desc) {
  if (!desc) return 'Без назви';
  const line = desc.split('\n')
    .map(l => l.replace(/<[^>]+>/g, '').trim())
    .find(l => l.length > 0);
  return (line && line.length <= 200)
    ? line
    : desc.replace(/<[^>]+>/g, '').trim().slice(0, 100) || 'Без назви';
}

async function main() {
  if (!fs.existsSync(SOURCE_DB)) {
    console.error('ERROR: source DB not found:', SOURCE_DB); process.exit(1);
  }
  if (!fs.existsSync(TARGET_DB)) {
    console.error('ERROR: target DB not found — run seller_bot once first:', TARGET_DB);
    process.exit(1);
  }
  if (!DRY_RUN) fs.mkdirSync(TARGET_UPLOADS, { recursive: true });

  const src = new Database(SOURCE_DB, { readonly: true });
  const tgt = new Database(TARGET_DB);
  if (!DRY_RUN) tgt.pragma('journal_mode = WAL');

  const report = {
    categories: 0, products: 0, links: 0,
    salePost: false, welcomePost: false,
    users: 0, usersSkipped: 0, skippedImages: 0,
  };

  try {
    log(DRY_RUN ? 'DRY RUN — no writes' : 'LIVE RUN');
    log('Source:', SOURCE_DB);
    log('Target:', TARGET_DB);

    // ── 1. Categories ─────────────────────────────────────────────────────
    log('\n[1/6] Creating categories...');

    const categoryNames = ['Рідини', 'Поди', 'Картриджи'];
    const categoryNameToId = new Map();

    const existingCats = tgt.prepare(
      "SELECT id, name FROM category_post WHERE type='custom'"
    ).all();
    const existingCatNames = new Map(existingCats.map(r => [r.name.trim(), r.id]));

    const insertCat = tgt.prepare(
      "INSERT INTO category_post (image, telegram_file_id, name, description, type, is_enabled) VALUES (NULL, NULL, ?, NULL, 'custom', 1)"
    );

    for (const name of categoryNames) {
      if (existingCatNames.has(name)) {
        categoryNameToId.set(name, existingCatNames.get(name));
        log(`  SKIP (exists): "${name}"`);
      } else {
        let newId;
        if (!DRY_RUN) { newId = insertCat.run(name).lastInsertRowid; }
        else { newId = -(++report.categories); }
        categoryNameToId.set(name, newId);
        report.categories++;
        log(`  + Category: "${name}"`);
      }
    }

    // ── 2. Products ───────────────────────────────────────────────────────
    log('\n[2/6] Migrating products...');

    const posts = src.prepare('SELECT * FROM Post').all();
    const existingImages = new Set(
      tgt.prepare('SELECT image FROM product_post WHERE image IS NOT NULL').all().map(r => r.image)
    );

    const insertProduct = tgt.prepare(
      'INSERT INTO product_post (image, telegram_file_id, name, description, is_enabled) VALUES (?, NULL, ?, ?, 1)'
    );
    const insertLink = tgt.prepare(
      'INSERT OR IGNORE INTO product_category (productPostId, categoryPostId) VALUES (?, ?)'
    );

    for (const post of posts) {
      // Post with sales_menu → sale_post singleton
      if (post.link_to_button && SALE_POST_BUTTONS.has(post.link_to_button)) {
        const filename = copyMedia(post.image);
        if (post.image && !filename) report.skippedImages++;
        if (!DRY_RUN) {
          tgt.prepare(
            'UPDATE sale_post SET name=?, description=?, image=?, telegram_file_id=NULL, is_enabled=1 WHERE id=1'
          ).run(extractName(post.description), post.description, filename);
        }
        report.salePost = true;
        log(`  SalePost updated (post.id=${post.id})`);
        continue;
      }

      const filename = copyMedia(post.image);
      if (post.image && !filename) report.skippedImages++;
      if (filename && existingImages.has(filename)) {
        log(`  SKIP (exists): post.id=${post.id}`);
        continue;
      }

      const name = extractName(post.description);
      let newId;
      if (!DRY_RUN) { newId = insertProduct.run(filename, name, post.description).lastInsertRowid; }
      else { newId = -(++report.products); }
      report.products++;

      const catName = post.link_to_button ? BUTTON_TO_CATEGORY[post.link_to_button] : null;
      if (catName) {
        const catId = categoryNameToId.get(catName);
        if (catId) {
          if (!DRY_RUN) insertLink.run(newId, catId);
          report.links++;
          log(`  + Product: "${name}" → ${catName}`);
        }
      } else {
        log(`  + Product: "${name}" → (no category)`);
      }
    }

    // ── 3. Welcome post ───────────────────────────────────────────────────
    log('\n[3/6] Migrating welcome post...');

    const startMsg = src.prepare('SELECT * FROM StartMessageSettings LIMIT 1').get();
    if (startMsg) {
      const filename = copyMedia(startMsg.image);
      if (startMsg.image && !filename) report.skippedImages++;
      if (!DRY_RUN) {
        tgt.prepare(
          'UPDATE welcome_post SET image=?, telegram_file_id=NULL, description=? WHERE id=1'
        ).run(filename, startMsg.text);
      }
      report.welcomePost = true;
      log(`  WelcomePost updated. image="${filename}"`);
    }

    // ── 4. Buttons ────────────────────────────────────────────────────────
    log('\n[4/6] Migrating buttons...');

    const orderBtn = src.prepare(
      "SELECT name, value FROM ButtonSettings WHERE render_type='order' LIMIT 1"
    ).get();
    if (orderBtn && !DRY_RUN) {
      tgt.prepare('UPDATE order_button SET name=?, telegram_user_link=? WHERE id=1')
        .run(orderBtn.name.trim(), orderBtn.value.trim());
    }
    log(`  OrderButton: ${orderBtn ? `"${orderBtn.name.trim()}" → ${orderBtn.value.trim()}` : 'not found'}`);

    const adminWelcomeBtn = src.prepare(
      "SELECT name, value FROM ButtonSettings WHERE render_type='welcome_button' AND type='url' LIMIT 1"
    ).get();
    const adminLink = adminWelcomeBtn?.value?.trim()
      || src.prepare("SELECT value FROM Configuration WHERE path='admin_url' LIMIT 1").get()?.value?.trim();
    const adminBtnName = adminWelcomeBtn?.name?.trim() || 'Адмін';
    if (adminLink && !DRY_RUN) {
      tgt.prepare('UPDATE admin_button SET name=?, telegram_user_link=? WHERE id=1')
        .run(adminBtnName, adminLink);
    }
    log(`  AdminButton: "${adminBtnName}" → ${adminLink || '(not found)'}`);

    const channelBtn = src.prepare(
      "SELECT name, value FROM ButtonSettings WHERE render_type='admin' AND type='url' LIMIT 1"
    ).get();
    if (channelBtn && !DRY_RUN) {
      tgt.prepare('UPDATE channel_button SET name=?, channel_link=? WHERE id=1')
        .run(channelBtn.name.trim(), channelBtn.value.trim());
    }
    log(`  ChannelButton: ${channelBtn ? `"${channelBtn.name.trim()}" → ${channelBtn.value.trim()}` : 'not found'}`);

    // ── 5. Admin ──────────────────────────────────────────────────────────
    log('\n[5/6] Migrating admin...');

    const srcAdmin = src.prepare('SELECT user_name FROM Admin LIMIT 1').get();
    const adminName = srcAdmin?.user_name || 'my_dear_uho';
    const existingAdmins = tgt.prepare('SELECT name FROM admin').all();
    const isOnlyDefault = existingAdmins.length === 1 && existingAdmins[0].name === 'admin';

    if (isOnlyDefault) {
      if (!DRY_RUN) {
        const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        tgt.prepare('UPDATE admin SET name=?, password_hash=? WHERE name=?')
          .run(adminName, hash, 'admin');
      }
      log(`  "admin" → "${adminName}" (temp password set)`);
    } else {
      log('  Skipped (non-default admin already exists)');
    }

    // ── 6. Users ──────────────────────────────────────────────────────────
    log('\n[6/6] Migrating users...');

    const srcUsers = src.prepare('SELECT * FROM User').all();
    const insertUser = tgt.prepare(
      'INSERT OR IGNORE INTO user (first_name, last_name, user_name, chat_id, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    const insertAll = tgt.transaction((users) => {
      for (const u of users) {
        const r = insertUser.run(
          u.first_name || null,
          u.last_name  || null,
          u.user_name  || null,
          String(u.chat_id),
          u.is_blocked ? 0 : 1,
          u.createdAt,
          u.updatedAt,
        );
        r.changes > 0 ? report.users++ : report.usersSkipped++;
      }
    });

    if (!DRY_RUN) insertAll(srcUsers);
    else report.users = srcUsers.length;
    log(`  ${report.users} inserted, ${report.usersSkipped} skipped`);

    // ── Summary ───────────────────────────────────────────────────────────
    log('\n--- Summary ---');
    log(JSON.stringify(report, null, 2));
    if (report.skippedImages > 0) {
      log(`WARNING: ${report.skippedImages} image(s) not found on disk and were skipped.`);
    }
    if (!DRY_RUN) {
      log(`\nIMPORTANT: Admin "${adminName}" temp password = "${ADMIN_PASSWORD}"`);
      log('Change with: node scripts/admin-cli.js update-password <name> <new-password>');
    }
  } finally {
    src.close();
    tgt.close();
  }
}

main().catch(err => { console.error('Migration failed:', err); process.exit(1); });
