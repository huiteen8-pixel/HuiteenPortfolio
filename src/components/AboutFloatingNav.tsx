import Link from 'next/link';

export default function AboutFloatingNav({ current = 'about' }: { current?: 'about' | 'contact' | 'work' | 'home' }) {
  return (
    <nav className="about-floating-nav" aria-label="页面导航">
      <Link href="/" aria-current={current === 'home' ? 'page' : undefined}>HOME</Link>
      <Link href="/about" scroll={current === 'about' ? false : true} aria-current={current === 'about' ? 'page' : undefined}>ABOUT</Link>
      <Link href="/contact" scroll={current === 'contact' ? false : true} aria-current={current === 'contact' ? 'page' : undefined}>CONTACT</Link>
    </nav>
  );
}
