'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { useInView } from 'framer-motion';
import AboutFooterWordmark from './AboutFooterWordmark';
import AboutContactFooter from './AboutContactFooter';

export default function HomeClosing() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.05 });

  return (
    <div ref={ref} id="home-closing" className="home-closing" data-visible={visible}>
      {/* Keep the title, introduction, artwork and signature as separate motion targets. */}
      <section id="what-i-do" className="home-services" aria-labelledby="home-services-title">
        <h2 id="home-services-title" className="home-services-title">What i do</h2>
        <p className="home-services-intro">我从真实场景与人的需求出发，主导项目的问题定义、概念发展与设计推进。让作品不仅在视觉上体现，更在叙事性和目的性上展现。</p>
        <div className="home-services-collage" data-motion-layer="services-collage">
          <Image unoptimized src="/home/services-collage.png" alt="数字体验、创意执行与项目主导：从需求与信息架构、UI/UX 和服务协同，到视觉语言、AIGC、设计研究与迭代决策。From Idea To Experience。" width={2139} height={1569} sizes="(max-width: 767px) 100vw, 73vw" />
        </div>
      </section>
      <div className="home-closing-footer">
        <AboutFooterWordmark style={{ left: '17%', top: '33.5%', width: '69%', height: 'auto' }} />
        <AboutContactFooter variant="home" />
      </div>
    </div>
  );
}
