import type { Metadata } from 'next';
import AboutContent from '@/components/AboutContent';

export const metadata: Metadata = {
  title: 'About Huiteen',
  description: 'How to define Huiteen? 郑惠文的设计方式、教育背景与日常。',
};

export default function AboutPage() {
  return <AboutContent />;
}
