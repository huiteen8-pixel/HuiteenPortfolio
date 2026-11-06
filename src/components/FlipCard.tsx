'use client';

import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  axis?: 'x' | 'y';
  flipOnClick?: boolean;
  draggable?: boolean;
  dragDistance?: number;
  tilt?: boolean;
  tiltMax?: number;
  glare?: boolean;
  glareOpacity?: number;
  hoverScale?: number;
  perspective?: number;
  stiffness?: number;
  damping?: number;
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  radius?: number;
  background?: string;
  color?: string;
  shadow?: boolean;
  shadowColor?: string;
  shadowOpacity?: number;
  label?: string;
  onFlipChange?: (flipped: boolean) => void;
}

type Gesture = { pointerId: number; x: number; y: number; angle: number; extent: number; moved: boolean };

export default function FlipCard({
  front, back, axis = 'y', flipOnClick = true, draggable = true,
  dragDistance = 0, tilt = true, tiltMax = 12, glare = true,
  glareOpacity = 0.22, hoverScale = 1.03, perspective = 1100,
  stiffness = 170, damping = 20, width = 300, height = 400,
  radius = 22, background = '#27272a', color = '#f5f5f5',
  shadow = true, shadowColor = '#000000', shadowOpacity = 0.45,
  label = '翻转卡片', onFlipChange,
}: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const gesture = useRef<Gesture | null>(null);
  const angle = useRef(0);
  const suppressClick = useRef(false);
  const reducedMotion = usePrefersReducedMotion();
  const spring = { stiffness, damping };
  const rotation = useSpring(0, spring);
  const tiltX = useSpring(0, spring);
  const tiltY = useSpring(0, spring);
  const scale = useSpring(1, spring);
  const shine = useSpring(0, { stiffness: 220, damping: 28 });
  const shineX = useMotionValue(50);
  const shineY = useMotionValue(50);
  const reflection = useMotionTemplate`radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,.9), rgba(255,255,255,.12) 40%, transparent 72%)`;

  const settle = (target: number) => {
    if (reducedMotion) rotation.jump(target);
    else rotation.set(target);
  };

  const flip = (direction = 1) => {
    const next = !flipped;
    angle.current += direction * 180;
    settle(angle.current);
    setFlipped(next);
    onFlipChange?.(next);
  };

  const resetHover = () => {
    tiltX.set(0);
    tiltY.set(0);
    scale.set(1);
    shine.set(0);
  };

  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    if (event.pointerType === 'mouse' && !reducedMotion) {
      if (tilt) {
        tiltX.set((0.5 - y) * tiltMax * 2);
        tiltY.set((x - 0.5) * tiltMax * 2);
      }
      shineX.set(x * 100);
      shineY.set(y * 100);
    }
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const distance = axis === 'y' ? event.clientX - active.x : event.clientY - active.y;
    const crossDistance = axis === 'y' ? event.clientY - active.y : event.clientX - active.x;
    if (!active.moved && Math.abs(distance) > 8 && Math.abs(distance) > Math.abs(crossDistance)) active.moved = true;
    if (active.moved && !reducedMotion) rotation.set(active.angle + distance / active.extent * 180);
  };

  const release = (event: PointerEvent<HTMLButtonElement>) => {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    gesture.current = null;
    const distance = axis === 'y' ? event.clientX - active.x : event.clientY - active.y;
    if (active.moved) {
      // The click generated after a drag must not immediately flip the card back.
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 0);
      if (Math.abs(distance) >= Math.max(12, dragDistance)) flip(distance > 0 ? 1 : -1);
      else settle(angle.current);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (event.pointerType !== 'mouse') resetHover();
  };

  const cancel = () => {
    if (gesture.current) {
      gesture.current = null;
      settle(angle.current);
    }
    resetHover();
  };

  const faceStyle: CSSProperties = {
    borderRadius: radius,
    background,
    color,
    boxShadow: shadow ? `0 24px 60px color-mix(in srgb, ${shadowColor} ${shadowOpacity * 100}%, transparent)` : undefined,
  };

  return (
    <button
      type="button"
      className="flip-card"
      style={{ width, height, perspective, touchAction: axis === 'y' ? 'pan-y' : 'pan-x' }}
      aria-label={`${label}，当前${flipped ? '背面，点击查看正面' : '正面，点击查看背面'}`}
      aria-pressed={flipped}
      data-flipped={flipped}
      onClick={() => {
        if (suppressClick.current) { suppressClick.current = false; return; }
        if (flipOnClick) flip();
      }}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse' || reducedMotion) return;
        scale.set(hoverScale);
        if (glare) shine.set(glareOpacity);
      }}
      onPointerLeave={resetHover}
      onPointerDown={(event) => {
        if (!draggable || !event.isPrimary || event.button !== 0) return;
        suppressClick.current = false;
        const bounds = event.currentTarget.getBoundingClientRect();
        gesture.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, angle: angle.current, extent: axis === 'y' ? bounds.width : bounds.height, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={move}
      onPointerUp={release}
      onPointerCancel={cancel}
      onLostPointerCapture={() => { if (gesture.current) cancel(); }}
      onDragStart={(event) => event.preventDefault()}
    >
      <motion.span className="flip-card-tilt" style={{ rotateX: tiltX, rotateY: tiltY, scale }}>
        <motion.span className="flip-card-rotor" style={axis === 'y' ? { rotateY: rotation } : { rotateX: rotation }}>
          <span className="flip-card-face flip-card-face-front" style={faceStyle} aria-hidden={flipped} inert={flipped}>
            {front}
            {glare && <motion.span aria-hidden="true" className="flip-card-glare" style={{ opacity: shine, background: reflection }} />}
          </span>
          <span className="flip-card-face flip-card-face-back" style={{ ...faceStyle, transform: `rotate${axis.toUpperCase()}(180deg)` }} aria-hidden={!flipped} inert={!flipped}>
            {back}
            {glare && <motion.span aria-hidden="true" className="flip-card-glare" style={{ opacity: shine, background: reflection }} />}
          </span>
        </motion.span>
      </motion.span>
    </button>
  );
}
