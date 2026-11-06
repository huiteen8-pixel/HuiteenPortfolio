'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const EMAIL = '2759693844@qq.com';

export default function AboutContactFooter() {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copyEmail() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(EMAIL);
      setMessage('邮箱已复制');
    } catch {
      setMessage('复制失败，请选中邮箱手动复制');
    }
    timer.current = setTimeout(() => setMessage(''), 2500);
  }

  return (
    <footer id="about-contact-footer" className="about-contact-footer" aria-label="联系 Huiteen">
      <Link className="about-contact-home" href="/">Huiteen</Link>
      <div className="about-contact-email">
        <button type="button" onClick={copyEmail} aria-label={`复制邮箱 ${EMAIL}`}>{EMAIL}</button>
        <span className="about-contact-status" role="status">{message}</span>
      </div>
      <a href="https://www.xiaohongshu.com/user/profile/67ca4837000000000a03cbb2" target="_blank" rel="noopener noreferrer">Hui 小红书</a>
    </footer>
  );
}
