"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// Import dynamique de Lottie pour éviter les erreurs SSR
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

type BookLoaderProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
};

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-24 h-24",
};

const BookLoader = ({ className, size = "md", text }: BookLoaderProps) => {
  const [animationData, setAnimationData] = useState<any>(null);
  const lottieRef = useRef<any>(null);

  useEffect(() => {
    // Charger l'animation dynamiquement
    const loadAnimation = async () => {
      try {
        const response = await fetch("/animations/book-loader.json");
        if (response.ok) {
          const data = await response.json();
          setAnimationData(data);
        }
      } catch (error) {
        console.warn("Animation Lottie non trouvée, utilisation du fallback");
      }
    };

    loadAnimation();
  }, []);

  useEffect(() => {
    if (lottieRef.current && animationData) {
      // Contrôler la vitesse de l'animation si nécessaire
      // lottieRef.current.setSpeed(1);
    }
  }, [animationData]);

  // Fallback si l'animation n'est pas chargée
  if (!animationData) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3",
          className
        )}
        role="status"
        aria-label="Chargement en cours"
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-lg bg-muted",
            sizeClasses[size]
          )}
        >
          <div className="h-1/2 w-1/2 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
        )}
        <span className="sr-only">Chargement en cours...</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className
      )}
      role="status"
      aria-label="Chargement en cours"
    >
      <div 
        className={cn("overflow-hidden", sizeClasses[size])}
        style={{ outline: "none" }}
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ 
            width: "100%", 
            height: "100%",
            outline: "none",
            border: "none",
            display: "block"
          }}
          className="outline-none border-none [&_svg]:outline-none [&_svg]:border-none [&_canvas]:outline-none [&_canvas]:border-none"
        />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
      <span className="sr-only">Chargement en cours...</span>
    </div>
  );
};

export { BookLoader };
