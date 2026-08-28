import type { NextConfig } from "next";

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (isVercel) {
      return [
        {
          source: "/api/backend/:path*",
          destination: "/api/:path*"
        }
      ];
    }
    return [
      {
        source: "/api/backend/:path*",
        destination: "http://127.0.0.1:8000/api/:path*"
      },
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*"
      }
    ];
  }
};

export default nextConfig;
