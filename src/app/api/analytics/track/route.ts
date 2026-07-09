import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateUUID } from '@/lib/db';

// POST /api/analytics/track — record a visit for a share link slug
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug } = body;
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    const db = getDb();

    // Find the share link by slug, or create it if not exists
    let link = db.prepare('SELECT id, is_active FROM share_links WHERE slug = ?').get(slug) as
      | { id: string; is_active: number }
      | undefined;

    if (!link) {
      // Auto-create the link if it doesn't exist
      const linkId = generateUUID();
      db.prepare(`
        INSERT INTO share_links (id, name, slug, click_count, is_active, created_at)
        VALUES (?, ?, ?, 0, 1, ?)
      `).run(linkId, slug, slug, new Date().toISOString());
      link = { id: linkId, is_active: 1 };
    }

    if (!link.is_active) {
      return NextResponse.json({ error: '链接已停用' }, { status: 410 });
    }

    // Extract visitor info
    const ip = extractIp(req);
    const userAgent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer') || '';

    // Get geolocation from IP
    let location = '未知';
    let city = '';
    let country = '';
    let region = '';
    if (ip && ip !== '127.0.0.1' && ip !== '::1') {
      const geoInfo = await getIpLocation(ip);
      location = geoInfo.location;
      city = geoInfo.city;
      country = geoInfo.country;
      region = geoInfo.region;
    }

    // Record the visit
    const visitId = generateUUID();
    const visitedAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO link_visits (
        id, share_link_id, ip, location, city, country, region,
        user_agent, referrer, visited_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      visitId, link.id, ip, location, city, country, region,
      userAgent.substring(0, 512), referrer.substring(0, 512), visitedAt
    );

    // Increment click count atomically (替代 RPC)
    db.prepare('UPDATE share_links SET click_count = click_count + 1 WHERE id = ?').run(link.id);

    return NextResponse.json({ success: true, visit_id: visitId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function extractIp(req: NextRequest): string {
  const isLocalIp = (ip: string) =>
    ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'].includes(ip);

  const candidates = [
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
    req.headers.get('x-real-ip')?.trim(),
    req.headers.get('cf-connecting-ip')?.trim(),
  ].filter(Boolean) as string[];

  for (const ip of candidates) {
    if (!isLocalIp(ip)) return ip;
  }

  return '8.8.8.8';
}

async function getIpLocation(ip: string): Promise<{ location: string; city: string; country: string; region: string }> {
  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?lang=zh-CN&fields=status,country,regionName,city,isp`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        const parts = [data.country, data.regionName, data.city, data.isp].filter(Boolean);
        return {
          location: parts.join(' ') || '未知',
          city: data.city || '',
          country: data.country || '',
          region: data.regionName || '',
        };
      }
    }
  } catch {
    // ignore
  }
  return { location: '未知', city: '', country: '', region: '' };
}
