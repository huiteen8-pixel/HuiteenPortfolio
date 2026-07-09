import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/analytics/visit-dwell?visit_id=xxx — get module dwell times for a single visit
export async function GET(req: NextRequest) {
  try {
    const visitId = req.nextUrl.searchParams.get('visit_id');
    if (!visitId) {
      return NextResponse.json({ error: 'visit_id is required' }, { status: 400 });
    }

    const db = getDb();

    const records = db.prepare(`
      SELECT module_name, dwell_time_ms FROM module_dwell_times
      WHERE visit_id = ? ORDER BY module_name
    `).all(visitId) as { module_name: string; dwell_time_ms: number }[];

    const visit = db.prepare(`
      SELECT viewed_resume, resume_dwell_ms, downloaded_resume
      FROM link_visits WHERE id = ?
    `).get(visitId) as
      | { viewed_resume: number; resume_dwell_ms: number; downloaded_resume: number }
      | undefined;

    const totalDwell = (records || []).reduce((sum, r) => sum + r.dwell_time_ms, 0);

    return NextResponse.json({
      modules: records || [],
      total_dwell_ms: totalDwell,
      viewed_resume: visit?.viewed_resume === 1,
      resume_dwell_ms: visit?.resume_dwell_ms ?? 0,
      downloaded_resume: visit?.downloaded_resume === 1,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
