'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useVisitTracker } from '@/hooks/useVisitTracker';
import { useVisitDuration } from '@/hooks/useVisitDuration';
import { useModuleTracker } from '@/hooks/useModuleTracker';
import { useClickTracker } from '@/hooks/useClickTracker';

function TrackerInner({ refSlug }: { refSlug: string }) {
  const credentials = useVisitTracker(refSlug);
  useClickTracker(credentials.visitId, credentials.token);
  useVisitDuration(credentials.visitId, credentials.token);
  useModuleTracker(credentials.visitId, credentials.token);

  return null;
}

function TrackerGate() {
  const searchParams = useSearchParams();
  const refSlug = searchParams.get('ref')?.trim();

  if (!refSlug) {
    return null;
  }

  return <TrackerInner key={refSlug} refSlug={refSlug} />;
}

export function TrackerProvider() {
  return (
    <Suspense fallback={null}>
      <TrackerGate />
    </Suspense>
  );
}
