import type Database from 'better-sqlite3';

export type EmailSettings = {
  enabled: boolean;
  recipient_email: string;
  public_base_url: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  password_set: boolean;
};

type EmailSettingsRow = {
  enabled: number;
  recipient_email: string | null;
  public_base_url: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_secure: number;
  smtp_user: string | null;
  smtp_pass: string | null;
  smtp_from: string | null;
};

export type EmailSettingsInput = Omit<EmailSettings, 'password_set'>;

export function getEmailSettings(db: Database.Database, includeSecret = false): EmailSettings {
  const row = db.prepare(`
    SELECT enabled, recipient_email, public_base_url, smtp_host, smtp_port,
           smtp_secure, smtp_user, smtp_pass, smtp_from
    FROM analytics_email_settings
    WHERE id = 'default'
  `).get() as EmailSettingsRow | undefined;

  const envPass = process.env.SMTP_PASS || '';
  const smtpPass = row?.smtp_pass || envPass;

  return {
    enabled: row ? row.enabled === 1 : process.env.ANALYTICS_SUMMARY_EMAIL_ENABLED === 'true',
    recipient_email: row?.recipient_email || process.env.ANALYTICS_SUMMARY_EMAIL_TO || '',
    public_base_url: row?.public_base_url || process.env.ANALYTICS_PUBLIC_BASE_URL || '',
    smtp_host: row?.smtp_host || process.env.SMTP_HOST || '',
    smtp_port: row?.smtp_port || Number(process.env.SMTP_PORT || 465),
    smtp_secure: row ? row.smtp_secure === 1 : (process.env.SMTP_SECURE || 'true') !== 'false',
    smtp_user: row?.smtp_user || process.env.SMTP_USER || '',
    smtp_pass: includeSecret ? smtpPass : '',
    smtp_from: row?.smtp_from || process.env.SMTP_FROM || process.env.SMTP_USER || '',
    password_set: Boolean(smtpPass),
  };
}

export function saveEmailSettings(db: Database.Database, input: EmailSettingsInput) {
  const current = getEmailSettings(db, true);
  const smtpPass = input.smtp_pass.trim() ? input.smtp_pass.trim() : current.smtp_pass;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO analytics_email_settings (
      id, enabled, recipient_email, public_base_url, smtp_host, smtp_port,
      smtp_secure, smtp_user, smtp_pass, smtp_from, updated_at
    )
    VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      enabled = excluded.enabled,
      recipient_email = excluded.recipient_email,
      public_base_url = excluded.public_base_url,
      smtp_host = excluded.smtp_host,
      smtp_port = excluded.smtp_port,
      smtp_secure = excluded.smtp_secure,
      smtp_user = excluded.smtp_user,
      smtp_pass = excluded.smtp_pass,
      smtp_from = excluded.smtp_from,
      updated_at = excluded.updated_at
  `).run(
    input.enabled ? 1 : 0,
    input.recipient_email.trim(),
    input.public_base_url.trim(),
    input.smtp_host.trim(),
    Number(input.smtp_port || 465),
    input.smtp_secure ? 1 : 0,
    input.smtp_user.trim(),
    smtpPass,
    input.smtp_from.trim(),
    now
  );

  return getEmailSettings(db, false);
}

export function isEmailSettingsComplete(settings: EmailSettings) {
  return Boolean(
    settings.enabled &&
      settings.recipient_email &&
      settings.smtp_host &&
      settings.smtp_user &&
      settings.smtp_pass
  );
}
