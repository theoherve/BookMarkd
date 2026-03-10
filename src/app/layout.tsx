import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import AuthSessionProvider from "@/components/layout/session-provider";
import ServiceWorkerProvider from "@/components/layout/service-worker-provider";
import { OrganizationJsonLd } from "@/components/seo/organization-json-ld";
import QueryProvider from "@/components/providers/query-provider";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const defaultTitle = "BookMarkd · Suivez, notez et partagez vos lectures";
const defaultDescription =
  "BookMarkd est votre hub lecture social : suivez vos livres, découvrez ceux de vos amis et recevez des recommandations personnalisées.";

export const metadata: Metadata = {
  metadataBase: new URL("https://bookmarkd.app"),
  title: {
    default: defaultTitle,
    template: "%s · BookMarkd",
  },
  description: defaultDescription,
  manifest: "/manifest.webmanifest",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfaf5" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0c0a" },
  ],
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "icon", url: "/pwa/icon-192.png", sizes: "192x192" },
    { rel: "apple-touch-icon", url: "/pwa/icon-180.png", sizes: "180x180" },
  ],
  appleWebApp: {
    title: "BookMarkd",
    statusBarStyle: "default",
    capable: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  },
  authors: [{ name: "BookMarkd" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "BookMarkd",
    title: defaultTitle,
    description: defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          "bg-background",
          "text-foreground",
          "min-h-screen",
          "antialiased",
        ].join(" ")}
      >
        <AuthSessionProvider>
          <QueryProvider>
            <OrganizationJsonLd />
            <ServiceWorkerProvider>{children}</ServiceWorkerProvider>
          </QueryProvider>
        </AuthSessionProvider>
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;
