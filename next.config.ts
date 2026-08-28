import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (process.env.VERCEL) {
      return [
        {
          source: "/api/backend/:path*",
          destination: "/api/index.py"
        },
        {
          source: "/api/:path*",
          destination: "/api/index.py"
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
