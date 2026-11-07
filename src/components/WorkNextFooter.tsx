'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import HuiteenWordmark from './HuiteenWordmark';

export default function WorkNextFooter({ href, label }: { href: string; label: string }) {
  const footerRef = useRef<HTMLElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const entered = useInView(wordmarkRef, { once: true, amount: .35 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const artwork = new window.Image();
    artwork.onload = () => setLoaded(true);
    artwork.src = '/hero/title.png';
    return () => { artwork.onload = null; };
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const footer = footerRef.current;
        const page = footer?.closest<HTMLElement>('.work-browsing-page');
        if (!footer || !page) return;
        const bounds = footer.getBoundingClientRect();
        const inside = (y: number) => bounds.top <= y && bounds.bottom >= y;
        page.style.setProperty('--work-edge-bottom-color', inside(window.innerHeight - 42) ? '#fff' : '#111');
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);

  return (
    <footer ref={footerRef} id="work-next-footer" className="work-next-footer">
      <div className="work-next-heading">
        <a href={href} className="work-next-link" aria-label={label} title={label}>Next</a>
        <a href={href} className="work-next-arrow" aria-label={label} title={label}><span aria-hidden="true">↗</span></a>
      </div>
      <div ref={wordmarkRef} className="work-next-wordmark">
        <HuiteenWordmark ready={entered && loaded} />
      </div>
    </footer>
  );
}
