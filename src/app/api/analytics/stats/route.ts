import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/analytics/stats?link_id=xxx — get analytics stats for a share link
export async function GET(req: NextRequest) {
  try {
    const linkId = req.nextUrl.searchParams.get('link_id');
    if (!linkId) {
      return NextResponse.json({ error: 'link_id is required' }, { status: 400 });
    }

    const db = getDb();

    // 1. Total visits
    const totalVisits = db.prepare(`
      SELECT COUNT(*) as count FROM link_visits WHERE share_link_id = ?
    `).get(linkId) as { count: number };

    // 2. Unique IPs
    const ipRows = db.prepare(`
      SELECT DISTINCT ip FROM link_visits WHERE share_link_id = ?
    `).all(linkId) as { ip: string }[];
    const uniqueIps = ipRows.length;

    // 3. Total duration (sum of all visits)
    const durationRows = db.prepare(`
      SELECT id, duration_ms FROM link_visits
      WHERE share_link_id = ? AND duration_ms > 0
    `).all(linkId) as { id: string; duration_ms: number }[];
    const totalDurationMs = durationRows.reduce((sum, v) => sum + v.duration_ms, 0);

    // 4. Top locations
    const locationRows = db.prepare(`
      SELECT city, country, region FROM link_visits WHERE share_link_id = ?
    `).all(linkId) as { city: string; country: string; region: string }[];

    const locationMap: Record<string, number> = {};
    locationRows.forEach((v) => {
      const loc = [v.city, v.region, v.country].filter(Boolean).join(', ') || '未知';
      locationMap[loc] = (locationMap[loc] || 0) + 1;
    });

    const topLocations = Object.entries(locationMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([location, count]) => ({ location, count }));

    // 5. Top modules by normalized dwell time.
    // A visit can have overlapping sections or legacy over-counted records. Normalize per
    // visit only when module totals exceed visit duration, so displayed module totals never
    // exceed total visit duration.
    const moduleRows = db.prepare(`
      SELECT visit_id, module_name, dwell_time_ms FROM module_dwell_times WHERE share_link_id = ?
    `).all(linkId) as { visit_id: string; module_name: string; dwell_time_ms: number }[];

    const moduleMap: Record<string, number> = {};
    const modulesByVisit: Record<string, { module_name: string; dwell_time_ms: number }[]> = {};
    moduleRows.forEach((m) => {
      if (!modulesByVisit[m.visit_id]) modulesByVisit[m.visit_id] = [];
      modulesByVisit[m.visit_id].push({
        module_name: m.module_name,
        dwell_time_ms: Math.max(m.dwell_time_ms || 0, 0),
      });
    });

    durationRows.forEach((visit) => {
      const records = modulesByVisit[visit.id] || [];
      const rawModuleTotal = records.reduce((sum, m) => sum + m.dwell_time_ms, 0);

      if (rawModuleTotal <= 0) {
        return;
      }

      const scale = rawModuleTotal > visit.duration_ms ? visit.duration_ms / rawModuleTotal : 1;
      records.forEach((m) => {
        moduleMap[m.module_name] = (moduleMap[m.module_name] || 0) + m.dwell_time_ms * scale;
      });
    });

    const moduleTotals = Object.entries(moduleMap)
      .map(([name, totalMs]) => ({
        module_name: name,
        total_dwell_ms: Math.round(totalMs),
      }));

    const roundedOverflow = moduleTotals.reduce((sum, m) => sum + m.total_dwell_ms, 0) - totalDurationMs;
    if (roundedOverflow > 0 && moduleTotals.length > 0) {
      moduleTotals.sort((a, b) => b.total_dwell_ms - a.total_dwell_ms);
      moduleTotals[0].total_dwell_ms = Math.max(moduleTotals[0].total_dwell_ms - roundedOverflow, 0);
    }

    const trackedModuleDurationMs = moduleTotals.reduce((sum, m) => sum + m.total_dwell_ms, 0);

    const topModules = moduleTotals
      .sort((a, b) => b.total_dwell_ms - a.total_dwell_ms)
      .slice(0, 10);

    // 6. Device and browser stats
    const uaRows = db.prepare(`
      SELECT user_agent FROM link_visits WHERE share_link_id = ?
    `).all(linkId) as { user_agent: string }[];

    const deviceMap: Record<string, number> = {};
    const browserMap: Record<string, number> = {};

    uaRows.forEach((v) => {
      const ua = v.user_agent || '';
      const device = parseDevice(ua);
      const browser = parseBrowser(ua);
      deviceMap[device] = (deviceMap[device] || 0) + 1;
      browserMap[browser] = (browserMap[browser] || 0) + 1;
    });

    // 7. Resume interaction stats
    const resumeRows = db.prepare(`
      SELECT viewed_resume, downloaded_resume FROM link_visits WHERE share_link_id = ?
    `).all(linkId) as { viewed_resume: number; downloaded_resume: number }[];

    const resumeViewed = resumeRows.filter((v) => v.viewed_resume === 1).length;
    const resumeDownloaded = resumeRows.filter((v) => v.downloaded_resume === 1).length;

    // 8. Click event stats
    const clickRows = db.prepare(`
      SELECT event_type, event_label FROM click_events WHERE share_link_id = ?
    `).all(linkId) as { event_type: string; event_label: string }[];

    const clickEventMap: Record<string, number> = {};
    clickRows.forEach((e) => {
      clickEventMap[e.event_label] = (clickEventMap[e.event_label] || 0) + 1;
    });

    const clickEventStats = Object.entries(clickEventMap)
      .map(([label, count]) => ({ event_label: label, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      total_visits: totalVisits?.count || 0,
      unique_visitors: uniqueIps,
      total_duration_ms: totalDurationMs,
      tracked_module_duration_ms: trackedModuleDurationMs,
      top_locations: topLocations,
      top_modules: topModules,
      devices: deviceMap,
      browsers: browserMap,
      resume_viewed: resumeViewed,
      resume_downloaded: resumeDownloaded,
      click_events: clickEventStats,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseDevice(ua: string): string {
  if (!ua) return '未知';
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android';
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Linux/i.test(ua)) return 'Linux';
  return '其他';
}

function parseBrowser(ua: string): string {
  if (!ua) return '未知';
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Chrome';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari';
  return '其他';
}
