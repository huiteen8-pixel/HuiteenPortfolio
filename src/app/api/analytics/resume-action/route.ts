import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST /api/analytics/resume-action
// Body: { visit_id, action: 'view_resume' | 'download_resume', dwell_ms?: number }
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
    const { visit_id, action, dwell_ms } = body as {
      visit_id?: string;
      action?: string;
      dwell_ms?: number;
    };

    if (!visit_id || !action) {
      return NextResponse.json({ error: 'visit_id and action required' }, { status: 400 });
    }

    const db = getDb();
    const updates: Record<string, number | string> = {};

    if (action === 'view_resume') {
      updates.viewed_resume = 1;
      if (typeof dwell_ms === 'number' && dwell_ms > 0) {
        updates.resume_dwell_ms = dwell_ms;
      }
    } else if (action === 'download_resume') {
      updates.downloaded_resume = 1;
    } else {
      return NextResponse.json({ error: 'invalid action' }, { status: 400 });
    }

    const setClause = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), visit_id];
    db.prepare(`UPDATE link_visits SET ${setClause} WHERE id = ?`).run(...values);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Resume action error:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
