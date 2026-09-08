'use client';

import { useState, useEffect, useCallback, useRef, type RefObject } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/* ── Pie Chart Component ── */
function PieChart({ data, size = 200 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  const slices = data.map((d, i) => {
    const percentage = d.value / total;
    const angle = percentage * 360;
    const startAngle = -90 + data
      .slice(0, i)
      .reduce((sum, item) => sum + (item.value / total) * 360, 0);
    const endAngle = startAngle + angle;

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
  profile: '个人介绍 / 教育',
  skills: '方法与能力',
  projects: '项目',
  connect: 'Approach',
};

const MODULE_COLORS: Record<string, string> = {
  about: '#6366f1',
  profile: '#8b5cf6',
  skills: '#c084fc',
  projects: '#f472b6',
  connect: '#fb7185',
};

const getModuleColor = (name: string) => MODULE_COLORS[name] || '#94a3b8';

const CLICK_EVENT_LABELS: Record<string, string> = {
  'gafa-1': 'GAFA 1.0 在线导览',
  'gafa-2': 'GAFA 2.0 楼层导览',
  'emotional-lens': 'Emotional Lens 在线概念网页',
};

/* ── Password Gate Component ── */
function PasswordGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'authenticated' | 'unauthenticated' | 'unconfigured'>('checking');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/analytics/auth', { cache: 'no-store' });
        const data = await response.json();
        if (!data.configured) {
          setStatus('unconfigured');
        } else {
          setStatus(data.authenticated ? 'authenticated' : 'unauthenticated');
        }
      } catch {
        setError('无法验证登录状态，请稍后重试');
        setStatus('unauthenticated');
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || submitting) return;

    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/analytics/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError(response.status === 429 ? '尝试次数过多，请稍后重试' : '密码错误，请重试');
        return;
      }
      setPassword('');
      setStatus('authenticated');
    } catch {
      setError('登录请求失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'checking') {
    return <div className="min-h-screen bg-stone-50 dark:bg-stone-900" aria-busy="true" />;
  }

  if (status === 'unconfigured') {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-200">数据分析后台未配置</h1>
          <p className="mt-3 text-sm leading-6 text-stone-500">
            请检查服务器环境变量：生产环境需要至少 16 个字符的
            {' '}ANALYTICS_ADMIN_PASSWORD，以及独立、至少 32 个随机字符的
            {' '}ANALYTICS_SESSION_SECRET。配置后请重启服务。
          </p>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated') {
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
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="密码"
            autoFocus
            className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-4 py-3 text-sm text-stone-800 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent text-center tracking-widest"
          />
          {error && (
            <p role="alert" className="text-red-500 text-xs text-center mt-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting || !password}
            className="w-full mt-4 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {submitting ? '验证中…' : '进入'}
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
          <p className="text-xs text-stone-400">匿名网络段</p>
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

      {/* Click Events */}
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
      aria-label={dark ? '切换到亮色模式' : '切换到暗色模式'}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
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

function EmailSettingsPanel({
  open,
  onClose,
  restoreFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  restoreFocusRef: RefObject<HTMLButtonElement | null>;
}) {
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
        const res = await fetch('/api/analytics/email-settings', { cache: 'no-store' });
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
        headers: { 'Content-Type': 'application/json' },
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
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          setTimeout(() => restoreFocusRef.current?.focus(), 0);
        }}
        className="z-[80] block max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden border-stone-200 bg-white p-0 text-stone-900 shadow-xl dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
      >
        <DialogHeader className="flex-row items-center justify-between gap-4 border-b border-stone-200 px-4 py-4 text-left dark:border-stone-700 sm:px-6">
          <div>
            <DialogTitle className="text-base font-semibold text-stone-800 dark:text-stone-100">
              邮件设置
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-stone-400">
              访问完成后发送浏览总结邮件
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="min-h-11 shrink-0 rounded-md px-3 text-sm text-stone-400 transition-colors hover:text-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500 dark:hover:text-stone-200"
            >
              关闭
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="max-h-[calc(90dvh-77px)] overflow-y-auto p-4 sm:p-6">
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
                  placeholder="https://your-domain.example"
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
                <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs leading-5 text-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400">
                  SMTP 密码仅从服务器环境变量 SMTP_PASS 读取，不会保存到分析数据库。
                  <span className="block mt-1">{settings.password_set ? '当前已配置' : '当前未配置'}</span>
                </div>
                <SettingsInput
                  label="发件人"
                  value={settings.smtp_from}
                  onChange={(value) => update('smtp_from', value)}
                  placeholder="Huiteen Portfolio <sender@example.com>"
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
                <p
                  aria-live="polite"
                  className={`text-sm ${message === '已保存' ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {message}
                </p>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="min-h-11 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {saving ? '保存中...' : '保存设置'}
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
function AnalyticsDashboard() {
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
  const emailSettingsTriggerRef = useRef<HTMLButtonElement>(null);

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
  const uniqueIps = new Set(visits.map(v => v.ip).filter(Boolean)).size;

  const logout = async () => {
    await fetch('/api/analytics/auth', { method: 'DELETE' });
    window.location.reload();
  };

  return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 transition-colors">
        {/* Header */}
        <header className="border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
          <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-stone-800 dark:text-stone-200">数据分析</h1>
                <p className="text-xs text-stone-400 mt-0.5">作品集访问追踪与模块停留分析</p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:gap-5">
                <div className="grid w-full grid-cols-3 divide-x divide-stone-200 rounded-xl border border-stone-200 text-center dark:divide-stone-700 dark:border-stone-700 sm:min-w-[300px] sm:flex-1 lg:w-auto lg:flex-none">
                  <div className="px-2 py-2.5">
                    <p className="text-xl font-semibold text-stone-800 dark:text-stone-200">{links.length}</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider">链接</p>
                  </div>
                  <div className="px-2 py-2.5">
                    <p className="text-xl font-semibold text-stone-800 dark:text-stone-200">{totalClicks}</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider">点击</p>
                  </div>
                  <div className="px-2 py-2.5">
                    <p className="text-xl font-semibold text-stone-800 dark:text-stone-200">{selectedLink ? uniqueIps : '—'}</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider">匿名网络段</p>
                  </div>
                </div>
                <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:flex sm:w-auto">
                  <button
                    ref={emailSettingsTriggerRef}
                    onClick={() => setShowEmailSettings(true)}
                    className="min-h-11 whitespace-nowrap px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                  >
                    邮件设置
                  </button>
                  <button
                    onClick={logout}
                    className="min-h-11 whitespace-nowrap px-3 py-2 text-xs rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                  >
                    退出
                  </button>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
          {/* Create link */}
          <div className="mb-8">
            <div className="flex gap-3 max-w-lg">
              <input
                type="text"
                value={newLinkName}
                onChange={e => setNewLinkName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createLink()}
                placeholder="新建分享链接，输入名称如：腾讯内推"
                className="min-w-0 flex-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-4 py-2.5 text-sm text-stone-800 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-300 dark:focus:ring-stone-600 focus:border-transparent"
              />
              <button
                onClick={createLink}
                disabled={creating || !newLinkName.trim()}
                className="min-h-11 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 disabled:bg-stone-300 dark:disabled:bg-stone-600 disabled:text-stone-500 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
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
                      className={`bg-white dark:bg-stone-800 border rounded-lg p-4 transition-all ${
                        selectedLink?.id === link.id
                          ? 'border-stone-400 dark:border-stone-500 ring-1 ring-stone-200 dark:ring-stone-600'
                          : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <button
                          type="button"
                          onClick={() => fetchVisits(link)}
                          aria-pressed={selectedLink?.id === link.id}
                          className="min-h-11 min-w-0 flex-1 rounded-md pr-3 text-left font-medium text-sm text-stone-800 dark:text-stone-200 truncate focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500"
                        >
                          {link.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteLink(link.id)}
                          aria-label={`删除分享链接：${link.name}`}
                          className="min-h-11 rounded-md px-3 text-stone-400 hover:text-red-500 transition-colors text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                        >
                          删除
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <code className="max-w-full break-all text-[11px] text-stone-400 bg-stone-50 dark:bg-stone-700 px-2 py-1 rounded font-mono">
                          ?ref={link.slug}
                        </code>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-stone-400">
                            {link.click_count} 次点击
                          </span>
                          <button
                            type="button"
                            onClick={() => copyShareUrl(link.slug)}
                            aria-label={`复制分享链接：${link.name}`}
                            className="min-h-11 rounded-md px-3 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500"
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
                    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800">
                      <table className="min-w-[720px] w-full text-sm">
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
                              className="border-b border-stone-50 dark:border-stone-700 hover:bg-stone-50/50 dark:hover:bg-stone-700/50 transition-colors"
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
                                <button
                                  type="button"
                                  onClick={() => setSelectedVisit(visit)}
                                  aria-label={`查看 ${new Date(visit.visited_at).toLocaleString('zh-CN')} 的访问详情`}
                                  className="min-h-11 whitespace-nowrap rounded-md px-3 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500"
                                >
                                  详情 →
                                </button>
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
        <EmailSettingsPanel
          open={showEmailSettings}
          onClose={() => setShowEmailSettings(false)}
          restoreFocusRef={emailSettingsTriggerRef}
        />
      </div>
  );
}

export default function AnalyticsPage() {
  return (
    <PasswordGate>
      <AnalyticsDashboard />
    </PasswordGate>
  );
}
