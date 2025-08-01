import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      strategies: "generateSW",
      includeAssets: ["icons/*", "fonts/*"], // Include fonts
      manifest: {
        name: "مشكاة للأحاديث النبوية الشريفة",
        short_name: "أحاديث",
        description: "تطبيق لاستعراض وفهم الأحاديث النبوية الشريفة",
        theme_color: "#7440EA",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait",
        icons: [
          {
            src: "/16x16.png",
            sizes: "16x16",
            type: "image/png",
          },
          {
            src: "/32x32.png",
            sizes: "32x32",
            type: "image/png",
          },
          {
            src: "/180x180.png",
            sizes: "180x180",
            type: "image/png",
          },
          {
            src: "/192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/512-512-01.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: [
          "**/*.{js,css,html,png,svg,ico,txt,json,webp,ttf,otf,woff,woff2}",
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/hadeethenc\.com\/api/,
            handler: "CacheFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /\.(ttf|otf|woff|woff2)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "font-cache",
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
