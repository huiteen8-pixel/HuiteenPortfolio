'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { workCategories, categoryProjects, type WorkCategory } from '@/data/work-categories';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import WorkPlaceholder from './WorkPlaceholder';

const placements = [
  { left: '5%', top: '15%', width: '22%', ratio: '1.5', travel: -110, rotate: -7 },
  { left: '64%', top: '8%', width: '22%', ratio: '1.3', travel: -170, rotate: 5 },
  { left: '84%', top: '46%', width: '13%', ratio: '.8', travel: -70, rotate: 8 },
  { left: '4%', top: '65%', width: '16%', ratio: '.85', travel: -230, rotate: -4 },
  { left: '31%', top: '77%', width: '21%', ratio: '1.7', travel: -125, rotate: 6 },
  { left: '64%', top: '70%', width: '22%', ratio: '1.6', travel: -260, rotate: -6 },
];

function FloatingCover({ progress, category, index }: { progress: MotionValue<number>; category: WorkCategory; index: number }) {
  const spot = placements[index];
  const reduced = usePrefersReducedMotion();
  const project = categoryProjects(category)[index % 3];
  const y = useTransform(progress, [0, .4, 1], [100 + index * 22, 0, spot.travel]);
  const rotate = useTransform(progress, [0, 1], [spot.rotate, -spot.rotate]);
  const scale = useTransform(progress, [0, .4, 1], [.85, 1, 1.08]);
  return (
    <motion.div className={`category-floating-cover category-floating-cover-${index}`} style={{ left: spot.left, top: spot.top, width: spot.width, aspectRatio: spot.ratio, y: reduced ? 0 : y, rotate: reduced ? 0 : rotate, scale: reduced ? 1 : scale }}>
      <a href={`/work/${category.slug}`} aria-label={`${category.title} — ${project.title}`}>
        <WorkPlaceholder figure={`${category.index}.${index + 1}`} title={project.title} variant={index} />
      </a>
    </motion.div>
  );
}

function CategoryScene({ category }: { category: WorkCategory }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const titleY = useTransform(scrollYProgress, [0, .5, 1], [65, 0, -65]);

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
        {placements.map((_, index) => <FloatingCover key={index} progress={scrollYProgress} category={category} index={index} />)}
        <div className="category-scene-bottom"><span>{category.index} / 04</span><span>SCROLL TO EXPLORE ↓</span><span>{categoryProjects(category).length} PROJECTS</span></div>
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
