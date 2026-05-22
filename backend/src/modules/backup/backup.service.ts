import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { join } from 'path';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import Database from 'better-sqlite3';

const DB_PATH = join(__dirname, '..', '..', '..', 'data', 'database.sqlite');
const BACKUP_DIR = join(__dirname, '..', '..', '..', 'backups');
const MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000;

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runBackup() {
    if (!existsSync(BACKUP_DIR)) {
      mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(BACKUP_DIR, `database_${timestamp}.sqlite`);

    try {
      const db = new Database(DB_PATH, { readonly: true });
      await db.backup(backupPath);
      db.close();
      this.logger.log(`Backup created: ${backupPath}`);
      this.removeOldBackups();
    } catch (err) {
      this.logger.error(`Backup failed — old backups preserved: ${err.message}`);
    }
  }

  private removeOldBackups() {
    const now = Date.now();
    const files = readdirSync(BACKUP_DIR).filter((f) =>
      f.startsWith('database_') && f.endsWith('.sqlite'),
    );

    for (const file of files) {
      const filePath = join(BACKUP_DIR, file);
      const age = now - statSync(filePath).mtimeMs;
      if (age > MAX_AGE_MS) {
        unlinkSync(filePath);
        this.logger.log(`Removed old backup: ${file}`);
      }
    }
  }
}
