import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/analytics/visits?link_id=xxx — get visits for a share link
export async function GET(req: NextRequest) {
  try {
    const linkId = req.nextUrl.searchParams.get('link_id');
    if (!linkId) {
      return NextResponse.json({ error: 'link_id is required' }, { status: 400 });
    }

    const db = getDb();
    const rows = db.prepare(`
      SELECT id, ip, location, city, country, region, user_agent, referrer,
             visited_at, duration_ms, entered_at, left_at
      FROM link_visits
      WHERE share_link_id = ?
      ORDER BY visited_at DESC
      LIMIT 500
    `).all(linkId);

    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
