'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { animate, motion, useDragControls, useMotionValue } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

type Props = {
  id: string; label: string; style: CSSProperties; children: ReactNode;
  boundaryRef: RefObject<HTMLElement | null>; zIndex: number; resetVersion: number;
  raise: () => void; onMoved: () => void; hit?: string;
  href?: string; download?: string; external?: boolean; onActivate?: () => void;
};

export default function ContactDraggable({ id, label, style, children, boundaryRef, zIndex, resetVersion, raise, onMoved, hit, href, download, external, onActivate }: Props) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const node = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const controls = useDragControls();
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [limits, setLimits] = useState<{ left: number; right: number; top: number; bottom: number }>();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const element = node.current;
    const boundary = boundaryRef.current;
    if (!element || !boundary) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const bounds = boundary.getBoundingClientRect();
        // Numeric limits avoid Framer remapping every layer's position when
        // responsive layout changes the size of a shared constraint element.
        setLimits({ left: x.get() + bounds.left - rect.left, right: x.get() + bounds.right - rect.right,
          top: y.get() + bounds.top - rect.top, bottom: y.get() + bounds.bottom - rect.bottom });
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element); observer.observe(boundary); measure();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [boundaryRef, x, y]);

  useEffect(() => {
    const a = animate(x, 0, { duration: reduced ? 0 : .35 });
    const b = animate(y, 0, { duration: reduced ? 0 : .35 });
    return () => { a.stop(); b.stop(); };
  }, [resetVersion, reduced, x, y]);

  function pointerDown(event: PointerEvent<HTMLButtonElement | HTMLAnchorElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    dragged.current = false;
    raise();
    controls.start(event, { distanceThreshold: 6 });
  }
  function click(event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) {
    // A drag must never copy an email, open a tab, or download the resume.
    if (event.detail !== 0 && dragged.current) { event.preventDefault(); event.stopPropagation(); return; }
    onActivate?.();
  }
  function keyboardMove(event: KeyboardEvent<HTMLButtonElement | HTMLAnchorElement>) {
    if (event.key === 'Escape') { event.preventDefault(); x.set(0); y.set(0); return; }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const bounds = boundaryRef.current?.getBoundingClientRect();
    const rect = node.current?.getBoundingClientRect();
    if (!bounds || !rect) return;
    const step = event.shiftKey ? 36 : 12;
    const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
    const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
    x.set(x.get() + Math.max(bounds.left - rect.left, Math.min(dx, bounds.right - rect.right)));
    y.set(y.get() + Math.max(bounds.top - rect.top, Math.min(dy, bounds.bottom - rect.bottom)));
    raise(); onMoved();
  }
  const handle = {
    className: 'contact-drag-handle', style: { clipPath: hit },
    'aria-label': label, 'aria-describedby': 'contact-drag-instructions',
    onPointerDown: pointerDown, onClick: click, onKeyDown: keyboardMove,
    onPointerEnter: (event: PointerEvent<HTMLButtonElement | HTMLAnchorElement>) => { if (event.pointerType === 'mouse') setHovered(true); },
    onPointerLeave: () => setHovered(false), onFocus: () => setHovered(true), onBlur: () => setHovered(false),
  };

  return (
    <motion.div ref={node} className={`contact-layer contact-draggable contact-${id}`} data-contact-layer={id} data-dragging={dragging}
      style={{ ...style, zIndex, x, y }} drag dragControls={controls} dragListener={false}
      dragConstraints={limits} dragElastic={.025} dragMomentum={false}
      onDragStart={() => { dragged.current = true; raise(); setDragging(true); }}
      onDragEnd={() => { setDragging(false); onMoved(); }}>
      <motion.div className="contact-drag-artwork" animate={{ y: reduced ? 0 : hovered || dragging ? -4 : 0, scale: reduced ? 1 : dragging ? 1.035 : hovered ? 1.018 : 1, rotate: reduced ? 0 : dragging ? 1.2 : hovered ? -.7 : 0 }} transition={{ type: 'spring', stiffness: 250, damping: 22 }}>
        <div className="contact-arrival">{children}</div>
      </motion.div>
      {href ? <a {...handle} draggable={false} href={href} download={download} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} /> : <button {...handle} type="button" />}
    </motion.div>
  );
}
