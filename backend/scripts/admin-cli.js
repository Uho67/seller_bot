#!/usr/bin/env node
'use strict';

const path = require('path');
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'database.sqlite');

function openDb() {
  try {
    return new Database(DB_PATH);
  } catch (err) {
    console.error(`Cannot open database at ${DB_PATH}: ${err.message}`);
    process.exit(1);
  }
}

function listAdmins(db) {
  const rows = db.prepare('SELECT id, name FROM admin ORDER BY id').all();
  if (rows.length === 0) {
    console.log('No admins found.');
    return;
  }
  console.log('\nID  Name');
  console.log('--  ----');
  for (const r of rows) {
    console.log(`${String(r.id).padEnd(4)}${r.name}`);
  }
  console.log();
}

async function createAdmin(db, name, password) {
  if (!name || !password) {
    console.error('Usage: admin-cli create <name> <password>');
    process.exit(1);
  }
  const exists = db.prepare('SELECT id FROM admin WHERE name = ?').get(name);
  if (exists) {
    console.error(`Admin "${name}" already exists.`);
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  const result = db.prepare('INSERT INTO admin (name, password_hash) VALUES (?, ?)').run(name, hash);
  console.log(`Created admin "${name}" (id=${result.lastInsertRowid}).`);
}

async function updatePassword(db, name, password) {
  if (!name || !password) {
    console.error('Usage: admin-cli update-password <name> <new-password>');
    process.exit(1);
  }
  const row = db.prepare('SELECT id FROM admin WHERE name = ?').get(name);
  if (!row) {
    console.error(`Admin "${name}" not found.`);
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  db.prepare('UPDATE admin SET password_hash = ? WHERE name = ?').run(hash, name);
  console.log(`Password updated for "${name}".`);
}

function deleteAdmin(db, name) {
  if (!name) {
    console.error('Usage: admin-cli delete <name>');
    process.exit(1);
  }
  const row = db.prepare('SELECT id FROM admin WHERE name = ?').get(name);
  if (!row) {
    console.error(`Admin "${name}" not found.`);
    process.exit(1);
  }
  const total = db.prepare('SELECT COUNT(*) as c FROM admin').get().c;
  if (total <= 1) {
    console.error('Cannot delete the last admin.');
    process.exit(1);
  }
  db.prepare('DELETE FROM admin WHERE name = ?').run(name);
  console.log(`Deleted admin "${name}".`);
}

async function main() {
  const [,, command, ...args] = process.argv;
  const db = openDb();

  switch (command) {
    case 'list':
      listAdmins(db);
      break;
    case 'create':
      await createAdmin(db, args[0], args[1]);
      break;
    case 'update-password':
      await updatePassword(db, args[0], args[1]);
      break;
    case 'delete':
      deleteAdmin(db, args[0]);
      break;
    default:
      console.log(`
Admin CLI — manage siga_bot admin accounts

Commands:
  list                          List all admins
  create <name> <password>      Create a new admin
  update-password <name> <pwd>  Change an admin's password
  delete <name>                 Delete an admin (cannot delete last one)

Environment:
  DB_PATH   Path to SQLite file (default: ./data/database.sqlite)
`);
      process.exit(command ? 1 : 0);
  }

  db.close();
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
