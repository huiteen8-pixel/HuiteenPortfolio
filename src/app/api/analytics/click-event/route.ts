import { NextRequest } from 'next/server';
import { getDb, generateUUID } from '@/lib/db';
import { analyticsJson, isAnalyticsAdmin, unauthorizedAnalyticsResponse } from '@/lib/analytics-auth';
import {
  analyticsPayloadError,
  enforceAnalyticsRateLimit,
  isValidEventLabel,
  isValidEventType,
  isValidUuid,
  readAnalyticsJson,
  rejectCrossSiteRequest,
  verifyVisitToken,
} from '@/lib/analytics-api';

const MAX_CLICK_EVENTS_PER_VISIT = 20;

// POST /api/analytics/click-event
// Body: { visit_id, event_type, event_label }
export async function POST(req: NextRequest) {
  const crossSite = rejectCrossSiteRequest(req);
  if (crossSite) return crossSite;
  const limited = enforceAnalyticsRateLimit(req, 'click-event', 60, 60_000);
  if (limited) return limited;

  try {
    const body = await readAnalyticsJson(req);
    const visitId = body.visit_id;
    const eventType = body.event_type;
    const eventLabel = body.event_label;

    if (
      !isValidUuid(visitId) ||
      !isValidEventType(eventType) ||
      !isValidEventLabel(eventLabel)
    ) {
      return analyticsJson({ error: 'invalid event payload' }, { status: 400 });
    }
    if (!verifyVisitToken(visitId, body.token)) {
      return analyticsJson({ error: 'invalid visit token' }, { status: 403 });
    }

    const db = getDb();
    const visit = db.prepare('SELECT share_link_id FROM link_visits WHERE id = ?').get(visitId) as
      | { share_link_id: string }
      | undefined;
    if (!visit) {
      return analyticsJson({ error: 'visit not found' }, { status: 404 });
    }

    const insert = db.prepare(`
      INSERT INTO click_events (id, visit_id, share_link_id, event_type, event_label, created_at)
      SELECT ?, ?, ?, ?, ?, ?
      WHERE (
        SELECT COUNT(*) FROM click_events WHERE visit_id = ?
      ) < ?
    `).run(
      generateUUID(),
      visitId,
      visit.share_link_id,
      eventType,
      eventLabel,
      new Date().toISOString(),
      visitId,
      MAX_CLICK_EVENTS_PER_VISIT
    );

    return analyticsJson({ success: true, recorded: insert.changes > 0 });
  } catch (error) {
    return analyticsPayloadError(error);
  }
}

// GET /api/analytics/click-event?link_id=xxx — get click event stats for a link
export async function GET(req: NextRequest) {
  if (!isAnalyticsAdmin(req)) return unauthorizedAnalyticsResponse();

  try {
    const linkId = req.nextUrl.searchParams.get('link_id');
    if (!isValidUuid(linkId)) {
      return analyticsJson({ error: 'valid link_id is required' }, { status: 400 });
    }

    const db = getDb();
    const rows = db.prepare(`
      SELECT event_type, event_label, COUNT(*) AS count
      FROM click_events
      WHERE share_link_id = ?
      GROUP BY event_type, event_label
      ORDER BY count DESC, event_label ASC
    `).all(linkId) as { event_type: string; event_label: string; count: number }[];

    return analyticsJson({
      events: rows,
      total: rows.reduce((sum, row) => sum + row.count, 0),
    });
  } catch (error) {
    return analyticsPayloadError(error);
  }
}
