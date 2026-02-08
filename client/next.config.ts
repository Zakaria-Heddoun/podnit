import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.podnit.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'api.podnit.com',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: 'api.podnit.com',
        pathname: '/images/**',
      },
      {
        protocol: 'http',
        hostname: 'api.podnit.com',
        pathname: '/storage/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
