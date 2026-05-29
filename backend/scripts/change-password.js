#!/usr/bin/env node
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const path = require('path');
const readline = require('readline');

const DB_PATH = path.join(__dirname, '../data/database.sqlite');
const USERNAME = process.argv[2] || 'admin';
const NEW_PASSWORD = process.argv[3];

async function changePassword(username, password) {
  const db = new Database(DB_PATH);

  const admin = db.prepare('SELECT * FROM admin WHERE name = ?').get(username);
  if (!admin) {
    console.error(`User '${username}' not found.`);
    db.close();
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  db.prepare('UPDATE admin SET password_hash = ? WHERE name = ?').run(hash, username);
  db.close();
  console.log(`Password updated for user '${username}'.`);
}

async function main() {
  if (NEW_PASSWORD) {
    await changePassword(USERNAME, NEW_PASSWORD);
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.stdoutMuted = true;
  process.stdout.write(`New password for '${USERNAME}': `);
  rl.question('', async (password) => {
    process.stdout.write('\n');
    rl.close();
    if (!password) { console.error('Password cannot be empty.'); process.exit(1); }
    await changePassword(USERNAME, password);
  });
  rl.input.on('keypress', () => {
    if (rl.stdoutMuted) rl.output.write('\x1B[2K\x1B[200D' + 'New password: ' + '*'.repeat(rl.line.length));
  });
}

main().catch(err => { console.error(err.message); process.exit(1); });
