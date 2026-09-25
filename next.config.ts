import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  ...(isProd
    ? [
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // Next.js ships inline bootstrap scripts; no third-party scripts exist.
            "script-src 'self' 'unsafe-inline'",
            // 'unsafe-inline' covers inline style attributes used by components.
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https://*.blob.vercel-storage.com",
            "font-src 'self'",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
          ].join("; "),
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Native/WASM + socket packages must load through Node, not the bundler.
  serverExternalPackages: ["@electric-sql/pglite", "postgres", "bcryptjs"],
  experimental: {
    serverActions: {
      // Next caps Server Action bodies at 1MB by default, but each image
      // slot accepts up to 2 MB (two slots per product). Without this the
      // framework rejects bigger uploads *before* the action runs — the save
      // silently does nothing, which made the admin image section look broken.
      // 4.2mb fits 2 × 2 MB files + multipart overhead (~20 KB per the docs)
      // and stays under Vercel's 4.5MB function payload limit.
      bodySizeLimit: "4.2mb",
    },
  },
  images: {
    // Admin uploads live in Vercel Blob (`brike-media`). Product/collection art
    // renders `unoptimized` (storefront convention for /prints SVGs), but keep
    // the optimizer door open for remote blob URLs too.
    remotePatterns: [
      { protocol: "https", hostname: "**.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
