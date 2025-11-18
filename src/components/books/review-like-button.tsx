"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useOfflineQueue } from "@/hooks/use-offline-queue";

type ReviewLikeButtonProps = {
  reviewId: string;
  initialLikesCount: number;
  initialHasLiked: boolean;
};

const ReviewLikeButton = ({
  reviewId,
  initialLikesCount,
  initialHasLiked,
}: ReviewLikeButtonProps) => {
  const { queueAction } = useOfflineQueue();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [isPending, startTransition] = useTransition();

  const handleToggleLike = () => {
    startTransition(async () => {
      const nextHasLiked = !hasLiked;
      const previousCount = likesCount;
      setHasLiked(nextHasLiked);
      setLikesCount((prev) => {
        const delta = nextHasLiked ? 1 : -1;
        return Math.max(0, prev + delta);
      });

      try {
        await queueAction({
          type: nextHasLiked ? "likeReview" : "unlikeReview",
          reviewId,
        });
      } catch (error) {
        console.error("Impossible de synchroniser le like :", error);
        setHasLiked(!nextHasLiked);
        setLikesCount(previousCount);
      }
    });
  };

  return (
    <Button
      variant={hasLiked ? "default" : "outline"}
      size="sm"
      onClick={handleToggleLike}
      disabled={isPending}
      aria-label={hasLiked ? "Retirer le like" : "Liker cet avis"}
      className="gap-2"
    >
      <Heart
        className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`}
        aria-hidden
      />
      <span>{likesCount}</span>
    </Button>
  );
};

export default ReviewLikeButton;

