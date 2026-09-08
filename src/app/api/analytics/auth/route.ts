import { NextRequest } from 'next/server';
import {
  analyticsAuthConfigured,
  analyticsJson,
  clearAnalyticsSessionCookie,
  createAnalyticsSession,
  isAnalyticsAdmin,
  setAnalyticsSessionCookie,
  verifyAnalyticsPassword,
} from '@/lib/analytics-auth';
import {
  analyticsPayloadError,
  boundedString,
  enforceAnalyticsRateLimit,
  readAnalyticsJson,
  rejectCrossSiteRequest,
} from '@/lib/analytics-api';

export async function GET(req: NextRequest) {
  return analyticsJson({
    configured: analyticsAuthConfigured(),
    authenticated: isAnalyticsAdmin(req),
  });
}

export async function POST(req: NextRequest) {
  const crossSite = rejectCrossSiteRequest(req);
  if (crossSite) return crossSite;

  const limited = enforceAnalyticsRateLimit(req, 'admin-login', 5, 15 * 60 * 1000);
  if (limited) return limited;

  if (!analyticsAuthConfigured()) {
    return analyticsJson({ error: 'analytics admin is not configured' }, { status: 503 });
  }

  try {
    const body = await readAnalyticsJson(req, 2 * 1024);
    const password = boundedString(body.password, 256);
    if (!password || !verifyAnalyticsPassword(password)) {
      return analyticsJson({ error: 'invalid credentials' }, { status: 401 });
    }

    const session = createAnalyticsSession();
    if (!session) {
      return analyticsJson({ error: 'analytics admin is not configured' }, { status: 503 });
    }

    const response = analyticsJson({ authenticated: true });
    setAnalyticsSessionCookie(response, session);
    return response;
  } catch (error) {
    return analyticsPayloadError(error);
  }
}

export async function DELETE(req: NextRequest) {
  const crossSite = rejectCrossSiteRequest(req);
  if (crossSite) return crossSite;

  const response = analyticsJson({ authenticated: false });
  clearAnalyticsSessionCookie(response);
  return response;
}
