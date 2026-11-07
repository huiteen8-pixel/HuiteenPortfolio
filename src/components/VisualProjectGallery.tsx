'use client';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { visualProjects } from '@/data/visual-projects';
import type { Project } from '@/data/projects';
import type { CaseAsset } from '@/data/campus-case-studies';
import './IcuCaseStudy.css';
import './VisualProjectGallery.css';

export default function VisualProjectGallery({ project }: { project: Project }) {
  const gallery = visualProjects[project.id];
  const [active, setActive] = useState<CaseAsset | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return <article className="icu-case-study visual-project-gallery" id={project.id}>
    <header className="icu-case-header">
      <p className="visual-project-meta">{project.category} / {project.year}</p>
      <h1>{project.id === 'data-visualization' ? project.title : project.english}</h1>
      <div className="icu-case-header-bottom"><p>{project.title}</p></div>
      <p className="visual-project-intro">{gallery.intro}</p>
    </header>
    <div className="visual-project-images">
      {gallery.images.map(asset => <figure className="icu-case-figure" key={asset.src}>
        <button className="icu-case-image" type="button" aria-label={`全屏查看：${asset.title}`} onClick={event => { trigger.current = event.currentTarget; setActive(asset); setZoomed(false); }}>
          <Image unoptimized src={asset.src} alt={asset.title} width={asset.width} height={asset.height} loading="eager" />
          <span className="icu-case-zoom" aria-hidden="true">↗</span>
        </button><figcaption>{asset.caption}</figcaption>
      </figure>)}
    </div>
    <Dialog open={active !== null} onOpenChange={open => { if (!open) setActive(null); }}>
      <DialogContent className="icu-case-lightbox" showCloseButton={false} onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}>
        <div className="icu-case-lightbox-toolbar"><DialogTitle>{active?.title ?? project.title}</DialogTitle><button type="button" onClick={() => setZoomed(value => !value)} aria-pressed={zoomed}>{zoomed ? '完整显示' : '放大查看'}</button><DialogClose aria-label="关闭图片预览">关闭 ×</DialogClose></div>
        <DialogDescription className="sr-only">完整显示作品图片，放大后可滚动查看细节，按 Escape 关闭。</DialogDescription>
        <div className={`icu-case-lightbox-view${zoomed ? ' is-zoomed' : ''}`} tabIndex={0} role="region" aria-label="图片查看区域" key={`${active?.src}-${zoomed}`}>
          {active && <Image unoptimized src={active.src} alt={active.title} width={active.width} height={active.height} style={zoomed ? { width: active.width } : undefined} />}
        </div>
      </DialogContent>
    </Dialog>
  </article>;
}
