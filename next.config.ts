import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.browser.js https://*.clerk.accounts.dev https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.clerk.accounts.dev https://*.neon.tech wss://*.clerk.accounts.dev",
              "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
