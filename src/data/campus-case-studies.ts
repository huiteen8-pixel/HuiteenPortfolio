export type CaseAsset = { src: string; width: number; height: number; title: string; caption?: string };
export type CaseChapter = {
  id: string; title: [string, string]; lead: string; copy: string[];
  layout: 'full' | 'pair' | 'ecosystem' | 'stack' | 'phones';
  images: CaseAsset[];
  notes?: { eyebrow: string; title: string; items: { title: string; body: string }[] };
};
export type CampusStudy = {
  title: [string, string]; subtitle: string; accent: string; cover: CaseAsset; directImages?: boolean;
  chapters: CaseChapter[];
  reflection: { title: [string, string]; body: string; deliverables: string; next: string };
};
const bio = (file: string, width: number, height: number, title: string, caption?: string): CaseAsset => ({ src: `/projects/symbiosphere/${file}`, width, height, title, caption });
const gafa = (file: string, width: number, height: number, title: string, caption?: string): CaseAsset => ({ src: `/projects/gafa/${file}`, width, height, title, caption });

export const campusStudies: Record<string, CampusStudy> = {
  symbiosphere: {
    title: ['Bio Campus', 'Life, connected.'], subtitle: '万物链 · 校园生态数字导览与互动平台', accent: '#456c1b',
    cover: bio('hd/website-overview.webp', 5736, 3226, '万物链网页端与品牌视觉总览'),
    chapters: [
      {
        id: 'bio-context', title: ['Nature is close.', 'Discovery is missing.'],
        lead: '从每天经过的自然景观，到愿意停下来认识的校园生态。',
        copy: [
          '校园中的植物、动物与栖息地就在日常路径里，但相关信息分散在不同入口。学生和访客能够看见自然，却不容易继续了解它、记录它，或把一次观察分享给其他人。',
          '万物链以校园为具体场景，提出一个连接生态信息与公众参与的概念平台：用网页建立入口，以移动端支持探索，再通过互动任务把短暂的好奇转化为持续的观察。',
        ],
        layout: 'ecosystem',
        images: [bio('hd/brand-system.webp', 2559, 2559, 'Bio Campus 品牌主张与视觉识别', 'Brand / 以统一视觉连接校园生态内容与探索入口。')],
        notes: { eyebrow: 'A shared campus ecology', title: '让发现、记录与传播\n连接到同一个入口。', items: [
          { title: '01 / 学生与访客', body: '从身边的自然对象进入，了解物种，选择探索路径。' },
          { title: '02 / 校园生态内容', body: '把物种、栖息地与空间信息组织成可阅读、可浏览的内容。' },
          { title: '03 / 参与与反馈', body: '通过观察记录与分享补充内容，让个人探索连接公共知识。' },
        ] },
      },
      {
        id: 'bio-system', title: ['One observation.', 'A connected loop.'],
        lead: '先梳理信息如何产生和流动，再决定每个界面的任务。',
        copy: [
          '系统逻辑围绕「发现 → 识别 → 了解 → 收藏 → 分享」展开。校园自然对象是探索的起点，物种内容承担解释，互动入口则让用户继续记录和传播。',
          '概念闭环把用户提供的信息、平台内容与反馈机制放在一起考虑。内容采集、专业审核和更新责任是后续运营需要解决的部分，当前方案主要展示这些环节之间的设计关系。',
        ],
        layout: 'full', images: [bio('04-business-loop.png', 2400, 1358, '万物链概念闭环与平台关系', 'System Loop / 内容、用户行为与反馈机制的关系。')],
      },
      {
        id: 'bio-website', title: ['Start with a view.', 'Stay for a discovery.'],
        lead: '让网页成为理解项目、浏览内容和进入探索的连续入口。',
        copy: [
          '网页端从校园场景与品牌介绍开始，逐步展开服务模块、观察记录与生态探索内容。图片卡片和模块化信息把抽象的生态议题转化成可进入的具体对象。',
          '页面的阅读顺序对应从认识平台到选择行动的过程：先说明这里有什么，再展示可以如何探索，最后把用户带向记录与参与。绿色视觉语言贯穿品牌与内容，让不同模块保持同一个平台的识别感。',
        ],
        layout: 'ecosystem', images: [bio('hd/website-complete.webp', 2511, 9558, '万物链完整网页长页', 'Website / 原始完整长页，保留全部内容与上下文。')],
        notes: { eyebrow: 'Website experience', title: '沿着阅读顺序，\n建立探索的动机。', items: [
          { title: '01 / 认识平台', body: '以校园自然场景和品牌主张建立第一印象。' },
          { title: '02 / 浏览服务与内容', body: '通过服务模块、自然观察和生态内容理解平台能力。' },
          { title: '03 / 进入探索', body: '把浏览兴趣引向地图、物种信息和后续互动入口。' },
        ] },
      },
      {
        id: 'bio-mobile', title: ['From browsing.', 'To exploring.'],
        lead: '把网页里的内容，带回用户正在行走的校园。',
        copy: [
          '移动端围绕物种详情、社区、识别、分享和探索地图组织入口，让用户能够在真实场景中继续查看内容，而不只停留在网页介绍。',
          '引导页面将数据收集、栖息地选择和物种信息串联起来。这里展示的是概念原型中的操作路径，用于说明不同页面如何接力完成一次探索。',
        ],
        layout: 'stack', images: [
          bio('hd/mobile-flow.webp', 1747, 683, '物种详情、社区、识别、分享与探索地图', 'Mobile / 从内容浏览到探索行动的五个入口。'),
          bio('hd/mobile-onboarding.webp', 1883, 1059, '移动端探索引导与栖息地场景', 'Onboarding / 让用户理解如何进入校园生态探索。'),
        ],
      },
      {
        id: 'bio-ar', title: ['Meet the species.', 'In its own habitat.'],
        lead: '用识别与 AR 交互，让数字内容回应身边的自然。',
        copy: [
          'AR 交互方案把扫描识别、实景二维码与不同生态场景连接起来。用户从线下对象出发，进入对应的物种内容，并获得进一步了解栖息地的入口。',
          '这一部分用于探索数字导览与现场体验如何衔接。识别准确性、生态数据质量与实际场景中的使用效果，仍需要在后续试点中验证。',
        ],
        layout: 'full', images: [bio('02-interaction.png', 2400, 1349, '万物链 AR 交互与线下二维码触点', 'AR Interaction / 扫描、实景触点与生态场景的连接方式。')],
      },
      {
        id: 'bio-prototype', title: ['Follow the flow.', 'See the interaction.'],
        lead: '把概念关系，放进一段段可以观看的操作流程。',
        copy: [
          'App 延展动图分别展示生物生长收集入口、栖息地选择、扫描识别与物种详情。它们补充了静态界面之间的过渡，说明用户如何从选择场景进入具体内容。',
          '这些动效与网页、移动端共同构成项目的概念原型。当前版本重点在信息组织、视觉表达与交互路径，持续参与机制及生态内容共建仍需真实运营验证。',
        ],
        layout: 'phones', images: [
          bio('app-extension-01.gif', 526, 1138, '生物生长收集入口动效', '01 / 收集入口'),
          bio('app-extension-02.gif', 526, 1138, '栖息地选择动效', '02 / 栖息地选择'),
          bio('app-extension-03.gif', 526, 1138, '扫描识别动效', '03 / 扫描识别'),
          bio('app-extension-04.gif', 526, 1138, '物种详情动效', '04 / 物种详情'),
        ],
      },
    ],
    reflection: {
      title: ['Discovery becomes', 'a connection.'],
      body: '万物链尝试把校园自然从日常背景转化为可被认识、记录与分享的内容。设计的重点，是让一次发现有清晰的下一步，也让不同终端共同承载一条连续的探索路径。',
      deliverables: '校园生态平台信息架构；网页与移动端界面；品牌视觉延展；AR 交互方案；App 操作动效与概念闭环。',
      next: '进一步明确生态内容的专业审核与更新机制，通过校园试点验证识别体验、内容质量和持续参与意愿。',
    },
  },
  'gafa-wayfinding': {
    title: ['GAFA', 'Find your way.'], subtitle: '广州美术学院 · 校园路标改良与线上导览系统', accent: '#a87a16',
    cover: gafa('hd/offline-online-guide.webp', 3200, 1982, 'GAFA 校园导览系统：实体标识与移动端总览'),
    chapters: [
      {
        id: 'gafa-context', title: ['A place to go.', 'An unclear way.'],
        lead: '找路的困难，往往发生在地图与下一块标识之间。',
        copy: [
          '对于第一次进入校园的新生与访客，知道目的地名称并不意味着知道如何抵达。当前位置、楼栋关系、楼层信息和沿途指引如果不能相互衔接，用户就需要不断停下来重新判断。',
          '项目把找路过程中的问题归纳为四类：信息层级混乱、识别性地标不足、方向感缺失与指引系统不连续。改良目标由单块标牌的视觉调整，转向一条可以持续跟随的信息路径。',
        ],
        layout: 'full', images: [gafa('hd/background-problem.webp', 3200, 671, '校园导览的四类问题与断点', 'Background / 信息层级、地标识别、方向判断与指引连续性。')],
      },
      {
        id: 'gafa-users', title: ['Different users.', 'The same uncertainty.'],
        lead: '把新生与在校学生的找路情境，放回具体的校园生活。',
        copy: [
          '用户画像与使用情境展示了不同熟悉度下的信息需求：新生需要先建立对校园的整体认知，在校学生则可能需要快速找到某个楼栋、教室或临时查询的地点。',
          '从报到、寻找教室到跨楼栋移动，项目关注用户在哪里产生疑问，以及在那个位置应该先看到哪一层信息。画像和情境图作为设计推导材料，用于确定导览内容的组织方式。',
        ],
        layout: 'pair', images: [
          gafa('hd/personas-original.webp', 1809, 2139, '新生与在校学生用户画像原图', 'Persona / 不同熟悉度下的目标与找路困扰。'),
          gafa('hd/user-journeys-original.webp', 1506, 924, '用户画像与校园找路情境原图', 'Scenario / 把信息需求放回一周中的校园使用情境。'),
        ],
      },
      {
        id: 'gafa-hierarchy', title: ['Read the campus.', 'One level at a time.'],
        lead: '先建立校区、楼栋、楼层和房间之间的层级，再设计标识。',
        copy: [
          '导览信息按校区级、楼栋级、楼层级与房间级逐层展开。用户在每个位置只需要先确认当前层级，再找到通向下一级的方向，减少所有信息同时出现带来的判断负担。',
          '字体、图标、箭头与黑白灰层级构成统一的阅读语言，黄色用于强调关键内容。楼栋字母、楼层编号与房间方向在不同载体上保持关联，让标识之间能够接续。',
        ],
        layout: 'ecosystem', images: [gafa('hd/floor-directory-signage.webp', 3200, 2133, 'GAFA 楼层索引与导视标识设计', 'Signage / 楼栋、楼层、房间与功能图标的统一表达。')],
        notes: { eyebrow: 'A consistent information hierarchy', title: '从整体定位，\n走向具体目的地。', items: [
          { title: '01 / 校区与楼栋', body: '确认所在位置、建筑关系与下一步方向。' },
          { title: '02 / 楼层', body: '通过楼层编号与索引缩小目的地范围。' },
          { title: '03 / 房间与功能', body: '用房间编号、功能图标和方向箭头完成最后一段指引。' },
        ] },
      },
      {
        id: 'gafa-connection', title: ['See the sign.', 'Continue on screen.'],
        lead: '让实体标识承担快速判断，让手机承接进一步查询。',
        copy: [
          '实体标识适合在空间中提供即时的方向线索，但能够承载的信息量有限。二维码入口与移动端页面补充楼栋、楼层和房间查询，让用户在需要时继续深入。',
          '线上与线下使用同一套信息层级：从看见标识、确认位置，到进入页面、寻找房间，再回到真实空间继续行动。系统总览把平面导览、标牌与手机界面放在一起，展示这条衔接路径。',
        ],
        layout: 'full', images: [gafa('hd/offline-online-guide.webp', 3200, 1982, '平面导览、实体标识与手机界面的系统关系', 'Connected Guide / 从空间标识到楼层与房间查询。')],
      },
      {
        id: 'gafa-prototype', title: ['A proposed system.', 'A working prototype.'],
        lead: '用线上导览原型，检查信息层级能否转化为具体操作。',
        copy: [
          'GAFA 1.0 与 2.0 的 Web 原型分别作为校园导览与楼层查询的体验入口。它们把标识系统中的信息组织方式延展到手机页面，让方案能够通过操作进行讨论。',
          '这一阶段完成的是校园导视提案与线上原型。实体标识的实际落地、现场可读距离和找路效率，需要通过真实空间中的观察与测试继续验证。',
        ],
        layout: 'full', images: [],
      },
    ],
    reflection: {
      title: ['Good directions.', 'A continuous journey.'],
      body: 'GAFA 路标改良系统关注的不只是一块标牌，而是标识之间能否连成一条路。通过统一的信息层级和线上线下入口，让用户在每次转向之前，都能找到继续前进的线索。',
      deliverables: '校园导览问题梳理；用户画像与找路情境；分层导视与功能图标；二维码入口规划；移动端页面与 Web 原型。',
      next: '在现场验证识别距离、路口决策和指引连续性，结合新生与访客的实际找路任务调整信息层级与部署位置。',
    },
  },
};
