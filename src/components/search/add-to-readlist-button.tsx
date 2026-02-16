"use client";

import { useState, useTransition } from "react";
import { BookmarkPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { addBookToReadlist } from "@/server/actions/readlist";

type AddToReadlistButtonProps = {
  bookId: string;
  disabled?: boolean;
  /** Mode compact : bouton plus petit, idéal pour les cartes de suggestion */
  compact?: boolean;
};

const AddToReadlistButton = ({
  bookId,
  disabled,
  compact = false,
}: AddToReadlistButtonProps) => {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAdd = () => {
    startTransition(async () => {
      const result = await addBookToReadlist(bookId);
      if (result.success) {
        setFeedback("Ajouté à votre readlist ✅");
      } else {
        setFeedback(result.message);
      }
    });
  };

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <Button
        type="button"
        variant={compact ? "outline" : "default"}
        size={compact ? "sm" : "default"}
        onClick={handleAdd}
        disabled={isPending || disabled}
        aria-live="polite"
        className={compact ? "h-7 text-xs" : undefined}
      >
        <BookmarkPlus className={compact ? "mr-1.5 h-3.5 w-3.5" : "mr-2 h-4 w-4"} />
        {isPending ? "Ajout..." : compact ? "Ajouter" : "Ajouter à la readlist"}
      </Button>
      {!compact && (disabled ? (
        <p className="text-xs text-muted-foreground">
          Déjà dans votre readlist ✅
        </p>
      ) : feedback ? (
        <p className="text-xs text-muted-foreground">{feedback}</p>
      ) : null)}
    </div>
  );
};

export default AddToReadlistButton;

