'use client';

import Image from 'next/image';

export default function HeroSection() {
  return (
    <section
      id="about"
      className="relative flex min-h-[100svh] scroll-mt-24 flex-col overflow-hidden px-5 pb-12 pt-8 text-white sm:px-8 md:px-8 md:pb-16 md:pt-12"
      aria-labelledby="portfolio-title"
    >
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

      <div className="mx-auto flex w-full flex-1 flex-col items-center justify-start pt-[clamp(4rem,17vh,12rem)] text-center">
        <h1 id="portfolio-title" className="sr-only">
          Huiteen — The undefined designer
        </h1>

        <div className="hero-logo-enter relative w-[min(92vw,760px)] md:w-[min(74vw,1400px)]">
          <Image
            src="/hero/title.png"
            alt="Huiteen"
            width={3980}
            height={1329}
            sizes="(min-width: 768px) 74vw, 92vw"
            className="h-auto w-full select-none"
            priority
          />
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

    </section>
  );
}
