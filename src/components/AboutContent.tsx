import Image from 'next/image';
import Link from 'next/link';
import FlipCard from '@/components/FlipCard';
import AboutObjects from '@/components/AboutObjects';
import DailyClock from '@/components/DailyClock';
import AboutFooterWordmark from '@/components/AboutFooterWordmark';
import AboutContactFooter from '@/components/AboutContactFooter';
import AboutFloatingNav from '@/components/AboutFloatingNav';
import TapeTitleProximity from '@/components/TapeTitleProximity';
import type { CSSProperties } from 'react';

// Coordinates follow the supplied 1409 × 5004 artboard. Each object remains
// separate so future animation can target it without rebuilding the composition.
const ARTBOARD_WIDTH = 1409;
const ARTBOARD_HEIGHT = 5004;
const place = (x: number, y: number, width: number, height: number): CSSProperties => ({
  left: `${x / ARTBOARD_WIDTH * 100}%`,
  top: `${y / ARTBOARD_HEIGHT * 100}%`,
  width: `${width / ARTBOARD_WIDTH * 100}%`,
  height: `${height / ARTBOARD_HEIGHT * 100}%`,
});

const capabilities = [
  {
    title: 'ALL Round?',
    lines: [
      '在产品思考、视觉表达与交互原型之',
      '间切换，根据项目需要选择合适的创',
      '作方式。从 Figma、AE 到 Cursor、',
      'Codex 与 AIGC 工作流，工具帮助我',
      '把抽象想法变成看得见、用得上的方',
      '案。我也持续探索 Naive Design的视',
      '觉语言，让设计在清晰表达之外，保',
      '留一点直觉、趣味和意外。',
    ],
  },
  {
    title: 'Carry out?',
    lines: [
      '先理解问题，再决定设计',
      '从需求识别、用户场景和目标判断出',
      '发，梳理功能、流程与信息架构，再',
      '通过视觉、动效和交互，把概念转化',
      '为可体验方案。关注每一个选择如何',
      '回应真实需求，并在演示、测试与反',
      '馈中持续调整，让创意从最初的设想',
      '走向完整落地。',
    ],
  },
  {
    title: 'Cooperation?',
    lines: [
      '通过明确目标、拆解任务与安排优',
      '先级，让团队理解正在解决什么，',
      '以及下一步需要完成什么。我会结',
      '合成员的优势与成长方向分配工',
      '作，在讨论、评审和迭代中协调不',
      '同想法，让最终成果保持一致的方',
      '向与完成度。',
    ],
  },
];

export default function AboutContent() {
  return (
    <main className="about-reference-page">
      <AboutFloatingNav />
      <Link href="/" className="about-keyboard-home">返回首页</Link>
      <div className="about-reference-canvas">
        <h1 className="sr-only">How to define Huiteen?</h1>
        <TapeTitleProximity style={place(390, 132, 608, 434)} />

        <div className="about-reference-asset about-name-card" style={place(326, 783, 795, 471)}>
          <FlipCard
            front={<Image unoptimized src="/about/name-card.png" alt="Huiteen / design sign — Make it odd. Make it real. Somewhere between ideas." width={795} height={471} sizes="57vw" draggable={false} />}
            back={<Image unoptimized src="/about/name-card-back.png" alt="名片背面：Huiteen 手绘头像与字标" width={954} height={564} sizes="57vw" draggable={false} />}
            axis="y"
            flipOnClick
            draggable
            dragDistance={0}
            tilt
            tiltMax={12}
            glare
            glareOpacity={0.22}
            hoverScale={1.03}
            perspective={1100}
            stiffness={170}
            damping={20}
            width="100%"
            height="100%"
            radius={22}
            background="transparent"
            color="#f5f5f5"
            shadow
            shadowColor="#000000"
            shadowOpacity={0.45}
            label="Huiteen 名片"
          />
        </div>

        <section className="about-reference-education" aria-labelledby="about-education-heading" style={place(501, 1490, 426, 411)}>
          <p className="about-reference-name">我是郑 惠文</p>
          <h2 id="about-education-heading">Education background</h2>
          <div className="about-reference-school">
            <svg viewBox="0 0 320 320" role="img" aria-label="广州美术学院校徽">
              <defs>
                <filter id="about-red-emblem" colorInterpolationFilters="sRGB">
                  <feColorMatrix type="matrix" values="0 0 0 0 .82  0 0 0 0 .06  0 0 0 0 .09  -.333333 -.333333 -.333333 0 1" />
                </filter>
              </defs>
              <image href="/profile/gafa-emblem.png" width="320" height="320" filter="url(#about-red-emblem)" />
            </svg>
            <span>广州美术学院</span>
          </div>
          <p className="about-reference-faculty">湾区创新学院 艺术与科技</p>
          <Image unoptimized className="about-reference-awards" src="/about/awards.png" alt="校级奖学金、校优秀学生、专业排名前1%" width={426} height={143} sizes="31vw" />
        </section>

        <AboutObjects />

        <section className="about-reference-capabilities" aria-label="设计能力与合作方式" style={place(56, 2886, 1285, 370)}>
          {capabilities.map((item) => (
            <article key={item.title}>
              <h2>{item.title}</h2>
              <p>{item.lines.map((line) => <span key={line}>{line}</span>)}</p>
            </article>
          ))}
        </section>

        <DailyClock style={place(225, 3345, 920, 795)} />

        <section className="about-reference-belief" aria-label="设计理念" style={place(380, 4128, 650, 140)}>
          <p>Huiteen认为设计的灵魂往往在于它的<br />不完美</p>
          <p lang="en">The essence of design lies in imperfection</p>
        </section>

        <AboutFooterWordmark style={place(296, 4438, 854, 287)} />
        <AboutContactFooter />
      </div>
    </main>
  );
}
