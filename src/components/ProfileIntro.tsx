import Image from 'next/image';

function Sticker({ name, wide = false }: { name: string; wide?: boolean }) {
  const assets: Record<string, { width: number; height: number }> = {
    carrot: { width: 36, height: 51 },
    capybara: { width: 72, height: 50 },
    babies: { width: 66, height: 78 },
    soda: { width: 40, height: 68 },
    poster: { width: 55, height: 54 },
  };
  return <Image src={`/profile/intro/${name}.png`} alt="" {...assets[name]} sizes="80px" className={`profile-intro-sticker ${wide ? 'profile-intro-sticker-wide' : ''}`} />;
}

export default function ProfileIntro() {
  return (
    <div id="profile-intro" className="profile-intro" style={{ fontFamily: 'Arial, PingFang SC, Microsoft YaHei, sans-serif' }}>
      <p>惠文 <Image src="/hero/avatar.png" alt="" width={80} height={80} sizes="80px" className="profile-intro-sticker profile-intro-avatar" /> 是一位多领域具有创造力的设计师</p>
      <p>擅长从模糊需求中 <Sticker name="carrot" /> 识别核心问题</p>
      <p>关注想法如何一步步执行</p>
      <p>她 <Sticker name="capybara" wide /> 在设计中更在意<span className="whitespace-nowrap">human touch</span> <Sticker name="babies" wide /> 的体现</p>
      <p>探索AI与<span className="whitespace-nowrap">Naive Design</span>视觉语言的结合</p>
      <p>在理性的体验中保留直觉 <Sticker name="soda" /> 趣味与人的 <Sticker name="poster" /> 温度</p>
    </div>
  );
}
