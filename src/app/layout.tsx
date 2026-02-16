import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import AuthSessionProvider from "@/components/layout/session-provider";
import ServiceWorkerProvider from "@/components/layout/service-worker-provider";
import { OrganizationJsonLd } from "@/components/seo/organization-json-ld";
import { getCurrentSession } from "@/lib/auth/session";
import QueryProvider from "@/components/providers/query-provider";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  keywords: [
    "livres",
    "suivi de lecture",
    "recommandations lecture",
    "réseau social lecture",
    "liste de livres",
    "PAL",
    "BookMarkd",
  ],
  authors: [{ name: "BookMarkd" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "BookMarkd",
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: "/pwa/icon-192.png",
        width: 192,
        height: 192,
        alt: "BookMarkd",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/pwa/icon-192.png"],
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = async ({ children }: RootLayoutProps) => {
  const session = await getCurrentSession();

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
        <AuthSessionProvider session={session}>
          <QueryProvider>
            <OrganizationJsonLd />
            <ServiceWorkerProvider>{children}</ServiceWorkerProvider>
          </QueryProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
};

export default RootLayout;
