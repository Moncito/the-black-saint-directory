import type { NextConfig } from "next";

/**
 * Baseline security headers for every response. No Content-Security-Policy
 * yet: the boot script and structured data are inline, so a CSP needs nonces —
 * worth adding once the domain and inquiry email are final.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Tilt on phones drives the candle light; nothing else is needed.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(self), gyroscope=(self)",
  },
  // No includeSubDomains/preload: those bind every subdomain of the future domain.
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];

const config: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Brand and work assets never change in place: cache them hard.
        source: "/:dir(brand|work|team|og|intro)/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default config;
