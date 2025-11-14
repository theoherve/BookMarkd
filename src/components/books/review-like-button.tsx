"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { likeReview, unlikeReview } from "@/server/actions/review";

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
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [isPending, startTransition] = useTransition();

  const handleToggleLike = () => {
    startTransition(async () => {
      if (hasLiked) {
        const result = await unlikeReview(reviewId);
        if (result.success) {
          setHasLiked(false);
          setLikesCount((prev) => Math.max(0, prev - 1));
        }
      } else {
        const result = await likeReview(reviewId);
        if (result.success) {
          setHasLiked(true);
          setLikesCount((prev) => prev + 1);
        }
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

