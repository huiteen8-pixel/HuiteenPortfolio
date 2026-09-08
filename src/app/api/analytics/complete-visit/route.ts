import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { sendVisitSummaryEmail } from '@/lib/analytics-email';
import { analyticsJson } from '@/lib/analytics-auth';
import {
  analyticsPayloadError,
  boundedDuration,
  enforceAnalyticsGlobalRateLimit,
  enforceAnalyticsRateLimit,
  isValidUuid,
  readAnalyticsJson,
  rejectCrossSiteRequest,
  verifyVisitToken,
} from '@/lib/analytics-api';

type CompleteVisitBody = {
  visit_id?: string;
  duration_ms?: number;
  token?: string;
};

export async function POST(req: NextRequest) {
  const crossSite = rejectCrossSiteRequest(req);
  if (crossSite) return crossSite;
  const limited = enforceAnalyticsRateLimit(req, 'complete-visit', 10, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await readAnalyticsJson(req) as CompleteVisitBody;
    const visitId = body.visit_id;
    const durationMs = boundedDuration(body.duration_ms);

    if (!isValidUuid(visitId) || durationMs === null) {
      return analyticsJson({ error: 'invalid visit payload' }, { status: 400 });
    }
    if (!verifyVisitToken(visitId, body.token)) {
      return analyticsJson({ error: 'invalid visit token' }, { status: 403 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    const visit = db.prepare(`
      SELECT id, summary_email_sent_at
      FROM link_visits
      WHERE id = ?
    `).get(visitId) as
      | {
          id: string;
          summary_email_sent_at: string | null;
        }
      | undefined;

    if (!visit) {
      return analyticsJson({ error: 'visit not found' }, { status: 404 });
    }

    if (visit.summary_email_sent_at) {
      return analyticsJson({ success: true, email_sent: false });
    }

    db.prepare(`
      UPDATE link_visits
      SET duration_ms = MAX(duration_ms, ?),
          left_at = ?,
          completed_at = COALESCE(completed_at, ?)
      WHERE id = ?
    `).run(durationMs, now, now, visitId);

    const configuredMinimum = Number(process.env.ANALYTICS_EMAIL_MIN_DURATION_MS || 10_000);
    const minimumEmailDuration =
      Number.isFinite(configuredMinimum) && configuredMinimum >= 1_000
        ? Math.round(configuredMinimum)
        : 10_000;
    if (durationMs < minimumEmailDuration) {
      return analyticsJson({ success: true, email_sent: false });
    }

    // Claim the send attempt atomically. Concurrent completions see a recent
    // attempt and skip; a failed attempt can be retried after the cool-down.
    const staleAttempt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const claimed = db.prepare(`
      UPDATE link_visits
      SET summary_email_attempted_at = ?, summary_email_error = NULL
      WHERE id = ?
        AND summary_email_sent_at IS NULL
        AND (
          summary_email_attempted_at IS NULL
          OR summary_email_attempted_at < ?
        )
    `).run(now, visitId, staleAttempt);
    if (claimed.changes === 0) {
      return analyticsJson({ success: true, email_sent: false });
    }

    // Consume the shared SMTP budget only after this visit owns the atomic
    // claim. Replaying one valid token must not exhaust email delivery for all
    // other visits.
    const emailLimited = enforceAnalyticsGlobalRateLimit('summary-email', 10, 60 * 60 * 1000);
    if (emailLimited) {
      db.prepare(`
        UPDATE link_visits SET summary_email_error = ? WHERE id = ?
      `).run('email rate limit reached', visitId);
      return analyticsJson({ success: true, email_sent: false });
    }

    const baseUrl = getBaseUrl();
    let result: Awaited<ReturnType<typeof sendVisitSummaryEmail>>;
    try {
      result = await sendVisitSummaryEmail(db, visitId, baseUrl);
    } catch {
      // Do not echo mail transport details (which can contain private host or
      // recipient data) into the public response or application logs.
      db.prepare(`
        UPDATE link_visits
        SET summary_email_error = ?
        WHERE id = ?
      `).run('email delivery failed', visitId);
      return analyticsJson({ success: true, email_sent: false });
    }

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

    return analyticsJson({ success: true, email_sent: result.sent });
  } catch (error: unknown) {
    return analyticsPayloadError(error);
  }
}

function getBaseUrl() {
  const configuredBaseUrl = process.env.ANALYTICS_PUBLIC_BASE_URL?.trim();
  if (configuredBaseUrl) {
    try {
      const url = new URL(configuredBaseUrl);
      if ((url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password) {
        return url.origin;
      }
    } catch {
      // Fall through to a local URL instead of trusting request headers.
    }
  }

  // Never copy Host or forwarding headers into an email link.
  return 'http://localhost';
}
