import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { analyticsJson, isAnalyticsAdmin, unauthorizedAnalyticsResponse } from '@/lib/analytics-auth';
import { analyticsPayloadError, isValidUuid } from '@/lib/analytics-api';

// GET /api/analytics/visits?link_id=xxx — get visits for a share link
export async function GET(req: NextRequest) {
  if (!isAnalyticsAdmin(req)) return unauthorizedAnalyticsResponse();

  try {
    const linkId = req.nextUrl.searchParams.get('link_id');
    if (!isValidUuid(linkId)) {
      return analyticsJson({ error: 'valid link_id is required' }, { status: 400 });
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

    return analyticsJson(rows);
  } catch (error: unknown) {
    return analyticsPayloadError(error);
  }
}
