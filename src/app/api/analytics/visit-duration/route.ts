import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST /api/analytics/visit-duration — update visit duration
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let body: Record<string, unknown>;

    // Handle both JSON and sendBeacon (text/plain) payloads
    if (contentType.includes('text/plain')) {
      const text = await req.text();
      body = JSON.parse(text);
    } else {
      body = await req.json();
    }

    const { visit_id, duration_ms } = body as { visit_id?: string; duration_ms?: number };

    if (!visit_id) {
      return NextResponse.json({ error: 'visit_id is required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(`
      UPDATE link_visits
      SET duration_ms = ?, left_at = ?
      WHERE id = ?
    `).run(duration_ms || 0, new Date().toISOString(), visit_id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
