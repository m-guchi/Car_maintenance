import type { NextConfig } from "next";
import path from "path";

const projectRoot = path.resolve(process.cwd());
const generatedClient = path.join(projectRoot, "generated/client.ts");

const devAllowedOrigins = [
  "*.sslip.io",
  ...(process.env.DEV_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []),
];

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  allowedDevOrigins: devAllowedOrigins,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async headers() {
    if (process.env.NODE_ENV !== "development") {
      return [];
    }

    return [
      {
        source: "/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
  webpack: (config, { dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@prisma/client$": generatedClient,
    };

    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        ignored: ["**/node_modules/**", "**/.git/**"],
      };
    }

    return config;
  },
};

export default nextConfig;
