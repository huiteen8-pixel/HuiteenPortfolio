'use client';

import { useEffect, useId, useRef, type CSSProperties } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/** Image-based counterpart of variable-font proximity, preserving the tape artwork. */
export default function TapeTitleProximity({ style }: { style: CSSProperties }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<SVGRadialGradientElement>(null);
  const overlayRef = useRef<SVGImageElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const id = useId().replace(/:/g, '');

  useEffect(() => {
    const container = containerRef.current;
    const gradient = gradientRef.current;
    const overlay = overlayRef.current;
    if (!container || !gradient || !overlay || reducedMotion) return;

    let frame = 0;
    let x = 304;
    let y = 217;
    let opacity = 0;
    let targetX = x;
    let targetY = y;
    let targetOpacity = 0;

    const animate = () => {
      // Same smoothing factor as the supplied VariableProximity settings.
      x += (targetX - x) * 0.2;
      y += (targetY - y) * 0.2;
      opacity += (targetOpacity - opacity) * 0.2;
      gradient.setAttribute('cx', String(x));
      gradient.setAttribute('cy', String(y));
      overlay.setAttribute('opacity', String(opacity));
      if (Math.abs(targetX - x) + Math.abs(targetY - y) + Math.abs(targetOpacity - opacity) > 0.002) {
        frame = requestAnimationFrame(animate);
      } else {
        overlay.setAttribute('opacity', String(targetOpacity));
        frame = 0;
      }
    };
    const start = () => { if (!frame) frame = requestAnimationFrame(animate); };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const bounds = container.getBoundingClientRect();
      targetX = (event.clientX - bounds.left) * 608 / bounds.width;
      targetY = (event.clientY - bounds.top) * 434 / bounds.height;
      gradient.setAttribute('r', String(100 * 608 / bounds.width));
      targetOpacity = 1;
      start();
    };
    const leave = () => { targetOpacity = 0; start(); };
    container.addEventListener('pointermove', move);
    container.addEventListener('pointerleave', leave);
    container.addEventListener('pointercancel', leave);
    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener('pointermove', move);
      container.removeEventListener('pointerleave', leave);
      container.removeEventListener('pointercancel', leave);
      overlay.setAttribute('opacity', '0');
    };
  }, [reducedMotion]);

  return (
    <div ref={containerRef} className="about-reference-asset about-tape-title about-tape-proximity" style={style}>
      <svg viewBox="0 0 608 434" role="img" aria-label="How to define Huiteen?">
        <defs>
          <radialGradient ref={gradientRef} id={`${id}-proximity`} gradientUnits="userSpaceOnUse" cx="304" cy="217" r="100">
            <stop offset="0" stopColor="white" />
            <stop offset="1" stopColor="black" />
          </radialGradient>
          <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="-10" y="-10" width="628" height="454" style={{ maskType: 'luminance' }}>
            <rect x="-10" y="-10" width="628" height="454" fill={`url(#${id}-proximity)`} />
          </mask>
          <filter id={`${id}-weight`} x="-5%" y="-5%" width="110%" height="110%">
            <feMorphology operator="dilate" radius="3" />
          </filter>
        </defs>
        <image href="/about/tape-title.png" width="608" height="434" />
        <g mask={`url(#${id}-mask)`} aria-hidden="true">
          <image ref={overlayRef} href="/about/tape-title.png" width="608" height="434" filter={`url(#${id}-weight)`} opacity="0" />
        </g>
      </svg>
    </div>
  );
}
