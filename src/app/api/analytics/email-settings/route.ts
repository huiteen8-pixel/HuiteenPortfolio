import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getEmailSettings, saveEmailSettings } from '@/lib/analytics-settings';

type EmailSettingsPayload = {
  enabled?: boolean;
  recipient_email?: string;
  public_base_url?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  smtp_user?: string;
  smtp_pass?: string;
  smtp_from?: string;
};

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    return NextResponse.json(getEmailSettings(db, false));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const payload = await req.json() as EmailSettingsPayload;
    const db = getDb();

    const settings = saveEmailSettings(db, {
      enabled: Boolean(payload.enabled),
      recipient_email: payload.recipient_email || '',
      public_base_url: payload.public_base_url || '',
      smtp_host: payload.smtp_host || '',
      smtp_port: Number(payload.smtp_port || 465),
      smtp_secure: payload.smtp_secure !== false,
      smtp_user: payload.smtp_user || '',
      smtp_pass: payload.smtp_pass || '',
      smtp_from: payload.smtp_from || '',
    });

    return NextResponse.json(settings);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isAuthorized(req: NextRequest) {
  return req.headers.get('x-analytics-admin-password') === 'ooooyasumi';
}
