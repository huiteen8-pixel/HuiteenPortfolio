import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendVisitSummaryEmail } from '@/lib/analytics-email';

type CompleteVisitBody = {
  visit_id?: string;
  duration_ms?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req);
    const visitId = body.visit_id;
    const durationMs = Number(body.duration_ms || 0);

    if (!visitId) {
      return NextResponse.json({ error: 'visit_id is required' }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    const visit = db.prepare(`
      SELECT id, completed_at, summary_email_sent_at
      FROM link_visits
      WHERE id = ?
    `).get(visitId) as
      | {
          id: string;
          completed_at: string | null;
          summary_email_sent_at: string | null;
        }
      | undefined;

    if (!visit) {
      return NextResponse.json({ error: 'visit not found' }, { status: 404 });
    }

    if (visit.summary_email_sent_at) {
      return NextResponse.json({ success: true, email_sent: false, reason: 'already_sent' });
    }

    if (visit.completed_at) {
      return NextResponse.json({ success: true, email_sent: false, reason: 'already_completed' });
    }

    db.prepare(`
      UPDATE link_visits
      SET duration_ms = MAX(duration_ms, ?),
          left_at = ?,
          completed_at = ?,
          summary_email_error = NULL
      WHERE id = ?
    `).run(Math.max(durationMs, 0), now, now, visitId);

    // Other pagehide beacons, especially module dwell records, often arrive beside this one.
    // Wait briefly before composing the summary so the email uses the final visit data.
    await sleep(800);

    const baseUrl = getBaseUrl(req);
    const result = await sendVisitSummaryEmail(db, visitId, baseUrl);

    if (result.sent) {
      db.prepare(`
        UPDATE link_visits
        SET summary_email_sent_at = ?, summary_email_error = NULL
        WHERE id = ?
      `).run(new Date().toISOString(), visitId);
    } else {
      db.prepare(`
        UPDATE link_visits
        SET summary_email_error = ?
        WHERE id = ?
      `).run(result.reason || 'email not sent', visitId);
    }

    return NextResponse.json({ success: true, email_sent: result.sent, reason: result.reason });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function parseBody(req: NextRequest): Promise<CompleteVisitBody> {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('text/plain')) {
    const text = await req.text();
    return JSON.parse(text);
  }
  return req.json();
}

function getBaseUrl(req: NextRequest) {
  if (process.env.ANALYTICS_PUBLIC_BASE_URL) {
    return process.env.ANALYTICS_PUBLIC_BASE_URL;
  }

  const forwardedProto = req.headers.get('x-forwarded-proto');
  const forwardedHost = req.headers.get('x-forwarded-host');
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return req.nextUrl.origin;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
