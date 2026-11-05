'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';

import HeroHandwriting from './HeroHandwriting';

import letterOutlines from './hero/wordmark-paths.json';
import numberedDetails from './hero/wordmark-details.json';

export default function HeroSection() {
  const [wordmarkReady, setWordmarkReady] = useState(false);
  const wordmarkMaskId = useId();
  const wordmarkFeatherId = useId();
  const wordmarkDetailsId = useId();
  const sceneRef = useRef<HTMLElement>(null);
  const [writingProgress, setWritingProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const updateBackground = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scene = sceneRef.current;
        const shell = scene?.parentElement;
        const pinned = scene?.firstElementChild as HTMLElement | null;
        if (!scene || !shell || !pinned) return;
        const travel = Math.max(0, scene.offsetHeight - pinned.offsetHeight);
        const offset = Math.max(0, Math.min(travel, -scene.getBoundingClientRect().top));
        shell.style.setProperty('--hero-background-offset', `${offset}px`);
      });
    };
    updateBackground();
    window.addEventListener('scroll', updateBackground, { passive: true });
    window.addEventListener('resize', updateBackground);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateBackground);
      window.removeEventListener('resize', updateBackground);
    };
  }, []);

  useEffect(() => {
    if (!wordmarkReady) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scene = sceneRef.current;
        if (!scene) return;
        const distance = scene.offsetHeight - window.innerHeight;
        const fraction = distance > 0 ? -scene.getBoundingClientRect().top / distance : 1;
        setWritingProgress(reducedMotion.matches ? 1 : Math.max(0, Math.min(1, (fraction - 0.035) / 0.85)));
      });
    };
    // The opening signature finishes before the scroll-controlled handwriting begins.
    const timer = window.setTimeout(update, reducedMotion.matches ? 0 : 4200);
    const onScroll = () => { if (performance.now() >= readyAt) update(); };
    const readyAt = performance.now() + (reducedMotion.matches ? 0 : 4200);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    reducedMotion.addEventListener('change', update);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      reducedMotion.removeEventListener('change', update);
    };
  }, [wordmarkReady]);

  useEffect(() => {
    const artwork = new window.Image();
    artwork.onload = () => setWordmarkReady(true);
    artwork.src = '/hero/title.png';
    return () => { artwork.onload = null; };
  }, []);

  return (
    <section
      id="about"
      ref={sceneRef}
      className="hero-scroll-scene relative text-white"
      aria-labelledby="portfolio-title"
    >
      <div className="hero-pinned sticky top-0 flex h-[100svh] flex-col overflow-hidden px-5 pb-12 pt-8 sm:px-8 md:px-8 md:pb-16 md:pt-12">
      <div className="flex w-full items-center">
        <a
          href="#profile"
          className="group inline-flex items-center gap-3 rounded-full pr-4 font-mono text-[clamp(1.5rem,2.1vw,2.5rem)] tracking-[-0.03em] text-white/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:gap-5"
          aria-label="前往 About 个人介绍"
        >
          <span className="relative h-[clamp(4.5rem,4.8vw,6rem)] w-[clamp(4.5rem,4.8vw,6rem)] shrink-0 overflow-hidden rounded-full bg-white">
            <Image
              src="/hero/avatar.png"
              alt="Huiteen hand-drawn avatar"
              fill
              sizes="96px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority
            />
          </span>
          <span>About</span>
        </a>
      </div>

      <div className="hero-center mx-auto flex w-full flex-1 flex-col items-center justify-start pt-[clamp(4rem,17vh,12rem)] text-center">
        <h1 id="portfolio-title" className="sr-only">
          Huiteen — The undefined designer
        </h1>

        <div className={`hero-wordmark relative w-[min(92vw,760px)] md:w-[min(74vw,1400px)] ${wordmarkReady ? 'hero-wordmark-ready' : ''}`}>
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

        <div className="hero-subtitle-enter mt-2 flex items-center justify-center gap-[0.45em] font-mono text-[clamp(1.15rem,2.7vw,3.25rem)] font-light tracking-[-0.045em] text-white/90 md:mt-1">
          <span>The</span>
          <span className="relative inline-flex h-[2.4em] w-[5.8em] items-center justify-center">
            <Image
              src="/hero/tag.png"
              alt=""
              fill
              sizes="200px"
              className="object-fill"
              aria-hidden="true"
            />
            <span className="relative z-10 -translate-y-[0.02em] rotate-[-2deg] font-mono text-[0.93em] font-semibold text-[#4d5055]">
              undefined
            </span>
          </span>
          <span>designer</span>
        </div>
      </div>

      <HeroHandwriting progress={writingProgress} />
      <span className="sr-only">Hui’s portfolio. Imperfect but casual. Show what I am. Ideas, aesthetic, all-round.</span>
      </div>
    </section>
  );
}
