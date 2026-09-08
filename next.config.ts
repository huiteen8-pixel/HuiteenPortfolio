import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const productionContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
].join('; ');

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  // Runtime analytics data is mounted separately in production. Never let a
  // developer database, local secrets, logs, or Codex backup files enter a
  // standalone release.
  outputFileTracingExcludes: {
    '/*': ['./data/**', './.env*', './.codex/**', './*.log'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          ...securityHeaders,
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Content-Security-Policy', value: productionContentSecurityPolicy }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
