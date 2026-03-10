"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useIsbnLookup } from "@/features/scan/api/use-isbn-lookup";
import ScanResultSheet from "@/components/scan/scan-result-sheet";
import type { ScanFlowState } from "@/features/scan/types";

// Dynamic import to avoid SSR issues (html5-qrcode uses navigator)
const BarcodeScanner = dynamic(
  () => import("@/components/scan/barcode-scanner"),
  { ssr: false }
);

type ScanFlowProps = {
  isActive: boolean;
  onClose: () => void;
};

const ScanFlow = ({ isActive, onClose }: ScanFlowProps) => {
  const [flowState, setFlowState] = useState<ScanFlowState>("idle");
  const [scannedIsbn, setScannedIsbn] = useState<string | null>(null);

  const { data: lookupResult, isLoading: isLookingUp } =
    useIsbnLookup(scannedIsbn);

  const handleScanSuccess = useCallback((isbn: string) => {
    setScannedIsbn(isbn);
    setFlowState("looking-up");
  }, []);

  const handleClose = useCallback(() => {
    setFlowState("idle");
    setScannedIsbn(null);
    onClose();
  }, [onClose]);

  const handleRetry = useCallback(() => {
    setScannedIsbn(null);
    setFlowState("scanning");
  }, []);

  // Start scanning when activated
  if (isActive && flowState === "idle") {
    setFlowState("scanning");
  }

  // Transition from looking-up to result when data arrives
  if (flowState === "looking-up" && !isLookingUp && lookupResult) {
    setFlowState("result");
  }

  const showScanner = isActive && flowState === "scanning";
  const showResultSheet =
    isActive && (flowState === "looking-up" || flowState === "result");

  return (
    <>
      {showScanner && (
        <BarcodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={handleClose}
        />
      )}

      <ScanResultSheet
        open={showResultSheet}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
        isLoading={isLookingUp}
        result={lookupResult ?? null}
        isbn={scannedIsbn}
        onRetry={handleRetry}
      />
    </>
  );
};

export default ScanFlow;
