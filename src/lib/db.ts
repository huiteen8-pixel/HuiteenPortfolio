import Database from 'better-sqlite3';
import { dirname, isAbsolute, join, relative, resolve } from 'path';
import { readFileSync, mkdirSync } from 'fs';
import { isProductionRuntime } from '@/lib/runtime-env';

let dbInstance: Database.Database | null = null;

function getDatabasePath() {
  const configuredPath = process.env.SQLITE_DB_PATH?.trim();
  if (configuredPath) {
    const resolvedPath = resolve(configuredPath);

    if (isProductionRuntime()) {
      if (!isAbsolute(configuredPath)) {
        throw new Error('SQLITE_DB_PATH must be an absolute path in production');
      }

      const releaseDirectory = resolve(process.cwd());
      const relativeToRelease = relative(releaseDirectory, resolvedPath);
      const isInsideRelease =
        relativeToRelease === '' ||
        (!relativeToRelease.startsWith('..') && !isAbsolute(relativeToRelease));
      if (isInsideRelease) {
        throw new Error('SQLITE_DB_PATH must be outside the replaceable release directory');
      }
    }

    return resolvedPath;
  }

  // A production database must live outside the replaceable release directory.
  // Failing closed also prevents an accidental deployment from creating a
  // visitor database inside `.next/standalone`.
  if (isProductionRuntime()) {
    throw new Error('SQLITE_DB_PATH is required in production');
  }

  return join(process.cwd(), 'data', 'analytics.db');
}

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  const dbPath = getDatabasePath();

  // 确保目录存在
  const dir = dirname(dbPath);
  mkdirSync(dir, { recursive: true });

  dbInstance = new Database(dbPath);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  // 首次启动自动建表
  const schemaPath = join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  dbInstance.exec(schema);
  ensureColumn(dbInstance, 'link_visits', 'completed_at', 'TEXT');
  ensureColumn(dbInstance, 'link_visits', 'summary_email_sent_at', 'TEXT');
  ensureColumn(dbInstance, 'link_visits', 'summary_email_attempted_at', 'TEXT');
  ensureColumn(dbInstance, 'link_visits', 'summary_email_error', 'TEXT');

  // Credentials are environment-only. Clear values written by legacy versions as an
  // idempotent startup migration while retaining the column for schema compatibility.
  dbInstance.prepare(`
    UPDATE analytics_email_settings
    SET smtp_pass = NULL
    WHERE smtp_pass IS NOT NULL
  `).run();

  return dbInstance;
}

function ensureColumn(db: Database.Database, table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (columns.some((col) => col.name === column)) return;
  db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function withTransaction<T>(fn: (db: Database.Database) => T): T {
  const db = getDb();
  db.prepare('BEGIN').run();
  try {
    const result = fn(db);
    db.prepare('COMMIT').run();
    return result;
  } catch (err) {
    db.prepare('ROLLBACK').run();
    throw err;
  }
}
