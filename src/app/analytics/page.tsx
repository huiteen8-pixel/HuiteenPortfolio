'use client';

import { useState, useEffect, useCallback } from 'react';

/* ── Pie Chart Component ── */
function PieChart({ data, size = 200 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  let currentAngle = -90; // 从顶部开始

  const slices = data.map((d, i) => {
    const percentage = d.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return {
      path,
      color: d.color,
      label: d.label,
      percentage,
      value: d.value,
    };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, i) => (
          <path
            key={i}
            d={slice.path}
            fill={slice.color}
            stroke="white"
            strokeWidth="2"
            className="hover:opacity-80 transition-opacity"
          >
            <title>{`${slice.label}: ${slice.value} (${(slice.percentage * 100).toFixed(1)}%)`}</title>
          </path>
        ))}
      </svg>
      <div className="space-y-2">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: slice.color }} />
            <span className="text-xs text-stone-600 dark:text-stone-400">{slice.label}</span>
            <span className="text-xs text-stone-400 ml-auto">
              {(slice.percentage * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Types ── */
interface ShareLink {
  id: string;
  name: string;
  slug: string;
  click_count: number;
  is_active: boolean;
  created_at: string;
}

interface Visit {
  id: string;
  ip: string;
  location: string;
  city: string;
  country: string;
  region: string;
  user_agent: string;
  referrer: string;
  visited_at: string;
  duration_ms: number;
  entered_at: string;
  left_at: string;
}

interface AnalyticsStats {
  total_visits: number;
  unique_visitors: number;
  total_duration_ms: number;
  top_locations: { location: string; count: number }[];
  top_modules: { module_name: string; total_dwell_ms: number }[];
  devices: Record<string, number>;
  browsers: Record<string, number>;
  resume_viewed: number;
  resume_downloaded: number;
  click_events: { event_label: string; count: number }[];
}

interface ModuleDwell {
  module_name: string;
  dwell_time_ms: number;
}

interface EmailSettings {
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
}

/* ── Password ── */
const CORRECT_PASSWORD = 'ooooyasumi';
const AUTH_KEY = 'dashboard_auth';

/* ── Helpers ── */
const formatMs = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

const formatDuration = (ms: number) => {
  if (ms < 1000) return '0s';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

const parseDevice = (ua: string) => {
  if (!ua) return '未知';
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android';
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Linux/i.test(ua)) return 'Linux';
  return '其他';
};

const parseBrowser = (ua: string) => {
  if (!ua) return '未知';
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Chrome';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari';
  return '其他';
};

const MODULE_LABELS: Record<string, string> = {
  about: 'Hero / 关于',
  introduce: '个人介绍',
  education: '教育背景',
  workexperience: '工作经历',
  technical: '技术项目',
  skills: '技能',
  connect: '联系方式',
};

const MODULE_COLORS: Record<string, string> = {
  about: '#6366f1',
  introduce: '#8b5cf6',
  education: '#a78bfa',
  workexperience: '#c084fc',
  technical: '#e879f9',
  skills: '#f472b6',
  connect: '#fb7185',
};

const getModuleColor = (name: string) => MODULE_COLORS[name] || '#94a3b8';

const CLICK_EVENT_LABELS: Record<string, string> = {
  blog: '个人博客',
  github: 'GitHub',
  xhs: '小红书',
  x: 'X',
  bilibili: '哔哩哔哩',
};

/* ── Password Gate Component ── */
function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(AUTH_KEY) === '1') {
      setAuthenticated(true);
    }
    setChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, '1');
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (checking) return null;

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center">
        <form onSubmit={handleSubmit} className="w-full max-w-sm px-6">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-stone-900 dark:bg-stone-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white dark:text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-200">数据分析后台</h1>
            <p className="text-stone-400 text-sm mt-1">请输入密码以继续</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false); }}
            placeholder="密码"
            autoFocus
            className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-4 py-3 text-sm text-stone-800 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent text-center tracking-widest"
          />
          {error && (
            <p className="text-red-500 text-xs text-center mt-2">密码错误，请重试</p>
          )}
          <button
            type="submit"
            className="w-full mt-4 py-3 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 text-white text-sm font-medium rounded-lg transition-colors"
          >
            进入
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}

/* ── Visit Detail Panel ── */
function VisitDetail({ visit, onBack }: { visit: Visit; onBack: () => void }) {
  const [modules, setModules] = useState<ModuleDwell[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch(`/api/analytics/module-dwell?visit_id=${visit.id}`);
        const data = await res.json();
        setModules(data || []);
      } catch (err) {
        console.error('Failed to fetch modules:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, [visit.id]);

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 text-sm mb-5 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        返回访问记录
      </button>

      {/* Visit Info */}
      <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-4">访问详情</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-stone-400">IP 地址</p>
            <p className="text-sm font-mono text-stone-700 dark:text-stone-300">{visit.ip || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400">位置</p>
            <p className="text-sm text-stone-700 dark:text-stone-300">
              {[visit.city, visit.region, visit.country].filter(Boolean).join(', ') || '未知'}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-400">设备</p>
            <p className="text-sm text-stone-700 dark:text-stone-300">{parseDevice(visit.user_agent)}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400">浏览器</p>
            <p className="text-sm text-stone-700 dark:text-stone-300">{parseBrowser(visit.user_agent)}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400">进入时间</p>
            <p className="text-sm text-stone-700 dark:text-stone-300">
              {new Date(visit.visited_at).toLocaleString('zh-CN')}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-400">停留时长</p>
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
              {visit.duration_ms > 0 ? formatDuration(visit.duration_ms) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-400">来源</p>
            <p className="text-sm text-stone-700 dark:text-stone-300 truncate max-w-[200px]">
              {visit.referrer || '直接访问'}
            </p>
          </div>
        </div>
      </div>

      {/* Module Dwell Times */}
      <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-5">
        <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-4">板块停留分析</h3>
        {loading ? (
          <p className="text-stone-400 text-sm">加载中...</p>
        ) : modules.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-stone-400 text-sm">暂无板块停留数据</p>
            <p className="text-stone-300 text-xs mt-1">访客可能未等待页面完全加载</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <PieChart
              data={modules.map(m => ({
                label: MODULE_LABELS[m.module_name] || m.module_name,
                value: m.dwell_time_ms,
                color: getModuleColor(m.module_name),
              }))}
              size={200}
            />
            <div className="mt-4 w-full">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-stone-400 border-b border-stone-100 dark:border-stone-700">
                    <th className="text-left py-2 font-medium">板块</th>
                    <th className="text-right py-2 font-medium">停留时长</th>
                    <th className="text-right py-2 font-medium">占比</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map(m => {
                    const totalMs = modules.reduce((sum, x) => sum + x.dwell_time_ms, 0);
                    const pct = totalMs > 0 ? (m.dwell_time_ms / totalMs * 100).toFixed(1) : '0';
                    return (
                      <tr key={m.module_name} className="border-b border-stone-50 dark:border-stone-700">
                        <td className="py-2 text-stone-600 dark:text-stone-400">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: getModuleColor(m.module_name) }} />
                            {MODULE_LABELS[m.module_name] || m.module_name}
                          </div>
                        </td>
                        <td className="py-2 text-right font-mono text-stone-500">{formatMs(m.dwell_time_ms)}</td>
                        <td className="py-2 text-right text-stone-400">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Stats Panel ── */
function StatsPanel({ linkId }: { linkId: string }) {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/analytics/stats?link_id=${linkId}`);
        const data = await res.json();
        if (!data.error) setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [linkId]);

  if (loading) return <p className="text-stone-400 text-sm">加载统计数据...</p>;
  if (!stats) return <p className="text-stone-400 text-sm">暂无统计数据</p>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-4">
          <p className="text-xs text-stone-400">总访问量</p>
          <p className="text-2xl font-semibold text-stone-800 dark:text-stone-200 mt-1">{stats.total_visits}</p>
        </div>
        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-4">
          <p className="text-xs text-stone-400">独立访客</p>
          <p className="text-2xl font-semibold text-stone-800 dark:text-stone-200 mt-1">{stats.unique_visitors}</p>
        </div>
        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-4">
          <p className="text-xs text-stone-400">总访问时长</p>
          <p className="text-2xl font-semibold text-stone-800 dark:text-stone-200 mt-1">{formatDuration(stats.total_duration_ms)}</p>
        </div>
      </div>

      {/* Top Locations */}
      <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-5">
        <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-4">访问地区 Top 10</h3>
        <div className="space-y-2">
          {stats.top_locations.map((loc, i) => (
            <div key={loc.location} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400 w-5">{i + 1}</span>
                <span className="text-sm text-stone-600 dark:text-stone-400">{loc.location}</span>
              </div>
              <span className="text-sm font-mono text-stone-500">{loc.count}</span>
            </div>
          ))}
          {stats.top_locations.length === 0 && (
            <p className="text-stone-400 text-sm">暂无数据</p>
          )}
        </div>
      </div>

      {/* Top Modules */}
      <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-5">
        <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-4">板块停留排行</h3>
        {stats.top_modules.length === 0 ? (
          <p className="text-stone-400 text-sm">暂无数据</p>
        ) : (
          <div className="flex flex-col items-center">
            <PieChart
              data={stats.top_modules.map(m => ({
                label: MODULE_LABELS[m.module_name] || m.module_name,
                value: m.total_dwell_ms,
                color: getModuleColor(m.module_name),
              }))}
              size={180}
            />
            <div className="mt-4 w-full space-y-2">
              {stats.top_modules.map(m => {
                const label = MODULE_LABELS[m.module_name] || m.module_name;
                return (
                  <div key={m.module_name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: getModuleColor(m.module_name) }} />
                      <span className="text-xs text-stone-500">{label}</span>
                    </div>
                    <span className="text-xs text-stone-400 font-mono">{formatMs(m.total_dwell_ms)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Resume & Click Events */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-5">
          <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-4">简历互动</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600 dark:text-stone-400">查看简历</span>
              <span className="text-sm font-mono text-stone-500">{stats.resume_viewed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600 dark:text-stone-400">下载简历</span>
              <span className="text-sm font-mono text-stone-500">{stats.resume_downloaded}</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-5">
          <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-4">链接点击</h3>
          {stats.click_events.length === 0 ? (
            <p className="text-stone-400 text-sm">暂无数据</p>
          ) : (
            <div className="space-y-2">
              {stats.click_events.map(ev => (
                <div key={ev.event_label} className="flex items-center justify-between">
                  <span className="text-sm text-stone-600 dark:text-stone-400">
                    {CLICK_EVENT_LABELS[ev.event_label] || ev.event_label}
                  </span>
                  <span className="text-sm font-mono text-stone-500">{ev.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Device & Browser */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-5">
          <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-4">设备分布</h3>
          <div className="space-y-2">
            {Object.entries(stats.devices).sort((a, b) => b[1] - a[1]).map(([device, count]) => (
              <div key={device} className="flex items-center justify-between">
                <span className="text-sm text-stone-600 dark:text-stone-400">{device}</span>
                <span className="text-sm font-mono text-stone-500">{count}</span>
              </div>
            ))}
            {Object.keys(stats.devices).length === 0 && (
              <p className="text-stone-400 text-sm">暂无数据</p>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-5">
          <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-4">浏览器分布</h3>
          <div className="space-y-2">
            {Object.entries(stats.browsers).sort((a, b) => b[1] - a[1]).map(([browser, count]) => (
              <div key={browser} className="flex items-center justify-between">
                <span className="text-sm text-stone-600 dark:text-stone-400">{browser}</span>
                <span className="text-sm font-mono text-stone-500">{count}</span>
              </div>
            ))}
            {Object.keys(stats.browsers).length === 0 && (
              <p className="text-stone-400 text-sm">暂无数据</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Theme Toggle ── */
function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = () => {
    const newDark = !dark;
    setDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDark);
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
      title={dark ? '切换到亮色模式' : '切换到暗色模式'}
    >
      {dark ? (
        <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  );
}

function EmailSettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) return;

    const fetchSettings = async () => {
      setLoading(true);
      setMessage('');
      try {
        const res = await fetch('/api/analytics/email-settings', {
          headers: { 'x-analytics-admin-password': CORRECT_PASSWORD },
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setSettings(data);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [open]);

  if (!open) return null;

  const update = <K extends keyof EmailSettings>(key: K, value: EmailSettings[K]) => {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  const save = async () => {
    if (!settings) return;

    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/analytics/email-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-analytics-admin-password': CORRECT_PASSWORD,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSettings(data);
      setMessage('已保存');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl">
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-800 dark:text-stone-100">邮件设置</h2>
            <p className="text-xs text-stone-400 mt-1">访问完成后发送浏览总结邮件</p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-sm"
          >
            关闭
          </button>
        </div>

        <div className="p-6">
          {loading || !settings ? (
            <p className="text-sm text-stone-400">加载中...</p>
          ) : (
            <div className="space-y-5">
              <label className="flex items-center justify-between gap-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-4 py-3">
                <span>
                  <span className="block text-sm font-medium text-stone-700 dark:text-stone-200">启用邮件总结</span>
                  <span className="block text-xs text-stone-400 mt-0.5">关闭后不会发送访问完成邮件</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => update('enabled', e.target.checked)}
                  className="h-5 w-5"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SettingsInput
                  label="收件邮箱"
                  value={settings.recipient_email}
                  onChange={(value) => update('recipient_email', value)}
                  placeholder="you@example.com"
                />
                <SettingsInput
                  label="站点地址"
                  value={settings.public_base_url}
                  onChange={(value) => update('public_base_url', value)}
                  placeholder="https://ooooyasumi.com"
                />
                <SettingsInput
                  label="SMTP Host"
                  value={settings.smtp_host}
                  onChange={(value) => update('smtp_host', value)}
                  placeholder="smtp.qq.com"
                />
                <SettingsInput
                  label="SMTP Port"
                  value={String(settings.smtp_port || '')}
                  onChange={(value) => update('smtp_port', Number(value || 465))}
                  placeholder="465"
                  type="number"
                />
                <SettingsInput
                  label="SMTP User"
                  value={settings.smtp_user}
                  onChange={(value) => update('smtp_user', value)}
                  placeholder="sender@example.com"
                />
                <SettingsInput
                  label={settings.password_set ? 'SMTP Password（已设置，留空不改）' : 'SMTP Password'}
                  value={settings.smtp_pass}
                  onChange={(value) => update('smtp_pass', value)}
                  placeholder={settings.password_set ? '留空则保留原密码' : '授权码或密码'}
                  type="password"
                />
                <SettingsInput
                  label="发件人"
                  value={settings.smtp_from}
                  onChange={(value) => update('smtp_from', value)}
                  placeholder="RenRui Resume <sender@example.com>"
                />
                <label className="flex items-center gap-3 pt-6 text-sm text-stone-600 dark:text-stone-300">
                  <input
                    type="checkbox"
                    checked={settings.smtp_secure}
                    onChange={(e) => update('smtp_secure', e.target.checked)}
                    className="h-4 w-4"
                  />
                  SMTP Secure / SSL
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className={`text-sm ${message === '已保存' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {message}
                </p>
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {saving ? '保存中...' : '保存设置'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-stone-400 mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2.5 text-sm text-stone-800 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-300 dark:focus:ring-stone-600 focus:border-transparent"
      />
    </label>
  );
}

/* ── Main Dashboard ── */
export default function AnalyticsPage() {
  const [targetLinkId, setTargetLinkId] = useState<string | null>(null);
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLinkName, setNewLinkName] = useState('');
  const [creating, setCreating] = useState(false);

  const [selectedLink, setSelectedLink] = useState<ShareLink | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [showEmailSettings, setShowEmailSettings] = useState(false);

  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [activeTab, setActiveTab] = useState<'visits' | 'stats'>('stats');

  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/links');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLinks(data);
    } catch (err) {
      console.error('Failed to fetch links:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  useEffect(() => {
    setTargetLinkId(new URLSearchParams(window.location.search).get('link_id'));
  }, []);

  const createLink = async () => {
    if (!newLinkName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/analytics/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLinkName.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNewLinkName('');
      await fetchLinks();
    } catch (err) {
      console.error('Failed to create link:', err);
    } finally {
      setCreating(false);
    }
  };

  const deleteLink = async (id: string) => {
    if (!confirm('确定要删除此链接？所有访问记录也会被删除。')) return;
    try {
      const res = await fetch(`/api/analytics/links?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (selectedLink?.id === id) {
        setSelectedLink(null);
        setVisits([]);
        setSelectedVisit(null);
      }
      await fetchLinks();
    } catch (err) {
      console.error('Failed to delete link:', err);
    }
  };

  const fetchVisits = useCallback(async (link: ShareLink) => {
    setSelectedLink(link);
    setSelectedVisit(null);
    setActiveTab('stats'); // 默认显示数据看板
    setVisitsLoading(true);
    try {
      const res = await fetch(`/api/analytics/visits?link_id=${link.id}`);
      const data = await res.json();
      if (!data.error) setVisits(data);
    } catch (err) {
      console.error('Failed to fetch visits:', err);
    } finally {
      setVisitsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!targetLinkId || selectedLink || links.length === 0) return;

    const link = links.find((item) => item.id === targetLinkId);
    if (link) {
      fetchVisits(link);
    }
  }, [fetchVisits, links, selectedLink, targetLinkId]);

  const copyShareUrl = (slug: string) => {
    const url = `${window.location.origin}?ref=${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const totalClicks = links.reduce((sum, l) => sum + l.click_count, 0);
  const uniqueIps = new Set(visits.map(v => v.ip)).size;

  return (
    <PasswordGate>
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 transition-colors">
        {/* Header */}
        <header className="border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
          <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-stone-800 dark:text-stone-200">数据分析</h1>
              <p className="text-xs text-stone-400 mt-0.5">简历访问追踪与模块停留分析</p>
            </div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-5 text-center">
                <div>
                  <p className="text-xl font-semibold text-stone-800 dark:text-stone-200">{links.length}</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-wider">链接</p>
                </div>
                <div className="w-px h-8 bg-stone-200 dark:bg-stone-700" />
                <div>
                  <p className="text-xl font-semibold text-stone-800 dark:text-stone-200">{totalClicks}</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-wider">点击</p>
                </div>
                <div className="w-px h-8 bg-stone-200 dark:bg-stone-700" />
                <div>
                  <p className="text-xl font-semibold text-stone-800 dark:text-stone-200">{selectedLink ? uniqueIps : '—'}</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-wider">独立访客</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailSettings(true)}
                className="px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
              >
                邮件设置
              </button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Create link */}
          <div className="mb-8">
            <div className="flex gap-3 max-w-lg">
              <input
                type="text"
                value={newLinkName}
                onChange={e => setNewLinkName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createLink()}
                placeholder="新建分享链接，输入名称如：腾讯内推"
                className="flex-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-4 py-2.5 text-sm text-stone-800 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-300 dark:focus:ring-stone-600 focus:border-transparent"
              />
              <button
                onClick={createLink}
                disabled={creating || !newLinkName.trim()}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 disabled:bg-stone-300 dark:disabled:bg-stone-600 disabled:text-stone-500 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                {creating ? '...' : '创建'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Links List */}
            <div className="lg:col-span-4">
              <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">分享链接</h2>
              {loading ? (
                <p className="text-stone-400 text-sm">加载中...</p>
              ) : links.length === 0 ? (
                <p className="text-stone-400 text-sm">暂无链接</p>
              ) : (
                <div className="space-y-2">
                  {links.map(link => (
                    <div
                      key={link.id}
                      onClick={() => fetchVisits(link)}
                      className={`cursor-pointer bg-white dark:bg-stone-800 border rounded-lg p-4 transition-all ${
                        selectedLink?.id === link.id
                          ? 'border-stone-400 dark:border-stone-500 ring-1 ring-stone-200 dark:ring-stone-600'
                          : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-sm text-stone-800 dark:text-stone-200 truncate">{link.name}</h3>
                        <button
                          onClick={e => { e.stopPropagation(); deleteLink(link.id); }}
                          className="text-stone-300 hover:text-red-400 transition-colors text-xs"
                        >
                          删除
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <code className="text-[11px] text-stone-400 bg-stone-50 dark:bg-stone-700 px-2 py-0.5 rounded font-mono">
                          ?ref={link.slug}
                        </code>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-stone-400">
                            {link.click_count} 次点击
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); copyShareUrl(link.slug); }}
                            className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
                          >
                            {copiedSlug === link.slug ? '✓' : '复制'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Detail Panel */}
            <div className="lg:col-span-8">
              {!selectedLink ? (
                <div className="text-center py-20">
                  <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <p className="text-stone-400 text-sm">点击左侧链接查看访问详情</p>
                </div>
              ) : selectedVisit ? (
                <VisitDetail visit={selectedVisit} onBack={() => setSelectedVisit(null)} />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                      {selectedLink.name}
                    </h2>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setActiveTab('visits')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          activeTab === 'visits'
                            ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                            : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                        }`}
                      >
                        访问记录
                      </button>
                      <button
                        onClick={() => setActiveTab('stats')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          activeTab === 'stats'
                            ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                            : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                        }`}
                      >
                        数据看板
                      </button>
                    </div>
                  </div>

                  {activeTab === 'stats' ? (
                    <StatsPanel linkId={selectedLink.id} />
                  ) : visitsLoading ? (
                    <p className="text-stone-400 text-sm">加载中...</p>
                  ) : visits.length === 0 ? (
                    <p className="text-stone-400 text-sm">暂无访问记录</p>
                  ) : (
                    <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-stone-400 text-xs text-left border-b border-stone-100 dark:border-stone-700">
                            <th className="px-4 py-3 font-medium">时间</th>
                            <th className="px-4 py-3 font-medium">IP</th>
                            <th className="px-4 py-3 font-medium">位置</th>
                            <th className="px-4 py-3 font-medium">设备</th>
                            <th className="px-4 py-3 font-medium">停留</th>
                            <th className="px-4 py-3 font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {visits.map(visit => (
                            <tr
                              key={visit.id}
                              className="border-b border-stone-50 dark:border-stone-700 hover:bg-stone-50/50 dark:hover:bg-stone-700/50 cursor-pointer transition-colors"
                              onClick={() => setSelectedVisit(visit)}
                            >
                              <td className="px-4 py-3 text-stone-500 whitespace-nowrap text-xs">
                                {new Date(visit.visited_at).toLocaleString('zh-CN', {
                                  month: '2-digit', day: '2-digit',
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-stone-600 dark:text-stone-400">
                                {visit.ip || '—'}
                              </td>
                              <td className="px-4 py-3 text-stone-600 dark:text-stone-400 text-xs">
                                {[visit.city, visit.region].filter(Boolean).join(', ') || '未知'}
                              </td>
                              <td className="px-4 py-3 text-stone-600 dark:text-stone-400 text-xs">
                                {parseDevice(visit.user_agent)}
                              </td>
                              <td className="px-4 py-3 text-stone-600 dark:text-stone-400 text-xs">
                                {visit.duration_ms > 0 ? formatDuration(visit.duration_ms) : '—'}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-stone-300 hover:text-stone-600 dark:hover:text-stone-300 text-xs transition-colors">
                                  详情 →
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <EmailSettingsPanel open={showEmailSettings} onClose={() => setShowEmailSettings(false)} />
      </div>
    </PasswordGate>
  );
}
