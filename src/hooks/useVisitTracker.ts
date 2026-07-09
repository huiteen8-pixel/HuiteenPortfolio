'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function useVisitTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // 检查是否已经有 visit_id（说明已经记录过这次会话）
    if (sessionStorage.getItem('visit_id')) {
      return;
    }

    const ref = searchParams.get('ref');
    const slug = ref || 'direct'; // 如果没有 ref，使用 'direct' 作为默认slug

    // Track visit via API
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.visit_id) {
          sessionStorage.setItem('visit_id', data.visit_id);
        }
      })
      .catch(() => {
        // Silently fail — tracking should never break the page
      });
  }, [searchParams]);
}
