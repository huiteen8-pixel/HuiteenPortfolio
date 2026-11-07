'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import AboutFloatingNav from './AboutFloatingNav';
import ContactDraggable from './ContactDraggable';

const REDBOOK = 'https://www.xiaohongshu.com/user/profile/67ca4837000000000a03cbb2';
const RESUME = '/contact/huiteen-resume.pdf';
const place = (x: number, y: number, width: number, height: number): CSSProperties => ({
  left: `${x / 1878 * 100}%`, top: `${y / 1062 * 100}%`,
  width: `${width / 1878 * 100}%`, height: `${height / 1062 * 100}%`,
});

const artwork = [
  { id: 'binder', file: 'binder.png', x: 348, y: 128, width: 1201, height: 918 },
  { id: 'huiteen', file: 'huiteen.png', x: 625, y: 247, width: 196, height: 68 },
  { id: 'blue-ribbon', file: 'blue-ribbon.png', x: 405, y: 213, width: 297, height: 298 },
  { id: 'resume-title', file: 'resume.png', x: 579, y: 372, width: 268, height: 88 },
  { id: 'social-title', file: 'social.png', x: 596, y: 532, width: 214, height: 72 },
  { id: 'name-card', file: 'name-card.png', x: 872, y: 419, width: 320, height: 214 },
  { id: 'list-pin', file: 'list-pin.png', x: 1196, y: 292, width: 148, height: 112 },
  { id: 'gingerbread', file: 'gingerbread.png', x: 1234, y: 511, width: 176, height: 174 },
  { id: 'pink-ribbon', file: 'pink-ribbon.png', x: 1197, y: 651, width: 130, height: 143 },
] as const;

const layerLabels: Record<string, string> = {
  huiteen: '拖动：Huiteen 字样', 'blue-ribbon': '拖动：蓝色徽章', 'resume-title': '拖动：Resume 字样',
  'social-title': '拖动：Social 字样', 'name-card': '拖动：名片', 'list-pin': '拖动：List 1 图钉便签',
  gingerbread: '拖动：姜饼贴纸', 'pink-ribbon': '拖动：粉色徽章',
};
const hitAreas: Record<string, string> = {
  'blue-ribbon': 'polygon(30% 22%,69% 22%,69% 81%,30% 81%)',
  'name-card': 'polygon(5% 2%,95% 5%,97% 91%,6% 97%)',
  'list-pin': 'polygon(12% 4%,99% 20%,99% 83%,12% 90%)',
  gingerbread: 'inset(14% 11% 7% 17%)',
};

export default function ContactContent() {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const boundaryRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [order, setOrder] = useState<Record<string, number>>({});
  const [resetVersion, setResetVersion] = useState(0);
  const [moved, setMoved] = useState(false);
  const nextLayer = useRef(10);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  useEffect(() => {
    let cancelled = false;
    // Start the sequence together once the local cutouts are decoded, so an
    // uncached image cannot suddenly pop into an already moving composition.
    const images = Array.from(frameRef.current?.querySelectorAll('img') ?? []);
    Promise.all(images.map(image => image.decode().catch(() => {}))).then(() => {
      if (!cancelled) setEntered(true);
    });
    return () => { cancelled = true; };
  }, []);

  function interaction(key: string, initialDepth: number) {
    return {
      resetVersion, zIndex: order[key] ?? initialDepth,
      raise: () => { const depth = ++nextLayer.current; setOrder(current => ({ ...current, [key]: depth })); },
      onMoved: () => setMoved(true),
    };
  }

  async function copyEmail(email: string) {
    if (timer.current) clearTimeout(timer.current);
    try { await navigator.clipboard.writeText(email); setMessage(`已复制 ${email}`); }
    catch { setMessage(`请手动复制：${email}`); }
    timer.current = setTimeout(() => setMessage(''), 2800);
  }

  return (
    <main ref={boundaryRef} className="contact-reference-page">
      <AboutFloatingNav current="contact" />
      <h1 className="sr-only">Contact Huiteen — Working with Huiteen</h1>
      <p id="contact-drag-instructions" className="sr-only">按住纸片或贴纸拖动，松手后保留位置。点击邮箱可复制，拖动不会触发点击。方向键可移动，Escape 还原当前素材。</p>
      <div ref={frameRef} className="contact-reference-frame" data-entered={entered}>
      <div className="contact-reference-canvas">
        {artwork.map(asset => asset.id === 'binder' ? (
          <div key={asset.id} className="contact-layer contact-binder" data-contact-layer="binder" style={place(asset.x, asset.y, asset.width, asset.height)}>
            <div className="contact-arrival"><Image unoptimized src="/contact/binder.png" alt="" width={1201} height={918} sizes="94vw" loading="eager" draggable={false} /></div>
          </div>
        ) : (
          <ContactDraggable boundaryRef={boundaryRef} key={asset.id} id={asset.id} label={layerLabels[asset.id]} style={place(asset.x, asset.y, asset.width, asset.height)} hit={hitAreas[asset.id]} {...interaction(asset.id, asset.id === 'name-card' ? 2 : asset.id === 'pink-ribbon' || asset.id === 'gingerbread' ? 5 : asset.id === 'list-pin' ? 4 : 1)}>
            <Image unoptimized src={`/contact/${asset.file}`} alt="" width={asset.width} height={asset.height} sizes="45vw" loading="eager" draggable={false} />
          </ContactDraggable>
        ))}

        {/* Isolate the original blue handwriting from the layout reference.
            It remains a separate layer rather than baking the page into one image. */}
        <svg className="contact-layer contact-working-title contact-arrival" data-contact-layer="working-title" style={place(900, 320, 310, 64)} viewBox="900 320 310 64" role="img" aria-label="Working with Huiteen">
          <defs>
            <filter id={`${id}-blue-ink`} colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 .63  0 0 0 0 1  -8 0 8 0 -4" />
            </filter>
          </defs>
          <image href="/contact/layout-reference.png" width="1878" height="1062" filter={`url(#${id}-blue-ink)`} />
        </svg>

        <ContactDraggable boundaryRef={boundaryRef} id="download" label="下载 Huiteen 简历 PDF" href={RESUME} download="Huiteen-Resume.pdf" style={place(630, 450, 200, 58)} {...interaction('download', 3)}>
          <Image unoptimized src="/contact/download-pdf.png" alt="Download PDF" width={200} height={58} sizes="12vw" loading="eager" draggable={false} />
        </ContactDraggable>
        <ContactDraggable boundaryRef={boundaryRef} id="redbook" label="打开 Hui 小红书" href={REDBOOK} external style={place(648, 613, 145, 40)} {...interaction('redbook', 3)}>
          <Image unoptimized src="/contact/redbook.png" alt="redbook" width={145} height={40} sizes="9vw" loading="eager" draggable={false} />
        </ContactDraggable>
        <ContactDraggable boundaryRef={boundaryRef} id="reservation-note" label="复制邮箱 2759693844@qq.com" style={place(994, 352, 340, 360)} hit="polygon(16% 8%,92% 19%,82% 94%,12% 85%)" onActivate={() => copyEmail('2759693844@qq.com')} {...interaction('reservation-note', 3)}>
          <Image unoptimized src="/contact/reservation-note.png" alt="" width={325} height={344} sizes="20vw" loading="eager" draggable={false} />
        </ContactDraggable>
        <ContactDraggable boundaryRef={boundaryRef} id="gmail" label="复制邮箱 huiteen8@gmail.com" style={place(543, 701, 634, 212)} hit="inset(22% 0 20%)" onActivate={() => copyEmail('huiteen8@gmail.com')} {...interaction('gmail', 4)}>
          <Image unoptimized src="/contact/gmail.png" alt="huiteen8@gmail.com" width={634} height={212} sizes="36vw" loading="eager" draggable={false} />
        </ContactDraggable>
      </div>
      </div>
      <nav className="contact-mobile-actions" aria-label="联系方式">
        <a href={RESUME} download="Huiteen-Resume.pdf">下载简历 ↗</a>
        <a href={REDBOOK} target="_blank" rel="noopener noreferrer">小红书 ↗</a>
        <button type="button" onClick={() => copyEmail('huiteen8@gmail.com')}>复制邮箱</button>
      </nav>
      {moved && <button type="button" className="contact-reset" onClick={() => { setResetVersion(value => value + 1); setOrder({}); nextLayer.current = 10; setMoved(false); }}>↺ 还原位置</button>}
      <div className="contact-copy-feedback" role="status">{message}</div>
    </main>
  );
}
