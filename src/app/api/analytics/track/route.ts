import { NextRequest } from 'next/server';
import { getDb, generateUUID, withTransaction } from '@/lib/db';
import { analyticsJson } from '@/lib/analytics-auth';
import {
  analyticsPayloadError,
  anonymizeIp,
  createVisitToken,
  enforceAnalyticsRateLimit,
  getClientIp,
  isValidSlug,
  readAnalyticsJson,
  rejectCrossSiteRequest,
} from '@/lib/analytics-api';

const DEFAULT_ANALYTICS_RETENTION_DAYS = 90;
const MIN_ANALYTICS_RETENTION_DAYS = 1;
const MAX_ANALYTICS_RETENTION_DAYS = 3650;
const MAX_VISITS_PER_SHARE_LINK = 10_000;

// POST /api/analytics/track — record a visit for a share link slug
export async function POST(req: NextRequest) {
  const crossSite = rejectCrossSiteRequest(req);
  if (crossSite) return crossSite;
  const limited = enforceAnalyticsRateLimit(req, 'track', 15, 60_000);
  if (limited) return limited;

  try {
    const body = await readAnalyticsJson(req, 2 * 1024);
    const slug = body.slug;
    if (!isValidSlug(slug)) {
      return analyticsJson({ error: 'valid slug is required' }, { status: 400 });
    }

    const db = getDb();

    // Share links are management records and may only be created from the authenticated
    // dashboard. Never turn untrusted visitor input into a new management record.
    const link = db.prepare('SELECT id, is_active FROM share_links WHERE slug = ?').get(slug) as
      | { id: string; is_active: number }
      | undefined;

    if (!link) {
      return analyticsJson({ error: '分享链接不存在' }, { status: 404 });
    }

    if (!link.is_active) {
      return analyticsJson({ error: '链接已停用' }, { status: 410 });
    }

    const rawIp = getClientIp(req);
    const ip = anonymizeIp(rawIp);
    const userAgent = (req.headers.get('user-agent') || '').slice(0, 512);
    const referrer = (req.headers.get('referer') || '').slice(0, 512);

    // Get geolocation from IP
    let location = '未知';
    let city = '';
    let country = '';
    let region = '';
    if (rawIp && process.env.ANALYTICS_IP_GEOLOCATION_ENABLED === 'true' && !isPrivateIp(rawIp)) {
      const geoInfo = await getIpLocation(rawIp);
      location = geoInfo.location;
      city = geoInfo.city;
      country = geoInfo.country;
      region = geoInfo.region;
    }

    // Prune and record atomically so a link never grows past the rolling limit.
    // Child module/click rows are removed by their visit foreign keys.
    const visitId = generateUUID();
    const visitedAt = new Date().toISOString();
    const retentionCutoff = new Date(
      Date.now() - getAnalyticsRetentionDays() * 24 * 60 * 60 * 1000
    ).toISOString();

    withTransaction((transactionDb) => {
      transactionDb.prepare(`
        DELETE FROM link_visits
        WHERE share_link_id = ? AND visited_at < ?
      `).run(link.id, retentionCutoff);

      const current = transactionDb.prepare(`
        SELECT COUNT(*) AS count FROM link_visits WHERE share_link_id = ?
      `).get(link.id) as { count: number };
      const excessBeforeInsert = Math.max(0, current.count - MAX_VISITS_PER_SHARE_LINK + 1);

      if (excessBeforeInsert > 0) {
        transactionDb.prepare(`
          DELETE FROM link_visits
          WHERE id IN (
            SELECT id
            FROM link_visits
            WHERE share_link_id = ?
            ORDER BY visited_at ASC, id ASC
            LIMIT ?
          )
        `).run(link.id, excessBeforeInsert);
      }

      transactionDb.prepare(`
        INSERT INTO link_visits (
          id, share_link_id, ip, location, city, country, region,
          user_agent, referrer, visited_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        visitId,
        link.id,
        ip,
        location,
        city,
        country,
        region,
        userAgent,
        referrer,
        visitedAt
      );

      transactionDb.prepare(
        'UPDATE share_links SET click_count = click_count + 1 WHERE id = ?'
      ).run(link.id);
    });

    return analyticsJson({
      success: true,
      visit_id: visitId,
      token: createVisitToken(visitId),
    });
  } catch (error: unknown) {
    return analyticsPayloadError(error);
  }
}

function getAnalyticsRetentionDays() {
  const configured = process.env.ANALYTICS_RETENTION_DAYS?.trim();
  if (!configured || !/^-?\d+$/.test(configured)) {
    return DEFAULT_ANALYTICS_RETENTION_DAYS;
  }

  const parsed = Number.parseInt(configured, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_ANALYTICS_RETENTION_DAYS;
  return Math.min(
    MAX_ANALYTICS_RETENTION_DAYS,
    Math.max(MIN_ANALYTICS_RETENTION_DAYS, parsed)
  );
}

function isPrivateIp(ip: string) {
  const normalized = ip.toLowerCase();
  if (normalized.startsWith('::ffff:')) {
    return isPrivateIp(normalized.slice('::ffff:'.length));
  }

  return (
    normalized === '::1' ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('127.') ||
    normalized.startsWith('10.') ||
    normalized.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(normalized)
  );
}

async function getIpLocation(ip: string): Promise<{ location: string; city: string; country: string; region: string }> {
  try {
    const res = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country,region,city,connection`,
      { signal: AbortSignal.timeout(3_000), cache: 'no-store' }
    );
    if (res.ok) {
      const data = await res.json() as {
        success?: boolean;
        country?: string;
        region?: string;
        city?: string;
        connection?: { isp?: string };
      };
      if (data.success) {
        const parts = [data.country, data.region, data.city, data.connection?.isp].filter(Boolean);
        return {
          location: parts.join(' ') || '未知',
          city: data.city || '',
          country: data.country || '',
          region: data.region || '',
        };
      }
    }
  } catch {
    // ignore
  }
  return { location: '未知', city: '', country: '', region: '' };
}
