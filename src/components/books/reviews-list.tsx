"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Image from "next/image";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import {
  addReviewComment,
  updateReviewComment,
  deleteReviewComment,
  updateReview,
  deleteReview,
} from "@/server/actions/book";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenuRoot,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const CommentItem = ({
  comment,
  reviewId,
  viewerId,
  onUpdate,
  onDelete,
}: {
  comment: ReviewComment;
  reviewId: string;
  viewerId?: string | null;
  onUpdate: (commentId: string, newContent: string) => void;
  onDelete: (commentId: string) => void;
}) => {
  const isOwner = viewerId === comment.user.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!editContent.trim()) return;
    startTransition(async () => {
      onUpdate(comment.id, editContent.trim());
      setIsEditing(false);
      const result = await updateReviewComment(comment.id, editContent.trim());
      if (!result.success) {
        onUpdate(comment.id, comment.content);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      onDelete(comment.id);
      const result = await deleteReviewComment(comment.id, reviewId);
      if (!result.success) {
        // La revalidation côté serveur restaurera le commentaire
      }
    });
  };

  return (
    <div className="space-y-1 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">
          {comment.user.displayName}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTimeFromNow(comment.createdAt)}
        </span>
        {isOwner && !isEditing ? (
          <DropdownMenuRoot>
            <DropdownMenuTrigger asChild>
              <button className="ml-auto rounded-md p-1 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditContent(comment.content);
                  setIsEditing(true);
                }}
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuRoot>
        ) : null}
      </div>
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={2}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending || !editContent.trim()}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground">{comment.content}</p>
      )}
    </div>
  );
};

type OptimisticAction =
  | { type: "update"; commentId: string; content: string }
  | { type: "delete"; commentId: string };

const ReviewItem = ({
  review,
  viewerId,
}: {
  review: BookReview;
  viewerId?: string | null;
}) => {
  const isReviewOwner = viewerId === review.user.id;
  const createdAtLabel = formatRelativeTimeFromNow(review.createdAt);
  const canSeeSpoiler = !review.spoiler || review.user.id === viewerId;
  const [showSpoiler, setShowSpoiler] = useState(canSeeSpoiler);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [editReviewContent, setEditReviewContent] = useState(review.content);
  const [isReviewPending, startReviewTransition] = useTransition();
  const [isDeleted, setIsDeleted] = useState(false);

  const [optimisticComments, dispatchOptimistic] = useOptimistic(
    review.comments,
    (state: ReviewComment[], action: OptimisticAction) => {
      if (action.type === "update") {
        return state.map((c) =>
          c.id === action.commentId ? { ...c, content: action.content } : c,
        );
      }
      if (action.type === "delete") {
        return state.filter((c) => c.id !== action.commentId);
      }
      return state;
    },
  );

  const handleUpdate = (commentId: string, newContent: string) => {
    dispatchOptimistic({ type: "update", commentId, content: newContent });
  };

  const handleDelete = (commentId: string) => {
    dispatchOptimistic({ type: "delete", commentId });
  };

  const [optimisticContent, setOptimisticContent] = useOptimistic(review.content);

  const handleSaveReview = () => {
    if (!editReviewContent.trim()) return;
    startReviewTransition(async () => {
      setOptimisticContent(editReviewContent.trim());
      setIsEditingReview(false);
      const result = await updateReview(review.id, editReviewContent.trim());
      if (!result.success) {
        setOptimisticContent(review.content);
      }
    });
  };

  const handleDeleteReview = () => {
    startReviewTransition(async () => {
      setIsDeleted(true);
      const result = await deleteReview(review.id);
      if (!result.success) {
        setIsDeleted(false);
      }
    });
  };

  if (isDeleted) return null;

  return (
    <article className="space-y-4 rounded-3xl border border-border/50 bg-card/70 p-6">
      <header className="flex items-start gap-4">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/50 bg-muted">
          {review.user.avatarUrl ? (
            <Image
              src={review.user.avatarUrl}
              alt={`Avatar ${review.user.displayName}`}
              fill
              sizes="40px"
              className="object-cover"
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
            {isReviewOwner && !isEditingReview ? (
              <DropdownMenuRoot>
                <DropdownMenuTrigger asChild>
                  <button className="ml-auto rounded-md p-1 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditReviewContent(review.content);
                      setIsEditingReview(true);
                    }}
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={handleDeleteReview}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuRoot>
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
        {isEditingReview ? (
          <div className="space-y-2">
            <Textarea
              value={editReviewContent}
              onChange={(e) => setEditReviewContent(e.target.value)}
              rows={4}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingReview(false)}
                disabled={isReviewPending}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleSaveReview}
                disabled={isReviewPending || !editReviewContent.trim()}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        ) : review.spoiler && !showSpoiler ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSpoiler(true)}
          >
            Afficher le contenu spoiler
          </Button>
        ) : (
          <p className="leading-6">{optimisticContent}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <ReviewLikeButton
          reviewId={review.id}
          initialLikesCount={review.likes.length}
          initialHasLiked={review.likes.some((like) => like.id === viewerId)}
        />
      </div>
      {optimisticComments.length > 0 ? (
        <div className="space-y-3 rounded-2xl border border-border/40 bg-card/50 p-4">
          {optimisticComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              reviewId={review.id}
              viewerId={viewerId}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
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

