import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Prevents double-rendering and double-compiling in development
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "@prisma/client",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@hello-pangea/dnd",
      "framer-motion",
      "better-auth",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
