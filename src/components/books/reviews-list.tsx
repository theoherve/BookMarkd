"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";

import { addReviewComment } from "@/server/actions/book";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTimeFromNow } from "@/lib/datetime";
import ReviewLikeButton from "@/components/books/review-like-button";

type ReviewUser = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
};

type ReviewComment = {
  id: string;
  content: string;
  createdAt: string;
  user: ReviewUser;
};

export type BookReview = {
  id: string;
  title?: string | null;
  content: string;
  createdAt: string;
  spoiler: boolean;
  visibility: "public" | "friends" | "private";
  user: ReviewUser;
  likes: ReviewUser[];
  comments: ReviewComment[];
};

type ReviewsListProps = {
  bookId: string;
  reviews: BookReview[];
  viewerId?: string | null;
};

const ReviewCommentForm = ({
  reviewId,
}: {
  reviewId: string;
}) => {
  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!content.trim()) {
      setFeedback("Veuillez écrire un message.");
      return;
    }
    startTransition(async () => {
      const result = await addReviewComment(reviewId, content.trim());
      if (result.success) {
        setContent("");
        setFeedback("Commentaire ajouté ✅");
      } else {
        setFeedback(result.message);
      }
    });
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={2}
        placeholder="Réagir à cet avis..."
      />
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setContent("")}
          disabled={isPending}
        >
          Effacer
        </Button>
        <Button type="button" size="sm" onClick={handleSubmit} disabled={isPending}>
          Publier
        </Button>
      </div>
      {feedback ? (
        <p className="text-xs text-muted-foreground">{feedback}</p>
      ) : null}
    </div>
  );
};

const ReviewItem = ({
  review,
  viewerId,
}: {
  review: BookReview;
  viewerId?: string | null;
}) => {
  const createdAtLabel = formatRelativeTimeFromNow(review.createdAt);
  const canSeeSpoiler = !review.spoiler || review.user.id === viewerId;
  const [showSpoiler, setShowSpoiler] = useState(canSeeSpoiler);

  return (
    <article className="space-y-4 rounded-3xl border border-border/50 bg-card/70 p-6">
      <header className="flex items-start gap-4">
        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-border/50 bg-muted">
          {review.user.avatarUrl ? (
            <Image
              src={review.user.avatarUrl}
              alt={`Avatar ${review.user.displayName}`}
              fill
              sizes="40px"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              {review.user.displayName.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-foreground">
              {review.user.displayName}
            </p>
            <Badge variant="outline" className="text-xs font-medium">
              {createdAtLabel}
            </Badge>
            {review.visibility !== "public" ? (
              <Badge variant="secondary" className="text-xs font-medium">
                {review.visibility === "friends" ? "Amis" : "Privé"}
              </Badge>
            ) : null}
            {review.spoiler ? (
              <Badge variant="destructive" className="text-xs font-medium">
                Spoiler
              </Badge>
            ) : null}
          </div>
          {review.title ? (
            <h4 className="text-base font-semibold text-foreground">
              {review.title}
            </h4>
          ) : null}
        </div>
      </header>
      <div className="space-y-3 text-sm text-muted-foreground">
        {review.spoiler && !showSpoiler ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSpoiler(true)}
          >
            Afficher le contenu spoiler
          </Button>
        ) : (
          <p className="leading-6">{review.content}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <ReviewLikeButton
          reviewId={review.id}
          initialLikesCount={review.likes.length}
          initialHasLiked={review.likes.some((like) => like.id === viewerId)}
        />
      </div>
      {review.comments.length > 0 ? (
        <div className="space-y-3 rounded-2xl border border-border/40 bg-card/50 p-4">
          {review.comments.map((comment) => (
            <div key={comment.id} className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {comment.user.displayName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTimeFromNow(comment.createdAt)}
                </span>
              </div>
              <p className="text-muted-foreground">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : null}
      <ReviewCommentForm reviewId={review.id} />
    </article>
  );
};

const ReviewsList = ({ reviews, viewerId }: ReviewsListProps) => {
  const sortedReviews = useMemo(
    () =>
      [...reviews].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [reviews],
  );

  if (sortedReviews.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/60 bg-card/60 p-8 text-sm text-muted-foreground">
        Aucun avis pour le moment. Soyez le premier à partager votre opinion !
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedReviews.map((review) => (
        <ReviewItem key={review.id} review={review} viewerId={viewerId} />
      ))}
    </div>
  );
};

export default ReviewsList;

