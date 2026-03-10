"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Flashlight, FlashlightOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isBookBarcode } from "@/lib/isbn";

type BarcodeScannerProps = {
  onScanSuccess: (isbn: string) => void;
  onClose: () => void;
};

const BarcodeScanner = ({ onScanSuccess, onClose }: BarcodeScannerProps) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<import("html5-qrcode").Html5Qrcode | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
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

        if (!mounted || !scannerRef.current) return;

        const scannerId = "bookmarkd-barcode-scanner";

        // Create a container div for the scanner
        let container = document.getElementById(scannerId);
        if (!container) {
          container = document.createElement("div");
          container.id = scannerId;
          scannerRef.current.appendChild(container);
        }

        const html5QrCode = new Html5Qrcode(scannerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
          verbose: false,
        });
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 100 },
            aspectRatio: 1.0,
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
            // Scan failure (no barcode found in frame) — ignore
          }
        );

        // Check torch support
        try {
          const capabilities = html5QrCode.getRunningTrackCameraCapabilities();
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

      // BooleanCameraCapability uses apply(value) method
      await torch.apply(!torchOn);
      setTorchOn(!torchOn);
    } catch {
      // Torch toggle failed
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-black/70 px-4 py-3 safe-area-inset-top">
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
                torchOn ? "Éteindre la lampe torche" : "Allumer la lampe torche"
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

      {/* Scanner viewport */}
      <div
        ref={scannerRef}
        className="flex h-full w-full items-center justify-center [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
      />

      {/* Viewfinder overlay */}
      {!error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-[100px] w-[280px]">
            {/* Corner markers */}
            <div className="absolute -left-1 -top-1 h-5 w-5 border-l-2 border-t-2 border-white rounded-tl-sm" />
            <div className="absolute -right-1 -top-1 h-5 w-5 border-r-2 border-t-2 border-white rounded-tr-sm" />
            <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-2 border-l-2 border-white rounded-bl-sm" />
            <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2 border-white rounded-br-sm" />

            {/* Animated scan line */}
            <div className="absolute inset-x-0 h-0.5 animate-scan-line bg-accent" />
          </div>
        </div>
      )}

      {/* Bottom instructions */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-black/70 px-4 py-6 text-center safe-area-inset-bottom">
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
