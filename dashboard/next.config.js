/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": require("path").resolve(__dirname, "src"),
    };
    return config;
  },
  // Configure asset prefix if needed
  assetPrefix: process.env.NEXT_PUBLIC_APP_URL,
};

module.exports = nextConfig;
