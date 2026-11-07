'use client';

import { useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export default function BioCampusProjectCover() {
  const video = useRef<HTMLVideoElement>(null);
  const visible = useInView(video, { amount: .15 });
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (visible && !reducedMotion) void element.play().catch(() => {});
    else element.pause();
  }, [visible, reducedMotion]);

  return <video ref={video} className="work-project-cover-video" src="/projects/symbiosphere/cover-video-trimmed.mp4"
    aria-label="万物链 Bio Campus 动态封面" muted loop playsInline preload="auto"
    poster="/projects/symbiosphere/cover-video-poster.jpg" />;
}
