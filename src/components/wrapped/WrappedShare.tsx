"use client";

import { Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type WrappedShareProps = {
  year: number;
  stats: {
    totalBooksRead: number;
    favoriteCategory: string | null;
  };
};

const WrappedShare = ({ year, stats }: WrappedShareProps) => {
  const [copied, setCopied] = useState(false);

  const shareText = `📚 Mon Bookmarkd Wrapped ${year} 📚\n\n` +
    `J'ai lu ${stats.totalBooksRead} livre${stats.totalBooksRead > 1 ? "s" : ""} cette année !\n` +
    (stats.favoriteCategory
      ? `Ma catégorie préférée : ${stats.favoriteCategory}\n`
      : "") +
    `\nDécouvrez vos statistiques sur Bookmarkd !`;

  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/wrapped/${year}`
    : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Mon Bookmarkd Wrapped ${year}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.error("Share failed:", error);
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  const canShare = typeof navigator !== "undefined" && navigator.share;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {canShare && (
        <Button
          onClick={handleShare}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          size="lg"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Partager
        </Button>
      )}
      <Button
        onClick={handleCopy}
        variant="outline"
        size="lg"
        className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
      >
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Copié !
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4" />
            Copier le lien
          </>
        )}
      </Button>
    </div>
  );
};

export default WrappedShare;
