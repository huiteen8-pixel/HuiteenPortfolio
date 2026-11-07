'use client';

import Image from 'next/image';
import { useRef, useState, type ReactNode } from 'react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import VideoPlayer from './VideoPlayer';
import type { Project } from '@/data/projects';
import './IcuCaseStudy.css';

// Keep each original asset intact: research diagrams and interface labels must
// remain readable, rather than being cropped to a decorative cover ratio.
const evidence = {
  cover: { file: 'hd/ward-overview.webp', width: 7680, height: 4320, title: 'ICU+ 数字孪生医护工作台' },
  ecosystem: { file: '07-ecosystem.png', width: 1908, height: 2200, title: '医护与家属的服务生态图' },
  persona: { file: '08-persona.png', width: 1676, height: 2200, title: '家属与医护角色画像' },
  touchpoints: { file: 'hd/touchpoints.webp', width: 1714, height: 900, title: '用户、医护与共同触点' },
  storyboard: { file: 'hd/storyboard.webp', width: 1670, height: 894, title: '家属等待与关键决策情境' },
  overview: { file: '11-overview.png', width: 2200, height: 656, title: 'Digital Twin、Mobile Terminal 与 Pocket Lens 三端系统' },
  dashboard: { file: 'hd/ward-workspace.webp', width: 7680, height: 4320, title: 'Digital Twin 数字孪生病区总览' },
  spatial: { file: '02-2d-dashboard.png', width: 2400, height: 1349, title: '二维监护工作台' },
  patient: { file: 'hd/patient-detail.webp', width: 7680, height: 4320, title: '患者详情：生命体征、治疗与设备信息' },
  patientMore: { file: 'hd/patient-complete.webp', width: 7680, height: 8920, title: '患者详情完整长图：两组患者工作台' },
  interaction: { file: 'hd/ward-workspace.webp', width: 7680, height: 4320, title: '医护操作界面 01：完整工作台' },
  interactionTwo: { file: 'hd/ward-overview.webp', width: 7680, height: 4320, title: '医护操作界面 02：完整工作台' },
  interactionThree: { file: 'hd/interaction-state-3.webp', width: 7680, height: 4320, title: '医护操作界面 03：完整工作台' },
  interactionFour: { file: 'hd/interaction-state-4.webp', width: 7680, height: 4320, title: '医护操作界面 04：完整工作台' },
  family: { file: 'hd/family-app-aligned.svg', width: 2598, height: 946, title: '家属端：从接收提醒到理解病情进展' },
  pocket: { file: 'hd/pocket-lens.webp', width: 5016, height: 5016, title: 'Pocket Lens ICU 便携硬件概念' },
  waiting: { file: 'hd/family-waiting.webp', width: 4900, height: 4924, title: 'Pocket Lens 家属等待场景概念' },
} as const;
type Evidence = (typeof evidence)[keyof typeof evidence];

function Chapter({ number, title, lead, children, reverse = false, id }: {
  number: string; title: ReactNode; lead: string; children: ReactNode; reverse?: boolean; id: string;
}) {
  return (
    <div className={`icu-case-chapter${reverse ? ' icu-case-chapter--reverse' : ''}`} id={id}>
      <div className="icu-case-chapter-heading"><h2>{title}</h2><p className="icu-case-lead">{lead}</p></div>
      <div className="icu-case-chapter-copy"><span className="icu-case-number">({number})</span>{children}</div>
    </div>
  );
}

export default function IcuCaseStudy({ project }: { project: Project }) {
  const [activeImage, setActiveImage] = useState<Evidence | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const lastImageButton = useRef<HTMLButtonElement>(null);
  function picture(key: keyof typeof evidence, caption?: string, priority = false) {
    const asset = evidence[key];
    return (
      <figure className="icu-case-figure">
        <button type="button" className="icu-case-image" onClick={event => { lastImageButton.current = event.currentTarget; setZoomed(false); setActiveImage(asset); }} aria-label={`全屏查看：${asset.title}`}>
          <Image src={`/projects/icu/${asset.file}`} alt={asset.title} width={asset.width} height={asset.height}
            quality={90} sizes="(max-width: 767px) 96vw, 96vw" loading={priority ? 'eager' : 'lazy'} />
          <span className="icu-case-zoom" aria-hidden="true">↗</span>
        </button>
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    );
  }

  return (
    <article id="icu-plus" className="icu-case-study">
      <header className="icu-case-header">
        <a className="icu-case-pill" href="#icu-context">case study ↓</a>
        <h1>ICU+<br />Care, connected.</h1>
        <div className="icu-case-header-bottom">
          <p>ICU 家属沟通与医护协同系统</p>
          <p>Service Design / Medical UX / Digital Twin<br />{project.year} · Huiteen</p>
        </div>
      </header>

      <div className="icu-case-media icu-case-cover">{picture('cover', undefined, true)}</div>

      <Chapter id="icu-context" number="01" title={<>Uncertainty starts<br />outside the ICU.</>}
        lead="在 ICU 门外，家属等待的不只是一条消息，更是对病情的理解。">
        <p>ICU 中的信息高度专业、持续变化，也伴随着强烈的情绪压力。家属需要知道发生了什么、治疗进行到哪里；医护则需要在工作中完成解释、审核与协同。</p>
        <p>ICU+ 从这两类角色的沟通关系出发，探索如何把医疗信息组织成家属能够理解、医护能够审核的连续服务体验。</p>
      </Chapter>

      <div className="icu-case-media icu-case-collage">
        <div className="icu-case-stack">{picture('touchpoints', '从用户触点、医护触点中寻找共同的沟通节点。')}{picture('storyboard', '把等待、接收变化与关键决策放回具体情境。')}</div>
        {picture('persona', '家属需要可理解的信息，医护需要准确且可追溯的沟通。')}
      </div>

      <Chapter id="icu-service" number="02" reverse title={<>Two perspectives.<br />One shared journey.</>}
        lead="先连接角色与触点，再决定界面应该承载什么。">
        <p>梳理家属与 ICU 医护各自的服务生态，识别信息在等待、询问、通知、报告阅读与知情沟通之间如何流转。</p>
        <p>设计重点放在双方共有的节点：哪些信息需要解释，哪些内容需要审核，以及家属如何持续了解治疗进展。界面由这些服务关系展开。</p>
      </Chapter>

      <div className="icu-case-media icu-case-ecosystem">
        {picture('ecosystem')}
        <div className="icu-case-service-notes">
          <p className="icu-case-eyebrow">A shared communication layer</p>
          <h3>让信息在角色之间<br />有序地流动。</h3>
          <dl>
            <div><dt>01 / 家属</dt><dd>接收关键变化，阅读病情摘要，追踪治疗进展。</dd></div>
            <div><dt>02 / 医护</dt><dd>查看病区与患者状态，审核摘要，发布沟通内容。</dd></div>
            <div><dt>03 / 共同触点</dt><dd>连接提醒、解释与确认，保留关键沟通的路径。</dd></div>
          </dl>
        </div>
      </div>

      <Chapter id="icu-system" number="03" title={<>Three touchpoints.<br />One connected system.</>}
        lead="从医护工作台，到家属手机，再到随身的轻量提醒。">
        <p>方案由 Digital Twin 医护工作台、家属移动端与 Pocket Lens 三个触点组成。三端围绕同一条信息路径承担不同任务：查看与审核、阅读与追踪、提醒与进入。</p>
        <p>整体信息架构围绕「医护判断 → 审核摘要 → 家属接收 → 持续了解」展开，把一次次分散的沟通组织为连续的服务流程。</p>
      </Chapter>
      <div className="icu-case-media icu-case-system-strip">{picture('overview')}</div>

      <Chapter id="icu-workspace" number="04" reverse title={<>From the whole ward.<br />To one patient.</>}
        lead="让医护先看见全局，再进入患者的具体状态。">
        <p>Digital Twin 以空间化病区总览呈现床位、设备与风险信息，并提供二维监护视图，兼顾直观浏览与高效检索。</p>
        <p>进入患者详情后，生命体征、治疗进展、风险提示与设备状态被组织在同一个工作台中，为病情判断和沟通摘要提供信息基础。</p>
      </Chapter>
      <div className="icu-case-media icu-case-stack icu-case-workspace">
        {picture('dashboard', 'Digital Twin / 从病区全局进入单个床位。')}
        {picture('spatial', '2D View / 为检索与监护提供平面视图。')}
        {picture('patient', 'Patient Detail / 患者状态与治疗信息。')}
        {picture('patientMore', 'Patient Detail / 完整长图，保留两组工作台的全部内容。')}
      </div>
      <div className="icu-case-inline-note"><span className="icu-case-number">04.1</span><p>从查看数据到发布信息，中间需要一次明确的审核。</p><p>医护操作路径进一步呈现信息如何被查看、组织为摘要，并同步给家属端。</p></div>
      <div className="icu-case-media icu-case-pair icu-case-interactions">
        {picture('interaction', '01 / 完整操作界面')}{picture('interactionTwo', '02 / 完整操作界面')}
        {picture('interactionThree', '03 / 完整操作界面')}{picture('interactionFour', '04 / 完整操作界面')}
      </div>

      <Chapter id="icu-family" number="05" title={<>Make information<br />easier to follow.</>}
        lead="把专业信息转译成家属能够持续阅读的病情进展。">
        <p>家属端围绕提醒、患者状态、治疗路径时间轴与咨询入口组织信息，减少原始医疗数据的直接堆叠。</p>
        <p>病情摘要与治疗进展让家属能够回到同一条信息路径中查看变化。AI 咨询助手作为概念功能纳入原型，关键医疗信息的发布仍以医护审核为前提。</p>
      </Chapter>
      <div className="icu-case-media">{picture('family', 'Family App / 接收提醒、查看状态与理解治疗进展。')}</div>

      <section id="icu-pocket" className="icu-case-media icu-case-pocket">
        {picture('pocket')}
        <div className="icu-case-pocket-copy">
          <span className="icu-case-number">(06)</span>
          <h2>A small reminder.<br />A quieter wait.</h2>
          <p className="icu-case-lead">把关键提醒带到身边，让等待少一点打扰。</p>
          <p>Pocket Lens 是面向家属等待场景的便携硬件概念。它通过静默提醒与轻量入口，把家属重新带回需要关注的信息。</p>
          <p>它与移动端共同承担提醒、信息同步和情绪陪伴的角色，让服务触点从屏幕延伸到等待过程。</p>
        </div>
      </section>

      <div className="icu-case-media icu-case-waiting">{picture('waiting', 'Pocket Lens / 家属等待场景概念图。')}</div>

      <Chapter id="icu-prototype" number="07" reverse title={<>Follow the flow.<br />Feel the connection.</>}
        lead="把三端的关系，放进一段可以观看的流程。">
        <p>系统演示串联接收提醒、查看患者状态、理解病情变化与医护沟通的过程，呈现界面与服务触点如何衔接。</p>
        <p>这一阶段的产出是高保真概念原型，重点在于说明信息组织方式、三端协同关系与交互路径。</p>
      </Chapter>
      {project.video && <div className="icu-case-media icu-case-video"><VideoPlayer src={project.video} poster="/projects/icu/hd/ward-overview.webp" /></div>}

      <section className="icu-case-conclusion" aria-label="项目总结">
        <div><span className="icu-case-number">(08) / Reflection</span><h2>Care is also<br />how we communicate.</h2>
          <p className="icu-case-reflection">ICU+ 把沟通本身作为服务设计的对象。从角色关系到三端原型，尝试让复杂的信息有清晰的出口，也让等待中的人能够跟上变化。</p></div>
        <div className="icu-case-credits"><dl><div><dt>Project</dt><dd>ICU+ / 2026</dd></div><div><dt>My focus</dt><dd>服务设计、信息架构、医护与家属端 UX、数字孪生界面、便携硬件概念、交互流程。</dd></div><div><dt>Deliverables</dt><dd>服务生态与角色触点梳理；三端高保真概念原型；系统流程演示。</dd></div><div><dt>Next step</dt><dd>通过专业评审与真实场景测试，进一步验证沟通效果、信息安全与医疗合规边界。</dd></div></dl></div>
      </section>

      <Dialog open={activeImage !== null} onOpenChange={open => { if (!open) { setActiveImage(null); setZoomed(false); } }}>
        <DialogContent className="icu-case-lightbox" showCloseButton={false} onCloseAutoFocus={event => { event.preventDefault(); lastImageButton.current?.focus(); }}>
          <div className="icu-case-lightbox-toolbar">
            <DialogTitle>{activeImage?.title ?? 'ICU+ 图片预览'}</DialogTitle>
            <button type="button" onClick={() => setZoomed(value => !value)} aria-pressed={zoomed}>{zoomed ? '完整显示' : '放大查看'}</button>
            <DialogClose aria-label="关闭图片预览">关闭 ×</DialogClose>
          </div>
          <DialogDescription className="sr-only">默认完整显示图片。放大后可横向和纵向滚动查看原图细节，按 Escape 关闭。</DialogDescription>
          <div className={`icu-case-lightbox-view${zoomed ? ' is-zoomed' : ''}`} tabIndex={0} role="region" aria-label="图片查看区域" key={`${activeImage?.file}-${zoomed}`}>
            {activeImage && <Image unoptimized src={`/projects/icu/${activeImage.file}`} alt={activeImage.title} width={activeImage.width} height={activeImage.height} style={zoomed ? { width: activeImage.width } : undefined} />}
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
