#!/usr/bin/env node
/**
 * Seed 10,000 rows into the mailout table for load testing.
 * Usage: node scripts/seed-mailout.js [--post-id 1] [--post-type product] [--count 10000]
 */

const Database = require('better-sqlite3');
const path = require('path');

const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : def;
};

const DB_PATH = path.join(__dirname, '..', 'database.sqlite');
const COUNT = parseInt(getArg('--count', '10000'), 10);
const POST_ID = parseInt(getArg('--post-id', '1'), 10);
const POST_TYPE = getArg('--post-type', 'product'); // product | sale | welcome
const IS_SENT = getArg('--is-sent', 'false') === 'true';

const VALID_TYPES = ['product', 'sale', 'welcome'];
if (!VALID_TYPES.includes(POST_TYPE)) {
  console.error(`Invalid --post-type "${POST_TYPE}". Must be one of: ${VALID_TYPES.join(', ')}`);
  process.exit(1);
}

const db = new Database(DB_PATH);

const insert = db.prepare(
  `INSERT INTO mailout (chat_id, post_id, post_type, is_sent, message_id, created_at)
   VALUES (?, ?, ?, ?, ?, ?)`
);

const insertMany = db.transaction((rows) => {
  for (const row of rows) {
    insert.run(row.chat_id, row.post_id, row.post_type, row.is_sent ? 1 : 0, row.message_id, row.created_at);
  }
});

const rows = Array.from({ length: COUNT }, (_, i) => ({
  chat_id: String(100000000 + i),
  post_id: POST_ID,
  post_type: POST_TYPE,
  is_sent: IS_SENT,
  message_id: IS_SENT ? String(200000000 + i) : null,
  created_at: new Date().toISOString(),
}));

console.log(`Seeding ${COUNT} mailout rows (post_type=${POST_TYPE}, post_id=${POST_ID}, is_sent=${IS_SENT})...`);
const start = Date.now();
insertMany(rows);
const elapsed = ((Date.now() - start) / 1000).toFixed(2);

const { count } = db.prepare('SELECT COUNT(*) as count FROM mailout').get();
console.log(`Done in ${elapsed}s. Total rows in mailout: ${count}`);

db.close();
