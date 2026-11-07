'use client';
import Image from 'next/image';
import { useRef, useState, type CSSProperties } from 'react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { campusStudies, type CaseAsset } from '@/data/campus-case-studies';
import { interactionStudies } from '@/data/interaction-case-studies';
import type { Project } from '@/data/projects';
import './IcuCaseStudy.css';
import './CampusCaseStudy.css';

export default function CampusCaseStudy({ project }: { project: Project }) {
  const study = campusStudies[project.id] ?? interactionStudies[project.id];
  const [activeImage, setActiveImage] = useState<CaseAsset | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const lastImageButton = useRef<HTMLButtonElement>(null);
  function picture(asset: CaseAsset, priority = false) {
    return <figure className="icu-case-figure" key={asset.src}>
      <button type="button" className="icu-case-image" onClick={event => { lastImageButton.current = event.currentTarget; setZoomed(false); setActiveImage(asset); }} aria-label={`全屏查看：${asset.title}`}>
        <Image src={asset.src} alt={asset.title} width={asset.width} height={asset.height} quality={90} sizes="(max-width: 767px) 96vw, 96vw" loading={priority || project.id === 'gafa-wayfinding' ? 'eager' : 'lazy'} unoptimized={study?.directImages || project.id === 'gafa-wayfinding' || asset.src.endsWith('.gif') || asset.src.endsWith('.svg')} />
        <span className="icu-case-zoom" aria-hidden="true">↗</span>
      </button>
      {asset.caption && <figcaption>{asset.caption}</figcaption>}
    </figure>;
  }
  if (!study) return null;
  return <article id={project.id} className="icu-case-study campus-case-study" style={{ '--case-accent': study.accent } as CSSProperties}>
    <header className="icu-case-header">
      <a className="icu-case-pill" href={`#${study.chapters[0].id}`}>case study ↓</a>
      <h1>{study.title[0]}<br />{study.title[1]}</h1>
      <div className="icu-case-header-bottom"><p>{study.subtitle}</p><p>{project.category}<br />{project.year} · Huiteen</p></div>
    </header>
    <div className="icu-case-media icu-case-cover">{picture(study.cover, true)}</div>
    {study.chapters.map((chapter, index) => <section key={chapter.id} aria-label={chapter.lead}>
      <div id={chapter.id} className={`icu-case-chapter${index % 2 ? ' icu-case-chapter--reverse' : ''}`}>
        <div className="icu-case-chapter-heading"><h2>{chapter.title[0]}<br />{chapter.title[1]}</h2><p className="icu-case-lead">{chapter.lead}</p></div>
        <div className="icu-case-chapter-copy"><span className="icu-case-number">({String(index + 1).padStart(2, '0')})</span>{chapter.copy.map(text => <p key={text}>{text}</p>)}</div>
      </div>
      {chapter.images.length > 0 && <div className={`icu-case-media ${chapter.layout === 'full' ? '' : chapter.layout === 'phones' ? 'campus-case-phones' : `icu-case-${chapter.layout}`} ${chapter.notes ? 'campus-case-with-notes' : ''}`}>
        {chapter.images.map(asset => picture(asset))}
        {chapter.notes && <div className="icu-case-service-notes">
          <p className="icu-case-eyebrow">{chapter.notes.eyebrow}</p><h3>{chapter.notes.title.split('\n').map((line, i) => <span key={line}>{i > 0 && <br />}{line}</span>)}</h3>
          <dl>{chapter.notes.items.map(item => <div key={item.title}><dt>{item.title}</dt><dd>{item.body}</dd></div>)}</dl>
        </div>}
      </div>}
      {index === study.chapters.length - 1 && <div className="campus-case-links icu-case-media">
        {project.id === 'symbiosphere' ? <a href="https://playful-sheets-173632.framer.app/" target="_blank" rel="noreferrer">体验万物链网页原型 ↗</a> : project.links?.map(link => <a key={link.url} href={link.url} target="_blank" rel="noreferrer" data-track-label={link.trackingLabel}>{link.label} ↗</a>)}
      </div>}
    </section>)}
    <section className="icu-case-conclusion" aria-label="项目总结">
      <div><span className="icu-case-number">({String(study.chapters.length + 1).padStart(2, '0')}) / Reflection</span><h2>{study.reflection.title[0]}<br />{study.reflection.title[1]}</h2><p className="icu-case-reflection">{study.reflection.body}</p></div>
      <div className="icu-case-credits"><dl>
        <div><dt>Project</dt><dd>{project.title} / {project.year}</dd></div>
        <div><dt>My focus</dt><dd>{project.role}</dd></div>
        <div><dt>Deliverables</dt><dd>{study.reflection.deliverables}</dd></div>
        <div><dt>Next step</dt><dd>{study.reflection.next}</dd></div>
      </dl></div>
    </section>
    <Dialog open={activeImage !== null} onOpenChange={open => { if (!open) { setActiveImage(null); setZoomed(false); } }}>
      <DialogContent className="icu-case-lightbox" showCloseButton={false} onCloseAutoFocus={event => { event.preventDefault(); lastImageButton.current?.focus(); }}>
        <div className="icu-case-lightbox-toolbar"><DialogTitle>{activeImage?.title ?? `${project.title} 图片预览`}</DialogTitle><button type="button" onClick={() => setZoomed(value => !value)} aria-pressed={zoomed}>{zoomed ? '完整显示' : '放大查看'}</button><DialogClose aria-label="关闭图片预览">关闭 ×</DialogClose></div>
        <DialogDescription className="sr-only">默认完整显示图片。放大后可横向和纵向滚动查看原图细节，按 Escape 关闭。</DialogDescription>
        <div className={`icu-case-lightbox-view${zoomed ? ' is-zoomed' : ''}`} tabIndex={0} role="region" aria-label="图片查看区域" key={`${activeImage?.src}-${zoomed}`}>
          {activeImage && <Image unoptimized src={activeImage.src} alt={activeImage.title} width={activeImage.width} height={activeImage.height} style={zoomed ? { width: activeImage.width } : undefined} />}
        </div>
      </DialogContent>
    </Dialog>
  </article>;
}
