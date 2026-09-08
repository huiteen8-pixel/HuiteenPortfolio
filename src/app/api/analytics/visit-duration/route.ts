import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { analyticsJson } from '@/lib/analytics-auth';
import {
  analyticsPayloadError,
  boundedDuration,
  enforceAnalyticsRateLimit,
  isValidUuid,
  readAnalyticsJson,
  rejectCrossSiteRequest,
  verifyVisitToken,
} from '@/lib/analytics-api';

// POST /api/analytics/visit-duration — update visit duration
export async function POST(req: NextRequest) {
  const crossSite = rejectCrossSiteRequest(req);
  if (crossSite) return crossSite;
  const limited = enforceAnalyticsRateLimit(req, 'visit-duration', 30, 60_000);
  if (limited) return limited;

  try {
    const body = await readAnalyticsJson(req);
    const visitId = body.visit_id;
    const durationMs = boundedDuration(body.duration_ms);
    if (!isValidUuid(visitId) || durationMs === null) {
      return analyticsJson({ error: 'invalid visit payload' }, { status: 400 });
    }
    if (!verifyVisitToken(visitId, body.token)) {
      return analyticsJson({ error: 'invalid visit token' }, { status: 403 });
    }

    const db = getDb();
    const result = db.prepare(`
      UPDATE link_visits
      SET duration_ms = MAX(duration_ms, ?), left_at = ?
      WHERE id = ?
    `).run(durationMs, new Date().toISOString(), visitId);

    if (result.changes === 0) {
      return analyticsJson({ error: 'visit not found' }, { status: 404 });
    }

    return analyticsJson({ success: true });
  } catch (error: unknown) {
    return analyticsPayloadError(error);
  }
}
