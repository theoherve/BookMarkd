"use client";

import { useState, useTransition } from "react";
import { Share2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ShareListButtonProps = {
  listId: string;
  listTitle: string;
};

const ShareListButton = ({ listId, listTitle }: ShareListButtonProps) => {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleShare = () => {
    startTransition(async () => {
      const url = `${window.location.origin}/lists/${listId}`;

      // Utiliser l'API Web Share si disponible
      if (navigator.share) {
        try {
          await navigator.share({
            title: listTitle,
            text: `Découvrez ma liste "${listTitle}" sur BookMarkd`,
            url,
          });
          return;
        } catch (error) {
          // L'utilisateur a annulé le partage, on continue avec la copie
          if ((error as Error).name !== "AbortError") {
            console.error("Error sharing:", error);
          }
        }
      }

      // Fallback: copier dans le presse-papiers
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        // Fallback manuel si clipboard API n'est pas disponible
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error("Fallback copy failed:", err);
        }
        document.body.removeChild(textArea);
      }
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          disabled={isPending}
          aria-label={copied ? "Lien copié" : "Partager cette liste"}
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" aria-hidden />
              <span>Copié</span>
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" aria-hidden />
              <span>Partager</span>
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{copied ? "Lien copié dans le presse-papiers" : "Partager cette liste"}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ShareListButton;

