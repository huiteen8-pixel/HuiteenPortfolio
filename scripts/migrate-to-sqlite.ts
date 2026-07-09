import Database from 'better-sqlite3';
import { join } from 'path';
import { readFileSync, mkdirSync } from 'fs';
import { config } from 'dotenv';

// 加载 .env.local 环境变量
config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const sqlitePath = process.env.SQLITE_DB_PATH || join(process.cwd(), 'data', 'analytics.db');

if (!supabaseUrl || !supabaseKey) {
  console.error('请在 .env.local 中设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

async function supabaseFetch(table: string): Promise<any[]> {
  const url = `${supabaseUrl}/rest/v1/${table}?select=*`;
  const res = await fetch(url, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${table}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function migrate() {
  // 确保目录存在
  const dir = join(sqlitePath, '..');
  mkdirSync(dir, { recursive: true });

  const db = new Database(sqlitePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = OFF'); // 迁移时关闭外键检查

  // 建表
  const schemaPath = join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  console.log('Migrating share_links...');
  const links = await supabaseFetch('share_links');
  if (links && links.length > 0) {
    const insert = db.prepare(`
      INSERT INTO share_links (id, name, slug, click_count, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((rows: any[]) => {
      for (const row of rows) {
        insert.run(row.id, row.name, row.slug, row.click_count || 0, row.is_active ? 1 : 0, row.created_at);
      }
    });
    insertMany(links);
    console.log(`  Inserted ${links.length} links`);
  } else {
    console.log('  No links to migrate');
  }

  console.log('Migrating link_visits...');
  const visits = await supabaseFetch('link_visits');
  if (visits && visits.length > 0) {
    const insert = db.prepare(`
      INSERT INTO link_visits (
        id, share_link_id, ip, location, city, country, region,
        user_agent, referrer, visited_at, duration_ms, entered_at, left_at,
        viewed_resume, downloaded_resume, resume_dwell_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((rows: any[]) => {
      for (const row of rows) {
        insert.run(
          row.id, row.share_link_id, row.ip, row.location, row.city, row.country, row.region,
          row.user_agent, row.referrer, row.visited_at, row.duration_ms || 0,
          row.entered_at, row.left_at,
          row.viewed_resume ? 1 : 0, row.downloaded_resume ? 1 : 0, row.resume_dwell_ms || 0
        );
      }
    });
    insertMany(visits);
    console.log(`  Inserted ${visits.length} visits`);
  } else {
    console.log('  No visits to migrate');
  }

  console.log('Migrating module_dwell_times...');
  const dwells = await supabaseFetch('module_dwell_times');
  if (dwells && dwells.length > 0) {
    const insert = db.prepare(`
      INSERT INTO module_dwell_times (id, visit_id, share_link_id, module_name, dwell_time_ms, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((rows: any[]) => {
      for (const row of rows) {
        insert.run(row.id, row.visit_id, row.share_link_id, row.module_name, row.dwell_time_ms || 0, row.created_at);
      }
    });
    insertMany(dwells);
    console.log(`  Inserted ${dwells.length} dwell records`);
  } else {
    console.log('  No dwell records to migrate');
  }

  console.log('Migrating click_events...');
  const clicks = await supabaseFetch('click_events');
  if (clicks && clicks.length > 0) {
    const insert = db.prepare(`
      INSERT INTO click_events (id, visit_id, share_link_id, event_type, event_label, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((rows: any[]) => {
      for (const row of rows) {
        insert.run(row.id, row.visit_id, row.share_link_id, row.event_type, row.event_label, row.created_at);
      }
    });
    insertMany(clicks);
    console.log(`  Inserted ${clicks.length} click events`);
  } else {
    console.log('  No click events to migrate');
  }

  db.pragma('foreign_keys = ON');
  db.close();
  console.log('\n✅ Migration complete!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
