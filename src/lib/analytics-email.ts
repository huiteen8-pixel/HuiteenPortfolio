import nodemailer from 'nodemailer';
import type Database from 'better-sqlite3';
import { getEmailSettings, isEmailSettingsComplete } from '@/lib/analytics-settings';

type VisitSummary = {
  id: string;
  share_link_id: string;
  link_name: string;
  slug: string;
  ip: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  region: string | null;
  user_agent: string | null;
  referrer: string | null;
  visited_at: string;
  left_at: string | null;
  duration_ms: number;
};

type ModuleDwell = {
  module_name: string;
  dwell_time_ms: number;
};

type ClickStat = {
  event_label: string;
  count: number;
};

const MODULE_LABELS: Record<string, string> = {
  about: 'Hero / 关于',
  profile: '个人介绍 / 教育',
  skills: '方法与能力',
  projects: '项目',
  connect: 'Approach',
};

const CLICK_EVENT_LABELS: Record<string, string> = {
  'gafa-1': 'GAFA 1.0 在线导览',
  'gafa-2': 'GAFA 2.0 楼层导览',
  'emotional-lens': 'Emotional Lens 在线概念网页',
};

export async function sendVisitSummaryEmail(db: Database.Database, visitId: string, baseUrl: string) {
  const settings = getEmailSettings(db, true);

  if (!settings.enabled) {
    return { sent: false, reason: 'disabled' };
  }

  if (!isEmailSettingsComplete(settings)) {
    return { sent: false, reason: 'missing SMTP or recipient configuration' };
  }

  const visit = db.prepare(`
    SELECT
      v.id,
      v.share_link_id,
      v.ip,
      v.location,
      v.city,
      v.country,
      v.region,
      v.user_agent,
      v.referrer,
      v.visited_at,
      v.left_at,
      v.duration_ms,
      l.name AS link_name,
      l.slug
    FROM link_visits v
    JOIN share_links l ON l.id = v.share_link_id
    WHERE v.id = ?
  `).get(visitId) as VisitSummary | undefined;

  if (!visit) {
    return { sent: false, reason: 'visit not found' };
  }

  const modules = getNormalizedModules(db, visit);
  const clickStats = db.prepare(`
    SELECT event_label, COUNT(*) AS count
    FROM click_events
    WHERE visit_id = ?
    GROUP BY event_label
    ORDER BY count DESC
  `).all(visitId) as ClickStat[];

  const analyticsUrl = new URL('/analytics', settings.public_base_url || baseUrl);
  analyticsUrl.searchParams.set('link_id', visit.share_link_id);

  const transporter = nodemailer.createTransport({
    host: settings.smtp_host,
    port: Number(settings.smtp_port || 465),
    secure: settings.smtp_secure,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    auth: {
      user: settings.smtp_user,
      pass: settings.smtp_pass,
    },
  });

  const subject = `作品集访问总结：${visit.link_name} (${formatDuration(visit.duration_ms)})`;
  await transporter.sendMail({
    from: settings.smtp_from || settings.smtp_user,
    to: settings.recipient_email,
    subject,
    html: renderVisitSummaryHtml(visit, modules, clickStats, analyticsUrl.toString()),
  });

  return { sent: true };
}

function getNormalizedModules(db: Database.Database, visit: VisitSummary): ModuleDwell[] {
  const rows = db.prepare(`
    SELECT module_name, dwell_time_ms
    FROM module_dwell_times
    WHERE visit_id = ?
    ORDER BY dwell_time_ms DESC
  `).all(visit.id) as ModuleDwell[];

  const rawTotal = rows.reduce((sum, row) => sum + Math.max(row.dwell_time_ms || 0, 0), 0);
  if (rawTotal <= 0 || visit.duration_ms <= 0) {
    return [];
  }

  const scale = rawTotal > visit.duration_ms ? visit.duration_ms / rawTotal : 1;
  const normalized = rows.map((row) => ({
    module_name: row.module_name,
    dwell_time_ms: Math.round(Math.max(row.dwell_time_ms || 0, 0) * scale),
  }));

  const overflow = normalized.reduce((sum, row) => sum + row.dwell_time_ms, 0) - visit.duration_ms;
  if (overflow > 0 && normalized.length > 0) {
    normalized[0].dwell_time_ms = Math.max(normalized[0].dwell_time_ms - overflow, 0);
  }

  return normalized.filter((row) => row.dwell_time_ms > 0);
}

function renderVisitSummaryHtml(
  visit: VisitSummary,
  modules: ModuleDwell[],
  clickStats: ClickStat[],
  analyticsUrl: string
) {
  const totalModuleMs = modules.reduce((sum, module) => sum + module.dwell_time_ms, 0);
  const location = [visit.city, visit.region, visit.country].filter(Boolean).join(', ') || visit.location || '未知';
  const device = parseDevice(visit.user_agent || '');
  const browser = parseBrowser(visit.user_agent || '');

  return `
<!doctype html>
<html lang="zh-CN">
  <body style="margin:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#292524;">
    <div style="max-width:720px;margin:0 auto;padding:28px 16px;">
      <div style="background:#ffffff;border:1px solid #e7e5e4;border-radius:14px;overflow:hidden;">
        <div style="padding:24px 28px;border-bottom:1px solid #e7e5e4;">
          <p style="margin:0 0 8px;color:#78716c;font-size:13px;">作品集访问完成</p>
          <h1 style="margin:0;font-size:24px;line-height:1.25;color:#1c1917;">${escapeHtml(visit.link_name)}</h1>
          <p style="margin:10px 0 0;color:#78716c;font-size:14px;">分享链接：<strong>${escapeHtml(visit.slug)}</strong></p>
        </div>

        <div style="padding:24px 28px;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr>
              ${metricCell('总访问时长', formatDuration(visit.duration_ms))}
              ${metricCell('板块停留合计', formatDuration(totalModuleMs))}
              ${metricCell('外链点击', String(clickStats.reduce((sum, item) => sum + item.count, 0)))}
            </tr>
          </table>

          <h2 style="font-size:15px;margin:0 0 12px;color:#44403c;">访问画像</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
            ${detailRow('进入时间', formatDate(visit.visited_at))}
            ${detailRow('离开时间', visit.left_at ? formatDate(visit.left_at) : '未知')}
            ${detailRow('位置', location)}
            ${detailRow('IP', visit.ip || '未知')}
            ${detailRow('设备 / 浏览器', `${device} / ${browser}`)}
            ${detailRow('来源', visit.referrer || '直接访问')}
          </table>

          <h2 style="font-size:15px;margin:0 0 12px;color:#44403c;">板块停留</h2>
          ${modules.length > 0 ? modules.map((module) => moduleBar(module, visit.duration_ms)).join('') : emptyState('暂无板块停留数据')}

          <h2 style="font-size:15px;margin:24px 0 12px;color:#44403c;">链接点击</h2>
          ${clickStats.length > 0 ? clickStats.map(clickRow).join('') : emptyState('暂无外链点击')}

          <div style="margin-top:28px;">
            <a href="${escapeAttribute(analyticsUrl)}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-size:14px;font-weight:600;">打开对应 Analytics 页面</a>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
`;
}

function metricCell(label: string, value: string) {
  return `
    <td style="width:33.33%;padding:14px;border:1px solid #e7e5e4;background:#fafaf9;">
      <div style="font-size:12px;color:#78716c;margin-bottom:6px;">${escapeHtml(label)}</div>
      <div style="font-size:22px;font-weight:700;color:#1c1917;">${escapeHtml(value)}</div>
    </td>
  `;
}

function detailRow(label: string, value: string) {
  return `
    <tr>
      <td style="width:120px;padding:8px 0;color:#78716c;border-bottom:1px solid #f5f5f4;">${escapeHtml(label)}</td>
      <td style="padding:8px 0;color:#292524;border-bottom:1px solid #f5f5f4;">${escapeHtml(value)}</td>
    </tr>
  `;
}

function moduleBar(module: ModuleDwell, totalMs: number) {
  const label = MODULE_LABELS[module.module_name] || module.module_name;
  const pct = totalMs > 0 ? Math.min(100, Math.round((module.dwell_time_ms / totalMs) * 100)) : 0;

  return `
    <div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
        <span style="color:#44403c;">${escapeHtml(label)}</span>
        <span style="color:#78716c;">${formatDuration(module.dwell_time_ms)} · ${pct}%</span>
      </div>
      <div style="height:10px;background:#e7e5e4;border-radius:999px;overflow:hidden;">
        <div style="height:10px;width:${pct}%;background:#57534e;border-radius:999px;"></div>
      </div>
    </div>
  `;
}

function clickRow(click: ClickStat) {
  const label = CLICK_EVENT_LABELS[click.event_label] || click.event_label;
  return `
    <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f5f5f4;font-size:14px;">
      <span>${escapeHtml(label)}</span>
      <strong>${click.count}</strong>
    </div>
  `;
}

function emptyState(text: string) {
  return `<p style="margin:0;color:#a8a29e;font-size:14px;">${escapeHtml(text)}</p>`;
}

function formatDuration(ms: number) {
  if (!ms || ms < 1000) return '0s';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
}

function parseDevice(ua: string) {
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android';
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Linux/i.test(ua)) return 'Linux';
  return '未知';
}

function parseBrowser(ua: string) {
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Chrome';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari';
  return '未知';
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string) {
  return escapeHtml(value);
}
