'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const pointerX = useMotionValue(-100);
  const pointerY = useMotionValue(-100);

  const outerX = useSpring(pointerX, { damping: 25, stiffness: 400 });
  const outerY = useSpring(pointerY, { damping: 25, stiffness: 400 });

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointerQuery = window.matchMedia('(pointer: fine)');

    const updateEnabledState = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsEnabled(!isTouchDevice && finePointerQuery.matches && !reducedMotionQuery.matches);
    };

    updateEnabledState();
    reducedMotionQuery.addEventListener('change', updateEnabledState);
    finePointerQuery.addEventListener('change', updateEnabledState);

    return () => {
      reducedMotionQuery.removeEventListener('change', updateEnabledState);
      finePointerQuery.removeEventListener('change', updateEnabledState);
    };
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after { cursor: none !important; }
      [data-native-cursor], [data-native-cursor] * { cursor: auto !important; }
    `;
    document.head.appendChild(style);
    styleRef.current = style;

    const moveCursor = (event: MouseEvent) => {
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);
      const target = event.target instanceof Element ? event.target : null;
      setIsVisible(!target?.closest('[data-native-cursor]'));
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    const handleElementHover = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-native-cursor]')) {
        setIsHovering(false);
        setIsVisible(false);
        return;
      }

      const clickable = target.closest('a, button, [role="button"], input, textarea, select, [data-cursor-hover]');
      setIsHovering(Boolean(clickable));
    };

    const handleNativeCursorEnter = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-native-cursor]')) {
        setIsVisible(false);
      }
    };

    const handleNativeCursorLeave = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-native-cursor]')) {
        setIsVisible(true);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleElementHover);
    window.addEventListener('mouseover', handleNativeCursorEnter);
    window.addEventListener('mouseout', handleNativeCursorLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleElementHover);
      window.removeEventListener('mouseover', handleNativeCursorEnter);
      window.removeEventListener('mouseout', handleNativeCursorLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isEnabled, pointerX, pointerY]);

  if (!isEnabled) return null;

  const baseStyle = {
    translateX: '-50%',
    translateY: '-50%',
    zIndex: 2147483647,
  };

  const cursorElement = (
    <>
      <motion.div
        className="fixed top-0 left-0 pointer-events-none mix-blend-difference"
        style={{
          x: outerX,
          y: outerY,
          ...baseStyle,
        }}
      >
        <motion.div
          className="rounded-full border border-white/80"
          animate={{
            width: isHovering ? 48 : 24,
            height: isHovering ? 48 : 24,
            opacity: isVisible ? 1 : 0,
          }}
          transition={{
            width: { type: 'spring', damping: 20, stiffness: 300 },
            height: { type: 'spring', damping: 20, stiffness: 300 },
            opacity: { duration: 0.2 },
          }}
        />
      </motion.div>

      <motion.div
        className="fixed top-0 left-0 pointer-events-none mix-blend-difference"
        style={{
          x: pointerX,
          y: pointerY,
          ...baseStyle,
        }}
      >
        <motion.div
          className="rounded-full bg-white"
          animate={{
            width: isHovering ? 7 : 5,
            height: isHovering ? 7 : 5,
            opacity: isVisible ? 1 : 0,
          }}
          transition={{
            width: { duration: 0.12 },
            height: { duration: 0.12 },
            opacity: { duration: 0.2 },
          }}
        />
      </motion.div>
    </>
  );

  return createPortal(cursorElement, document.body);
}
