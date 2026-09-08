import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '数据分析后台',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
};

export default function AnalyticsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
