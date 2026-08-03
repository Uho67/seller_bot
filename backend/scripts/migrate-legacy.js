#!/usr/bin/env node
/**
 * One-off migration of a single bot's data from the legacy bot_manager MySQL database
 * (bot_api_db) into this seller_bot instance's SQLite database.
 *
 * Scope: only the bot identified by BOT_IDENTIFIER below (u_manager_first /
 * 8520920508:AAEuuDBgC). seller_bot has no multi-bot support, so this script is
 * intentionally single-bot and not a generic sync tool — re-running it against a
 * different bot_identifier requires re-checking the CATEGORY_MAP / PRODUCT overrides
 * below, since they encode this bot's specific category structure.
 *
 * What is migrated: categories (flattened to seller_bot's 2-level model), products,
 * product<->category links, the welcome post, one product promoted to the sale post,
 * the 4 fixed buttons, and telegram users.
 *
 * What is NOT migrated (by design, see docs/plan): config, template, post_mailout,
 * broadcast/promo `post` rows other than the welcome post, admin_user, bot.
 * `telegram_file_id` is never copied — every migrated row is inserted with a null
 * file id so seller_bot uploads the copied image itself and caches a fresh file_id
 * on first send.
 *
 * Usage:
 *   node scripts/migrate-legacy.js [--dry-run]
 *
 * Configuration (env vars, all optional except where noted):
 *   SOURCE_DB_HOST      (default: 127.0.0.1)
 *   SOURCE_DB_PORT      (default: 3306)
 *   SOURCE_DB_USER      (default: root)
 *   SOURCE_DB_PASSWORD  (required — no default, must be supplied)
 *   SOURCE_DB_DATABASE  (default: app)
 *   SOURCE_MEDIA_ROOT   (default: ../../bot_manager/app/public, relative to this repo)
 *   BOT_IDENTIFIER      (default: 8520920508:AAEuuDBgC)
 *   DB_PATH             (default: <backend>/data/database.sqlite, same as admin-cli.js)
 *   UPLOADS_DIR         (default: <backend>/uploads)
 */

'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const mysql = require('mysql2/promise');

const DRY_RUN = process.argv.includes('--dry-run');

const BOT_IDENTIFIER = process.env.BOT_IDENTIFIER || '8520920508:AAEuuDBgC';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'database.sqlite');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
const SOURCE_MEDIA_ROOT = process.env.SOURCE_MEDIA_ROOT
  || path.join(__dirname, '..', '..', '..', 'bot_manager', 'app', 'public');

const SOURCE_DB_CONFIG = {
  host: process.env.SOURCE_DB_HOST || '127.0.0.1',
  port: Number(process.env.SOURCE_DB_PORT || 3306),
  user: process.env.SOURCE_DB_USER || 'root',
  password: process.env.SOURCE_DB_PASSWORD,
  database: process.env.SOURCE_DB_DATABASE || 'app',
};

/**
 * Legacy category id -> how it maps onto seller_bot's flat category model, decided
 * with the project owner for this specific bot's structure (see migration plan):
 *  - id 3 "❤️ Каталог" is the tree root -> updates seller_bot's existing CATALOG row.
 *  - ids 2 "Рiдини 💧" and 5 "Картриджі 🔗" already sit one level under the root ->
 *    become CUSTOM categories as-is.
 *  - id 4 "Поди 💨" also becomes a CUSTOM category, but absorbs the products that
 *    legacy has under its two sub-categories (7 "Vaporesso", 9 "Voopoo") instead of
 *    recreating that extra nesting level, which seller_bot doesn't support.
 *  - ids 7 and 9 are dropped entirely; `mergeProductsInto: 4` reroutes their products.
 */
const CATEGORY_MAP = {
  3: { role: 'catalog_root' },
  2: { role: 'custom' },
  5: { role: 'custom' },
  4: { role: 'custom' },
  7: { role: 'dropped', mergeProductsInto: 4 },
  9: { role: 'dropped', mergeProductsInto: 4 },
};

// The legacy product highlighted directly on the main-menu layout — this bot has no
// "sale_post" entity in the old system, so this product is promoted to seller_bot's
// singleton sale_post instead of being imported as a regular product.
const SALE_PRODUCT_ID = 100;

// Legacy `post` row to use as the welcome post (template_type = 'start').
const WELCOME_POST_ID = 1;

// In --dry-run mode nothing is actually inserted, so there's no real auto-increment
// id to map legacy ids onto. This counter hands out synthetic negative ids purely so
// dry-run reporting (e.g. product<->category link counts) reflects what a real run
// would migrate, without ever touching the database.
let dryRunIdCounter = 0;
function nextDryRunId() {
  dryRunIdCounter -= 1;
  return dryRunIdCounter;
}

function log(...args) {
  console.log('[migrate-legacy]', ...args);
}

function assertSourceDbPassword() {
  if (!SOURCE_DB_CONFIG.password) {
    console.error('SOURCE_DB_PASSWORD env var is required (legacy MySQL credentials).');
    process.exit(1);
  }
}

function openTargetDb() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Target SQLite DB not found at ${DB_PATH}.`);
    console.error('Run seller_bot once (npm run start:dev) first so schema + defaults are seeded.');
    process.exit(1);
  }
  return new Database(DB_PATH);
}

/** Copies one legacy image file into seller_bot's uploads dir; returns the new relative filename, or null. */
function copyImage(legacyImagePath) {
  if (!legacyImagePath) return null;
  const relative = legacyImagePath.replace(/^\/+/, ''); // strip leading slash if present
  const sourcePath = path.join(SOURCE_MEDIA_ROOT, relative);
  if (!fs.existsSync(sourcePath)) {
    log(`WARNING: source image not found, skipping: ${sourcePath}`);
    return null;
  }
  const ext = path.extname(sourcePath);
  const newFilename = `${Date.now()}-${crypto.randomInt(1e6)}${ext}`;
  if (!DRY_RUN) {
    fs.copyFileSync(sourcePath, path.join(UPLOADS_DIR, newFilename));
  }
  return newFilename;
}

async function fetchRows(conn, sql, params) {
  const [rows] = await conn.execute(sql, params);
  return rows;
}

/** mysql2 returns DATETIME columns as JS Date objects; better-sqlite3 can only bind
 * primitives, so convert to an ISO string (or null) before inserting. */
function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

async function main() {
  assertSourceDbPassword();
  const target = openTargetDb();
  const conn = await mysql.createConnection(SOURCE_DB_CONFIG);

  const report = {
    categories: 0, products: 0, productCategoryLinks: 0, users: 0,
    buttons: 0, welcomePost: 0, salePost: 0, skippedImages: 0,
  };

  try {
    log(`Migrating bot_identifier=${BOT_IDENTIFIER} ${DRY_RUN ? '(DRY RUN, no writes)' : ''}`);

    // ---- Categories --------------------------------------------------------
    const legacyCategories = await fetchRows(
      conn,
      'SELECT id, name, image, layout FROM category WHERE bot_identifier = ?',
      [BOT_IDENTIFIER],
    );
    const legacyById = new Map(legacyCategories.map((c) => [c.id, c]));

    // legacyId -> seller_bot category_post.id
    const categoryIdMap = new Map();

    const updateCatalogStmt = target.prepare(
      "UPDATE category_post SET name = ?, description = NULL, image = COALESCE(?, image) WHERE type = 'catalog'",
    );
    const insertCustomCategoryStmt = target.prepare(
      "INSERT INTO category_post (image, telegram_file_id, name, description, type, is_enabled) VALUES (?, NULL, ?, NULL, 'custom', 1)",
    );

    for (const [legacyId, mapping] of Object.entries(CATEGORY_MAP)) {
      const id = Number(legacyId);
      const legacy = legacyById.get(id);
      if (mapping.role === 'dropped') continue;
      if (!legacy) {
        log(`WARNING: legacy category id=${id} not found for this bot, skipping.`);
        continue;
      }

      const newImage = copyImage(legacy.image);
      if (legacy.image && !newImage) report.skippedImages += 1;

      if (mapping.role === 'catalog_root') {
        if (!DRY_RUN) {
          updateCatalogStmt.run(legacy.name, newImage);
          const catalogRow = target.prepare("SELECT id FROM category_post WHERE type = 'catalog'").get();
          categoryIdMap.set(id, catalogRow.id);
        } else {
          categoryIdMap.set(id, nextDryRunId());
        }
      } else {
        let newId;
        if (!DRY_RUN) {
          const result = insertCustomCategoryStmt.run(newImage, legacy.name);
          newId = result.lastInsertRowid;
        } else {
          newId = nextDryRunId();
        }
        categoryIdMap.set(id, newId);
        report.categories += 1;
      }
    }
    // Sub-categories being merged (Vaporesso/Voopoo) route their products to the
    // category id they were merged into.
    for (const [legacyId, mapping] of Object.entries(CATEGORY_MAP)) {
      if (mapping.role === 'dropped') {
        categoryIdMap.set(Number(legacyId), categoryIdMap.get(mapping.mergeProductsInto));
      }
    }
    log(`Categories migrated: ${report.categories} (+1 catalog root updated)`);

    // ---- Products ------------------------------------------------------------
    const legacyProducts = await fetchRows(
      conn,
      'SELECT id, name, description, image, enabled FROM product WHERE bot_identifier = ?',
      [BOT_IDENTIFIER],
    );
    const productIdMap = new Map(); // legacy product id -> seller_bot product_post.id

    const insertProductStmt = target.prepare(
      'INSERT INTO product_post (image, telegram_file_id, name, description, is_enabled) VALUES (?, NULL, ?, ?, ?)',
    );

    for (const p of legacyProducts) {
      if (p.id === SALE_PRODUCT_ID) continue; // handled separately as sale_post
      const newImage = copyImage(p.image);
      if (p.image && !newImage) report.skippedImages += 1;
      let newId;
      if (!DRY_RUN) {
        const result = insertProductStmt.run(newImage, p.name, p.description, p.enabled ? 1 : 0);
        newId = result.lastInsertRowid;
      } else {
        newId = nextDryRunId();
      }
      productIdMap.set(p.id, newId);
      report.products += 1;
    }
    log(`Products migrated: ${report.products}`);

    // ---- Product <-> Category links ------------------------------------------
    const legacyLinks = await fetchRows(
      conn,
      `SELECT pc.product_id, pc.category_id
         FROM product_category pc
         INNER JOIN product p ON p.id = pc.product_id
        WHERE p.bot_identifier = ?`,
      [BOT_IDENTIFIER],
    );
    const insertLinkStmt = target.prepare(
      'INSERT OR IGNORE INTO product_category (productPostId, categoryPostId) VALUES (?, ?)',
    );
    for (const link of legacyLinks) {
      if (link.product_id === SALE_PRODUCT_ID) continue;
      const newProductId = productIdMap.get(link.product_id);
      const newCategoryId = categoryIdMap.get(link.category_id);
      if (!newProductId || !newCategoryId) continue; // product/category outside migrated scope
      if (!DRY_RUN) insertLinkStmt.run(newProductId, newCategoryId);
      report.productCategoryLinks += 1;
    }
    log(`Product-category links migrated: ${report.productCategoryLinks}`);

    // ---- Welcome post ----------------------------------------------------------
    const [welcomePost] = await fetchRows(
      conn,
      "SELECT image, description FROM post WHERE bot_identifier = ? AND id = ? AND template_type = 'start'",
      [BOT_IDENTIFIER, WELCOME_POST_ID],
    );
    if (welcomePost) {
      const newImage = copyImage(welcomePost.image);
      if (welcomePost.image && !newImage) report.skippedImages += 1;
      if (!DRY_RUN) {
        target.prepare('UPDATE welcome_post SET image = ?, telegram_file_id = NULL, description = ? WHERE id = 1')
          .run(newImage, welcomePost.description);
      }
      report.welcomePost = 1;
    } else {
      log(`WARNING: welcome post id=${WELCOME_POST_ID} not found for this bot.`);
    }
    log(`Welcome post migrated: ${report.welcomePost === 1 ? 'yes' : 'no'}`);

    // ---- Sale post (promoted from product id=100) ------------------------------
    const [saleProduct] = await fetchRows(
      conn,
      'SELECT name, description, image, enabled FROM product WHERE bot_identifier = ? AND id = ?',
      [BOT_IDENTIFIER, SALE_PRODUCT_ID],
    );
    if (saleProduct) {
      const newImage = copyImage(saleProduct.image);
      if (saleProduct.image && !newImage) report.skippedImages += 1;
      if (!DRY_RUN) {
        target.prepare(
          'UPDATE sale_post SET name = ?, description = ?, image = ?, telegram_file_id = NULL, is_enabled = ? WHERE id = 1',
        ).run(saleProduct.name, saleProduct.description, newImage, saleProduct.enabled ? 1 : 0);
      }
      report.salePost = 1;
    } else {
      log(`WARNING: sale product id=${SALE_PRODUCT_ID} not found for this bot.`);
    }
    log(`Sale post migrated: ${report.salePost === 1 ? 'yes' : 'no'}`);

    // ---- Buttons -----------------------------------------------------------------
    const legacyButtons = await fetchRows(
      conn,
      'SELECT code, label, value FROM button WHERE bot_identifier = ?',
      [BOT_IDENTIFIER],
    );
    const byCode = new Map(legacyButtons.map((b) => [b.code, b]));

    const order = byCode.get('zamoviti');
    if (order && !DRY_RUN) {
      target.prepare('UPDATE order_button SET name = ?, telegram_user_link = ? WHERE id = 1')
        .run(order.label, order.value.trim());
    }
    if (order) report.buttons += 1;

    const admin = byCode.get('admin_button');
    if (admin && !DRY_RUN) {
      target.prepare('UPDATE admin_button SET name = ?, telegram_user_link = ? WHERE id = 1')
        .run(admin.label, admin.value.trim());
    }
    if (admin) report.buttons += 1;

    const channel = byCode.get('To channel');
    if (channel && !DRY_RUN) {
      target.prepare('UPDATE channel_button SET name = ?, channel_link = ? WHERE id = 1')
        .run(channel.label, channel.value.trim());
    }
    if (channel) report.buttons += 1;

    const mainMenu = byCode.get('start');
    if (mainMenu && !DRY_RUN) {
      target.prepare('UPDATE main_menu_button SET name = ? WHERE id = 1').run(mainMenu.label);
    }
    if (mainMenu) report.buttons += 1;

    log(`Buttons migrated: ${report.buttons}/4`);

    // ---- Users ---------------------------------------------------------------
    const legacyUsers = await fetchRows(
      conn,
      'SELECT name, username, chat_id, status, created_at, updated_at FROM user WHERE bot_identifier = ?',
      [BOT_IDENTIFIER],
    );
    const insertUserStmt = target.prepare(
      'INSERT OR IGNORE INTO user (first_name, last_name, user_name, chat_id, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    for (const u of legacyUsers) {
      const [firstName, ...rest] = (u.name || '').trim().split(/\s+/);
      const lastName = rest.join(' ') || null;
      if (!DRY_RUN) {
        insertUserStmt.run(
          firstName || null,
          lastName,
          u.username || null,
          String(u.chat_id),
          u.status === 'active' ? 1 : 0,
          toIso(u.created_at),
          toIso(u.updated_at),
        );
      }
      report.users += 1;
    }
    log(`Users migrated: ${report.users}`);

    log('--- Summary ---');
    log(JSON.stringify(report, null, 2));
    if (report.skippedImages > 0) {
      log(`WARNING: ${report.skippedImages} image(s) could not be found on disk and were skipped.`);
    }
    if (DRY_RUN) log('Dry run complete — no rows were written.');
  } finally {
    await conn.end();
    target.close();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
