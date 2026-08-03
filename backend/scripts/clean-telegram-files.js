#!/usr/bin/env node
'use strict';

/**
 * Clears cached Telegram file_id references from all entities that store
 * them: sale_post, category_post, product_post, welcome_post.
 *
 * Only telegram_file_id is cleared; the `image` column (local image path)
 * is never modified or removed by this script.
 *
 * Usage:
 *   node scripts/clean-telegram-files.js            # clear telegram_file_id
 *   node scripts/clean-telegram-files.js --dry-run  # show affected rows only
 */

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'database.sqlite');

const TABLES = ['sale_post', 'category_post', 'product_post', 'welcome_post'];

function openDb() {
  try {
    return new Database(DB_PATH);
  } catch (err) {
    console.error(`Cannot open database at ${DB_PATH}: ${err.message}`);
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  const db = openDb();

  console.log(`Database: ${DB_PATH}`);
  console.log(dryRun ? 'Mode: dry-run (no changes will be made)\n' : 'Mode: clean\n');

  let totalCleared = 0;

  for (const table of TABLES) {
    const rows = db
      .prepare(`SELECT id FROM ${table} WHERE telegram_file_id IS NOT NULL AND telegram_file_id != ''`)
      .all();

    if (rows.length === 0) {
      console.log(`${table}: nothing to clean`);
      continue;
    }

    console.log(`${table}: ${rows.length} row(s) with telegram_file_id set`);

    if (!dryRun) {
      const stmt = db.prepare(`UPDATE ${table} SET telegram_file_id = NULL WHERE id = ?`);

      const clearAll = db.transaction((ids) => {
        for (const { id } of ids) stmt.run(id);
      });
      clearAll(rows);
    }

    totalCleared += rows.length;
  }

  console.log(`\n${dryRun ? 'Would clear' : 'Cleared'} ${totalCleared} row(s) across ${TABLES.length} table(s).`);

  db.close();
}

main();
