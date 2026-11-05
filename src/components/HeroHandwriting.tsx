'use client';

import { useId } from 'react';
import handwriting from './hero/handwriting.json';

const totalLength = handwriting.reduce((sum, group) => sum + group.paths.reduce((n, path) => n + path.length, 0), 0);
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export default function HeroHandwriting({ progress }: { progress: number }) {
  const id = useId();

  return (
    <div className="hero-handwriting pointer-events-none absolute inset-0" aria-hidden="true">
      {handwriting.map((group, groupIndex) => {
        const start = handwriting.slice(0, groupIndex).reduce((sum, previous) => sum + previous.paths.reduce((n, path) => n + path.length, 0), 0);
        const paths = group.paths.map((path, pathIndex) => {
          const offset = start + group.paths.slice(0, pathIndex).reduce((sum, previous) => sum + previous.length, 0);
          return { ...path, reveal: clamp((progress * totalLength - offset) / path.length) };
        });
        const end = start + group.paths.reduce((sum, path) => sum + path.length, 0);
        const complete = clamp((progress * totalLength - end) / 32);
        return (
          <svg
            key={group.name}
            className={`hero-note hero-note-${group.name} absolute`}
            style={{ left: `${group.x / 1799 * 100}%`, top: `${group.y / 1080 * 100}%`, width: `${group.width / 1799 * 100}%` }}
            viewBox={`0 0 ${group.width} ${group.height}`}
            data-note-start={start / totalLength}
          >
            <defs>
              <mask id={`${id}-${group.name}`} maskUnits="userSpaceOnUse" x="0" y="0" width={group.width} height={group.height} style={{ maskType: 'luminance' }}>
                {paths.map((path, index) => (
                  <path key={index} d={path.d} fill="none" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - path.reveal} opacity={path.reveal > 0 ? 1 : 0} />
                ))}
                <rect width={group.width} height={group.height} fill="white" opacity={progress === 1 ? 1 : complete} />
              </mask>
            </defs>
            <image href={`/hero/handwriting/${group.name}.png`} width={group.width} height={group.height} mask={`url(#${id}-${group.name})`} />
          </svg>
        );
      })}
    </div>
  );
}
