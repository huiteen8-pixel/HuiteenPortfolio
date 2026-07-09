import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateUUID, withTransaction } from '@/lib/db';

// POST /api/analytics/module-dwell — record module dwell times
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let body: Record<string, unknown>;

    if (contentType.includes('text/plain')) {
      const text = await req.text();
      body = JSON.parse(text);
    } else {
      body = await req.json();
    }

    const { visit_id, share_link_id, records } = body as {
      visit_id?: string;
      share_link_id?: string;
      records?: { module_name: string; dwell_time_ms: number }[];
    };

    if (!visit_id || !records || records.length === 0) {
      return NextResponse.json({ error: 'visit_id and records are required' }, { status: 400 });
    }

    const db = getDb();

    // Get share_link_id from visit if not provided
    let linkId = share_link_id;
    if (!linkId) {
      const visit = db.prepare('SELECT share_link_id FROM link_visits WHERE id = ?').get(visit_id) as
        | { share_link_id: string }
        | undefined;
      linkId = visit?.share_link_id;
    }

    if (!linkId) {
      return NextResponse.json({ error: 'Could not determine share_link_id' }, { status: 400 });
    }

    withTransaction(() => {
      for (const record of records) {
        const existing = db.prepare(`
          SELECT id, dwell_time_ms FROM module_dwell_times
          WHERE visit_id = ? AND module_name = ?
        `).get(visit_id, record.module_name) as
          | { id: string; dwell_time_ms: number }
          | undefined;

        if (existing) {
          if (record.dwell_time_ms > existing.dwell_time_ms) {
            db.prepare(`
              UPDATE module_dwell_times
              SET dwell_time_ms = ?
              WHERE id = ?
            `).run(record.dwell_time_ms, existing.id);
          }
        } else {
          db.prepare(`
            INSERT INTO module_dwell_times (id, visit_id, share_link_id, module_name, dwell_time_ms, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            generateUUID(), visit_id, linkId, record.module_name, record.dwell_time_ms, new Date().toISOString()
          );
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/analytics/module-dwell?visit_id=xxx — get module dwell times for a visit
export async function GET(req: NextRequest) {
  try {
    const visitId = req.nextUrl.searchParams.get('visit_id');
    if (!visitId) {
      return NextResponse.json({ error: 'visit_id is required' }, { status: 400 });
    }

    const db = getDb();
    const rows = db.prepare(`
      SELECT module_name, dwell_time_ms
      FROM module_dwell_times
      WHERE visit_id = ?
      ORDER BY dwell_time_ms DESC
    `).all(visitId);

    return NextResponse.json(rows || []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
