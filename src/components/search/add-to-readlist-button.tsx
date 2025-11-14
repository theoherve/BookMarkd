"use client";

import { useState, useTransition } from "react";
import { BookmarkPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { addBookToReadlist } from "@/server/actions/readlist";

type AddToReadlistButtonProps = {
  bookId: string;
  disabled?: boolean;
};

const AddToReadlistButton = ({
  bookId,
  disabled,
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
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleAdd}
        disabled={isPending || disabled}
        aria-live="polite"
      >
        <BookmarkPlus className="mr-2 h-4 w-4" />
        {isPending ? "Ajout..." : "Ajouter à la readlist"}
      </Button>
      {disabled ? (
        <p className="text-xs text-muted-foreground">
          Déjà dans votre readlist ✅
        </p>
      ) : feedback ? (
        <p className="text-xs text-muted-foreground">{feedback}</p>
      ) : null}
    </div>
  );
};

export default AddToReadlistButton;

