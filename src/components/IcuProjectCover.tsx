'use client';

import Image from 'next/image';
import { useRef, type CSSProperties } from 'react';
import { useInView } from 'framer-motion';
import './IcuProjectCover.css';

// Four masked copies preserve the supplied metallic artwork while letting
// I, C, U and the gold plus arrive individually. The PNG is downloaded once.
const letters = [
  { clip: 'inset(0 70% 0 0)', angle: '-4deg' },
  { clip: 'inset(0 50.7% 0 30%)', angle: '3deg' },
  { clip: 'inset(0 32.7% 0 49.3%)', angle: '-3deg' },
  { clip: 'inset(0 0 0 67.3%)', angle: '8deg' },
];

export default function IcuProjectCover({ compact = false }: { compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: .25 });
  return (
    <div ref={ref} className={`icu-project-cover${compact ? ' icu-project-cover--compact' : ''}`} data-visible={visible}>
      <div className="icu-cover-logo" role="img" aria-label="ICU+">
        {letters.map((letter, index) => (
          <span key={index} className="icu-cover-letter" style={{ clipPath: letter.clip, '--letter-delay': `${index * .13}s`, '--letter-angle': letter.angle } as CSSProperties} aria-hidden="true">
            <Image src="/projects/icu/cover-logo.png" alt="" fill sizes="(max-width: 767px) 90vw, 60vw" className="icu-cover-art" />
          </span>
        ))}
      </div>
    </div>
  );
}
