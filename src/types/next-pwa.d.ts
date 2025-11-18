declare module "next-pwa" {
  import type { NextConfig } from "next";

  type PWAConfig = {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    clientsClaim?: boolean;
    runtimeCaching?: Array<{
      urlPattern: RegExp | ((options: { request: Request }) => boolean);
      handler: string;
      options?: {
        cacheName?: string;
        expiration?: {
          maxEntries?: number;
          maxAgeSeconds?: number;
        };
        networkTimeoutSeconds?: number;
      };
    }>;
    fallbacks?: {
      document?: string;
    };
  };

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;

  export default withPWA;
}

