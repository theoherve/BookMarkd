"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Flashlight, FlashlightOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isBookBarcode } from "@/lib/isbn";

type BarcodeScannerProps = {
  onScanSuccess: (isbn: string) => void;
  onClose: () => void;
};

const SCANNER_ELEMENT_ID = "bookmarkd-barcode-scanner";

const BarcodeScanner = ({ onScanSuccess, onClose }: BarcodeScannerProps) => {
  const html5QrCodeRef = useRef<import("html5-qrcode").Html5Qrcode | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const hasScannedRef = useRef(false);

  const handleStop = useCallback(async () => {
    try {
      const scanner = html5QrCodeRef.current;
      if (scanner) {
        const state = scanner.getState();
        // Only stop if scanning (state 2) or paused (state 3)
        if (state === 2 || state === 3) {
          await scanner.stop();
        }
      }
    } catch {
      // Ignore stop errors
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
          "html5-qrcode"
        );

        if (!mounted) return;

        // Wait for the DOM element to be available
        const container = document.getElementById(SCANNER_ELEMENT_ID);
        if (!container) return;

        const html5QrCode = new Html5Qrcode(SCANNER_ELEMENT_ID, {
          formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
          verbose: false,
        });
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 80 },
          },
          (decodedText) => {
            if (hasScannedRef.current) return;

            if (isBookBarcode(decodedText)) {
              hasScannedRef.current = true;

              // Haptic feedback
              if (navigator.vibrate) {
                navigator.vibrate(100);
              }

              // Stop scanner then notify parent
              handleStop().then(() => {
                if (mounted) {
                  onScanSuccess(decodedText);
                }
              });
            } else {
              setError("Ce code-barres n'est pas un ISBN de livre.");
              setTimeout(() => {
                if (mounted) setError(null);
              }, 3000);
            }
          },
          () => {
            // Scan failure (no barcode found in frame) — ignore silently
          }
        );

        if (mounted) setIsReady(true);

        // Check torch support
        try {
          const capabilities =
            html5QrCode.getRunningTrackCameraCapabilities();
          if (capabilities.torchFeature().isSupported()) {
            if (mounted) setTorchSupported(true);
          }
        } catch {
          // Torch not supported
        }
      } catch (err) {
        if (!mounted) return;

        const message =
          err instanceof Error ? err.message : "Erreur inconnue";

        if (
          message.includes("NotAllowedError") ||
          message.includes("Permission")
        ) {
          setError(
            "Accès à la caméra refusé. Autorisez l'accès dans les paramètres de votre navigateur."
          );
        } else if (
          message.includes("NotFoundError") ||
          message.includes("device")
        ) {
          setError("Aucune caméra détectée sur cet appareil.");
        } else {
          setError(`Impossible de démarrer la caméra : ${message}`);
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      handleStop();
    };
  }, [onScanSuccess, handleStop]);

  const toggleTorch = async () => {
    try {
      const scanner = html5QrCodeRef.current;
      if (!scanner) return;

      const capabilities = scanner.getRunningTrackCameraCapabilities();
      const torch = capabilities.torchFeature();

      await torch.apply(!torchOn);
      setTorchOn(!torchOn);
    } catch {
      // Torch toggle failed
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      {/* Top bar */}
      <div className="relative z-20 flex shrink-0 items-center justify-between bg-black/80 px-4 py-3 safe-area-inset-top">
        <h2 className="text-base font-semibold text-white">
          Scanner un code-barres
        </h2>
        <div className="flex items-center gap-2">
          {torchSupported && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTorch}
              className="text-white hover:bg-white/20"
              aria-label={
                torchOn
                  ? "Éteindre la lampe torche"
                  : "Allumer la lampe torche"
              }
            >
              {torchOn ? (
                <FlashlightOff className="size-5" />
              ) : (
                <Flashlight className="size-5" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              handleStop();
              onClose();
            }}
            className="text-white hover:bg-white/20"
            aria-label="Fermer le scanner"
          >
            <X className="size-6" />
          </Button>
        </div>
      </div>

      {/* Scanner video container — html5-qrcode injects <video> here */}
      <div className="relative min-h-0 flex-1">
        <div
          id={SCANNER_ELEMENT_ID}
          className="h-full w-full"
          style={{ minHeight: "300px" }}
        />

        {/* Viewfinder overlay (only when camera is ready) */}
        {isReady && !error && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="relative h-[80px] w-[250px]">
              {/* Corner markers */}
              <div className="absolute -left-1 -top-1 h-5 w-5 rounded-tl-sm border-l-2 border-t-2 border-white" />
              <div className="absolute -right-1 -top-1 h-5 w-5 rounded-tr-sm border-r-2 border-t-2 border-white" />
              <div className="absolute -bottom-1 -left-1 h-5 w-5 rounded-bl-sm border-b-2 border-l-2 border-white" />
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-br-sm border-b-2 border-r-2 border-white" />

              {/* Animated scan line */}
              <div className="absolute inset-x-0 h-0.5 animate-scan-line bg-accent" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom instructions */}
      <div className="relative z-20 shrink-0 bg-black/80 px-4 py-6 text-center safe-area-inset-bottom">
        {error ? (
          <p className="text-sm font-medium text-red-400">{error}</p>
        ) : (
          <p className="text-sm text-white/80">
            Placez le code-barres du livre dans le cadre
          </p>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;
