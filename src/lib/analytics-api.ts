import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import type { NextRequest } from 'next/server';
import { analyticsJson } from '@/lib/analytics-auth';
import { isProductionRuntime } from '@/lib/runtime-env';

const VISIT_TOKEN_TTL_SECONDS = 60 * 60 * 24;
const MAX_BODY_BYTES = 16 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9_-]{1,64}$/i;
const TRACKED_MODULE_NAMES = new Set(['about', 'profile', 'skills', 'projects', 'connect']);
const TRACKED_EVENT_TYPES = new Set(['external_link']);
const TRACKED_EVENT_LABELS = new Set([
  'gafa-1',
  'gafa-2',
  'emotional-lens',
]);

let ephemeralTrackingSecret: Buffer | null = null;

type RateLimitEntry = { count: number; resetAt: number };
const rateLimits = new Map<string, RateLimitEntry>();
const MAX_RATE_LIMIT_BUCKETS = 1_024;

export class InvalidAnalyticsPayload extends Error {}

function getTrackingSecret(): string | Buffer {
  const candidates = [
    process.env.ANALYTICS_TRACKING_SECRET?.trim(),
    process.env.ANALYTICS_SESSION_SECRET?.trim(),
    process.env.ANALYTICS_ADMIN_PASSWORD?.trim(),
  ].filter((value): value is string => Boolean(value));

  const minimumLength = isProductionRuntime() ? 32 : 1;
  const configured = candidates.find((value) => value.length >= minimumLength);
  if (configured) return configured;
  ephemeralTrackingSecret ??= randomBytes(32);
  return ephemeralTrackingSecret;
}

function constantTimeEqual(actual: string, expected: string) {
  const actualDigest = createHmac('sha256', 'analytics-token-compare').update(actual).digest();
  const expectedDigest = createHmac('sha256', 'analytics-token-compare').update(expected).digest();
  return timingSafeEqual(actualDigest, expectedDigest);
}

function signVisitToken(visitId: string, expiresAt: number) {
  return createHmac('sha256', getTrackingSecret())
    .update(`v1.${visitId}.${expiresAt}`)
    .digest('base64url');
}

export function createVisitToken(visitId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + VISIT_TOKEN_TTL_SECONDS;
  return `v1.${expiresAt}.${signVisitToken(visitId, expiresAt)}`;
}

export function verifyVisitToken(visitId: string, token: unknown) {
  if (!isValidUuid(visitId) || typeof token !== 'string') return false;
  const [version, expiresAtValue, signature] = token.split('.');
  const expiresAt = Number(expiresAtValue);
  if (
    version !== 'v1' ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Math.floor(Date.now() / 1000) ||
    !signature
  ) {
    return false;
  }

  return constantTimeEqual(signature, signVisitToken(visitId, expiresAt));
}

export async function readAnalyticsJson(req: NextRequest, maxBytes = MAX_BODY_BYTES) {
  const contentLengthHeader = req.headers.get('content-length');
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isSafeInteger(contentLength) || contentLength < 0 || contentLength > maxBytes) {
      throw new InvalidAnalyticsPayload('invalid or oversized content-length');
    }
  }

  const contentType = req.headers.get('content-type')?.split(';', 1)[0]?.trim();
  if (contentType && contentType !== 'application/json' && contentType !== 'text/plain') {
    throw new InvalidAnalyticsPayload('content-type must be application/json or text/plain');
  }

  const text = await readTextWithLimit(req, maxBytes);

  try {
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new InvalidAnalyticsPayload('JSON object required');
    }
    return value as Record<string, unknown>;
  } catch (error) {
    if (error instanceof InvalidAnalyticsPayload) throw error;
    throw new InvalidAnalyticsPayload('invalid JSON');
  }
}

async function readTextWithLimit(req: NextRequest, maxBytes: number) {
  if (!req.body) throw new InvalidAnalyticsPayload('request body required');

  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      bytesRead += value.byteLength;
      if (bytesRead > maxBytes) {
        await reader.cancel('request body too large');
        throw new InvalidAnalyticsPayload('request body too large');
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }

  if (!text) throw new InvalidAnalyticsPayload('request body required');
  return text;
}

export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function isValidSlug(value: unknown): value is string {
  return typeof value === 'string' && SLUG_PATTERN.test(value);
}

export function isValidModuleName(value: unknown): value is string {
  return typeof value === 'string' && TRACKED_MODULE_NAMES.has(value);
}

export function isValidEventType(value: unknown): value is string {
  return typeof value === 'string' && TRACKED_EVENT_TYPES.has(value);
}

export function isValidEventLabel(value: unknown): value is string {
  return typeof value === 'string' && TRACKED_EVENT_LABELS.has(value);
}

export function boundedString(value: unknown, maxLength: number) {
  return typeof value === 'string' && value.length <= maxLength ? value.trim() : null;
}

export function boundedDuration(value: unknown, max = 1000 * 60 * 60 * 24) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max
    ? Math.round(value)
    : null;
}

export function getClientIp(req: NextRequest) {
  // NextRequest does not expose the socket address. Only trust forwarding headers when
  // the deployment guarantees they are overwritten by a trusted reverse proxy. Use a
  // single header so an attacker cannot win by supplying a higher-priority forwarding
  // header that the proxy happens to pass through unchanged.
  if (process.env.ANALYTICS_TRUST_PROXY !== 'true') return null;

  const candidate = req.headers.get('x-real-ip')?.trim();
  return candidate && isIP(candidate) ? candidate : null;
}

export function anonymizeIp(ip: string | null) {
  if (!ip) return null;
  if (isIP(ip) === 4) {
    const parts = ip.split('.');
    parts[3] = '0';
    return parts.join('.');
  }
  // IPv6 text has multiple valid compressed and IPv4-mapped forms. Avoid an
  // incomplete string transformation that could retain identifying bits.
  // Until a byte-level /64 masker is needed, do not persist IPv6 addresses.
  if (isIP(ip) === 6) return null;
  return null;
}

export function rejectCrossSiteRequest(req: NextRequest) {
  const fetchSite = req.headers.get('sec-fetch-site');
  // SameSite cookies still travel between sibling subdomains on the same
  // registrable domain. Treat `same-site` as untrusted and accept only the
  // exact browser origin (plus `none`/missing for direct or server clients).
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') {
    return analyticsJson({ error: 'cross-origin request rejected' }, { status: 403 });
  }

  const origin = req.headers.get('origin');
  const host = req.headers.get('host')?.toLowerCase();
  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      const isLoopbackOrigin =
        originUrl.hostname === '127.0.0.1' ||
        originUrl.hostname === 'localhost' ||
        originUrl.hostname === '[::1]';
      if (
        (originUrl.protocol !== 'http:' && originUrl.protocol !== 'https:') ||
        (isProductionRuntime() && originUrl.protocol !== 'https:' && !isLoopbackOrigin) ||
        originUrl.host.toLowerCase() !== host
      ) {
        return analyticsJson({ error: 'cross-origin request rejected' }, { status: 403 });
      }
    } catch {
      return analyticsJson({ error: 'invalid origin' }, { status: 403 });
    }
  }
  return null;
}

export function enforceAnalyticsRateLimit(
  req: NextRequest,
  scope: string,
  limit: number,
  windowMs: number
) {
  // A shared ceiling is always active, including deployments that deliberately
  // do not trust proxy IP headers. Never use User-Agent as a security key: it is
  // attacker-controlled and makes unbounded key creation trivial.
  const client = getClientIp(req);
  if (client) {
    const clientLimited = consumeRateLimit(`client:${scope}:${client}`, limit, windowMs);
    if (clientLimited) return clientLimited;
  }

  // Only requests that remain within their client budget consume the shared
  // ceiling. Without a trusted client IP, the shared ceiling is the fallback.
  return consumeRateLimit(`global:${scope}`, limit * 20, windowMs);
}

export function enforceAnalyticsGlobalRateLimit(scope: string, limit: number, windowMs: number) {
  return consumeRateLimit(`global:${scope}`, limit, windowMs);
}

function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = rateLimits.get(key);
  if (!current || current.resetAt <= now) {
    if (current) rateLimits.delete(key);
    if (rateLimits.size >= MAX_RATE_LIMIT_BUCKETS) {
      const oldestKey = rateLimits.keys().next().value as string | undefined;
      if (oldestKey) rateLimits.delete(oldestKey);
    }
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  current.count += 1;
  // Refresh insertion order so the fixed-size map behaves as an LRU cache.
  rateLimits.delete(key);
  rateLimits.set(key, current);
  if (current.count <= limit) return null;

  const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  return analyticsJson(
    { error: 'too many requests' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}

export function analyticsPayloadError(error: unknown) {
  if (error instanceof InvalidAnalyticsPayload) {
    return analyticsJson({ error: error.message }, { status: 400 });
  }
  console.error('Analytics API error:', error);
  return analyticsJson({ error: 'server error' }, { status: 500 });
}
