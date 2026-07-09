import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateUUID } from '@/lib/db';

// POST /api/analytics/click-event
// Body: { visit_id, event_type, event_label }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { visit_id, event_type, event_label } = body as {
      visit_id?: string;
      event_type?: string;
      event_label?: string;
    };

    if (!visit_id || !event_type || !event_label) {
      return NextResponse.json({ error: 'visit_id, event_type, event_label required' }, { status: 400 });
    }

    const db = getDb();
    const visit = db.prepare('SELECT share_link_id FROM link_visits WHERE id = ?').get(visit_id) as
      | { share_link_id: string }
      | undefined;

    db.prepare(`
      INSERT INTO click_events (id, visit_id, share_link_id, event_type, event_label, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      generateUUID(), visit_id, visit?.share_link_id ?? null, event_type, event_label, new Date().toISOString()
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Click event error:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

// GET /api/analytics/click-event?link_id=xxx — get click event stats for a link
export async function GET(req: NextRequest) {
  try {
    const linkId = req.nextUrl.searchParams.get('link_id');
    if (!linkId) {
      return NextResponse.json({ error: 'link_id is required' }, { status: 400 });
    }

    const db = getDb();
    const rows = db.prepare(`
      SELECT event_type, event_label FROM click_events WHERE share_link_id = ?
    `).all(linkId) as { event_type: string; event_label: string }[];

    const stats: Record<string, { event_type: string; count: number }> = {};
    for (const row of rows) {
      if (!stats[row.event_label]) {
        stats[row.event_label] = { event_type: row.event_type, count: 0 };
      }
      stats[row.event_label].count++;
    }

    return NextResponse.json({
      events: Object.entries(stats).map(([label, info]) => ({
        event_label: label,
        event_type: info.event_type,
        count: info.count,
      })),
      total: rows.length,
    });
  } catch (e) {
    console.error('Click events error:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
