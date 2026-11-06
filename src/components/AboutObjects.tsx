'use client';

import Image from 'next/image';
import { useId, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { motion, useSpring } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const STAGE_WIDTH = 1409;
const STAGE_HEIGHT = 850;
const bounds = (x: number, y: number, width: number, height: number): CSSProperties => ({
  left: `${x / STAGE_WIDTH * 100}%`, top: `${y / STAGE_HEIGHT * 100}%`,
  width: `${width / STAGE_WIDTH * 100}%`, height: `${height / STAGE_HEIGHT * 100}%`,
  aspectRatio: `${width} / ${height}`,
});

const notes = {
  macbook: { file: 'macbook-note.png?v=49aa61472fc8', text: '负责把“随便做做”保存成“最终版_07”', x: 140, y: 337, width: 277, height: 92 },
  camera: { file: 'camera-note.png?v=431048ef3b2d', text: '瞬间往往更值得回味', x: 900, y: 140, width: 285, height: 95 },
  ipad: { file: 'ipad-note.png?v=710df7f8b38d', text: '草图也不会丢垃圾桶', x: 1090, y: 606, width: 305, height: 109 },
  writing: { file: 'writing-note.png?v=7367ceef1c63', text: '书教我成为作家，笔等我写完了第一句', x: 358, y: 597, width: 305, height: 107 },
} as const;
type NoteName = keyof typeof notes;

const objects = [
  { name: 'macbook', file: 'macbook.png', alt: '黄色 MacBook', x: 34, y: 0, width: 610, height: 475, note: 'macbook' },
  { name: 'camera', file: 'camera.png', alt: '拍立得相机', x: 645, y: 22, width: 329, height: 262, note: 'camera' },
  { name: 'ipad', file: 'ipad.png', alt: '银色 iPad', x: 912, y: 241, width: 421, height: 554, note: 'ipad' },
  { name: 'pencil', file: 'pencil.png', alt: '红色自动铅笔', x: 204, y: 390, width: 342, height: 350, note: 'writing' },
  { name: 'book', file: 'book.png', alt: '《成为作家》', x: 505, y: 369, width: 407, height: 371, note: 'writing' },
] as const;
type ObjectItem = typeof objects[number];

function ObjectButton({ object, active, onActivate, onDismiss, noteId }: {
  object: ObjectItem; active: boolean; onActivate: () => void; onDismiss: () => void; noteId: string;
}) {
  const reduced = usePrefersReducedMotion();
  const pointerType = useRef('mouse');
  const spring = { stiffness: 210, damping: 18, mass: 0.75 };
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);
  const rotate = useSpring(0, spring);
  const scale = useSpring(1, spring);

  const reset = () => { x.set(0); y.set(0); rotate.set(0); scale.set(1); };
  const lift = () => {
    if (reduced) return;
    y.set(-5);
    rotate.set(object.name === 'camera' || object.name === 'book' ? -1.2 : 1.2);
    scale.set(1.025);
  };
  const followPointer = (event: PointerEvent<HTMLButtonElement>) => {
    if (reduced || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    x.set(px * 7);
    y.set(-5 + py * 5);
    rotate.set(px * 3);
  };

  return (
    <div className={`about-reference-asset about-object-${object.name} about-interactive-object`} style={bounds(object.x, object.y, object.width, object.height)} data-active={active}>
      <button
        type="button"
        className="about-object-button"
        aria-label={object.alt}
        aria-expanded={active}
        aria-controls={noteId}
        aria-describedby={active ? noteId : undefined}
        onPointerEnter={(event) => { if (event.pointerType === 'mouse') { onActivate(); lift(); } }}
        onPointerMove={followPointer}
        onPointerLeave={(event) => {
          reset();
          if (event.pointerType === 'mouse' && !event.currentTarget.matches(':focus-visible')) onDismiss();
        }}
        onPointerDown={(event) => { pointerType.current = event.pointerType; }}
        onFocus={(event) => { if (event.currentTarget.matches(':focus-visible')) { onActivate(); lift(); } }}
        onBlur={() => { reset(); onDismiss(); }}
        onClick={(event) => {
          if (event.detail === 0) { onActivate(); lift(); }
          else if (pointerType.current !== 'mouse') {
            if (active) { onDismiss(); reset(); }
            else { onActivate(); lift(); }
          }
        }}
        onKeyDown={(event) => { if (event.key === 'Escape') { onDismiss(); reset(); } }}
      >
        <motion.span className="about-object-motion" style={{ x, y, rotate, scale }}>
          <Image unoptimized src={`/about/${object.file}`} alt="" width={object.width} height={object.height} sizes={`${Math.ceil(object.width / STAGE_WIDTH * 100)}vw`} draggable={false} />
        </motion.span>
      </button>
    </div>
  );
}

export default function AboutObjects() {
  const [active, setActive] = useState<ObjectItem['name'] | null>(null);
  const id = useId();
  const reduced = usePrefersReducedMotion();
  const currentNote = objects.find((object) => object.name === active)?.note;

  return (
    <section id="about-objects" className="about-reference-objects" aria-label="Huiteen 的日常物件" onKeyDown={(event) => { if (event.key === 'Escape') setActive(null); }}>
      {objects.map((object) => (
        <ObjectButton key={object.name} object={object} active={active === object.name} noteId={`${id}-${object.note}`} onActivate={() => setActive(object.name)} onDismiss={() => setActive((current) => current === object.name ? null : current)} />
      ))}
      {(Object.entries(notes) as [NoteName, typeof notes[NoteName]][]).map(([name, note]) => {
        const visible = currentNote === name;
        return (
          <motion.div
            key={name}
            id={`${id}-${name}`}
            role="tooltip"
            aria-hidden={!visible}
            className={`about-object-note about-object-note-${name}`}
            style={bounds(note.x, note.y, note.width, note.height)}
            initial={false}
            animate={{ opacity: visible ? 1 : 0, y: visible || reduced ? 0 : 7, scale: visible || reduced ? 1 : 0.96 }}
            transition={reduced ? { duration: 0 } : { duration: visible ? 0.2 : 0.13, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image unoptimized src={`/about/${note.file}`} alt={note.text} width={note.width} height={note.height} sizes="23vw" draggable={false} />
          </motion.div>
        );
      })}
    </section>
  );
}
