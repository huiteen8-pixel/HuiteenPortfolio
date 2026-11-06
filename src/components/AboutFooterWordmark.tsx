'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useInView } from 'framer-motion';
import HuiteenWordmark from './HuiteenWordmark';

export default function AboutFooterWordmark({ style }: { style: CSSProperties }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const entered = useInView(ref, { once: true, amount: 0.45 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const artwork = new window.Image();
    artwork.onload = () => setLoaded(true);
    artwork.src = '/hero/title.png';
    return () => { artwork.onload = null; };
  }, []);

  return (
    <Link ref={ref} id="about-footer-wordmark" href="/"
      className="about-reference-asset about-footer-wordmark"
      style={style} aria-label="Huiteen — 返回首页">
      <HuiteenWordmark ready={entered && loaded} />
    </Link>
  );
}
