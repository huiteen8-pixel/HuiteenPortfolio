'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type RefObject, type KeyboardEvent } from 'react';
import { animate, motion, useDragControls, useMotionValue } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const WIDTH = 2139;
const HEIGHT = 1569;
// Coordinates match the former flattened collage; transparent margins are
// retained. Only the invisible hit areas are clipped, never the artwork itself.
const papers = [
  { id: 'experience', label: '数字体验与创意执行横线纸', x: -1, y: -54, width: 984, height: 1270, z: 1, intrinsic: [1104, 1425], hit: 'polygon(5% 6%,94% 6%,94% 21%,98% 21%,98% 27%,94% 28%,94% 94%,5% 94%)' },
  { id: 'blue-sheet', label: '浅蓝色底纸', x: 740, y: 397, width: 900, height: 450, z: 2, intrinsic: [1774, 887], hit: 'polygon(12% 13%,88% 13%,88% 88%,12% 88%)' },
  { id: 'leadership', label: '项目主导网格纸', x: 1030, y: 67, width: 876, height: 584, z: 3, intrinsic: [1536, 1024], hit: 'polygon(14% 17%,85% 15%,86% 85%,15% 85%)' },
  { id: 'quote', label: 'The essence of design 手写便签', x: 580, y: 400, width: 700, height: 897, z: 4, intrinsic: [1108, 1420], hit: 'polygon(47% 16%,56% 15%,58% 23%,78% 21%,85% 83%,21% 87%,15% 26%,48% 23%)' },
  { id: 'process', label: 'From Idea To Experience 流程纸', x: 1035, y: 420, width: 1104, height: 596, z: 5, intrinsic: [1706, 922], hit: 'polygon(3% 9%,97% 8%,97% 93%,3% 93%)' },
  { id: 'clip', label: '黑色夹子', x: 353, y: 902, width: 1285, height: 613, z: 6, intrinsic: [1815, 866], hit: 'polygon(2% 12%,97% 2%,98% 25%,97% 36%,72% 39%,69% 43%,67% 85%,63% 95%,40% 98%,35% 91%,34% 48%,31% 44%,6% 46%,3% 40%)' },
] as const;
type Paper = typeof papers[number];

function DraggablePaper({ paper, boundaryRef, resetVersion, zIndex, raise, onMoved }: {
  paper: Paper; boundaryRef: RefObject<HTMLElement | null>; resetVersion: number;
  zIndex: number; raise: () => void; onMoved: () => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useDragControls();
  const nodeRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const options = { duration: reduced ? 0 : 0.4 };
    const a = animate(x, 0, options);
    const b = animate(y, 0, options);
    return () => { a.stop(); b.stop(); };
  }, [resetVersion, x, y, reduced]);

  function keyboardMove(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape' || event.key === 'Home') {
      event.preventDefault(); x.set(0); y.set(0); return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? 36 : 12;
    const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
    const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
    const bounds = boundaryRef.current?.getBoundingClientRect();
    const current = nodeRef.current?.getBoundingClientRect();
    if (!bounds || !current) return;
    x.set(x.get() + Math.max(bounds.left - current.left, Math.min(dx, bounds.right - current.right)));
    y.set(y.get() + Math.max(bounds.top - current.top, Math.min(dy, bounds.bottom - current.bottom)));
    raise(); onMoved();
  }

  return (
    <motion.div ref={nodeRef} className="interactive-paper" data-paper={paper.id}
      data-dragging={dragging} style={{ left: `${paper.x / WIDTH * 100}%`, top: `${paper.y / HEIGHT * 100}%`, width: `${paper.width / WIDTH * 100}%`, height: `${paper.height / HEIGHT * 100}%`, zIndex, x, y }}
      drag dragControls={controls} dragListener={false} dragConstraints={boundaryRef}
      dragElastic={0.035} dragMomentum={false}
      onDragStart={() => { raise(); setDragging(true); }}
      onDragEnd={() => { setDragging(false); onMoved(); }}>
      <motion.div className="interactive-paper-artwork" animate={{ scale: reduced ? 1 : dragging ? 1.025 : hovered ? 1.012 : 1, y: reduced ? 0 : hovered || dragging ? -5 : 0, rotate: reduced ? 0 : dragging ? 1 : hovered ? -0.5 : 0 }} transition={{ type: 'spring', stiffness: 240, damping: 22 }}>
        <Image unoptimized src={`/home/papers/${paper.id}.png`} alt="" width={paper.intrinsic[0]} height={paper.intrinsic[1]} sizes="(max-width: 767px) 70vw, 48vw" draggable={false} />
      </motion.div>
      <button type="button" className="interactive-paper-handle" style={{ clipPath: paper.hit }}
        aria-label={`拖动：${paper.label}`} aria-describedby="paper-drag-instructions"
        onPointerDown={event => { if (!event.isPrimary || event.button !== 0) return; raise(); controls.start(event); }}
        onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true); }}
        onPointerLeave={() => setHovered(false)} onFocus={() => setHovered(true)} onBlur={() => setHovered(false)}
        onKeyDown={keyboardMove} />
    </motion.div>
  );
}

export default function InteractivePapers({ boundaryRef }: { boundaryRef: RefObject<HTMLElement | null> }) {
  const [resetVersion, setResetVersion] = useState(0);
  const [moved, setMoved] = useState(false);
  const [order, setOrder] = useState<Record<string, number>>({});
  const nextLayer = useRef(6);
  const raise = (id: string) => {
    const value = ++nextLayer.current;
    setOrder(current => ({ ...current, [id]: value }));
  };
  return (
    <div id="interactive-papers" className="home-services-collage interactive-papers" role="group" aria-label="可拖拽的设计纸张">
      <p id="paper-drag-instructions" className="sr-only">按住纸张拖动，松手后保留位置。也可聚焦后用方向键移动，Shift 加速，Escape 还原当前纸张。</p>
      {papers.map(paper => <DraggablePaper key={paper.id} paper={paper} boundaryRef={boundaryRef} resetVersion={resetVersion} zIndex={order[paper.id] ?? paper.z} raise={() => raise(paper.id)} onMoved={() => setMoved(true)} />)}
      {moved && <button type="button" className="papers-reset" onClick={() => { setResetVersion(value => value + 1); setOrder({}); nextLayer.current = 6; setMoved(false); }}>↺ 还原纸张</button>}
    </div>
  );
}
