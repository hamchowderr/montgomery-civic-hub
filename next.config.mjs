/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
  experimental: {
    // Tree-shake heavy barrel exports for faster dev compilation
    optimizePackageImports: [
      "@copilotkit/react-core",
      "@copilotkit/react-ui",
      "lucide-react",
      "recharts",
      "motion/react",
    ],
  },
};

export default nextConfig;
