'use client';

import { useEffect } from 'react';

/**
 * 全局站外链接点击追踪
 * 自动拦截所有指向外部域名的 <a> 标签点击并上报
 */
export function useClickTracker(visitId: string | null, visitToken: string | null) {
  useEffect(() => {
    if (!visitId || !visitToken) return;

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

      // 只上报页面明确标记、且服务端另行做白名单校验的稳定 ID；
      // 链接文字不会进入数据库。
      const eventType = 'external_link';
      const eventLabel = anchor.dataset.trackLabel;
      if (!eventLabel) return;

      // sendBeacon 确保页面跳转前发送成功
      const payload = JSON.stringify({
        visit_id: visitId,
        token: visitToken,
        event_type: eventType,
        event_label: eventLabel,
      });
      navigator.sendBeacon('/api/analytics/click-event', new Blob([payload], { type: 'application/json' }));
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [visitId, visitToken]);
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
