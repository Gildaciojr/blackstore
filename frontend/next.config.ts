import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // DEV LOCAL
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },

      // PRODUÇÃO (CRÍTICO)
      {
        protocol: "https",
        hostname: "api.blackstore.cloud",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;