'use client';

import { useEffect, useRef } from 'react';

const DEFAULT_MODULE_SELECTORS = [
  { id: 'about', label: 'Hero / 关于' },
  { id: 'introduce', label: '个人介绍' },
  { id: 'education', label: '教育背景' },
  { id: 'workexperience', label: '工作经历' },
  { id: 'technical', label: '技术项目' },
  { id: 'skills', label: '技能' },
  { id: 'connect', label: '联系方式' },
];

interface DwellRecord {
  module_name: string;
  dwell_time_ms: number;
}

export function useModuleTracker(modules = DEFAULT_MODULE_SELECTORS) {
  const dwellTimers = useRef<Record<string, number>>({});
  const lastVisible = useRef<Record<string, number>>({});
  const visibleModules = useRef<Set<string>>(new Set());
  const visitId = useRef<string | null>(null);
  const finalReported = useRef(false);

  useEffect(() => {
    const checkVisitId = () => {
      const stored = sessionStorage.getItem('visit_id');
      if (stored) {
        visitId.current = stored;
      }
    };

    checkVisitId();
    const poll = setInterval(() => {
      checkVisitId();
      if (visitId.current) {
        clearInterval(poll);
      }
    }, 500);

    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const addElapsed = (id: string, now: number) => {
      const startedAt = lastVisible.current[id];
      if (!startedAt) return;

      dwellTimers.current[id] = (dwellTimers.current[id] || 0) + now - startedAt;
      delete lastVisible.current[id];
    };

    const isInViewport = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth
      );
    };

    const startVisibleModules = () => {
      if (document.visibilityState !== 'visible') return;

      const now = Date.now();
      modules.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element instanceof HTMLElement && isInViewport(element)) {
          visibleModules.current.add(id);
          if (!lastVisible.current[id]) {
            lastVisible.current[id] = now;
          }
        }
      });
    };

    const buildRecords = (keepRunning: boolean): DwellRecord[] => {
      const now = Date.now();
      const records: DwellRecord[] = [];

      modules.forEach(({ id }) => {
        const startedAt = lastVisible.current[id];
        if (startedAt) {
          dwellTimers.current[id] = (dwellTimers.current[id] || 0) + now - startedAt;
          if (keepRunning && document.visibilityState === 'visible') {
            lastVisible.current[id] = now;
          } else {
            delete lastVisible.current[id];
          }
        }

        const total = dwellTimers.current[id] || 0;
        if (total >= 500) {
          records.push({ module_name: id, dwell_time_ms: Math.round(total) });
        }
      });

      return records;
    };

    const sendRecords = (keepRunning: boolean, useBeacon: boolean) => {
      if (!visitId.current) return;

      const records = buildRecords(keepRunning);
      if (records.length === 0) return;

      const payload = JSON.stringify({
        visit_id: visitId.current,
        records,
      });

      if (useBeacon) {
        navigator.sendBeacon('/api/analytics/module-dwell', payload);
        return;
      }

      fetch('/api/analytics/module-dwell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      }).catch(() => {});
    };

    modules.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const now = Date.now();

            if (entry.isIntersecting) {
              visibleModules.current.add(id);
              if (document.visibilityState === 'visible' && !lastVisible.current[id]) {
                lastVisible.current[id] = now;
              }
              return;
            }

            visibleModules.current.delete(id);
            addElapsed(id, now);
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(element);
      observers.push(observer);
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendRecords(false, true);
        return;
      }

      finalReported.current = false;
      startVisibleModules();
    };

    const flushFinal = () => {
      if (finalReported.current) return;
      finalReported.current = true;
      sendRecords(false, true);
    };

    const handleBeforeUnload = () => {
      flushFinal();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleBeforeUnload);
    window.addEventListener('beforeunload', handleBeforeUnload);

    startVisibleModules();

    const autoReportInterval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      sendRecords(true, false);
    }, 5000);

    return () => {
      observers.forEach((o) => o.disconnect());
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleBeforeUnload);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(autoReportInterval);
      flushFinal();
    };
  }, [modules]);
}
