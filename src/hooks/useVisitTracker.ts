'use client';

import { useEffect, useState } from 'react';

export type VisitCredentials = {
  visitId: string | null;
  token: string | null;
};

export function useVisitTracker(refSlug: string) {
  const [credentials, setCredentials] = useState<VisitCredentials>({
    visitId: null,
    token: null,
  });

  useEffect(() => {
    const storedRef = sessionStorage.getItem('visit_ref');
    const storedVisitId = sessionStorage.getItem('visit_id');
    const storedVisitToken = sessionStorage.getItem('visit_token');

    // 同一分享链接在当前浏览会话内继续使用同一次 visit。
    if (storedRef === refSlug && storedVisitId && storedVisitToken) {
      setCredentials({ visitId: storedVisitId, token: storedVisitToken });
      return;
    }

    // ref 变化时必须创建新 visit，不得沿用上一条分享链接的凭据。
    sessionStorage.removeItem('visit_ref');
    sessionStorage.removeItem('visit_id');
    sessionStorage.removeItem('visit_token');
    setCredentials({ visitId: null, token: null });

    const controller = new AbortController();

    // Track visit via API
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: refSlug }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unable to start analytics visit');
        return res.json();
      })
      .then((data) => {
        if (
          !controller.signal.aborted &&
          typeof data.visit_id === 'string' &&
          typeof data.token === 'string'
        ) {
          sessionStorage.setItem('visit_ref', refSlug);
          sessionStorage.setItem('visit_id', data.visit_id);
          sessionStorage.setItem('visit_token', data.token);
          setCredentials({ visitId: data.visit_id, token: data.token });
        }
      })
      .catch(() => {
        // Silently fail — tracking should never break the page
      });

    return () => controller.abort();
  }, [refSlug]);

  return credentials;
}
