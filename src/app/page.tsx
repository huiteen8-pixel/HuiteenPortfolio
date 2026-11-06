import HeroSection from '@/components/HeroSection';
import ProfileIntro from '@/components/ProfileIntro';
import ScrollReveal from '@/components/ScrollReveal';
import { TrackerProvider } from '@/components/TrackerProvider';
import CategoryShowcase from '@/components/CategoryShowcase';
import HomeClosing from '@/components/HomeClosing';
import AboutFloatingNav from '@/components/AboutFloatingNav';

export default function Portfolio() {
  return (
    <main className="portfolio-page min-h-screen bg-white text-[#151515]">
      <TrackerProvider />
      <AboutFloatingNav current="home" />
      <a href="/about" className="floating-about-link" aria-label="About Huiteen">About Huiteen</a>
      <div className="home-gradient-shell">
        <HeroSection />
        <section id="profile" className="profile-section relative scroll-mt-24 px-4 pb-24 sm:px-6 md:px-8 md:pb-44">
          <div className="mx-auto w-full max-w-[1600px]">
            <ScrollReveal><ProfileIntro /></ScrollReveal>
          </div>
        </section>
        <CategoryShowcase />
        <HomeClosing />
      </div>
    </main>
  );
}
