export default function WorkEdgeNavigation() {
  return (
    <nav aria-label="作品页面导航">
      <a href="/about" className="floating-about-link work-edge-about">About Huiteen</a>
      <Link href="/" className="work-edge-home">Home</Link>
    </nav>
  );
}
import Link from 'next/link';

