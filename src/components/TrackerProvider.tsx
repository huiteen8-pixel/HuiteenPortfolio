'use client';

import { Suspense, useState, useEffect } from 'react';
import { useVisitTracker } from '@/hooks/useVisitTracker';
import { useVisitDuration } from '@/hooks/useVisitDuration';
import { useModuleTracker } from '@/hooks/useModuleTracker';
import { useClickTracker } from '@/hooks/useClickTracker';

function TrackerInner() {
  useVisitTracker();
  useClickTracker();
  const [visitId, setVisitId] = useState<string | null>(null);

  useEffect(() => {
    // Poll for visit_id from sessionStorage
    const checkVisitId = () => {
      const stored = sessionStorage.getItem('visit_id');
      if (stored) {
        setVisitId(stored);
      }
    };

    checkVisitId();
    const poll = setInterval(checkVisitId, 500);
    return () => clearInterval(poll);
  }, []);

  useVisitDuration(visitId);
  useModuleTracker();

  return null;
}

export function TrackerProvider() {
  return (
    <Suspense fallback={null}>
      <TrackerInner />
    </Suspense>
  );
}
