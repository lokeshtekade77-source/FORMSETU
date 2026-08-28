import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // On Vercel, vercel.json handles routing /api/* directly to the Python serverless function (api/index.py).
    // In local development, Next.js proxies /api/* to local uvicorn server (http://127.0.0.1:8000).
    if (process.env.VERCEL) {
      return [];
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
