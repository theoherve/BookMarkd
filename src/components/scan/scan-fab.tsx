"use client";

import { useState } from "react";
import { ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScanFlow from "@/components/scan/scan-flow";

const ScanFab = () => {
  const [isScanActive, setIsScanActive] = useState(false);

  return (
    <>
      {/* Floating scan button — above bottom nav, mobile only */}
      <Button
        onClick={() => setIsScanActive(true)}
        aria-label="Scanner le code-barres d'un livre"
        className="fixed bottom-20 right-4 z-50 size-14 rounded-full bg-accent text-accent-foreground shadow-lg transition-transform duration-200 hover:bg-accent/90 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 md:hidden"
      >
        <ScanBarcode className="size-6" aria-hidden="true" />
      </Button>

      {/* Scan flow (full-screen overlay) */}
      <ScanFlow
        isActive={isScanActive}
        onClose={() => setIsScanActive(false)}
      />
    </>
  );
};

export default ScanFab;
