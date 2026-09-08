'use client';

import { motion, useInView, Variants } from 'framer-motion';
import { useRef, ReactNode } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
  once?: boolean;
  stagger?: number;
}

const variants: Variants = {
  hidden: (custom: { y: number }) => ({
    opacity: 0,
    y: custom.y,
  }),
  visible: (custom: { duration: number; delay: number }) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: custom.duration,
      delay: custom.delay,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  duration = 0.62,
  y = 22,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-80px' });
  const shouldReduceMotion = usePrefersReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      custom={{ y, duration, delay }}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      className={className}
      data-motion-reveal
      style={{ willChange: isInView ? 'auto' : 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}

// 文字逐词揭示
export function WordReveal({
  text,
  className = '',
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduceMotion = usePrefersReducedMotion();
  const words = text.split(' ');

  if (shouldReduceMotion) {
    return (
      <div ref={ref} className={className}>
        {text}
      </div>
    );
  }

  return (
    <div ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em]">
          <motion.span
            className="inline-block"
            initial={{ y: '100%', opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: '100%', opacity: 0 }}
            transition={{
              duration: 0.5,
              delay: delay + i * 0.035,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </div>
  );
}

// 线条绘制动画
export function DrawLine({
  className = '',
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const shouldReduceMotion = usePrefersReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div ref={ref} className={className}>
        <div className="h-px bg-[#e0e0e0]" />
      </div>
    );
  }

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        className="h-px bg-[#e0e0e0] origin-left"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{
          duration: 0.8,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
      />
    </div>
  );
}
