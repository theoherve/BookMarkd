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

  const shareText =
    `Mon Bookmarkd Wrapped ${year}\n\n` +
    `J'ai lu ${stats.totalBooksRead} livre${stats.totalBooksRead > 1 ? "s" : ""} cette année.\n` +
    (stats.favoriteCategory
      ? `Genre favori : ${stats.favoriteCategory}\n`
      : "") +
    `\nDécouvrez les vôtres sur Bookmarkd.`;

  const shareUrl =
    typeof window !== "undefined"
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
        console.error("Share failed:", error);
      }
    } else {
      handleCopy();
    }
  };

  const canShare = typeof navigator !== "undefined" && navigator.share;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {canShare && (
        <Button
          onClick={handleShare}
          size="lg"
          className="bg-[#2f1c11] text-[#fdfaf5] shadow-sm hover:bg-[#1f140d] dark:bg-[#c89a6f] dark:text-[#130c08] dark:hover:bg-[#b9885d]"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Partager
        </Button>
      )}
      <Button
        onClick={handleCopy}
        variant="outline"
        size="lg"
        className="border-[#d6b087] bg-[#fdfaf5]/80 text-[#2f1c11] backdrop-blur-sm hover:bg-[#efe6dc] dark:border-[#c89a6f]/40 dark:bg-[#1a1410]/80 dark:text-[#f7f1ea] dark:hover:bg-[#221b15]"
      >
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Copié
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
