import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getEmailSettings, saveEmailSettings } from '@/lib/analytics-settings';
import { analyticsJson, isAnalyticsAdmin, unauthorizedAnalyticsResponse } from '@/lib/analytics-auth';
import {
  analyticsPayloadError,
  boundedString,
  readAnalyticsJson,
  rejectCrossSiteRequest,
} from '@/lib/analytics-api';

type EmailSettingsPayload = {
  enabled?: boolean;
  recipient_email?: string;
  public_base_url?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  smtp_user?: string;
  smtp_from?: string;
};

export async function GET(req: NextRequest) {
  if (!isAnalyticsAdmin(req)) return unauthorizedAnalyticsResponse();

  try {
    const db = getDb();
    return analyticsJson(getEmailSettings(db, false));
  } catch (error: unknown) {
    return analyticsPayloadError(error);
  }
}

export async function PUT(req: NextRequest) {
  if (!isAnalyticsAdmin(req)) return unauthorizedAnalyticsResponse();
  const crossSite = rejectCrossSiteRequest(req);
  if (crossSite) return crossSite;

  try {
    const payload = await readAnalyticsJson(req) as EmailSettingsPayload;
    const recipient = boundedString(payload.recipient_email, 254) ?? '';
    const publicBaseUrl = boundedString(payload.public_base_url, 2_048) ?? '';
    const smtpHost = boundedString(payload.smtp_host, 253) ?? '';
    const smtpUser = boundedString(payload.smtp_user, 254) ?? '';
    const smtpFrom = boundedString(payload.smtp_from, 254) ?? '';
    const smtpPort = Number(payload.smtp_port ?? 465);

    if (payload.enabled !== undefined && typeof payload.enabled !== 'boolean') {
      return analyticsJson({ error: 'enabled must be boolean' }, { status: 400 });
    }
    if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65_535) {
      return analyticsJson({ error: 'invalid SMTP port' }, { status: 400 });
    }
    if (publicBaseUrl && !isHttpUrl(publicBaseUrl)) {
      return analyticsJson({ error: 'public_base_url must be an HTTP(S) URL' }, { status: 400 });
    }
    if ([recipient, smtpHost, smtpUser, smtpFrom].some(hasHeaderControlCharacters)) {
      return analyticsJson({ error: 'email settings contain invalid characters' }, { status: 400 });
    }

    const db = getDb();

    const settings = saveEmailSettings(db, {
      enabled: Boolean(payload.enabled),
      recipient_email: recipient,
      public_base_url: publicBaseUrl,
      smtp_host: smtpHost,
      smtp_port: smtpPort,
      smtp_secure: payload.smtp_secure !== false,
      smtp_user: smtpUser,
      smtp_from: smtpFrom,
    });

    return analyticsJson(settings);
  } catch (error: unknown) {
    return analyticsPayloadError(error);
  }
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function hasHeaderControlCharacters(value: string) {
  return /[\r\n\0]/.test(value);
}
