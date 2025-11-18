import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.fr",
      },
      {
        protocol: "https",
        hostname: "books.google.com",
      },
      {
        protocol: "https",
        hostname: "books.google.fr",
      },
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "media.licdn.com",
      },
    ],
  },
};

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: false, // On gère l'enregistrement manuellement via le provider
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "images-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours
        },
      },
    },
    {
      // Cache les assets Next.js statiques (incluant les polices Geist self-hostées)
      urlPattern: /^https?:\/\/.*\/_next\/.*$/,
      handler: "CacheFirst",
      options: {
        cacheName: "nextjs-static",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 an
        },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/api\/(feed|lists|books|tags|users\/search).*$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        networkTimeoutSeconds: 3,
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/api\/books\/search.*$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "search-cache",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60, // 1 heure
        },
        networkTimeoutSeconds: 3,
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/api\/.*$/,
      handler: "NetworkOnly",
      options: {
        cacheName: "api-no-cache",
      },
    },
    {
      urlPattern: ({ request }) => request.destination === "document",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 heures
        },
        networkTimeoutSeconds: 3,
      },
    },
  ],
  fallbacks: {
    document: "/offline",
  },
});

export default pwaConfig(nextConfig);
