import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // Legacy profile photos uploaded to Firebase Storage before the
      // Cloudinary switch — keep them rendering on next/image.
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.app",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
