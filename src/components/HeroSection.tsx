'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent,
} from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface HeroSectionProps {
  tags: string[];
}

type HeroAnimationStyle = CSSProperties & {
  '--hero-delay'?: string;
};

export default function HeroSection({ tags }: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const heroBoundsRef = useRef<DOMRect | null>(null);
  const parallaxEnabledRef = useRef(false);
  const shouldReduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const updatePointerCapability = () => {
      parallaxEnabledRef.current = pointerQuery.matches;
    };

    updatePointerCapability();
    pointerQuery.addEventListener('change', updatePointerCapability);
    return () => pointerQuery.removeEventListener('change', updatePointerCapability);
  }, []);

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    },
    [],
  );

  const updateParallax = useCallback((x: number, y: number) => {
    if (!heroRef.current) return;
    heroRef.current.style.setProperty('--hero-x', x.toFixed(4));
    heroRef.current.style.setProperty('--hero-y', y.toFixed(4));
  }, []);

  const handleHeroPointerEnter = () => {
    if (shouldReduceMotion || !parallaxEnabledRef.current || !heroRef.current) return;
    heroBoundsRef.current = heroRef.current.getBoundingClientRect();
    heroRef.current.dataset.parallaxActive = 'true';
  };

  const handleHeroPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (
      shouldReduceMotion ||
      event.pointerType !== 'mouse' ||
      !parallaxEnabledRef.current ||
      !heroRef.current
    ) {
      return;
    }

    const rect = heroBoundsRef.current ?? heroRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = window.requestAnimationFrame(() => {
      updateParallax(x, y);
      animationFrameRef.current = null;
    });
  };

  const handleHeroPointerLeave = () => {
    heroBoundsRef.current = null;
    if (heroRef.current) delete heroRef.current.dataset.parallaxActive;
    if (!shouldReduceMotion) updateParallax(0, 0);
  };

  const parallaxStyle = (x: number, y: number) =>
    shouldReduceMotion
      ? undefined
      : {
          transform: `translate3d(calc(var(--hero-x, 0) * ${x}px), calc(var(--hero-y, 0) * ${y}px), 0)`,
        };

  const entranceStyle = (delay: number): HeroAnimationStyle => ({
    '--hero-delay': `${delay}ms`,
  });

  return (
    <section
      id="about"
      ref={heroRef}
      onPointerEnter={handleHeroPointerEnter}
      onPointerMove={handleHeroPointerMove}
      onPointerLeave={handleHeroPointerLeave}
      className="relative flex min-h-screen scroll-mt-24 items-center overflow-hidden bg-white px-4 py-24 sm:px-6 md:px-8"
      aria-labelledby="portfolio-title"
    >
      <div className="hero-rule hero-rule-top pointer-events-none absolute inset-x-4 top-20 h-px bg-[#ece7df] md:inset-x-8" />
      <div className="hero-rule hero-rule-bottom pointer-events-none absolute inset-x-4 bottom-20 h-px bg-[#ece7df] md:inset-x-8" />

      <div className="relative mx-auto w-full max-w-[1400px]">
        <div className="max-w-6xl space-y-8 text-left">
          <div className="hero-reveal" style={entranceStyle(80)}>
            <p
              className="hero-parallax-layer text-sm uppercase tracking-[0.18em] text-[#746c65] md:tracking-[0.34em]"
              style={parallaxStyle(-9, -6)}
            >
              Interaction / Service / AIGC Portfolio
            </p>
          </div>
          <div className="hero-reveal" style={entranceStyle(150)}>
            <h1
              id="portfolio-title"
              className="hero-parallax-layer w-full select-none text-left text-[clamp(4.4rem,15vw,13rem)] font-bold leading-[0.88] text-[#171412]"
              style={{
                fontFamily: 'Noto Serif SC Critical, Noto Serif SC, Georgia, serif',
                ...parallaxStyle(-14, -9),
              }}
            >
              <span className="block">Huiteen</span>
              <span className="mt-4 block text-left text-[clamp(2.4rem,7vw,6rem)] font-semibold leading-none tracking-normal">
                郑惠文
              </span>
            </h1>
          </div>
          <div className="hero-reveal" style={entranceStyle(260)}>
            <p
              className="hero-parallax-layer max-w-6xl text-left text-xl leading-relaxed text-[#3e3832] md:text-3xl lg:whitespace-nowrap"
              style={{
                fontFamily: 'Noto Serif SC, Georgia, serif',
                ...parallaxStyle(-11, -7),
              }}
            >
              我擅长把模糊需求整理成清晰的产品结构、交互路径和可验证原型。
            </p>
          </div>
          <div className="hero-parallax-layer flex flex-wrap justify-start gap-3" style={parallaxStyle(-7, -5)}>
            {tags.map((tag, index) => (
              <span
                key={tag}
                className="hero-tag rounded-full border border-[#ded8d0] px-4 py-2 text-xs uppercase tracking-[0.12em] text-[#5d554e]"
                style={entranceStyle(390 + index * 55)}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
