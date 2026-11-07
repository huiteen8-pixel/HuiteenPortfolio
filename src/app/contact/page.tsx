import type { Metadata } from 'next';
import ContactContent from '@/components/ContactContent';

export const metadata: Metadata = { title: 'Contact Huiteen' };

export default function ContactPage() {
  return <ContactContent />;
}
