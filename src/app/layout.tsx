import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import AuthSessionProvider from "@/components/layout/session-provider";
import { getCurrentSession } from "@/lib/auth/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bookmarkd.app"),
  title: {
    default: "BookMarkd · Suivez, notez et partagez vos lectures",
    template: "%s · BookMarkd",
  },
  description:
    "BookMarkd est votre hub lecture social : suivez vos livres, découvrez ceux de vos amis et recevez des recommandations personnalisées.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  keywords: [
    "books",
    "reading tracker",
    "social reading",
    "BookMarkd",
    "Next.js",
    "TailwindCSS 4",
  ],
  authors: [{ name: "BookMarkd" }],
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
        <AuthSessionProvider session={session}>{children}</AuthSessionProvider>
      </body>
    </html>
  );
};

export default RootLayout;
