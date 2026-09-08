-- SQLite Schema for Analytics Database
-- Adapted from Supabase PostgreSQL schema

-- 分享链接表
CREATE TABLE IF NOT EXISTS share_links (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    click_count INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);

-- 访问记录表
CREATE TABLE IF NOT EXISTS link_visits (
    id TEXT PRIMARY KEY,
    share_link_id TEXT NOT NULL,
    ip TEXT,
    location TEXT,
    city TEXT,
    country TEXT,
    region TEXT,
    user_agent TEXT,
    referrer TEXT,
    visited_at TEXT NOT NULL,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    entered_at TEXT,
    left_at TEXT,
    completed_at TEXT,
    summary_email_sent_at TEXT,
    summary_email_attempted_at TEXT,
    summary_email_error TEXT,
    viewed_resume INTEGER NOT NULL DEFAULT 0,
    downloaded_resume INTEGER NOT NULL DEFAULT 0,
    resume_dwell_ms INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (share_link_id) REFERENCES share_links(id) ON DELETE CASCADE
);

-- 模块停留时间表
CREATE TABLE IF NOT EXISTS module_dwell_times (
    id TEXT PRIMARY KEY,
    visit_id TEXT NOT NULL,
    share_link_id TEXT NOT NULL,
    module_name TEXT NOT NULL,
    dwell_time_ms INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (visit_id) REFERENCES link_visits(id) ON DELETE CASCADE,
    FOREIGN KEY (share_link_id) REFERENCES share_links(id) ON DELETE CASCADE,
    UNIQUE(visit_id, module_name)
);

-- 点击事件表
CREATE TABLE IF NOT EXISTS click_events (
    id TEXT PRIMARY KEY,
    visit_id TEXT NOT NULL,
    share_link_id TEXT,
    event_type TEXT NOT NULL,
    event_label TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (visit_id) REFERENCES link_visits(id) ON DELETE CASCADE,
    FOREIGN KEY (share_link_id) REFERENCES share_links(id) ON DELETE SET NULL
);

-- 邮件设置表
CREATE TABLE IF NOT EXISTS analytics_email_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    enabled INTEGER NOT NULL DEFAULT 0,
    recipient_email TEXT,
    public_base_url TEXT,
    smtp_host TEXT,
    smtp_port INTEGER,
    smtp_secure INTEGER NOT NULL DEFAULT 1,
    smtp_user TEXT,
    smtp_pass TEXT,
    smtp_from TEXT,
    updated_at TEXT NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_link_visits_share_link_id ON link_visits(share_link_id);
CREATE INDEX IF NOT EXISTS idx_link_visits_visited_at ON link_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_link_visits_share_link_visited_at ON link_visits(share_link_id, visited_at);
CREATE INDEX IF NOT EXISTS idx_share_links_slug ON share_links(slug);
CREATE INDEX IF NOT EXISTS idx_module_dwell_visit_id ON module_dwell_times(visit_id);
CREATE INDEX IF NOT EXISTS idx_module_dwell_share_link_id ON module_dwell_times(share_link_id);
CREATE INDEX IF NOT EXISTS idx_click_events_share_link_id ON click_events(share_link_id);
CREATE INDEX IF NOT EXISTS idx_click_events_visit_id ON click_events(visit_id);
CREATE INDEX IF NOT EXISTS idx_click_events_type ON click_events(event_type);
