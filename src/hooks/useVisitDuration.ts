'use client';

import { useEffect, useRef } from 'react';

export function useVisitDuration(visitId: string | null, visitToken: string | null) {
  const totalVisibleTime = useRef<number>(0);
  const lastVisibleStart = useRef<number | null>(null);
  const completionSent = useRef(false);
  const reportInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!visitId || !visitToken) return;

    const startTimer = () => {
      if (!lastVisibleStart.current) {
        lastVisibleStart.current = Date.now();
      }
    };

    const stopTimer = () => {
      if (!lastVisibleStart.current) return;

      totalVisibleTime.current += Date.now() - lastVisibleStart.current;
      lastVisibleStart.current = null;
    };

    const getCurrentDuration = (stopCurrentTimer: boolean) => {
      if (stopCurrentTimer) {
        stopTimer();
        return Math.round(totalVisibleTime.current);
      }

      let currentTotal = totalVisibleTime.current;
      if (lastVisibleStart.current) {
        currentTotal += Date.now() - lastVisibleStart.current;
      }
      return Math.round(currentTotal);
    };

    const postJson = (url: string, payload: Record<string, unknown>, useBeacon: boolean) => {
      const body = JSON.stringify({ ...payload, token: visitToken });

      if (useBeacon && navigator.sendBeacon(url, body)) {
        return;
      }

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: useBeacon,
      }).catch(() => {});
    };

    const reportDuration = (useBeacon: boolean) => {
      const durationMs = getCurrentDuration(useBeacon);
      if (durationMs < 1000) return;

      postJson('/api/analytics/visit-duration', {
        visit_id: visitId,
        duration_ms: durationMs,
      }, useBeacon);
    };

    const completeVisit = () => {
      if (completionSent.current) return;
      completionSent.current = true;

      const durationMs = getCurrentDuration(true);
      if (durationMs < 1000) return;

      postJson('/api/analytics/complete-visit', {
        visit_id: visitId,
        duration_ms: durationMs,
      }, true);
    };

    if (document.visibilityState === 'visible') {
      startTimer();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopTimer();
        reportDuration(true);
        return;
      }

      startTimer();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', completeVisit);
    window.addEventListener('beforeunload', completeVisit);

    reportInterval.current = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      reportDuration(false);
    }, 10000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', completeVisit);
      window.removeEventListener('beforeunload', completeVisit);

      if (reportInterval.current) {
        clearInterval(reportInterval.current);
      }

      reportDuration(true);
    };
  }, [visitId, visitToken]);
}
