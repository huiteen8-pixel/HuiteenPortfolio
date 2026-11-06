'use client';

import { useId } from 'react';
import letterOutlines from './hero/wordmark-paths.json';
import numberedDetails from './hero/wordmark-details.json';

/** Shared artwork and timing keep the home and About signatures identical. */
export default function HuiteenWordmark({ ready, className = '' }: { ready: boolean; className?: string }) {
  const wordmarkMaskId = useId();
  const wordmarkFeatherId = useId();
  const wordmarkDetailsId = useId();
  return (
    <div className={`hero-wordmark ${ready ? 'hero-wordmark-ready' : ''} ${className}`}>
          <svg className="block h-auto w-full" viewBox="0 0 3980 1329" role="img" aria-label="Huiteen">
            <defs>
              <clipPath id={`${wordmarkDetailsId}-body`}>
                <path clipRule="evenodd" d={`M0 0H3980V1329H0Z${numberedDetails.join('')}`} />
              </clipPath>
              {numberedDetails.map((d, index) => (
                <clipPath key={index} id={`${wordmarkDetailsId}-${index}`}><path d={d} /></clipPath>
              ))}
              <filter id={wordmarkFeatherId} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
                <feGaussianBlur stdDeviation="24" />
              </filter>
              <mask id={wordmarkMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="3980" height="1329" style={{ maskType: 'luminance' }}>
                <g className="hero-wordmark-traces" filter={`url(#${wordmarkFeatherId})`} fill="none" stroke="white" strokeWidth="150" strokeLinecap="round" strokeLinejoin="round">
                  {letterOutlines.map((d, index) => (
                    <path key={index} d={d} pathLength="1" style={{ animationDelay: `${0.8 + index * 0.14}s` }} />
                  ))}
                </g>
                <rect className="hero-wordmark-complete" width="3980" height="1329" fill="white" />
              </mask>
            </defs>
            <g clipPath={`url(#${wordmarkDetailsId}-body)`}>
              <image href="/hero/title.png" width="3980" height="1329" mask={`url(#${wordmarkMaskId})`} />
            </g>
            {numberedDetails.map((_, index) => (
              <g key={index} className="hero-wordmark-point" style={{ animationDelay: `${index * 0.26}s` }}>
                <image href="/hero/title.png" width="3980" height="1329" clipPath={`url(#${wordmarkDetailsId}-${index})`} />
              </g>
            ))}
          </svg>
    </div>
  );
}
