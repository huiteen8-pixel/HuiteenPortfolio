'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import ImageGallery from '@/components/ImageGallery';
import ScrollReveal, { DrawLine } from '@/components/ScrollReveal';
import VideoPlayer from '@/components/VideoPlayer';

type Project = {
  id: string;
  index: string;
  logo: string;
  logoImage?: string;
  group: 'System' | 'Concept' | 'Visual' | 'Making';
  title: string;
  english: string;
  category: string;
  year: string;
  role: string;
  summary: string;
  question: string;
  contributions: string[];
  outcome: string;
  infoBlocks?: { label: string; body: string }[];
  images: ProjectImage[];
  video?: string;
  poster?: string;
  links?: { label: string; url: string }[];
};

type ProjectImage = {
  src: string;
  title: string;
  description: string;
  layout?: 'wide' | 'standard' | 'tall' | 'square';
  category?: string;
  size?: 'full' | 'large' | 'medium' | 'compact';
  display?: 'scroll' | 'grid';
};

const visual = (
  src: string,
  title: string,
  description: string,
  layout: ProjectImage['layout'] = 'standard',
  category?: string,
  size?: ProjectImage['size'],
  display?: ProjectImage['display'],
): ProjectImage => ({ src, title, description, layout, category, size, display });

const navigation = [
  { label: 'about', id: 'about' },
  { label: 'profile', id: 'profile' },
  { label: 'methods', id: 'skills' },
  { label: 'projects', id: 'projects' },
  { label: 'approach', id: 'connect' },
];

const projects: Project[] = [
  {
    id: 'icu-plus',
    index: '01',
    logo: 'ICU+',
    logoImage: '/projects/icu/logo.png',
    group: 'System',
    title: 'ICU+',
    english: 'ICU Family Communication and Medical Collaboration System',
    category: 'Service Design / Medical UX / Digital Twin',
    year: '2026',
    role: '服务设计 / 医疗 UX / 数字孪生 / 家属沟通系统',
    summary:
      '面向 ICU 场景的家属沟通与医护协同系统，通过数字孪生、移动端信息同步与便携硬件，重构重症监护中的信息透明度与情绪安全感。',
    question:
      '如何把 ICU 中高度专业、实时变化、情绪敏感的医疗信息，转化为家属可理解、医护可审核、团队可协同的服务体验？',
    contributions: [
      '从患者家属与 ICU 医护两类角色出发，梳理沟通生态、用户旅程、触点和高风险节点。',
      '设计三端协同系统：Digital Twin 医护工作台、家属移动端和 Pocket Lens 便携信息同步硬件。',
      '建立病情摘要审核、治疗路径时间轴、AI 咨询助手和高危沟通留痕等关键功能。',
    ],
    outcome:
      '项目把 ICU 的数据监控转译为信息同步与情绪安抚服务，让医学信息更透明、家属等待更安心、医护沟通更可复用。',
    images: [
      visual('/projects/icu/01-dashboard.png', 'Project Cover｜数字孪生主页', '面向 ICU 场景的家属沟通与医护协同系统，通过数字孪生、移动端信息同步与便携硬件，重构重症监护中的信息透明度与情绪安全感。', 'wide', undefined, 'full'),
      visual('/projects/icu/07-ecosystem.png', '多角色服务生态图', 'ICU+ 首先梳理 ICU 场景中的多角色关系，将患者状态、医护判断、家属信息需求与设备数据整合为一个服务生态，为后续产品系统设计提供逻辑基础。', 'tall', '02 Research Logic｜研究与服务逻辑', 'large'),
      visual('/projects/icu/08-persona.png', 'Persona｜家属与医护角色画像', '通过家属与医护角色画像，项目聚焦 ICU 场景中最典型的矛盾：家属需要及时、可理解、可信的信息；医护需要减少重复解释，并保证关键信息发布的准确性与可追溯性。', 'tall', '02 Research Logic｜角色与触点', 'medium'),
      visual('/projects/icu/09-touchpoints.png', 'Touchpoints｜关键触点拆解', '项目进一步拆解家属从等待、询问、接收通知、阅读报告到签署高风险知情文件的关键触点，明确系统介入的位置。', 'wide', '02 Research Logic｜角色与触点', 'medium'),
      visual('/projects/icu/10-storyboard.png', 'Storyboard｜等待与决策情境', '故事版用于呈现家属在 ICU 外等待、接收病情变化、理解治疗进展与完成关键决策的情绪路径，帮助系统从“数据展示”转向“信息安抚”。', 'wide', '02 Research Logic｜情境故事板', 'medium'),
      visual('/projects/icu/digital-twin-homepage.png', 'Digital Twin Homepage｜数字孪生主页', '医护端以 ICU 数字孪生为核心，将床位状态、患者风险等级、设备运行情况与关键指标集中展示，使医护人员能够从病区全局快速进入单个患者详情。', 'wide', '04 Digital Twin｜医护端', 'large'),
      visual('/projects/icu/02-2d-dashboard.png', 'Spatial View & 2D View｜二维监护工作台', '系统同时提供空间化视图与 2D 平面视图，分别满足直观病区总览与高效信息检索的使用需求。', 'wide', '04 Digital Twin｜医护端', 'large'),
      visual('/projects/icu/03-interaction.png', 'Interaction Flow｜医护操作路径', '交互页面展示医护人员从病区总览进入患者信息、查看指标变化、审核摘要并发布给家属端的操作路径。', 'wide', '04 Digital Twin｜医护端', 'large'),
      visual('/projects/icu/03-frame.png', 'Patient Detail 01｜患者详情页', '患者页面用于呈现单个 ICU 患者的生命体征、治疗进展、风险提示与设备状态，使医护能够快速判断病情变化，并生成适合家属阅读的信息摘要。', 'wide', '04 Patient Detail｜患者详情页', 'medium'),
      visual('/projects/icu/patient-detail-2.png', 'Patient Detail 02｜患者详情页补充', '第二张患者详情页与第一张形成横向对比组，用于补充展示单个患者信息、风险提示、设备状态和摘要生成的医护端判断场景。', 'wide', '04 Patient Detail｜患者详情页', 'medium'),
      visual('/projects/icu/05-family-app.png', 'Family App｜家属端信息同步', '家属端不直接堆叠医疗原始数据，而是将 ICU 中复杂的生命体征、治疗安排、检查结果和医护解释转译为可阅读的信息流。信息同步不是“通知”，而是将专业医疗判断转化为家属能够理解、能够追踪、能够信任的阅读体验。', 'wide', '05 Family App｜家属端信息同步', 'large'),
      visual('/projects/icu/06-pocket-lens.png', 'Pocket Lens｜便携硬件', 'Pocket Lens 是面向家属等待场景的便携硬件。它不承担复杂操作，而是通过静默提醒、快速进入患者页面、情绪陪伴与低打扰通知，帮助家属在高压等待中及时获取关键变化。', 'square', '06 Pocket Lens｜便携硬件', 'compact'),
      visual('/projects/icu/11-overview.png', 'Final System｜ICU+ 产品系统总览', '最终，ICU+ 将 ICU 病区中的医疗数据、医护判断、家属阅读和便携提醒整合为一个连续的信息服务系统。项目通过三端协同，让重症监护不再只是封闭的医疗空间，而成为一个更透明、更可理解、更具信任感的沟通系统。', 'wide', '08 Final System｜ICU+ 产品系统总览', 'full'),
    ],
    video: '/projects/icu/demo.mp4',
  },
  {
    id: 'symbiosphere',
    index: '02',
    logo: '万',
    logoImage: '/projects/symbiosphere/logo.png',
    group: 'System',
    title: '万物链',
    english: 'Bio Campus',
    category: 'AI Ecology Platform / Campus Service System',
    year: '2025',
    role: '信息架构 / 网页视觉 / 移动端界面 / 品牌视觉 / 交互流程 / 线上页面落地',
    summary:
      '万物链 Bio Campus 是一个面向校园自然生态的数字导览与互动平台，通过网页、移动端和交互任务，将校园中的植物、动物与空间路线重新组织为可探索、可记录、可传播的生态体验。',
    question:
      '校园生态信息分散、缺少统一入口，学生和访客很难在日常路径中理解校园自然资源。如何让这些自然对象从背景景观变成可被认识、记录和连接的公共知识？',
    contributions: [
      '负责项目信息架构梳理，明确网页端、移动端、App 延展与互动任务之间的内容关系。',
      '完成网页视觉设计、移动端界面设计和品牌视觉延展，让自然生态议题具有更友好的校园平台气质。',
      '设计发现、识别、了解、收藏、分享的交互流程，并规划内容采集、用户互动与校园传播闭环。',
    ],
    outcome:
      '最终，万物链将校园自然资源转化为一个可浏览、可互动、可持续积累的数字生态平台。项目通过网页展示、移动端适配与互动机制，让校园中的自然对象从背景景观变成可被认识、记录和连接的公共知识。',
    infoBlocks: [
      {
        label: 'Background',
        body: '校园中的自然资源常常被看见，却很少被真正认识。学生与访客在日常通行中经过植物、昆虫、鸟类和生态空间，但这些内容缺少持续的导览、解释和互动机制。',
      },
      {
        label: 'Goal',
        body: '通过数字平台建立校园生态信息入口，让用户能够发现、识别、收藏和分享校园中的自然生命，并进一步形成生态教育、校园导览与社区参与的闭环。',
      },
    ],
    images: [
      visual('/projects/symbiosphere/01-home.png', 'Project Cover｜万物链 Bio Campus', '万物链 Bio Campus 是一个面向校园自然生态的数字导览与互动平台，通过网页、移动端和交互任务，将校园中的植物、动物与空间路线重新组织为可探索、可记录、可传播的生态体验。', 'wide', undefined, 'full'),
      visual('/projects/symbiosphere/04-business-loop.png', 'System Loop｜商业闭环', '项目通过内容采集、生态识别、用户互动、任务激励与校园传播形成闭环。用户在浏览和探索校园生态的同时，也能持续贡献观察记录，使平台从单向展示转变为可成长的校园生态数据库。', 'wide', '03 System Logic｜系统逻辑', 'large'),
      visual('/projects/symbiosphere/02-interaction.png', 'Service Flow & Interaction Logic｜交互机制', '交互设计围绕“发现—识别—了解—收藏—分享”展开，将自然观察转化为轻量化任务。用户可以通过网页或移动端进入生态内容，在浏览校园物种信息的同时形成个人化的探索路径。', 'wide', '04 Service Flow & Interaction Logic｜交互机制', 'large'),
      visual('/projects/symbiosphere/01-hero.jpg', 'Website Experience 01｜网页端主体验', '网页端承担项目的主要信息展示功能，以绿色视觉系统、图片卡片和模块化内容组织校园生态信息，让用户能够快速浏览校园中的自然对象与相关介绍。', 'wide', '05 Website Experience｜网页端体验', 'large'),
      visual('/projects/symbiosphere/08-web-image-2.jpg', 'Website Experience 02｜网页内容模块', '内容模块用于承载物种信息、生态内容与校园导览入口，使网页不只是品牌展示，也能成为持续浏览和进入生态任务的主入口。', 'square', '05 Website Experience｜网页端体验', 'medium'),
      visual('/projects/symbiosphere/05-long.jpg', 'Website Experience 03｜网页长页展示', '完整网页长页展示了 Bio Campus 如何从项目入口、品牌介绍、服务模块、观察记录到生态探索连续展开，让网页端成为承载校园生态信息与平台叙事的主要入口。', 'tall', '05 Website Experience｜网页端体验', 'compact'),
      visual('/projects/symbiosphere/app-extension-01.gif', 'App Extension 01｜生物生长收集', 'App 端通过动态引导展示生物生长数据收集入口，让校园生态观察从静态浏览转化为持续记录。', 'tall', '07 App Extension｜App 延展', 'compact', 'grid'),
      visual('/projects/symbiosphere/app-extension-02.gif', 'App Extension 02｜栖息地选择', '用户可以选择不同栖息地并进入对应生态信息，将空间导览、物种内容和探索路径连接起来。', 'tall', '07 App Extension｜App 延展', 'compact', 'grid'),
      visual('/projects/symbiosphere/app-extension-03.gif', 'App Extension 03｜扫描识别', '扫描页面强化真实场景中的即时识别体验，使用户能够在校园空间中直接发现并理解身边的自然对象。', 'tall', '07 App Extension｜App 延展', 'compact', 'grid'),
      visual('/projects/symbiosphere/app-extension-04.gif', 'App Extension 04｜物种详情', '物种详情页将识别结果、生物状态和行为信息组织为可阅读内容，形成从发现到理解的完整闭环。', 'tall', '07 App Extension｜App 延展', 'compact', 'grid'),
      visual('/projects/symbiosphere/final-overview.svg', 'Final Overview｜Web + Mobile + App + System Loop', '最终，万物链将校园自然资源转化为一个可浏览、可互动、可持续积累的数字生态平台。网页展示、移动端适配、App 延展与商业闭环共同构成从发现到记录、从个人探索到公共知识的完整系统。', 'wide', '09 Final Overview｜项目总结', 'full'),
    ],
  },
  {
    id: 'gafa-wayfinding',
    index: '03',
    logo: 'G',
    logoImage: '/projects/gafa/logo.jpg',
    group: 'System',
    title: 'GAFA 路标改良系统',
    english: 'GAFA Campus Navigation System',
    category: 'Wayfinding / Spatial Interface / QR Web Guide',
    year: '2025',
    role: '校园导览问题分析 / 标识系统改良 / 视觉层级设计 / 移动端页面设计 / 二维码入口规划 / 线上页面部署',
    summary:
      '通过校园平面导览、楼层标识、功能图标、移动端 UI 与二维码入口，重构 GAFA 校园中“从看见标识到抵达目的地”的完整导览体验。',
    question:
      '当新生与访客面对复杂校园空间时，如何通过更清晰的信息层级、视觉语言和线上线下连接，提升识别效率、方向判断和路径连续性？',
    contributions: [
      '归纳信息层级混乱、缺乏识别性地标、方向感缺失和指引系统不连续四类校园找路断点。',
      '建立校区级、楼栋级、楼层级和房间级的信息分层，并统一字体、图标、方向箭头、黑白灰层级和黄色强调色。',
      '规划二维码入口与移动端页面，把实体标识连接到线上查询，使用户能继续查看楼栋、楼层和具体房间信息。',
    ],
    outcome:
      '最终，GAFA 路标改良系统将校园中的静态标识升级为一套可持续延展的导览服务。它不仅改良了视觉识别与空间指引，也通过二维码和线上页面补足了实体标识难以承载的动态信息。',
    images: [
      visual('/projects/gafa/offline-online-guide.png', 'Project Cover｜校园路标改良与线上导览系统', '通过校园平面导览、楼层标识、功能图标、移动端 UI 与二维码入口，重构 GAFA 校园中“从看见标识到抵达目的地”的完整导览体验。', 'wide', undefined, 'full'),
      visual('/projects/gafa/background-problem.png', 'Background & Problem｜背景问题', '新生与访客第一次进入校园时，常常面对复杂的空间结构和分散的信息标识。原有导览系统存在信息层级不清、关键地标弱、方向指引不连续等问题，导致用户难以快速判断当前位置、楼栋关系与目的地方向。', 'wide', '02 Background & Problem｜背景问题', 'large'),
      visual('/projects/gafa/user-scenario.png', 'User Scenario｜用户画像', '项目以新生和校内学生作为主要用户，分析他们在入学报到、寻找教室、跨楼栋移动和临时查询信息时遇到的迷路、焦虑和信息不确定问题。导览系统的目标不是单纯提供地图，而是帮助用户在不同熟悉度下快速建立空间认知。', 'tall', '03 User Scenario｜用户画像', 'medium'),
      visual('/projects/gafa/floor-directory-signage.png', 'Floor Directory Signage System｜平面导览改良', '平面导览系统通过更明确的楼栋字母、楼层编号、房间方向和功能图标，帮助用户快速理解空间结构。设计以高对比黑白灰为基础，减少装饰干扰，使标识在真实校园环境中具备更高的识别效率。', 'wide', '04 Core Output｜平面导览改良', 'full'),
      visual('/projects/gafa/final-overview.svg', 'Final System｜GAFA 导览系统总览', '最终，GAFA 路标改良系统将校园中的静态标识升级为一套可持续延展的导览服务。它不仅改良了视觉识别与空间指引，也通过二维码和线上页面补足了实体标识难以承载的动态信息。', 'wide', '05 Final System｜项目总结', 'full'),
    ],
    links: [
      { label: '打开 GAFA 1.0 在线导览网页', url: 'https://gagafa.netlify.app/gafa1.0/' },
      { label: '打开 GAFA 2.0 楼层导览网页', url: 'https://gagafa.netlify.app/gafa2.0/louceng' },
    ],
  },
  {
    id: 'moodlens',
    index: '04',
    logo: 'M',
    group: 'Concept',
    title: '情绪地图',
    english: 'Emotional Map',
    category: 'Workplace Service Design / Emotion-Aware Interface',
    year: '2026',
    role: '用户研究 / 服务系统设计 / 信息减负策略 / 响应模式设计 / 界面原型',
    summary:
      '情绪地图是一套面向白领与商务人士情绪状态的服务设计系统，关注他们在通勤、会议、任务切换、客户沟通和信息接收中的压力变化，并尝试让系统根据不同状态调整信息密度、交互节奏与服务入口。',
    question:
      '当职场用户处于焦虑、疲惫、决策压力或信息过载状态时，工作服务系统如何判断“此刻应该给多少信息”，并以更低压力的方式提供下一步支持？',
    contributions: [
      '通过用户研究归纳白领与商务人士在工作日中的焦虑、疲惫、低动力、决策压力与信息过载状态。',
      '提出信息减负策略，让系统在高压力或低能量状态下降低信息密度、减少选择数量并突出关键下一步。',
      '构建状态识别、系统递进与模式响应机制，将情绪变化转化为工作服务入口、任务优先级和界面层级调整。',
    ],
    outcome:
      '最终，情绪地图把情绪识别、信息减负和模式响应机制转化为具体界面，使工作服务不只是展示任务和消息，而能根据用户当下状态提供更合适的行动支持。',
    images: [
      visual('/projects/moodlens/design-background.png', 'Project Introduction｜设计背景', '情绪地图是一套面向白领与商务人士情绪状态的服务设计系统，关注他们在通勤、会议、任务切换、客户沟通和信息接收中的压力变化，并尝试让系统根据不同状态调整信息密度、交互节奏与服务入口。', 'wide', undefined, 'large'),
      visual('/projects/moodlens/user-research.png', 'User Research｜用户研究', '通过用户研究，归纳职场人群在工作日中常见的情绪状态：焦虑、疲惫、低动力、决策压力和信息过载。不同状态下，用户对系统的需求并不相同，有人需要完整任务信息，有人需要简化路径，有人只需要一个低压力的下一步提醒。', 'wide', '02 User Research｜用户研究', 'large'),
      visual('/projects/moodlens/scenario-story.png', 'Scenario Story｜用户情景故事', '用户情景故事描绘商务人士在一天工作中从通勤、会议准备、消息堆叠、任务切换到寻求支持的过程，帮助定位系统介入的关键节点：什么时候应该减少信息，什么时候应该突出优先级，什么时候应该提供可执行的下一步。', 'wide', '03 Scenario Story｜用户情景故事', 'large'),
      visual('/projects/moodlens/information-load-reduction.png', 'Information Load Reduction｜信息减负对比', '项目将“信息减负”作为核心策略：当用户处于高压力或低能量状态时，系统不继续堆叠内容，而是主动降低信息密度、减少选择数量、弱化视觉刺激，并优先呈现最关键的下一步。', 'wide', '04 Information Load Reduction｜信息减负对比', 'large'),
      visual('/projects/moodlens/system-evolution.png', 'System Evolution｜系统递进', '系统递进展示了情绪地图从基础工作信息展示，到状态识别，再到个性化响应的演化逻辑。项目不是简单记录情绪，而是将情绪状态转化为任务组织、提醒节奏和服务入口调整依据。', 'wide', '05 System Evolution｜系统递进', 'large'),
      visual('/projects/moodlens/response-modes.png', 'Response Modes｜模式响应', '系统根据不同情绪状态切换响应模式：稳定状态下提供完整工作信息，焦虑状态下降低信息密度，迷失状态下强化任务路径，低动力状态下提供轻量行动提示，高压状态下优先呈现支持入口。', 'wide', '06 Response Modes｜响应机制', 'large'),
      visual('/projects/moodlens/final-interface.png', 'Final Interface｜页面展示', '最终页面将前面的情绪识别、信息减负和模式响应机制转化为具体界面。整体视觉采用柔和色调、低压力留白和轻量化信息层级，让白领与商务人士在不同状态下获得更适合当下的工作支持。', 'wide', '07 Final Interface｜最终成果', 'full'),
    ],
  },
  {
    id: 'emotional-lens',
    index: '05',
    logo: 'EL',
    group: 'Concept',
    title: 'Emotional Lens',
    english: 'Adaptive Emotional Service System',
    category: 'Speculative Service Design / UX Concept / Web Prototype',
    year: '2026',
    role: '趋势洞察 / 全局概念设计 / 网页信息架构 / 视觉落地',
    summary:
      'Emotional Lens 是一个面向未来服务系统的概念网页项目，探索数字服务如何从面向静态用户画像，转向面向用户当下情绪状态。项目提出情绪透镜与情绪协议，让可信服务根据状态调节信息密度、提醒节奏与交互负担。',
    question:
      '当用户并不总是稳定、理性、可持续交互时，服务系统如何理解“此刻的用户能承受什么”，并以被授权、低干预的方式回应？',
    contributions: [
      '梳理服务设计从可用性、用户旅程、个性化到情绪感知的发展迁移，找到趋势切入点。',
      '构建 Emotional Lens 与 Emotional Agreement 两个核心概念，回应状态识别与数据授权问题。',
      '用手写标题、便签卡片、草图箭头和珊瑚橙视觉系统，将服务机制转化为可浏览网页叙事。',
    ],
    outcome:
      '形成一套可在线访问的概念网页原型，完整串联趋势判断、问题定义、服务机制和场景案例。',
    images: [
      visual('/projects/emotional-lens/01.png', '趋势入口', '以网页首屏建立 Emotional Lens 的概念语气和视觉基调。', 'wide'),
      visual('/projects/emotional-lens/02.png', '问题定义', '说明为什么服务系统需要理解用户当下的情绪承受能力。', 'wide'),
      visual('/projects/emotional-lens/03.png', '情绪透镜机制', '把抽象概念转译为可以被服务系统调用的判断层。', 'wide'),
      visual('/projects/emotional-lens/04.png', '授权与情绪协议', '解释情绪数据如何被用户授权、控制和撤回。', 'wide'),
      visual('/projects/emotional-lens/05.png', '服务状态变化', '展示系统如何根据状态调整信息密度和提醒节奏。', 'wide'),
      visual('/projects/emotional-lens/06.png', '场景案例', '用具体服务场景说明情绪响应式体验的价值。', 'wide'),
      visual('/projects/emotional-lens/07.png', '网页叙事展开', '补充网页长页中的视觉节奏和手写语言。', 'wide'),
      visual('/projects/emotional-lens/08.png', '概念收束', '以最后一屏回收项目概念与未来服务方向。', 'wide'),
    ],
    links: [
      {
        label: '打开 Emotional Lens 在线概念网页',
        url: 'https://imaginative-kheer-c2fc30.netlify.app/',
      },
    ],
  },
  {
    id: 'data-visualization',
    index: '06',
    logo: 'M/E',
    group: 'Visual',
    title: 'Music and Economics',
    english: 'Economy, Emotion and Music Culture',
    category: 'Data Visualization / Infographic Design',
    year: '2026',
    role: '信息结构搭建 / 图表语言设计 / 大型展板叙事',
    summary:
      'Music and Economics 是一个围绕宏观经济环境与当代音乐审美偏好展开的数据可视化项目，将经济周期、音乐类型、情绪消费、传播方式和地域差异等复杂变量转化为可阅读、可比较、具有审美感染力的图表系统。',
    question:
      '如何把横跨经济、文化、音乐、情绪和地域的复杂议题，整合成稳定的信息结构和具有音乐感的视觉叙事？',
    contributions: [
      '将经济、音乐、情绪、地域、时间和传播变量拆解为可视化信息层级。',
      '使用关系图、象限图、极坐标图、地图、趋势图和辅助图表构建统一图表语言。',
      '把多个尺度与多个图表类型整合到大型信息展板中，控制阅读顺序和视觉节奏。',
    ],
    outcome:
      '项目展示了复杂信息组织、图表审美控制和大型信息图排版能力，让观众通过图表理解经济环境、社会情绪与音乐文化之间的互动关系。',
    images: [
      visual('/projects/data-viz/01-board.png', '完整信息展板', '先展示大型信息图的整体组织和阅读路径。', 'tall'),
      visual('/projects/data-viz/02-concept.png', '概念框架与变量拆解', '解释经济、音乐、情绪和地域变量如何被拆分为图表结构。', 'tall'),
      visual('/projects/data-viz/02-chart.png', '图表语言二', '补充长图表中的纵向阅读和细节密度控制。', 'tall'),
    ],
  },
  {
    id: 'digital-table',
    index: '07',
    logo: 'DT',
    group: 'Concept',
    title: '数字餐桌',
    english: 'The Table',
    category: 'Critical Digital Art / 3D Interactive Narrative',
    year: '2026',
    role: '批判性叙事 / 3D 场景 / 交互机制 / 展览呈现',
    summary:
      '《The Table / 数字餐桌》是一项以共餐场景为核心的批判性数字艺术项目。作品将餐桌视为现实关系发生的微型社会场域，通过 3D 场景、动态视觉反馈与交互叙事，探讨数字信息如何侵入亲密空间并加剧真实疏离。',
    question:
      '当屏幕出现在餐桌，我们咀嚼的是数据，还是情感？虚拟连接如何在最日常的共处场景中制造真实疏离？',
    contributions: [
      '建立“真实共餐 - 数字侵入 - 信息挤压 - 实体消散 - 回归反思”的体验叙事。',
      '通过数据瀑流、空间压缩、黑白化、模糊处理和 UI 入侵表现数字信息对关系现场的侵蚀。',
      '将论坛现场、线上展览与证书材料组织为项目完成度与外部认可的证明。',
    ],
    outcome:
      '作品受邀参与首尔国立大学 AI 时代叙事主题国际论坛相关展览，形成具备公开展示和学术讨论背景的批判性体验项目。',
    images: [
      visual('/projects/digital-table/01-board.png', '项目展板总览', '先展示数字餐桌的完整叙事、视觉和交互机制。', 'wide'),
      visual('/projects/digital-table/01-hero.jpg', '广美线上作品展览', '建立作品的核心空间：餐桌作为关系发生和被数字侵入的场域。', 'square'),
      visual('/projects/digital-table/02-frame.png', '交互框架', '说明数字侵入、信息挤压和关系疏离如何在体验中推进。', 'wide'),
      visual('/projects/digital-table/03-forum.jpg', '国际论坛现场', '展示项目参与首尔国立大学相关论坛与展览。', 'standard'),
      visual('/projects/digital-table/04-certificate.jpg', '展览证书', '作为项目外部认可与展示经历的补充材料。', 'tall'),
    ],
  },
  {
    id: 'heytea-character',
    index: '08',
    logo: '喜',
    group: 'Visual',
    title: '喜茶阿喜全身像',
    english: 'HEYTEA Character Visual',
    category: 'Character Design / Brand Visual',
    year: '2024',
    role: '角色视觉 / 品牌形象 / 比赛获奖作品',
    summary:
      '喜茶阿喜全身像围绕品牌角色进行全身视觉塑造，把角色姿态、比例、服装和品牌气质统一到一个可延展的形象系统中。',
    question:
      '品牌角色如何在保持识别度的同时，拥有更完整的身体姿态、性格气质和传播延展空间？',
    contributions: [
      '梳理角色比例、服装、表情和姿态之间的关系。',
      '将喜茶品牌气质转译为可用于传播和延展的角色全身形象。',
      '以高完成度角色图获得 2024 阿喜全身像大赛第一名。',
    ],
    outcome:
      '形成一个品牌角色视觉提案，可作为后续 IP 表情、包装、活动视觉或衍生品形象基础。',
    images: [
      visual('/projects/heytea/01-character.jpg', '阿喜全身像设计', '先呈现角色本体，让比例、姿态和品牌气质成为主信息。', 'tall'),
    ],
  },
  {
    id: 'other-skills',
    index: '09',
    logo: '+',
    group: 'Making',
    title: '其他能力',
    english: 'Additional Making Skills',
    category: 'Modeling / Editorial Design / Handmade Book / Sketch',
    year: '2024-2026',
    role: '三维建模 / 战报设计 / 手工书制作 / 手绘表达',
    summary:
      '其他能力板块用于补充展示跨媒介制作能力：场景建模、战报设计、手工书制作和手绘能力。它不是单一项目，而是证明你能在不同媒介中完成视觉组织和实体制作。',
    question:
      '除了系统型交互项目，作品集还需要如何证明设计基础、视觉完成度和跨媒介执行能力？',
    contributions: [
      '整理三维场景、编辑式版面、手工书和手绘图像，作为方法之外的制作证据。',
      '用同一套项目卡片承载不同媒介，避免辅助作品散乱堆放。',
      '补足作品集中从系统设计到视觉执行、从数字到实体的能力跨度。',
    ],
    outcome:
      '该板块让作品集不只展示概念和界面，也能展示造型、排版、手工和手绘等基础能力。',
    images: [
      visual('/projects/other-skills/01-modeling.jpg', '场景建模', '展示三维空间、材质和场景氛围塑造能力。', 'square'),
      visual('/projects/other-skills/02-report.jpg', '战报设计', '展示纵向信息排版、图文节奏和视觉层级控制。', 'tall'),
      visual('/projects/other-skills/03-handmade-book.png', '手工书制作', '补充实体制作、装帧和材料表达能力。', 'square'),
      visual('/projects/other-skills/04-sketch.jpg', '手绘表达', '展示手绘造型、观察和视觉表达基础。', 'tall'),
    ],
  },
];

const skillGroups = [
  {
    title: 'Research & Strategy',
    items: ['需求识别', '设计研究与定义', '用户场景拆解', '产品目标判断', '方案推进方向'],
  },
  {
    title: 'Product Structure',
    items: ['功能拆解', '流程规划', '信息架构', '系统设计', '服务与产品开发'],
  },
  {
    title: 'Prototype & Tools',
    items: ['Figma', 'Cursor', 'Codex', 'AE', 'AI 工具', 'Sketch'],
  },
  {
    title: 'Exploration',
    items: ['AIGC 工作流', '视觉探索', '高质量可演示原型', 'Naive Design', 'Kid Core'],
  },
];

const capabilityHighlights = [
  {
    title: 'Focus',
    lines: ['产品服务与开发', '设计研究与定义', '数据可视化 / 系统设计'],
  },
  {
    title: 'What I Can Do',
    lines: ['需求识别与功能拆解', '流程规划与交互原型', '视觉界面与可演示网页原型'],
  },
];

const heroTags = ['Interaction Design', 'Service Design', 'Product Prototype', 'AIGC Workflow'];

export default function Portfolio() {
  const [scrolled, setScrolled] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const entranceTimer = window.setTimeout(() => setHasAnimated(true), 1600);

    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.clearTimeout(entranceTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleHeroMouseMove = (event: MouseEvent<HTMLElement>) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-white text-[#151515]">
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'translate-y-0 bg-white/88 opacity-100 backdrop-blur-md'
            : 'pointer-events-none -translate-y-4 bg-transparent opacity-0'
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 md:px-8">
          <button
            onClick={() => scrollTo('about')}
            className="text-sm uppercase tracking-[0.24em] text-[#1a1a1a] transition-colors hover:text-[#666]"
            style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}
          >
            郑惠文 Huiteen
          </button>
          <div className="hidden items-center gap-10 md:flex">
            {navigation.slice(1).map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-sm uppercase tracking-[0.22em] text-[#1a1a1a] transition-colors hover:text-[#666]"
                style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <section
        id="about"
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        className="relative flex min-h-screen items-center overflow-hidden bg-white px-4 py-24 sm:px-6 md:px-8"
      >
        <div className="pointer-events-none absolute inset-x-4 top-20 h-px bg-[#ece7df] md:inset-x-8" />
        <div className="pointer-events-none absolute inset-x-4 bottom-20 h-px bg-[#ece7df] md:inset-x-8" />

        <div className="relative mx-auto w-full max-w-[1400px]">
          <div className="max-w-6xl space-y-8 text-left">
            <p
              className={`${hasAnimated ? '' : 'hero-text hero-text-delay-1'} text-sm uppercase tracking-[0.18em] text-[#8c847d] md:tracking-[0.34em]`}
              style={{
                transform: `translate(${mousePos.x * -22}px, ${mousePos.y * -16}px)`,
                transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              Interaction / Service / AIGC Portfolio
            </p>
            <h1
              className={`${hasAnimated ? '' : 'hero-text hero-text-delay-1'} w-full select-none text-left text-[clamp(4.4rem,15vw,13rem)] font-bold leading-[0.88] text-[#171412]`}
              style={{
                fontFamily: 'Noto Serif SC Critical, Noto Serif SC, Georgia, serif',
                transform: `translate(${mousePos.x * -28}px, ${mousePos.y * -18}px)`,
                transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <span className="block">Huiteen</span>
              <span className="mt-4 block text-left text-[clamp(2.4rem,7vw,6rem)] font-semibold leading-none tracking-normal">
                郑惠文
              </span>
            </h1>
            <p
              className={`${hasAnimated ? '' : 'hero-text hero-text-delay-2'} max-w-6xl text-left text-xl leading-relaxed text-[#3e3832] md:text-3xl lg:whitespace-nowrap`}
              style={{
                fontFamily: 'Noto Serif SC, Georgia, serif',
                transform: `translate(${mousePos.x * -24}px, ${mousePos.y * -16}px)`,
                transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              我擅长把模糊需求整理成清晰的产品结构、交互路径和可验证原型。
            </p>
            <div className={`${hasAnimated ? '' : 'hero-text hero-text-delay-2'} flex flex-wrap justify-start gap-3`}>
              {heroTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#ded8d0] px-4 py-2 text-xs uppercase tracking-[0.12em] text-[#5d554e]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

        </div>
      </section>

      <section id="profile" className="relative px-4 py-24 sm:px-6 md:px-8 md:py-44">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-center">
              <div className="overflow-hidden rounded-[8px] border border-[#d7d0c7] bg-[#f8f5ef] shadow-[0_24px_70px_rgba(24,20,16,0.08)]">
                <div className="aspect-[4/5] bg-[#eee9e2]">
                  <motion.img
                    src="/profile/huiteen-portrait.jpg"
                    alt="Huiteen portrait"
                    className="h-full w-full object-cover object-[62%_50%]"
                    initial={{ scale: 1.03 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
              <div className="max-w-3xl space-y-7 self-center text-left text-base leading-8 text-[#444] md:text-lg md:leading-loose">
                <p>
                  我擅长在不确定的需求中快速捕捉核心问题，并围绕用户场景、产品目标与使用路径，建立清晰的设计判断和推进方向。
                </p>
                <p>
                  在项目执行中，我能够将抽象概念转化为具体的产品结构，完成从功能拆解、流程规划、交互原型到视觉界面的完整设计过程。
                </p>
                <p>
                  我关注 AI 工具在灵感发散、视觉探索、原型生成和方案迭代中的应用，也在探索 AIGC 与 Naive Design、Kid Core 等人文感视觉语言的结合。
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <div className="mt-20 md:mt-28">
              <h2
                className="text-[3.6rem] font-semibold leading-none tracking-[-0.04em] text-[#171412] md:text-[7.5rem]"
                style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}
              >
                Education Background
              </h2>

              <div className="mt-10 border-t border-[#ded8d0] pt-10 md:mt-16 md:pt-14">
                <div className="grid gap-12 md:grid-cols-[0.24fr_0.76fr]">
                  <div className="text-left">
                    <p className="text-sm uppercase tracking-[0.22em] text-[#aaa]">2024.9 - 2028.6</p>
                    <h3 className="mt-6 text-3xl font-semibold tracking-[-0.02em] text-[#171412]">
                      广州美术学院
                    </h3>
                    <motion.img
                      src="/profile/gafa-emblem.png"
                      alt="广州美术学院校徽"
                      className="mt-8 h-24 w-24 object-contain"
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>

                  <div className="text-left">
                    <h3 className="text-3xl font-semibold leading-snug tracking-[-0.02em] text-[#171412]">
                      湾区创新学院 · 艺术与科技专业 · 本科
                    </h3>

                    <div className="mt-12 space-y-10 text-base leading-8 text-[#4d463f] md:text-lg">
                      <div>
                        <p className="mb-4 text-sm uppercase tracking-[0.18em] text-[#aaa]">主修课程</p>
                        <p>产品服务与开发、设计研究与定义、数据可视化、系统设计</p>
                      </div>

                      <div>
                        <p className="mb-4 text-sm uppercase tracking-[0.18em] text-[#aaa]">个人成绩</p>
                        <p>
                          学院排名前 <span className="font-semibold text-[#171412]">1%</span>
                        </p>
                      </div>

                      <div>
                        <p className="mb-4 text-sm uppercase tracking-[0.18em] text-[#aaa]">所获荣誉</p>
                        <div className="flex flex-wrap gap-3">
                          {['校级奖学金', '校优秀学生', '创新创业'].map((item) => (
                            <span
                              key={item}
                              className="rounded-full bg-[#f4f1ed] px-5 py-2 text-base text-[#4d463f]"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <div className="mt-16 grid gap-5 md:mt-20 md:grid-cols-2">
            {capabilityHighlights.map((item, index) => (
              <ScrollReveal key={item.title} delay={index * 0.08}>
                <div className="h-full border-t border-[#ded8d0] pt-5 text-left">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#aaa]">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-5 text-2xl font-semibold text-[#171412]">{item.title}</h3>
                  <div className="mt-5 space-y-3 text-base leading-7 text-[#4d463f]">
                    {item.lines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="skills" className="px-6 py-32 md:px-8 md:py-44">
        <div className="mx-auto max-w-[1200px]">
          <SectionHeader
            eyebrow="Methods"
            title="Methods"
            description="能力结构围绕需求识别、产品结构、原型工具和 AIGC 探索展开，强调从模糊想法到可验证方案的完整推进能力。"
            hideEyebrow
          />

          <div className="mt-20 grid gap-x-12 gap-y-16 md:grid-cols-2">
            {skillGroups.map((group, index) => (
              <ScrollReveal key={group.title} delay={index * 0.06}>
                <div>
                  <div className="mb-6 flex items-center gap-5">
                    <span className="text-sm text-[#999]">0{index + 1}</span>
                    <h3 className="text-3xl font-semibold tracking-[-0.03em]">{group.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {group.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[#e5e5e5] px-4 py-2 text-sm text-[#444]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <DrawLine className="mx-auto max-w-[1200px] px-6 md:px-8" />

      <section id="projects" className="px-4 py-24 sm:px-6 md:px-8 md:py-44">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader
            eyebrow="Selected Projects"
            title="Selected Projects"
            hideEyebrow
          />

          <div className="mt-24 space-y-32 md:space-y-44">
            {projects.map((project) => (
              <ProjectArticle key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

      <section id="connect" className="px-6 py-28 md:px-8 md:py-36">
        <div className="mx-auto max-w-[1200px]">
          <DrawLine className="mb-20" />
          <ScrollReveal>
            <div className="grid gap-12 md:grid-cols-[1fr_0.8fr] md:items-end">
              <div>
                <p className="mb-6 text-sm uppercase tracking-[0.32em] text-[#999]">Approach</p>
                <h2
                  className="text-5xl font-semibold leading-tight tracking-[-0.03em] md:text-7xl"
                  style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}
                >
                  设计的不完美感往往透露出真正的<span className="whitespace-nowrap">生命力。</span>
                </h2>
              </div>
              <div className="space-y-6 text-lg leading-loose text-[#444]">
                <p>
                  我对产品体验、交互逻辑、视觉表达和技术实现都保持持续探索的兴趣，具备较强的自主学习能力、工具适应能力和反馈响应能力。
                </p>
                <p>
                  面对早期模糊想法，我能够快速整理逻辑、搭建框架，并将其转化为可以被讨论、测试和优化的设计方案；在项目中也会主动尝试新方法，推动方案更快落地。
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  hideEyebrow = false,
}: {
  eyebrow: string;
  title?: string;
  description?: string;
  hideEyebrow?: boolean;
}) {
  return (
    <ScrollReveal>
      <div className="max-w-4xl text-left">
        {!hideEyebrow && (
          <p className="mb-5 text-sm uppercase tracking-[0.16em] text-[#999] md:mb-6 md:tracking-[0.32em]">
            {eyebrow}
          </p>
        )}
        {title && (
          <h2
            className="text-[3.2rem] font-semibold leading-tight tracking-[-0.03em] md:text-[6.5rem] md:tracking-[-0.045em]"
            style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}
          >
            {title}
          </h2>
        )}
        {description && (
          <p className="mt-6 max-w-3xl text-base leading-8 text-[#555] md:mt-8 md:text-lg md:leading-loose">
            {description}
          </p>
        )}
      </div>
    </ScrollReveal>
  );
}

function ProjectArticle({ project }: { project: Project }) {
  const leadImage = project.images[0];
  const isIcuProject = project.id === 'icu-plus';
  const isSymbiosphereProject = project.id === 'symbiosphere';
  const infoBlocks = project.infoBlocks ?? [
    { label: 'Design Question', body: project.question },
    { label: 'Outcome', body: project.outcome },
  ];
  const galleryImages = project.images
    .slice(1)
    .filter(
      (image, index, images) =>
        image.src !== leadImage.src && images.findIndex((item) => item.src === image.src) === index,
    );

  return (
    <article id={project.id} className="scroll-mt-28">
      <ScrollReveal>
        <div className="grid gap-12 lg:grid-cols-[0.56fr_1.44fr] lg:items-start">
          <aside className="lg:sticky lg:top-28">
            <div className="max-w-md">
              <div className="mb-8 border-b border-[#ece7df] pb-5 text-left md:mb-10 md:pb-6">
                <p className="text-sm uppercase tracking-[0.16em] text-[#aaa] md:tracking-[0.28em]">
                  {project.index}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#8c847d] md:tracking-[0.2em]">
                  {project.group}
                </p>
              </div>

              <p className="mb-4 text-left text-xs uppercase leading-6 tracking-[0.12em] text-[#a49a91] md:mb-5 md:tracking-[0.26em]">
                {project.category}
              </p>
              <h3
                className="text-left text-4xl font-semibold leading-tight tracking-normal md:text-7xl md:tracking-[-0.045em]"
                style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}
              >
                {project.title}
              </h3>
              <p className="mt-5 text-left text-sm uppercase leading-7 tracking-[0.08em] text-[#8a8178] md:mt-6 md:tracking-[0.22em]">
                {project.english}
              </p>

              <dl className="mt-8 space-y-5 text-left text-sm leading-7 text-[#5d554e] md:mt-12">
                <div>
                  <dt className="mb-1 text-xs uppercase tracking-[0.2em] text-[#aaa]">Year</dt>
                  <dd>{project.year}</dd>
                </div>
                <div>
                  <dt className="mb-1 text-xs uppercase tracking-[0.2em] text-[#aaa]">Role</dt>
                  <dd>{project.role}</dd>
                </div>
              </dl>
            </div>
          </aside>

          <motion.div
            className="overflow-hidden rounded-[8px] border border-[#d7d0c7] bg-white shadow-[0_24px_70px_rgba(24,20,16,0.12)]"
            initial={{ opacity: 0, y: 28, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-12% 0px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className={`relative min-h-[280px] overflow-hidden bg-[#eee9e2] ${
                isIcuProject ? 'md:min-h-[620px]' : 'md:min-h-[460px]'
              }`}
            >
              <motion.img
                src={leadImage.src}
                alt={leadImage.title}
                className={`h-full min-h-[280px] w-full object-contain p-4 md:p-8 ${
                  isIcuProject ? 'md:min-h-[620px]' : 'md:min-h-[460px]'
                }`}
                initial={{ scale: 1.04 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/24 via-transparent to-transparent" />
              {isSymbiosphereProject && project.logoImage && (
                <div className="absolute right-5 top-5 rounded-[8px] border border-white/70 bg-white/88 p-4 shadow-[0_16px_44px_rgba(24,20,16,0.14)] backdrop-blur-md">
                  <motion.img
                    src={project.logoImage}
                    alt={`${project.title} logo`}
                    className="h-10 w-auto object-contain md:h-14"
                    initial={{ opacity: 0, y: -8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />
                </div>
              )}
            </div>

            <div className="p-4 text-left sm:p-6 md:p-10 lg:p-12">
              <p className="max-w-4xl text-xl leading-relaxed tracking-normal text-[#1f1c19] md:text-3xl md:tracking-[-0.02em]">
                {project.summary}
              </p>

              <div className="mt-10 grid gap-8 border-t border-[#ece7df] pt-8 md:mt-12 md:grid-cols-2 md:pt-10">
                {infoBlocks.map((block) => (
                  <InfoBlock key={block.label} label={block.label} body={block.body} />
                ))}
              </div>

              <div className="mt-10 border-t border-[#ece7df] pt-8 md:mt-12 md:pt-10">
                <p className="mb-6 text-sm uppercase tracking-[0.24em] text-[#999]">Contribution</p>
                <div className="grid gap-7 md:grid-cols-3">
                  {project.contributions.map((item, index) => (
                    <div key={item} className="text-left text-base leading-8 text-[#4d463f]">
                      <span className="mb-2 block text-sm text-[#aaa]">0{index + 1}</span>
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {galleryImages.length > 0 && (
                <div className="mt-10 border-t border-[#ece7df] pt-8 md:mt-12 md:pt-10">
                  <p className="mb-6 text-sm uppercase tracking-[0.24em] text-[#999]">Visual Evidence</p>
                  <ImageGallery images={galleryImages} />
                </div>
              )}

              {project.video && (
                <div className="mt-10 border-t border-[#ece7df] pt-8 md:mt-12 md:pt-10">
                  <p className="mb-6 text-sm uppercase tracking-[0.24em] text-[#999]">Motion Prototype</p>
                  <VideoPlayer src={project.video} poster={project.poster} />
                </div>
              )}

              {project.links && (
                <div className="mt-10 border-t border-[#ece7df] pt-8 md:mt-12 md:pt-10">
                  <p className="mb-3 text-sm uppercase tracking-[0.24em] text-[#999]">Online Access</p>
                  <p className="mb-6 text-sm leading-7 text-[#666]">
                    这个项目有可跳转的在线页面，可以直接打开查看网页原型或交互版本。
                  </p>
                  <div className="grid gap-3 sm:flex sm:flex-wrap">
                    {project.links.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex min-h-12 flex-col items-start justify-center gap-1 rounded-[6px] border border-[#d8d1c8] bg-[#f8f5ef] px-4 py-3 text-left text-sm font-medium text-[#1f1c19] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#171412] hover:bg-[#171412] hover:text-white hover:shadow-[0_14px_34px_rgba(24,20,16,0.16)] sm:flex-row sm:items-center sm:justify-between sm:gap-5"
                      >
                        <span>{link.label}</span>
                        <span className="text-xs uppercase tracking-[0.16em] opacity-60 transition-opacity group-hover:opacity-80">
                          点击打开 -&gt;
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </ScrollReveal>
    </article>
  );
}

function InfoBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="mb-4 text-sm uppercase tracking-[0.24em] text-[#999]">{label}</p>
      <p className="text-base leading-8 text-[#555]">{body}</p>
    </div>
  );
}
