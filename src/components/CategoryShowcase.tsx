'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { workCategories, categoryProjects, type WorkCategory } from '@/data/work-categories';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { visualPreviews } from '@/data/visual-projects';
import { interactionPreviews } from '@/data/interaction-case-studies';
import WorkPlaceholder from './WorkPlaceholder';

type Placement = { left: string; top: string; width: string; ratio: string; travel: number; rotate: number; depth?: number };
type Composition = { desktop: Placement[]; mobile: Partial<Placement>[] };

const systemPlacements: Placement[] = [
  { left: '1%', top: '8%', width: '40%', ratio: '1.5', travel: -110, rotate: -7 },
  { left: '67%', top: '2%', width: '37%', ratio: '1.3', travel: -170, rotate: 5 },
  { left: '84%', top: '37%', width: '24%', ratio: '.8', travel: -70, rotate: 8 },
  { left: '-2%', top: '65%', width: '37%', ratio: '1.25', travel: -230, rotate: -4 },
  { left: '25%', top: '83%', width: '36%', ratio: '1.7', travel: -125, rotate: 6 },
  { left: '64%', top: '70%', width: '40%', ratio: '1.6', travel: -260, rotate: -6 },
];

const systemMobilePlacements: Partial<Placement>[] = [
  { left: '0%', top: '10%', width: '62%' },
  { left: '58%', top: '15%', width: '57%' },
  { left: '78%', top: '36%', width: '43%' },
  { left: '0%', top: '68%', width: '61%' },
  { left: '25%', top: '89%', width: '60%' },
  { left: '60%', top: '73%', width: '60%' },
];

// Each collection has its own composition: surrounding screens, a diagonal
// cascade, and an editorial collage of visual work.
const compositions: Record<WorkCategory['slug'], Composition> = {
  'systems-services': { desktop: systemPlacements, mobile: systemMobilePlacements },
  'interaction-concepts': {
    desktop: [
      { left: '0%', top: '0%', width: '45%', ratio: '1.7', travel: -130, rotate: -3, depth: 2 },
      { left: '71%', top: '2%', width: '27%', ratio: '.8', travel: -90, rotate: 9 },
      { left: '1%', top: '48%', width: '26%', ratio: '1.1', travel: -180, rotate: -8 },
      { left: '40%', top: '13%', width: '31%', ratio: '1.4', travel: -210, rotate: 6 },
      { left: '18%', top: '79%', width: '35%', ratio: '1.7', travel: -100, rotate: 3, depth: 2 },
      { left: '65%', top: '70%', width: '36%', ratio: '1.3', travel: -240, rotate: -7, depth: 2 },
    ],
    mobile: [
      { left: '0%', top: '0%', width: '77%' },
      { left: '64%', top: '18%', width: '36%' },
      { left: '0%', top: '49%', width: '48%' },
      { left: '38%', top: '18%', width: '58%' },
      { left: '6%', top: '87%', width: '62%' },
      { left: '53%', top: '73%', width: '46%' },
    ],
  },
  'visuals-making': {
    desktop: [
      { left: '4%', top: '0%', width: '40%', ratio: '2', travel: -80, rotate: 2 },
      { left: '74%', top: '0%', width: '24%', ratio: '.8', travel: -200, rotate: -4, depth: 2 },
      { left: '0%', top: '61%', width: '27%', ratio: '.75', travel: -110, rotate: 5 },
      { left: '22%', top: '77%', width: '43%', ratio: '1.9', travel: -160, rotate: -2, depth: 2 },
      { left: '43%', top: '33%', width: '30%', ratio: '1.5', travel: -230, rotate: -6 },
      { left: '72%', top: '62%', width: '27%', ratio: '1.1', travel: -120, rotate: 4, depth: 2 },
    ],
    mobile: [
      { left: '0%', top: '0%', width: '62%' },
      { left: '65%', top: '4%', width: '34%' },
      { left: '0%', top: '60%', width: '40%' },
      { left: '16%', top: '85%', width: '65%' },
      { left: '39%', top: '24%', width: '48%' },
      { left: '64%', top: '59%', width: '35%' },
    ],
  },

};
type CanvasBounds = { width: number; height: number; compact: boolean };

function coverLayout(progress: number, bounds: CanvasBounds, spot: Placement, index: number, ratio: number, reduced: boolean) {
  if (!bounds.width || !bounds.height) return { width: 0, x: 0, y: 0, rotate: 0, scale: 1 };
  const radians = Math.abs(spot.rotate) * Math.PI / 180;
  // Fit the full rotated rectangle at its largest animated scale, then clamp
  // its centre. Covers can overlap each other without crossing their canvas.
  const maxWidth = Math.min(
    (bounds.width - 16) / (1.08 * (Math.cos(radians) + Math.sin(radians) / ratio)),
    (bounds.height - 16) / (1.08 * (Math.sin(radians) + Math.cos(radians) / ratio)),
  );
  const width = Math.min(bounds.width * parseFloat(spot.width) / 100, maxWidth);
  const height = width / ratio;
  const rotate = reduced ? 0 : spot.rotate * (1 - 2 * progress);
  const scale = reduced ? 1 : progress < .4 ? .96 + .04 * progress / .4 : 1 + .08 * (progress - .4) / .6;
  const travel = reduced ? 0 : progress < .4 ? (100 + index * 22) * (1 - progress / .4) : spot.travel * (progress - .4) / .6;
  const angle = Math.abs(rotate) * Math.PI / 180;
  const halfWidth = scale * (Math.cos(angle) * width + Math.sin(angle) * height) / 2;
  const halfHeight = scale * (Math.sin(angle) * width + Math.cos(angle) * height) / 2;
  const centreX = Math.max(halfWidth + 8, Math.min(bounds.width * parseFloat(spot.left) / 100 + width / 2, bounds.width - halfWidth - 8));
  const centreY = Math.max(halfHeight + 8, Math.min(bounds.height * parseFloat(spot.top) / 100 + travel + height / 2, bounds.height - halfHeight - 8));
  return { width, x: centreX - width / 2, y: centreY - height / 2, rotate, scale };
}

function FloatingCover({ progress, category, index, bounds }: { progress: MotionValue<number>; category: WorkCategory; index: number; bounds: CanvasBounds }) {
  const composition = compositions[category.slug];
  const spot = bounds.compact ? { ...composition.desktop[index], ...composition.mobile[index] } : composition.desktop[index];
  const reduced = usePrefersReducedMotion();
  const project = categoryProjects(category)[index % 3];
  const previewImage = project.id === 'icu-plus'
    ? index < 3
      ? { src: '/home/previews/icu-dashboard.webp', width: 2400, height: 1337, alt: 'ICU+ 数字孪生工作台与家属端' }
      : { src: '/home/previews/icu-patient.webp', width: 2040, height: 1148, alt: 'ICU+ 患者详情工作台' }
    : project.id === 'symbiosphere'
      ? index < 3
        ? { src: '/home/previews/bio-campus-mobile-cutout.svg', width: 916, height: 830, alt: '万物链 Bio Campus 附近发现与拍照识图移动端界面' }
        : { src: '/home/previews/bio-campus-website.png', width: 2214, height: 1300, alt: '万物链 Bio Campus 校园生态网页首页' }
      : project.id === 'gafa-wayfinding'
        ? index < 3
          ? { src: '/projects/gafa/hd/floor-directory-signage.webp', width: 3200, height: 2133, alt: 'GAFA 路标改良系统楼层索引与导视标识设计' }
          : { src: '/projects/gafa/hd/offline-online-guide.webp', width: 3200, height: 1982, alt: 'GAFA 路标改良系统实体标识与移动端导览总览' }
        : interactionPreviews[project.id]?.[index < 3 ? 0 : 1] ? { ...interactionPreviews[project.id][index < 3 ? 0 : 1], alt: interactionPreviews[project.id][index < 3 ? 0 : 1].title } : visualPreviews[project.id] ? { ...visualPreviews[project.id][index < 3 ? 0 : 1], alt: visualPreviews[project.id][index < 3 ? 0 : 1].title } : null;
  const ratio = previewImage ? previewImage.width / previewImage.height : Number(spot.ratio);
  const layout = useTransform(progress, value => coverLayout(value, bounds, spot, index, ratio, reduced));
  const x = useTransform(layout, value => value.x);
  const y = useTransform(layout, value => value.y);
  const rotate = useTransform(layout, value => value.rotate);
  const scale = useTransform(layout, value => value.scale);
  const width = coverLayout(0, bounds, spot, index, ratio, reduced).width;
  const depthStyle = { '--cover-depth': spot.depth ?? 1 } as CSSProperties;
  return (
    <motion.div className={`category-floating-cover category-floating-cover-${index}`} style={{ ...depthStyle, left: 0, top: 0, width, aspectRatio: ratio, x, y, rotate, scale }}>
      <a href={`/work/${category.slug}`} aria-label={`${category.title} — ${project.title}`}>
        {previewImage ? <Image unoptimized={project.id !== 'gafa-wayfinding'} sizes="(max-width: 767px) 65vw, 45vw" src={previewImage.src} alt={previewImage.alt} width={previewImage.width} height={previewImage.height} loading="eager" className="h-full w-full object-contain" /> : <WorkPlaceholder figure={`${category.index}.${index + 1}`} title={project.title} variant={index} />}
      </a>
    </motion.div>
  );
}

function CategoryScene({ category }: { category: WorkCategory }) {
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState<CanvasBounds>({ width: 0, height: 0, compact: false });
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const titleY = useTransform(scrollYProgress, [0, .5, 1], [65, 0, -65]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const measure = () => {
      const { width, height } = canvas.getBoundingClientRect();
      setBounds({ width, height, compact: window.matchMedia('(max-width: 767px)').matches });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    measure();
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} id={category.slug} className="category-scroll-scene" aria-labelledby={`${category.slug}-title`}>
      <div className="category-pinned-stage">
        <div className="category-scene-meta"><span>FIG. {category.range}</span><span>SELECTED WORK / {category.index}</span></div>
        <motion.div className="category-scene-title" style={{ y: reduced ? 0 : titleY }}>
          <a href={`/work/${category.slug}`}>
            <h2 id={`${category.slug}-title`}>{category.lines.map(line => <span key={line}>{line}</span>)}</h2>
            <span className="category-open">VIEW PROJECTS <span aria-hidden="true">↗</span></span>
          </a>
        </motion.div>
        <div ref={canvasRef} className="category-collage-canvas">
          {compositions[category.slug].desktop.map((_, index) => category.slug === 'visuals-making' && index === 4 ? null : <FloatingCover key={index} progress={scrollYProgress} category={category} index={index} bounds={bounds} />)}
        </div>
        <div className="category-scene-bottom"><span>{category.index} / {String(workCategories.length).padStart(2, '0')}</span><span>SCROLL TO EXPLORE ↓</span><span>{categoryProjects(category).length} PROJECTS</span></div>
      </div>
    </section>
  );
}

export default function CategoryShowcase() {
  return (
    <div id="projects" className="category-showcase">
      <nav className="category-directory" aria-label="作品分类">
        {workCategories.map(category => <a key={category.slug} href={`#${category.slug}`}><span>{category.index}</span> {category.title}</a>)}
      </nav>
      {workCategories.map(category => <CategoryScene key={category.slug} category={category} />)}
    </div>
  );
}
