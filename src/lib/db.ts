import Database from 'better-sqlite3';
import { join } from 'path';
import { readFileSync, mkdirSync } from 'fs';

const DB_PATH = process.env.SQLITE_DB_PATH || join(process.cwd(), 'data', 'analytics.db');

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  // 确保目录存在
  const dir = join(DB_PATH, '..');
  mkdirSync(dir, { recursive: true });

  dbInstance = new Database(DB_PATH);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  // 首次启动自动建表
  const schemaPath = join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  dbInstance.exec(schema);
  ensureColumn(dbInstance, 'link_visits', 'completed_at', 'TEXT');
  ensureColumn(dbInstance, 'link_visits', 'summary_email_sent_at', 'TEXT');
  ensureColumn(dbInstance, 'link_visits', 'summary_email_error', 'TEXT');

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
