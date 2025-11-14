"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { rateBook } from "@/server/actions/book";

type RatingFormProps = {
  bookId: string;
  currentRating?: number | null;
};

const stars = [1, 2, 3, 4, 5];

const RatingForm = ({ bookId, currentRating }: RatingFormProps) => {
  const [pendingRating, setPendingRating] = useState<number | null>(
    currentRating ?? null,
  );
  const [isPending, startTransition] = useTransition();

  const handleRate = (value: number) => {
    setPendingRating(value);
    startTransition(() => {
      rateBook(bookId, value);
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Votre note
      </p>
      <div className="flex items-center gap-2">
        {stars.map((star) => {
          const active =
            (pendingRating ?? 0) >= star || (currentRating ?? 0) >= star;
          return (
            <button
              key={star}
              type="button"
              aria-label={`Noter ${star} sur 5`}
              onClick={() => handleRate(star)}
              disabled={isPending}
              className={`text-2xl transition ${
                active ? "text-accent-foreground" : "text-muted-foreground"
              }`}
            >
              ★
            </button>
          );
        })}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRate(0.5)}
          disabled={isPending}
        >
          0.5
        </Button>
      </div>
    </div>
  );
};

export default RatingForm;

