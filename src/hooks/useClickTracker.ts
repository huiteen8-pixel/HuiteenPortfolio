'use client';

import { useEffect } from 'react';

/**
 * 全局站外链接点击追踪
 * 自动拦截所有指向外部域名的 <a> 标签点击并上报
 */
export function useClickTracker() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // 向上查找最近的 <a> 标签
      let target = e.target as HTMLElement | null;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }
      if (!target || target.tagName !== 'A') return;

      const anchor = target as HTMLAnchorElement;
      const href = anchor.getAttribute('href') || anchor.href;

      // 只追踪站外链接
      if (!isExternalLink(href)) return;

      // 检查是否有显式 data-track-event 属性（允许页面定制 event_type）
      const eventType = anchor.getAttribute('data-track-event') || 'external_link';

      // event_label: 优先用 data-track-label，其次是链接文字，最后是 hostname
      const eventLabel =
        anchor.getAttribute('data-track-label') ||
        (anchor.textContent?.trim().slice(0, 80) || '') ||
        getHostname(href);

      const visitId = sessionStorage.getItem('visit_id');
      if (!visitId) return;

      // sendBeacon 确保页面跳转前发送成功
      const payload = JSON.stringify({
        visit_id: visitId,
        event_type: eventType,
        event_label: eventLabel,
      });
      navigator.sendBeacon('/api/analytics/click-event', new Blob([payload], { type: 'application/json' }));
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);
}

function isExternalLink(href: string): boolean {
  if (!href) return false;

  // 过滤 javascript:、mailto:、tel: 等非 HTTP 协议
  if (!/^https?:\/\//i.test(href)) return false;

  try {
    const url = new URL(href);
    // 过滤同站点链接
    if (url.hostname === window.location.hostname) return false;
    return true;
  } catch {
    return false;
  }
}

function getHostname(href: string): string {
  try {
    return new URL(href).hostname;
  } catch {
    return href;
  }
}
