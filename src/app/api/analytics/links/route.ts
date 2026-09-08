import { NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { getDb, generateUUID } from '@/lib/db';
import { analyticsJson, isAnalyticsAdmin, unauthorizedAnalyticsResponse } from '@/lib/analytics-auth';
import {
  analyticsPayloadError,
  boundedString,
  isValidUuid,
  readAnalyticsJson,
  rejectCrossSiteRequest,
} from '@/lib/analytics-api';

// POST /api/analytics/links — create a new share link
export async function POST(req: NextRequest) {
  if (!isAnalyticsAdmin(req)) return unauthorizedAnalyticsResponse();
  const crossSite = rejectCrossSiteRequest(req);
  if (crossSite) return crossSite;

  try {
    const body = await readAnalyticsJson(req);
    const name = boundedString(body.name, 100);
    if (!name) {
      return analyticsJson({ error: 'name is required' }, { status: 400 });
    }

    const slug = generateSlug();
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO share_links (id, name, slug, click_count, is_active, created_at)
      VALUES (?, ?, ?, 0, 1, ?)
      RETURNING id, name, slug, click_count, is_active, created_at
    `).get(generateUUID(), name.trim(), slug, new Date().toISOString());

    return analyticsJson(result, { status: 201 });
  } catch (error: unknown) {
    return analyticsPayloadError(error);
  }
}

// GET /api/analytics/links — list all share links
export async function GET(req: NextRequest) {
  if (!isAnalyticsAdmin(req)) return unauthorizedAnalyticsResponse();

  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT id, name, slug, click_count, is_active, created_at
      FROM share_links
      ORDER BY created_at DESC
    `).all();

    return analyticsJson(rows);
  } catch (error: unknown) {
    return analyticsPayloadError(error);
  }
}

// DELETE /api/analytics/links?id=xxx — delete a share link
export async function DELETE(req: NextRequest) {
  if (!isAnalyticsAdmin(req)) return unauthorizedAnalyticsResponse();
  const crossSite = rejectCrossSiteRequest(req);
  if (crossSite) return crossSite;

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!isValidUuid(id)) {
      return analyticsJson({ error: 'valid id is required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM share_links WHERE id = ?').run(id);

    return analyticsJson({ success: true });
  } catch (error: unknown) {
    return analyticsPayloadError(error);
  }
}

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(randomBytes(10), (byte) => chars[byte % chars.length]).join('');
}
