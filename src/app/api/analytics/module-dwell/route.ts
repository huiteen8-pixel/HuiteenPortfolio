import { NextRequest } from 'next/server';
import { getDb, generateUUID, withTransaction } from '@/lib/db';
import { analyticsJson, isAnalyticsAdmin, unauthorizedAnalyticsResponse } from '@/lib/analytics-auth';
import {
  analyticsPayloadError,
  boundedDuration,
  enforceAnalyticsRateLimit,
  isValidModuleName,
  isValidUuid,
  readAnalyticsJson,
  rejectCrossSiteRequest,
  verifyVisitToken,
} from '@/lib/analytics-api';

type DwellRecord = { module_name: string; dwell_time_ms: number };

// POST /api/analytics/module-dwell — record module dwell times
export async function POST(req: NextRequest) {
  const crossSite = rejectCrossSiteRequest(req);
  if (crossSite) return crossSite;
  const limited = enforceAnalyticsRateLimit(req, 'module-dwell', 30, 60_000);
  if (limited) return limited;

  try {
    const body = await readAnalyticsJson(req);
    const visitId = body.visit_id;
    if (!isValidUuid(visitId) || !verifyVisitToken(visitId, body.token)) {
      return analyticsJson({ error: 'invalid visit credentials' }, { status: 403 });
    }

    if (!Array.isArray(body.records) || body.records.length === 0 || body.records.length > 32) {
      return analyticsJson({ error: 'records must contain 1 to 32 items' }, { status: 400 });
    }

    const records: DwellRecord[] = [];
    for (const value of body.records) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return analyticsJson({ error: 'invalid dwell record' }, { status: 400 });
      }
      const record = value as Record<string, unknown>;
      const duration = boundedDuration(record.dwell_time_ms);
      if (!isValidModuleName(record.module_name) || duration === null) {
        return analyticsJson({ error: 'invalid dwell record' }, { status: 400 });
      }
      records.push({ module_name: record.module_name, dwell_time_ms: duration });
    }

    const db = getDb();
    const visit = db.prepare('SELECT share_link_id FROM link_visits WHERE id = ?').get(visitId) as
      | { share_link_id: string }
      | undefined;

    if (!visit) {
      return analyticsJson({ error: 'visit not found' }, { status: 404 });
    }

    withTransaction(() => {
      for (const record of records) {
        const existing = db.prepare(`
          SELECT id, dwell_time_ms FROM module_dwell_times
          WHERE visit_id = ? AND module_name = ?
        `).get(visitId, record.module_name) as
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
            generateUUID(), visitId, visit.share_link_id, record.module_name, record.dwell_time_ms, new Date().toISOString()
          );
        }
      }
    });

    return analyticsJson({ success: true });
  } catch (error: unknown) {
    return analyticsPayloadError(error);
  }
}

// GET /api/analytics/module-dwell?visit_id=xxx — get module dwell times for a visit
export async function GET(req: NextRequest) {
  if (!isAnalyticsAdmin(req)) return unauthorizedAnalyticsResponse();

  try {
    const visitId = req.nextUrl.searchParams.get('visit_id');
    if (!isValidUuid(visitId)) {
      return analyticsJson({ error: 'valid visit_id is required' }, { status: 400 });
    }

    const db = getDb();
    const rows = db.prepare(`
      SELECT module_name, dwell_time_ms
      FROM module_dwell_times
      WHERE visit_id = ?
      ORDER BY dwell_time_ms DESC
    `).all(visitId);

    return analyticsJson(rows || []);
  } catch (error: unknown) {
    return analyticsPayloadError(error);
  }
}
