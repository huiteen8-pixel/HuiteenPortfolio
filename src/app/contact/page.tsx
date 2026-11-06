import type { Metadata } from 'next';
import AboutFloatingNav from '@/components/AboutFloatingNav';

export const metadata: Metadata = { title: 'Contact Huiteen' };

export default function ContactPage() {
  return (
    <main className="contact-empty-page" aria-label="Contact Huiteen">
      <AboutFloatingNav current="contact" />
    </main>
  );
}
