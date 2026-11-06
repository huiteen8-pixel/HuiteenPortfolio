'use client';

import { useId, useRef, type CSSProperties } from 'react';
import { useInView, motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

// Clockwise order on the original artboard, including both 2:30 entries.
const schedule = [
  { name: '9:30 breakfast', box: [355, 40, 210, 98] },
  { name: '10:00 calpis', box: [577, 109, 145, 97] },
  { name: '10:30 dog time', box: [643, 226, 195, 98] },
  { name: '12:30 lunch & coffee', box: [680, 356, 164, 138] },
  { name: '1:00 scrolling', box: [608, 519, 204, 100] },
  { name: '2:00 giggly', box: [467, 619, 152, 105] },
  { name: '2:30 writing', box: [244, 624, 158, 102] },
  { name: '3:00 homework', box: [103, 519, 205, 94] },
  { name: '7:00 stupid walk', box: [82, 358, 145, 132] },
  { name: '11:00 morework', box: [75, 228, 210, 97] },
  { name: '2:30 sleep', box: [204, 101, 135, 100] },
];

export default function DailyClock({ style }: { style: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const entered = useInView(ref, { once: true, amount: 0.3 });
  const visible = useInView(ref, { amount: 0.05 });
  const reducedMotion = usePrefersReducedMotion();
  const id = useId().replace(/:/g, '');

  return (
    <div ref={ref} id="about-daily-clock" className="about-reference-asset about-daily-clock" style={style}>
      <svg viewBox="0 0 920 795" role="img" aria-label={`Huiteen 的日常时钟：${schedule.map(item => item.name).join('，')}`}>
        <defs>
          {/* Extract only green ink, retaining the original hand-drawn lettering. */}
          <filter id={`${id}-green`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -4 8 -4 0 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
          {schedule.map(({ box: [x, y, width, height] }, index) => (
            <clipPath key={index} id={`${id}-label-${index}`}><rect x={x} y={y} width={width} height={height} /></clipPath>
          ))}
        </defs>
        <image href="/about/daily-clock-clean.png" width="920" height="795" preserveAspectRatio="none" />
        {schedule.map(({ name }, index) => (
          <motion.g key={name} className="daily-clock-label" data-time={name}
            initial={{ opacity: 0 }} animate={{ opacity: entered || reducedMotion ? 1 : 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : index * 0.24 }}
            clipPath={`url(#${id}-label-${index})`}>
            <image href="/about/daily-clock.png" width="920" height="795" filter={`url(#${id}-green)`} />
          </motion.g>
        ))}
        <g transform="translate(459 394)" className="daily-clock-hands" style={{ animationPlayState: visible && !reducedMotion ? 'running' : 'paused' }}>
          <rect x="-24" y="-25" width="48" height="46" fill="#ec8dd0" stroke="#ad5695" strokeWidth="0.8" />
          <g className="daily-clock-hand daily-clock-hour"><path d="M-9 11 L84 -111" stroke="#080808" strokeWidth="8" /></g>
          <g className="daily-clock-hand daily-clock-minute"><path d="M0 0 L201 45" stroke="#bdbdb7" strokeWidth="8" /></g>
          <g className="daily-clock-hand daily-clock-second"><path d="M0 0 L-202 136" stroke="#f51b10" strokeWidth="2.5" /></g>
        </g>
      </svg>
    </div>
  );
}
