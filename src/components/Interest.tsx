'use client';

import { useState, useEffect } from 'react';

const COS_BASE = 'https://web-resource-1372876299.cos.ap-guangzhou.myqcloud.com/RenRuiWebResume';

const GAME_DATA = {
  totalHours: '4000+',
  totalGames: '300+',
  platforms: ['手机', 'PC', '游戏主机', '复古游戏主机', 'VR'],
  quotes: [
    {
      en: 'On my business card, I am a corporate president.\nIn my mind, I am a game developer.',
      zh: '在我的名片上，我是公司总裁。\n在我心里，我是一个游戏开发者。',
      author: '岩田聪',
      title: 'Nintendo'
    },
    {
      en: '"Games should be something that people can enjoy with their eyes, ears, and hands."',
      zh: '"游戏是一种能让人用眼睛、耳朵和双手一起享受的东西。"',
      author: '小岛秀夫',
      title: 'Kojima Productions'
    },
    {
      en: 'Games are an art form that lets you participate.',
      zh: '游戏是一种让你参与其中的艺术形式。',
      author: 'Gabe Newell',
      title: 'Valve'
    },
    {
      en: 'Focus on making your game fun, rather than making it look like other successful games.',
      zh: '专注于让你的游戏有趣，而不是让它看起来像其他成功的游戏。',
      author: '约翰·卡马克',
      title: 'id Software'
    },
    {
      en: 'My game design philosophy is simple: make players smile.',
      zh: '我的游戏设计理念很简单：让玩家微笑。',
      author: '宫本茂',
      title: 'Nintendo'
    },
    {
      en: 'Games are a series of learning experiences.',
      zh: '游戏是学习体验的系列。',
      author: '席德·梅尔',
      title: '文明系列'
    },
    {
      en: 'Whether it is fun matters more than whether it has bugs.',
      zh: '一个游戏好不好玩，比它有没有bug更重要。',
      author: '宫本茂',
      title: 'Nintendo'
    },
    {
      en: 'Games are a way for players to experience failure in a safe environment so they can learn to succeed in real life.',
      zh: '游戏是一种让玩家在安全环境中体验失败的方式，这样他们就能学会如何在现实中成功。',
      author: '威尔·赖特',
      title: 'SimCity / 模拟人生'
    },
    {
      en: 'The goal is to make players feel like they are living in another world, rather than controlling a character.',
      zh: '目标是让玩家感觉像是活在另一个世界里，而不是在操控一个角色。',
      author: '蒂姆·谢弗',
      title: 'Valve / 半条命'
    }
  ],
  topGames: [
    { name: 'GTA5', hours: '800+', tags: ['开放世界', '动作冒险'] },
    { name: '塞尔达传说系列', hours: '250+', tags: ['动作冒险', '开放世界'] },
    { name: 'PUBG', hours: '200+', tags: ['TPS', '大逃杀'] },
    { name: '巫师3', hours: '150+', tags: ['RPG', '开放世界'] },
    { name: '逆转裁判系列', hours: '150+', tags: ['推理', 'AVG'] },
    { name: '死亡搁浅', hours: '100+', tags: ['开放世界', '动作冒险'] },
    { name: '赛博朋克2077', hours: '100+', tags: ['RPG', '城市开放世界'] },
    { name: '女神异闻录5R', hours: '90+', tags: ['JRPG'] },
  ],
  otherHighlights: [
    { name: '动物森友会', hours: '150+', note: '生活模拟' },
    { name: '逆战', hours: '150+', note: 'FPS' },
    { name: '半衰期系列', hours: '100+', note: 'FPS + VR' },
    { name: 'GT赛车7', hours: '100+', note: '模拟驾驶' },
    { name: '最后生还者', hours: '80+', note: '动作冒险' },
    { name: '明日方舟', hours: '80+', note: '策略RPG' },
  ]
};

interface CardData {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  img: string;
}

const INTEREST_CARDS: CardData[] = [
  { id: 'games', emoji: '🎮', title: '电子游戏', desc: '在虚拟世界中寻找真实的感动', img: `${COS_BASE}/images/interest/games/cover.webp` },
  { id: 'movies', emoji: '🎬', title: '电 影', desc: '光影之间的故事', img: `${COS_BASE}/images/interest/movies/cover.jpg` },
  { id: 'music', emoji: '🎵', title: '音 乐', desc: '旋律是最好的语言', img: `${COS_BASE}/images/interest/music/cover.png` },
  { id: 'photography', emoji: '📷', title: '摄 影', desc: '定格瞬间，收藏记忆', img: `${COS_BASE}/images/interest/photography/cover.jpg` },
  { id: 'cars', emoji: '🏎️', title: '汽 车', desc: '速度与自由的象征', img: `${COS_BASE}/images/interest/cars/cover.png` },
];

export default function Interest() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleExpand = (id: string) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setExpandedId(id);
    setTimeout(() => setIsTransitioning(false), 1000);
  };

  const handleClose = () => {
    if (isTransitioning) return;
    const element = document.getElementById('interest');
    if (element) {
      const offset = 0; // Flush at top below dock
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setIsTransitioning(true);
    setExpandedId(null);
    setTimeout(() => setIsTransitioning(false), 1000);
  };

  const getLayout = () => {
    if (expandedId) {
      return { cols: 'grid-cols-1', showExpanded: true };
    }
    return { cols: 'grid-cols-5', showExpanded: false };
  };

  const { cols, showExpanded } = getLayout();

  return (
    <section id="interest" className="py-32 px-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-12">
          <h2 className="text-[clamp(2rem,6vw,5rem)] font-bold text-[#1a1a1a] leading-[1]" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
            Interest
          </h2>
        </div>

        {/* 顶部大卡片 */}
        <div className={`grid grid-cols-2 gap-6 mb-6 transition-all duration-700 ease-in-out ${showExpanded ? 'opacity-0 translate-y-[-20px] scale-95 absolute pointer-events-none' : 'opacity-100 translate-y-0 scale-100 relative pointer-events-auto'}`}>
          {INTEREST_CARDS.slice(0, 2).map((card) => (
            <div
              key={card.id}
              className="relative group cursor-pointer"
              onClick={() => handleExpand(card.id)}
            >
              <div
                className="relative overflow-hidden rounded-2xl transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)]"
                style={{ aspectRatio: '3/2' }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${card.img})` }}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60 opacity-70 group-hover:opacity-80 transition-opacity duration-300"
                />
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <div>
                    <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>{card.title}</h3>
                    <p className="text-xs mt-1 text-white/60" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>{card.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部三个卡片 */}
        <div className={`grid grid-cols-3 gap-6 transition-all duration-700 ease-in-out ${showExpanded ? 'opacity-0 translate-y-[20px] scale-95 absolute pointer-events-none' : 'opacity-100 translate-y-0 scale-100 relative pointer-events-auto'}`}>
          {INTEREST_CARDS.slice(2, 5).map((card) => (
              <div
                key={card.id}
                className="relative group cursor-pointer"
                onClick={() => handleExpand(card.id)}
              >
                <div
                  className="relative overflow-hidden rounded-2xl transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)]"
                  style={{ aspectRatio: '3/2' }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${card.img})` }}
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60 opacity-70 group-hover:opacity-80 transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <div>
                      <h3 className="text-base font-bold text-white" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>{card.title}</h3>
                      <p className="text-xs mt-0.5 text-white/60" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>{card.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        {/* 展开的详情内容 - 显示在卡片区域下方 */}
        <div className={`mt-6 overflow-hidden transition-all duration-1000 ease-in-out ${showExpanded ? 'max-h-[2000px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 translate-y-4'}`}>
          {expandedId && (
            <div>
              {/* 有设计感的标题区域 */}
              <div className="mb-8">
                <button
                  onClick={handleClose}
                  className="group flex items-baseline gap-4 cursor-pointer hover:opacity-80 transition-all duration-300"
                >
                  <span className="text-6xl">{INTEREST_CARDS.find(c => c.id === expandedId)?.emoji}</span>
                  <span className="text-4xl font-bold text-[#1a1a1a] relative" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
                    {INTEREST_CARDS.find(c => c.id === expandedId)?.title}
                    <span className="absolute -right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">←</span>
                  </span>
                </button>
                <p className="text-base text-[#666] mt-2" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
                  {INTEREST_CARDS.find(c => c.id === expandedId)?.desc}
                </p>

                {expandedId === 'games' && (
                  <div className="mt-8">
                    <p className="text-[clamp(1.2rem,2vw,1.6rem)] font-bold text-[#1a1a1a] leading-relaxed" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
                      我生于数字浪潮初涌的 2005 年，电子游戏是我此生最滚烫的信仰，亦是刻入灵魂的时代印记。
                    </p>
                    <p className="text-base leading-relaxed text-[#444] mt-4" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
                      它以代码为骨，以光影为魂，自童年便闯入我的世界，用无数个日夜，浇筑了我的青春与灵魂。
                    </p>
                    <p className="text-base leading-relaxed text-[#444] mt-4" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
                      它不是消遣，不是娱乐，是孤独岁月里唯一的光，是重压之下喘息的缝隙，是跨越虚实的精神疆域。从懵懂触碰，到深陷热爱，再到以敬畏之心审视，游戏早已挣脱媒介的枷锁，成为我认知世界、安放自我的精神原乡。
                    </p>
                    <p className="text-base leading-relaxed text-[#444] mt-4 italic" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
                      这是一场跨越十余年的奔赴，是独属于我们这代人的数字史诗。它见证时代更迭，承载成长悲欢，以磅礴又温柔的力量，重塑了我的生命轨迹，成为我一生无法割舍的精神烙印。
                    </p>
                    <div className="mt-8">
                      <p className="text-base text-[#444] leading-relaxed" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
                        电子游戏是集合了 <span className="font-semibold text-[#1a1a1a]">科技与艺术</span> 的全新表达，它集合了：
                      </p>
                      <p className="text-xl font-bold text-[#444] leading-loose mt-3" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
                        程序的数理逻辑 · 文学的叙事深度 · 美术的视觉审美 · 音乐的情绪引导 · 电影的视听语言
                      </p>
                      <div className="mt-6">
                        <a
                          href="https://www.yuque.com/ooooyasumi/game/tfe3u7gf0mrf7xg5"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-3 bg-[#1a1a1a] text-white text-base font-semibold rounded-full hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}
                        >
                          📖 我和电子游戏的故事 →
                        </a>
                      </div>
                      <div className="h-px bg-[#e0e0e0] mt-8" />
                    </div>
                  </div>
                )}
              </div>

              {/* 内容区域 */}
              <div className="mt-8">

                {expandedId === 'games' && (
                  <>
                    <div className="mb-8">
                      <p className="text-base text-[#444] mb-4 leading-relaxed" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
                        游玩 300+ 款 3A、网络游戏与独立游戏，对开放世界、FPS、解谜、ARPG、VR 游戏等品类的机制设计、反馈节奏、动线引导和玩家动机有深度体感经验。能从体验中反推设计意图，并结合市场趋势进行玩法判断。发布过 10+ 游戏评价与技术拆解文章。
                      </p>
                      <p className="text-base text-[#444] leading-relaxed" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
                        深入了解从街机时代到现代 3A 的设计演化、技术迭代、玩法范式与行业发展脉络，熟悉主流游戏公司的历史路线与产品战略。
                      </p>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-base mt-8">
                        <p className="text-[#1a1a1a]" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
                          <span className="font-bold text-2xl">{GAME_DATA.totalHours}</span> 小时游戏时长
                        </p>
                        <p className="text-[#1a1a1a]" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
                          <span className="font-bold text-2xl">{GAME_DATA.totalGames}</span> 款游戏体验
                        </p>
                      </div>
                      <div className="mt-6">
                        <p className="text-sm text-[#666] mb-3" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>游戏平台</p>
                        <div className="flex flex-wrap gap-2">
                          {['PC', '手机', 'Switch', 'PS5', 'NDS', '3DS', 'GBA', 'Wii', 'WiiU', 'PSP', 'PS1', 'PS2', 'Quest3'].map((platform) => (
                            <span key={platform} className="text-sm text-[#444]" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>{platform}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mb-8">
                      <p className="text-sm tracking-widest uppercase text-[#666] mb-6" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
                        深度体验
                      </p>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        {GAME_DATA.topGames.map((game) => (
                          <div key={game.name}>
                            <p className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>{game.name}</p>
                            <p className="text-xs text-[#666] mt-1" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>{game.tags.join(' · ')}</p>
                            <p className="text-sm text-[#666] mt-1" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>{game.hours}h</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-8">
                      <p className="text-sm tracking-widest uppercase text-[#666] mb-6" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
                        其他记录
                      </p>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        {GAME_DATA.otherHighlights.map((game) => (
                          <div key={game.name}>
                            <p className="text-[#444]" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>{game.name}</p>
                            <p className="text-[#666] mt-1" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>{game.hours}h · {game.note}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 text-left">
                        <a
                          href="https://www.yuque.com/ooooyasumi/nn8yx9/smca4s6fza2u3k7y"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base text-[#666] hover:text-[#1a1a1a] transition-colors" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}
                        >
                          查看完整游戏记录 →
                        </a>
                      </div>
                    </div>

                    {/* 名言轮播 */}
                    <QuoteCarousel quotes={GAME_DATA.quotes} />
                  </>
                )}

                {expandedId === 'movies' && (
                  <div className="text-center py-8">
                    <p className="text-[#666]" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>电影内容整理中...</p>
                  </div>
                )}

                {expandedId === 'music' && (
                  <div className="text-center py-8">
                    <p className="text-[#666]" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>音乐内容整理中...</p>
                  </div>
                )}

                {expandedId === 'photography' && (
                  <div className="text-center py-8">
                    <p className="text-[#666]" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>摄影内容整理中...</p>
                  </div>
                )}

                {expandedId === 'cars' && (
                  <div className="text-center py-8">
                    <p className="text-[#666]" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>汽车内容整理中...</p>
                  </div>
                )}

                <div className="mt-16 text-center">
                  <button
                    onClick={handleClose}
                    className="text-2xl text-[#666] hover:text-[#1a1a1a] transition-all duration-300 hover:-translate-y-1" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}
                  >
                    收起 ↑
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center pt-12">
          <p className="text-sm text-[#999] tracking-widest transition-opacity duration-300" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
            {expandedId ? '' : '点击每个兴趣模块探索更多'}
          </p>
        </div>
      </div>
</section>
  );
}

function QuoteCarousel({ quotes }: { quotes: typeof GAME_DATA.quotes }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % quotes.length);
        setIsAnimating(false);
      }, 400);
    }, 8000);
    return () => clearInterval(timer);
  }, [quotes.length]);

  const current = quotes[currentIndex];

  return (
    <div className="mb-8 py-8 border-t border-b border-[#e0e0e0]">
      <div className="relative overflow-hidden" style={{ minHeight: '120px' }}>
        <div
          className={`transition-all duration-500 ease-out ${isAnimating ? 'opacity-0 translate-x-[-20px] blur-sm' : 'opacity-100 translate-x-0 blur-0'}`}
        >
          <p className="text-base leading-relaxed text-[#1a1a1a] italic" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
            {current.zh.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < current.zh.split('\n').length - 1 && <br />}
              </span>
            ))}
          </p>
          <p className="text-sm text-[#999] mt-4" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
            —— {current.author} <span className="text-[#666]">/ {current.title}</span>
          </p>
          <p className="text-xs text-[#ccc] mt-2" style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}>
            {current.en}
          </p>
        </div>
      </div>
    </div>
  );
}
