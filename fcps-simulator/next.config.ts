import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseHost = (() => {
  try { return new URL(supabaseUrl).host; } catch { return ""; }
})();

const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'`, // Next.js inline bootstrap scripts require this
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob:`,
  `font-src 'self' data:`,
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
  // PWA: the service worker and the web app manifest are both same-origin.
  // Without these two the fallback chain still resolves to 'self', but a
  // few browsers refuse to register a worker unless worker-src is explicit.
  `worker-src 'self'`,
  `manifest-src 'self'`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // The service worker must never be served from cache. If a stale
        // sw.js sticks around, installed users keep running old logic and
        // can never be updated -- so force a revalidation every load.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
    ];
  },
  // Default Server Action body limit is 1MB. The bulk question importer
  // (/admin/questions/import) posts the entire parsed JSON array in one
  // action call, and a few hundred MCQs with explanations easily clears
  // 1MB -- Next.js was rejecting those uploads with a 413 "Body exceeded
  // 1 MB limit" before importQuestionsBulk() ever ran, so nothing was
  // saved and the question count on /admin/questions never moved. Raised
  // to 10mb, generous enough for a multi-thousand-question bulk import.
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
