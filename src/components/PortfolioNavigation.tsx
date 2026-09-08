'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Menu } from 'lucide-react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

type NavigationItem = {
  label: string;
  id: string;
};

type ProjectNavigationItem = {
  id: string;
  index: string;
  title: string;
};

interface PortfolioNavigationProps {
  navigation: NavigationItem[];
  projects: ProjectNavigationItem[];
}

const getScrollBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export default function PortfolioNavigation({ navigation, projects }: PortfolioNavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(navigation[0]?.id ?? 'about');
  const progressRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    let animationFrameId: number | null = null;

    const updateScrollState = () => {
      animationFrameId = null;
      const scrollTop = window.scrollY;
      const nextScrolled = scrollTop > 100;
      setScrolled((current) => (current === nextScrolled ? current : nextScrolled));

      const readingLine = scrollTop + Math.min(window.innerHeight * 0.36, 300);
      let nextActiveSection = navigation[0]?.id ?? 'about';
      navigation.forEach((item) => {
        const section = document.getElementById(item.id);
        if (section && section.offsetTop <= readingLine) nextActiveSection = item.id;
      });
      setActiveSection((current) =>
        current === nextActiveSection ? current : nextActiveSection,
      );

      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, scrollTop / maxScroll));
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`;
      }
    };

    const scheduleScrollUpdate = () => {
      if (animationFrameId === null) {
        animationFrameId = window.requestAnimationFrame(updateScrollState);
      }
    };

    window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
    window.addEventListener('resize', scheduleScrollUpdate);
    scheduleScrollUpdate();
    return () => {
      window.removeEventListener('scroll', scheduleScrollUpdate);
      window.removeEventListener('resize', scheduleScrollUpdate);
      if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
    };
  }, [navigation]);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    setActiveSection(id);
    const top = element.getBoundingClientRect().top + window.scrollY - 88;
    window.history.replaceState(window.history.state, '', `#${id}`);
    window.scrollTo({ top, behavior: getScrollBehavior() });
  };

  return (
    <>
      <nav
        aria-label="主要导航"
        className={`fixed left-0 right-0 top-0 z-50 translate-y-0 bg-white/92 opacity-100 backdrop-blur-md transition-[transform,opacity,background-color,box-shadow] duration-300 ${
          scrolled
            ? 'shadow-[0_8px_28px_rgba(24,20,16,0.05)] md:translate-y-0 md:bg-white/88 md:opacity-100'
            : 'md:pointer-events-none md:-translate-y-4 md:bg-transparent md:opacity-0'
        }`}
      >
        <div className="mx-auto flex min-h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6 md:px-8">
          <button
            type="button"
            onClick={() => scrollTo('about')}
            className="relative min-h-11 text-left text-sm uppercase tracking-[0.2em] text-[#1a1a1a] transition-colors hover:text-[#5f5a55] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#171412] md:tracking-[0.24em]"
            style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}
            aria-current={activeSection === 'about' ? 'location' : undefined}
          >
            郑惠文 Huiteen
            {activeSection === 'about' && (
              <motion.span
                layoutId="portfolio-active-navigation"
                aria-hidden="true"
                className="absolute inset-x-0 bottom-1 h-px bg-[#171412]"
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.32, ease: MOTION_EASE }
                }
              />
            )}
          </button>

          <div className="hidden items-center gap-10 md:flex">
            {navigation.slice(1).map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="relative min-h-11 text-sm uppercase tracking-[0.22em] text-[#1a1a1a] transition-colors hover:text-[#5f5a55] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#171412]"
                style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}
                aria-current={activeSection === item.id ? 'location' : undefined}
              >
                {item.label}
                {activeSection === item.id && (
                  <motion.span
                    layoutId="portfolio-active-navigation"
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-1 h-px bg-[#171412]"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { duration: 0.32, ease: MOTION_EASE }
                    }
                  />
                )}
              </button>
            ))}
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-[#d8d1c8] px-3 text-sm text-[#1f1c19] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171412] md:hidden"
                aria-label="打开导航菜单"
              >
                <Menu aria-hidden="true" className="h-5 w-5" />
                <span>菜单</span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(88vw,380px)] gap-0 border-[#d8d1c8] bg-[#faf8f4] p-0 text-[#171412]"
            >
              <SheetHeader className="border-b border-[#ded8d0] px-6 pb-5 pt-7 text-left">
                <SheetTitle
                  className="text-3xl font-semibold"
                  style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}
                >
                  浏览作品集
                </SheetTitle>
                <SheetDescription className="text-sm leading-6 text-[#625b55]">
                  快速前往页面章节或指定项目。
                </SheetDescription>
              </SheetHeader>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#706a65]">页面</p>
                <div className="grid">
                  {navigation.map((item) => (
                    <SheetClose asChild key={item.id}>
                      <button
                        type="button"
                        onClick={() => scrollTo(item.id)}
                        className="flex min-h-11 items-center border-b border-[#e8e2da] text-left text-base font-medium"
                      >
                        {item.label}
                      </button>
                    </SheetClose>
                  ))}
                </div>

                <p className="mb-2 mt-8 text-xs uppercase tracking-[0.18em] text-[#706a65]">项目目录</p>
                <div className="grid">
                  {projects.map((project) => (
                    <SheetClose asChild key={project.id}>
                      <button
                        type="button"
                        onClick={() => scrollTo(project.id)}
                        className="grid min-h-12 grid-cols-[2.5rem_1fr] items-center border-b border-[#e8e2da] text-left"
                      >
                        <span className="text-xs text-[#706a65]">{project.index}</span>
                        <span className="text-sm font-medium">{project.title}</span>
                      </button>
                    </SheetClose>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-[#e7e1d9]">
          <div
            ref={progressRef}
            className="h-full origin-left scale-x-0 bg-[#171412]"
          />
        </div>
      </nav>

      <AnimatePresence initial={false}>
        {scrolled && (
          <motion.button
            type="button"
            onClick={() => scrollTo('about')}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
            transition={
              shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease: MOTION_EASE }
            }
            whileHover={shouldReduceMotion ? undefined : { y: -2 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
            className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 inline-flex h-12 min-w-12 items-center justify-center rounded-full border border-[#d8d1c8] bg-white/92 text-[#171412] shadow-[0_10px_28px_rgba(24,20,16,0.14)] backdrop-blur-md transition-colors hover:bg-[#171412] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171412] md:right-6"
            aria-label="返回页面顶部"
          >
            <ArrowUp aria-hidden="true" className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
