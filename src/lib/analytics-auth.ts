import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isProductionRuntime } from '@/lib/runtime-env';

const SESSION_COOKIE = 'huiteen_analytics_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const SESSION_VERSION = 'v1';

let ephemeralSessionSecret: Buffer | null = null;

type AuthConfiguration = {
  password: string;
  sessionSecret: string | Buffer;
};

function getAuthConfiguration(): AuthConfiguration | null {
  const password = process.env.ANALYTICS_ADMIN_PASSWORD?.trim() || '';
  if (!password) return null;

  // Weak, committed defaults are worse than an unavailable dashboard. Keep production
  // closed until the operator supplies a sufficiently long credential.
  if (isProductionRuntime() && password.length < 16) return null;

  const configuredSecret = process.env.ANALYTICS_SESSION_SECRET?.trim();
  if (configuredSecret) {
    if (isProductionRuntime() && configuredSecret.length < 32) return null;
    return { password, sessionSecret: configuredSecret };
  }

  // Production sessions require a separate high-entropy key so authentication
  // fails closed when deployment secrets are incomplete.
  if (isProductionRuntime()) {
    return null;
  }

  ephemeralSessionSecret ??= randomBytes(32);
  return { password, sessionSecret: ephemeralSessionSecret };
}

function constantTimeEqual(actual: string, expected: string) {
  const actualDigest = createHmac('sha256', 'analytics-credential-compare').update(actual).digest();
  const expectedDigest = createHmac('sha256', 'analytics-credential-compare').update(expected).digest();
  return timingSafeEqual(actualDigest, expectedDigest);
}

function signSession(expiresAt: number, secret: string | Buffer) {
  return createHmac('sha256', secret)
    .update(`${SESSION_VERSION}.${expiresAt}`)
    .digest('base64url');
}

export function analyticsAuthConfigured() {
  return getAuthConfiguration() !== null;
}

export function verifyAnalyticsPassword(candidate: string) {
  const config = getAuthConfiguration();
  return Boolean(config && constantTimeEqual(candidate, config.password));
}

export function createAnalyticsSession() {
  const config = getAuthConfiguration();
  if (!config) return null;

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return `${SESSION_VERSION}.${expiresAt}.${signSession(expiresAt, config.sessionSecret)}`;
}

export function isAnalyticsAdmin(req: NextRequest) {
  const config = getAuthConfiguration();
  if (!config) return false;

  const bearer = req.headers.get('authorization');
  const adminToken = process.env.ANALYTICS_ADMIN_TOKEN?.trim();
  const usableAdminToken =
    adminToken && (!isProductionRuntime() || adminToken.length >= 32) ? adminToken : null;
  if (usableAdminToken && bearer?.startsWith('Bearer ')) {
    return constantTimeEqual(bearer.slice(7), usableAdminToken);
  }

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (!session) return false;

  const [version, expiresAtValue, signature] = session.split('.');
  const expiresAt = Number(expiresAtValue);
  if (
    version !== SESSION_VERSION ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Math.floor(Date.now() / 1000) ||
    !signature
  ) {
    return false;
  }

  const expected = signSession(expiresAt, config.sessionSecret);
  return constantTimeEqual(signature, expected);
}

export function setAnalyticsSessionCookie(response: NextResponse, value: string) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value,
    httpOnly: true,
    sameSite: 'strict',
    secure: isProductionRuntime(),
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearAnalyticsSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'strict',
    secure: isProductionRuntime(),
    path: '/',
    maxAge: 0,
  });
}

export function unauthorizedAnalyticsResponse() {
  return analyticsJson({ error: 'unauthorized' }, { status: 401 });
}

export function analyticsJson(
  body: unknown,
  init?: { status?: number; headers?: HeadersInit }
) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}
