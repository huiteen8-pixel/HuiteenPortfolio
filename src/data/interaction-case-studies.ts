import type { CampusStudy, CaseAsset } from './campus-case-studies';
const mood = (file: string, width: number, height: number, title: string, caption?: string): CaseAsset => ({ src: `/projects/moodlens/hd/${file}.webp`, width, height, title, caption });
const lens = (file: string, width: number, height: number, title: string, caption?: string): CaseAsset => ({ src: `/projects/emotional-lens/hd/${file}.webp`, width, height, title, caption });
const table = (file: string, width: number, height: number, title: string, caption?: string): CaseAsset => ({ src: `/projects/digital-table/hd/${file}`, width, height, title, caption });

export const interactionStudies: Record<string, CampusStudy> = {
  moodlens: {
    title: ['Emotional Map', 'Clarity, in context.'],
    subtitle: '情绪地图 · 面向职场与通勤情境的信息减负概念', accent: '#a36c69', directImages: true,
    cover: mood('design-background', 1680, 946, '情绪地图设计背景与信息过载主视觉'),
    chapters: [
      {
        id: 'mood-context', title: ['More information.', 'Less clarity.'],
        lead: '当人已经承受压力，更多信息不一定带来更好的支持。',
        copy: [
          '通勤、会议、消息提醒与任务切换构成了职场人一天中的连续情境。当界面同时强调所有内容，用户需要在时间压力和情绪变化之中反复筛选，才能找到此刻真正需要的信息。',
          '情绪地图从这一矛盾出发，探索让服务根据当下状态改变信息呈现的方式。设计关注的不只是内容是否完整，还包括用户现在能够理解多少、需要多快做出决定，以及哪一步最值得被突出。',
        ],
        layout: 'full', images: [mood('design-background', 1680, 946, '情绪地图设计背景与信息过载情境', 'Context / 把密集提醒、任务与通勤压力放回同一个情境。')],
      },
      {
        id: 'mood-scenarios', title: ['Follow the day.', 'Find the pressure.'],
        lead: '先理解状态与场景如何变化，再决定系统何时介入。',
        copy: [
          '项目以职场角色与广州通勤情境作为设计假设，梳理从出发、换乘到抵达和恢复平静的状态变化。角色画像、情绪情境地图和用户故事用于定位信息负担可能出现的位置。',
          '角色与情境框架为原型定义了不同的回应方向：高压时需要少而明确的信息，移动与切换中需要清晰路径，恢复阶段则可以重新开放环境与探索内容。',
        ],
        layout: 'stack', images: [
          mood('user-research', 1682, 940, '职场角色与广州情绪情境地图', 'Research Framing / 角色、需求和情境的设计假设。'),
          mood('scenario-story', 3200, 1801, '情绪地图用户情景故事', 'Scenario / 沿着一天中的行动，寻找信息负担与介入时机。'),
        ],
      },
      {
        id: 'mood-reduction', title: ['Reduce the noise.', 'Reveal the next step.'],
        lead: '信息减负的核心，是让重要内容在正确时刻被看见。',
        copy: [
          '设计将完整的信息视图与情境化的简化界面进行对照。高负荷时减少并列选择和次要内容，把当前目的地、路线变化、时间与关键提醒放到更明确的位置。',
          '这种调整不要求用户先阅读全部信息再自行排序，而是让界面主动形成阅读优先级。较轻的视觉层级、留白和单一行动入口，共同表达当前最值得完成的下一步。',
        ],
        layout: 'full', images: [mood('information-load-reduction', 3200, 1801, '情绪地图信息减负前后对比', 'Information Design / 从内容堆叠到情境化的阅读顺序。')],
      },
      {
        id: 'mood-system', title: ['Sense the context.', 'Adjust the response.'],
        lead: '把状态判断转化为内容、层级与节奏的调整规则。',
        copy: [
          '系统框架把输入、状态判断、响应模式、自适应输出和体验结果串成一条路径。时间、位置与当前任务提供情境线索，响应规则决定哪些内容优先、哪些内容暂时退后。',
          '框架进一步把抽象的状态变化转化为界面决策：信息应该更少还是更完整，提示应该更突出还是更轻，以及用户如何理解并控制当前模式。',
        ],
        layout: 'full', images: [mood('system-evolution', 3200, 1801, '情绪地图系统输入、判断与输出框架', 'System / 从情境线索到界面响应的设计关系。')],
      },
      {
        id: 'mood-modes', title: ['Three states.', 'Three ways to help.'],
        lead: '从高负荷，到行动切换，再到恢复平静。',
        copy: [
          '方案将响应整理为三种模式。高负荷模式压低信息密度，突出时间敏感的提醒；切换模式聚焦路线、换乘与当前任务；恢复模式放缓节奏，开放环境与探索内容。',
          '三种模式以不同的信息密度、层级、节奏和内容行为表达状态差异。它们是同一服务在不同情境下的呈现方式，用户仍需要能够理解并控制这些变化。',
        ],
        layout: 'full', images: [mood('response-modes', 3200, 1801, '高负荷、切换与恢复三种情绪响应模式', 'Response Modes / Overload · Transition · Recovery。')],
      },
      {
        id: 'mood-interface', title: ['One principle.', 'Across touchpoints.'],
        lead: '让桌面、空间与手机共同表达适合当下的信息量。',
        copy: [
          '最终界面把前面的响应规则放进桌面屏幕、空间显示与移动端场景。每一种载体围绕自己的使用距离和行动状态组织信息，同时保持柔和色调与轻量层级。',
          '项目完成的是信息减负与情境响应的界面概念。后续需要以具体任务检查阅读效率、遗漏风险与用户控制感，判断这些变化是否真正减少负担。',
        ],
        layout: 'full', images: [mood('final-interface', 3200, 1801, '情绪地图跨触点界面设计', 'Interface / 将同一套响应原则落实到不同使用场景。')],
      },
    ],
    reflection: {
      title: ['Design the amount.', 'Not just the content.'],
      body: '情绪地图把“给用户什么”进一步转化为“此刻给多少”。通过情境、状态与信息层级之间的联系，尝试让工作与出行服务提供更清晰、更低负担的下一步。',
      deliverables: '角色与场景框架；情绪情境地图；用户情景故事；信息减负对比；系统框架；三种响应模式与跨触点界面。',
      next: '开展真实用户研究与任务测试，验证状态判断、信息遗漏风险和减负效果，并明确数据授权与用户手动控制方式。',
    },
  },
  'emotional-lens': {
    title: ['Emotional Lens', 'Services that listen.'],
    subtitle: '情绪透镜 · 面向当下状态的思辨性服务概念', accent: '#cb5b45', directImages: true,
    cover: lens('01', 2400, 1511, 'Emotional Lens 概念网页首页'),
    chapters: [
      {
        id: 'lens-context', title: ['Beyond a profile.', 'Toward a moment.'],
        lead: '用户画像相对稳定，人的情绪与承受能力却持续变化。',
        copy: [
          'Emotional Lens 从服务设计的趋势讨论切入：当系统逐渐具备个性化能力，仍然需要面对同一个用户在不同时刻可能具有完全不同的注意力与交互意愿。',
          '项目把这一问题转化为一个思辨性方向：服务能否回应此刻的状态，而不只依据长期画像推荐更多内容？趋势时间线与问题定义是概念的推导材料，用来建立后续设计的讨论范围。',
        ],
        layout: 'pair', images: [
          lens('02', 2400, 1499, '服务设计趋势与时间线', 'Trend / 从服务发展讨论中提出状态响应的切入点。'),
          lens('03', 2400, 1499, 'Emotional Lens 议题与问题定义', 'Definition / 把情绪状态带入服务机制的讨论。'),
        ],
      },
      {
        id: 'lens-problem', title: ['A useful service.', 'At the wrong time.'],
        lead: '即使服务有用，也可能在错误的时机增加交互负担。',
        copy: [
          '通知、建议和任务入口通常以完成服务为目标，却不一定知道用户此刻是否愿意接收。项目通过案例和问题卡片，讨论信息量、介入时机与情绪承受能力之间的关系。',
          '设计问题因此从“还能提供什么”转向“现在是否应该提供，以及以什么方式提供”。系统的回应需要与用户的状态和意愿共同决定，避免把情绪感知变成新的打扰。',
        ],
        layout: 'full', images: [lens('04', 2400, 1470, '服务可以回应的问题与案例卡片', 'Problem / 以案例讨论服务介入的时机与负担。')],
      },
      {
        id: 'lens-concept', title: ['An emotional lens.', 'An explicit agreement.'],
        lead: '理解状态的设想，需要和用户授权放在一起讨论。',
        copy: [
          '项目提出 Emotional Lens 与 Emotional Agreement 两个概念。透镜象征服务理解当下状态的判断层，协议则把识别和响应放回用户授权的关系之中；可穿戴设备作为概念中的输入触点被纳入讨论。',
          '情绪协议强调用户对服务介入的决定权：能够知道系统正在使用什么信息、为何调整服务，也能够拒绝或撤回。网页用可穿戴设备和协议卡片，让这种抽象关系有了具体的讨论对象。',
        ],
        layout: 'full', images: [lens('06', 2400, 1471, '可穿戴设备与情绪协议概念卡片', 'Concept / Wearable devices · Emotional agreement。')],
      },
      {
        id: 'lens-mechanism', title: ['From a signal.', 'To a considered response.'],
        lead: '把抽象的“理解情绪”，拆成可讨论的服务步骤。',
        copy: [
          '服务机制以 Input、Examine、Classify 与 Send out Answer 组织判断过程：输入线索进入系统，经过理解与分类，最后转化为服务回应。图示强调的是各环节之间的关系。',
          '回应可以体现在信息密度、提醒时机或交互路径的变化上。未来若进入开发，每个环节都需要明确输入边界、判断依据与错误处理，而不能把情绪标签直接当作事实。',
        ],
        layout: 'full', images: [lens('05', 2400, 1496, '输入、判断、分类与回应的服务机制', 'Mechanism / Input → Examine → Classify → Send out Answer。')],
      },
      {
        id: 'lens-scenarios', title: ['Make the idea', 'part of everyday life.'],
        lead: '通过日常场景，让概念从机制图走向可以想象的体验。',
        copy: [
          '网页以街道、房间和日常活动的草图串联场景，用卡片与箭头说明服务可能如何与人的行动发生关系。手写标题、便签和珊瑚橙视觉语言使复杂机制保持可接近的讨论感。',
          '最后的情绪透镜图像收束了这一设想：把模糊的当下感受转化为系统能够讨论的回应条件。在线网页是概念的展示载体，体验是否合适仍需要通过场景原型和用户反馈检验。',
        ],
        layout: 'stack', images: [
          lens('07', 2400, 1500, '日常服务场景与手绘叙事', 'Scenarios / 用日常情境说明服务可能如何回应。'),
          lens('08', 2400, 1480, 'Emotional Lens 情绪透镜概念收束', 'Vision / 从情绪状态到服务回应的概念表达。'),
        ],
      },
    ],
    reflection: {
      title: ['Listen with care.', 'Respond with permission.'],
      body: 'Emotional Lens 把情绪理解和服务介入放在同一个问题里：好的回应既需要对当下保持敏感，也需要尊重用户是否愿意被理解、被提醒和被服务。',
      deliverables: '趋势与议题梳理；情绪透镜与情绪协议概念；服务机制图；日常场景叙事；手写视觉系统与概念网页。',
      next: '通过可操作的场景原型验证介入时机、授权理解与用户控制感，再讨论状态推断和服务调节的实现方式。',
    },
  },
  'digital-table': {
    title: ['The Table', 'Together, apart.'],
    subtitle: '数字餐桌 · 关于数字连接与真实疏离的交互叙事', accent: '#95633e', directImages: true,
    cover: table('scene-cover.svg', 1405, 650, '数字餐桌核心场景与项目标题'),
    chapters: [
      {
        id: 'table-context', title: ['Around one table.', 'Somewhere else.'],
        lead: '当屏幕出现在餐桌，我们咀嚼的是数据，还是情感？',
        copy: [
          '共餐原本让人共享时间、空间与注意力。数字餐桌把这一日常场景视为关系发生的微型社会，通过数字信息逐渐进入餐桌的过程，讨论虚拟连接如何改变真实的共同在场。',
          '项目以低多边形人物、3D 场景与交互叙事构建体验。完整展板汇集概念、视觉、叙事和机制，下面再按体验顺序展开，让每一次空间变化都对应关系的变化。',
        ],
        layout: 'full', images: [table('02-frame.webp', 2600, 1840, '数字餐桌完整项目展板', 'Overview / 完整保留概念、场景、叙事与交互机制。')],
      },
      {
        id: 'table-narrative', title: ['A shared meal.', 'A gradual disappearance.'],
        lead: '让关系的疏离，通过一段可以被观看的空间变化发生。',
        copy: [
          '体验按五个阶段推进：真实共餐建立温暖而专注的关系；数字侵入把通知带入现场；信息挤压使屏幕占据共享空间；实体消散让人物与环境逐渐失去明确边界；回归反思重新把注意力交还彼此。',
          '每个阶段都通过场景、光线和信息层的变化表达情绪。观众看到的不只是屏幕数量增加，更是原本可以交流的空间如何一步步被占据。',
        ],
        layout: 'full', images: [table('experience-sequence.svg', 2600, 445, '数字餐桌五阶段体验叙事细节', 'Narrative Detail / 共餐 → 侵入 → 挤压 → 消散 → 反思；来自完整展板的叙事区域。')],
      },
      {
        id: 'table-mechanism', title: ['A change in attention.', 'A change in space.'],
        lead: '把拿起手机、低头与消息提醒，转化为场景的回应。',
        copy: [
          '交互框架把手机使用、视线变化和消息提醒等行为放在输入端，经由注意力关系的判断，驱动光线、色彩、空间、人物和界面的变化。这是展板所提出的交互设计路径。',
          '暖色、木材与共餐灯光对应现实关系，冷色、屏幕与数字瀑流表达信息侵入。黑白化、模糊和空间压缩进一步放大失联感，让抽象的注意力转移成为可感知的视觉叙事。',
        ],
        layout: 'pair', images: [
          table('visual-language.svg', 1155, 715, '数字餐桌色彩、构图与材质语言细节', 'Visual Detail / 暖色现实与冷色数字空间的对照。'),
          table('interaction-mechanism.svg', 585, 715, '数字餐桌输入与场景转化机制细节', 'Interaction Detail / 行为输入、注意力关系与视觉场景响应。'),
        ],
      },
      {
        id: 'table-exhibition', title: ['From a scene.', 'To a public conversation.'],
        lead: '通过展示材料，把关于在场与注意力的问题带到现场。',
        copy: [
          '现有档案包含线上展示页面、论坛现场记录与展览证书。它们分别承载作品的公开介绍、现场讨论和展示归档，为项目的展示过程提供不同视角。',
          '从展板的结构化说明到现场的影像呈现，同一个问题通过不同尺度被展开：人们如何从视觉场景中感受到关系的变化，又如何重新理解自己的屏幕使用习惯。',
        ],
        layout: 'pair', images: [
          table('01-hero.webp', 2400, 2400, '数字餐桌线上展示页面档案', 'Archive / 线上展示页面与项目介绍。'),
          table('03-forum.webp', 2200, 1649, '数字餐桌论坛现场展示记录', 'Archive / 文件夹中保留的论坛现场照片。'),
        ],
      },
      {
        id: 'table-record', title: ['Keep the record.', 'Keep the question open.'],
        lead: '保留展示档案，也保留进一步体验和讨论的空间。',
        copy: [
          '展板、线上介绍、现场交流与证书共同构成项目的展示记录。通过这些载体，作品从单个 3D 场景扩展为围绕数字共处展开的公共讨论。',
          '下一步需要验证的是行为与反馈是否容易理解，以及观众是否能从空间变化中感知注意力和共同在场的关系，而不仅是被屏幕与视觉效果吸引。',
        ],
        layout: 'ecosystem', images: [table('04-certificate.webp', 1558, 2200, '数字餐桌现有展览证书档案', 'Documentation / 展览证书与项目展示记录。')],
        notes: { eyebrow: 'Exhibition archive', title: '让材料说明过程，\n让体验承载问题。', items: [
          { title: '01 / 项目展板', body: '保留完整的概念、体验叙事、视觉和交互框架。' },
          { title: '02 / 展示记录', body: '以线上页面、现场照片与证书归档已有展示材料。' },
          { title: '03 / 后续体验', body: '通过观众参与继续检验叙事理解与行为反馈的关系。' },
        ] },
      },
    ],
    reflection: {
      title: ['Reclaim the table.', 'Reconnect with each other.'],
      body: '数字餐桌将注意力转移转化为空间与关系的变化。作品最终把问题留给观众：当数字连接不断增加，我们是否仍然拥有与彼此共同在场的时间？',
      deliverables: '3D 场景与批判性叙事；五阶段体验顺序；色彩、材质与空间语言；交互机制框架；完整展板与展示档案。',
      next: '继续打磨行为输入与场景反馈的对应关系，通过观众体验检验叙事是否清晰，以及作品如何引发对真实共处的反思。',
    },
  },
};

export const interactionPreviews: Record<string, [CaseAsset, CaseAsset]> = {
  moodlens: [interactionStudies.moodlens.cover, mood('response-modes', 3200, 1801, '情绪地图三种响应模式')],
  'emotional-lens': [interactionStudies['emotional-lens'].cover, lens('07', 2400, 1500, 'Emotional Lens 日常服务场景')],
  'digital-table': [interactionStudies['digital-table'].cover, { src: '/home/previews/digital-table-imprisoned.png', width: 374, height: 210, title: '数字餐桌 The table — Imprisoned invisibly' }],
};
