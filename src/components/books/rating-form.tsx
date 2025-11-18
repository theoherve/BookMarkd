"use client";

import { useState, useTransition } from "react";

import { formatRating } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useOfflineQueue } from "@/hooks/use-offline-queue";

type RatingFormProps = {
  bookId: string;
  currentRating?: number | null;
};

const stars = [1, 2, 3, 4, 5];

const RatingForm = ({ bookId, currentRating }: RatingFormProps) => {
  const { queueAction } = useOfflineQueue();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [confirmedRating, setConfirmedRating] = useState<number | null>(
    currentRating ?? null,
  );
  const [isPending, startTransition] = useTransition();

  // La note à afficher est soit la note sélectionnée (en attente), soit la note confirmée
  const displayRating = selectedRating ?? confirmedRating ?? null;

  const handleStarClick = (starValue: number) => {
    const currentDisplay = selectedRating ?? confirmedRating ?? 0;
    
    // Si on clique sur la même étoile que la note actuellement affichée
    if (currentDisplay === starValue) {
      // Passer à la note avec 0.5
      setSelectedRating(starValue - 0.5);
    } else {
      // Sinon, donner la note entière
      setSelectedRating(starValue);
    }
  };

  const handleValidate = () => {
    if (selectedRating === null) {
      return;
    }
    
    const previousRating = confirmedRating;
    setConfirmedRating(selectedRating);
    startTransition(async () => {
      try {
        await queueAction({
          type: "rateBook",
          bookId,
          rating: selectedRating,
        });
      } catch (error) {
        console.error("Impossible d'enregistrer la note :", error);
        setConfirmedRating(previousRating ?? null);
      }
    });
    // Réinitialiser la sélection après validation
    setSelectedRating(null);
  };

  const getStarState = (starValue: number) => {
    const rating = displayRating ?? 0;
    
    if (rating >= starValue) {
      return "full";
    }
    if (rating >= starValue - 0.5) {
      return "half";
    }
    return "empty";
  };

  const hasUnconfirmedSelection = selectedRating !== null && selectedRating !== confirmedRating;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Votre note
      </p>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {stars.map((star) => {
            const state = getStarState(star);
            
            return (
              <button
                key={star}
                type="button"
                aria-label={`Noter ${star} sur 5`}
                onClick={() => handleStarClick(star)}
                disabled={isPending}
                className="relative inline-flex h-8 w-8 items-center justify-center text-2xl transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {/* Étoile de fond (vide) */}
                <span className="text-muted-foreground">★</span>
                {/* Étoile colorée (pleine ou partielle) */}
                <span
                  className={`absolute inset-0 flex items-center justify-center overflow-hidden ${
                    state === "full"
                      ? "text-accent-foreground"
                      : state === "half"
                        ? "text-accent-foreground"
                        : "text-transparent"
                  }`}
                  style={
                    state === "half"
                      ? { clipPath: "inset(0 50% 0 0)" }
                      : undefined
                  }
                >
                  ★
                </span>
              </button>
            );
          })}
        </div>
        {displayRating !== null && (
          <span className="text-sm text-muted-foreground">
            {formatRating(displayRating)}
          </span>
        )}
        {hasUnconfirmedSelection && (
          <Button
            type="button"
            size="sm"
            onClick={handleValidate}
            disabled={isPending}
          >
            {isPending ? "Validation..." : "Valider"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default RatingForm;

