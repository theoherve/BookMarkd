import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Hors ligne",
  description: "Vous êtes actuellement hors ligne. Vérifiez votre connexion.",
  robots: { index: false, follow: false },
};

const OfflineLayout = ({ children }: { children: ReactNode }) => {
  return children;
};

export default OfflineLayout;
