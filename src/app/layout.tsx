import type { Metadata, Viewport } from 'next';
import './globals.css';
import MotionProvider from '@/components/MotionProvider';
import CustomCursor from '@/components/CustomCursor';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: '郑惠文 Huiteen | Interaction Portfolio',
    template: '%s | 郑惠文 Huiteen',
  },
  description: 'Interaction, service design, product structure and AIGC portfolio by Huiteen.',
  keywords: [
    'Huiteen',
    '郑惠文',
    '惠文',
    'portfolio',
    'interaction design',
    'system design',
    'service design',
    'AI interaction',
  ],
  authors: [{ name: 'Huiteen' }],
  icons: {
    icon: [{ url: '/profile/tab-logo.png', type: 'image/png' }],
    apple: [{ url: '/profile/tab-logo.png', type: 'image/png' }],
  },
  openGraph: {
    title: '郑惠文 Huiteen | Portfolio',
    description: 'Interaction, service design, product structure and AIGC portfolio.',
    siteName: 'Huiteen Portfolio',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased font-serif" suppressHydrationWarning>
        <MotionProvider>{children}</MotionProvider>
        <CustomCursor />
      </body>
    </html>
  );
}
