"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Star, X } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { saveBookFromDiscover } from "@/server/actions/discover";

import type { DiscoverCandidate } from "../types";
import {
  isDiscoverActionsFormDirty,
  toggleArrayMember,
} from "../form-helpers";

type FollowOption = {
  id: string;
  displayName: string;
  username: string | null;
};

type Props = {
  book: DiscoverCandidate | null;
  open: boolean;
  follows: FollowOption[];
  onClose: () => void;
  onSaved: (book: DiscoverCandidate) => void;
};

type ReadingStatus = "to_read" | "reading" | "finished";
type ReviewVisibility = "public" | "friends" | "private";

const statusOptions: Array<{ value: ReadingStatus; label: string; help: string }> = [
  { value: "to_read", label: "À lire", help: "Dans ma pile" },
  { value: "reading", label: "En cours", help: "Je le lis" },
  { value: "finished", label: "Lu", help: "Terminé" },
];

const visibilityOptions: Array<{ value: ReviewVisibility; label: string }> = [
  { value: "public", label: "Public" },
  { value: "friends", label: "Amis" },
  { value: "private", label: "Privé" },
];

export const DiscoverActionsSheet = ({
  book,
  open,
  follows,
  onClose,
  onSaved,
}: Props) => {
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent
        side="top"
        className="max-h-[100dvh] rounded-b-[28px] border-amber-900/15 bg-[#fdfaf5] p-0 dark:border-amber-100/15 dark:bg-[#0f0c0a]"
      >
        {book ? (
          <DiscoverActionsForm
            key={book.id}
            book={book}
            follows={follows}
            onClose={onClose}
            onSaved={onSaved}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
};

type FormProps = {
  book: DiscoverCandidate;
  follows: FollowOption[];
  onClose: () => void;
  onSaved: (book: DiscoverCandidate) => void;
};

const DiscoverActionsForm = ({ book, follows, onClose, onSaved }: FormProps) => {
  const [status, setStatus] = useState<ReadingStatus>("to_read");
  const [rating, setRating] = useState<number>(0);
  const [reviewContent, setReviewContent] = useState("");
  const [visibility, setVisibility] = useState<ReviewVisibility>("public");
  const [recommendIds, setRecommendIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const firstFieldRef = useRef<HTMLButtonElement>(null);

  // Focus 1er champ au mount (key={book.id} garantit fresh mount par livre)
  useEffect(() => {
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 100);
    return () => window.clearTimeout(t);
  }, []);

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const res = await saveBookFromDiscover({
        bookId: book.id,
        status,
        rating: rating > 0 ? rating : null,
        reviewContent: reviewContent.trim() || null,
        reviewVisibility: visibility,
        recommendToUserIds: recommendIds,
      });
      if (res.success) {
        onSaved(book);
      } else {
        setError(res.message);
      }
    });
  };

  const handleClose = () => {
    if (isDiscoverActionsFormDirty({ rating, reviewContent, recommendIds })) {
      const confirmed = window.confirm(
        "Abandonner les modifications ? Vos saisies ne seront pas conservées.",
      );
      if (!confirmed) return;
    }
    onClose();
  };

  const toggleRecommend = (userId: string) => {
    setRecommendIds((prev) => toggleArrayMember(prev, userId));
  };

  return (
    <div className="relative flex max-h-dvh flex-col">
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 px-5 pb-4 pt-3 md:grid-cols-2 md:gap-y-4 md:px-6 md:pb-5 md:pt-4">
        {/* Header (spans 2 cols on desktop) */}
        <div className="md:col-span-2 flex items-start gap-3">
          <div className="relative aspect-2/3 w-12 shrink-0 overflow-hidden rounded-sm shadow-md ring-1 ring-amber-900/10 dark:ring-amber-100/15 md:w-14">
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#e8dfd0] dark:bg-[#2a221c]">
                <BookOpen className="size-5 text-amber-900/40 dark:text-amber-100/40" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-900/55 dark:text-amber-100/50">
              Ranger ce livre
            </div>
            <SheetTitle className="mt-0.5 font-display text-lg font-medium italic leading-tight text-[#1f140d] dark:text-[#f7f1ea] truncate">
              {book.title}
            </SheetTitle>
            <SheetDescription className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-900/65 dark:text-amber-100/55 truncate">
              {book.author}
            </SheetDescription>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer"
            className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-amber-900/15 text-amber-900 transition hover:bg-amber-900/10 dark:border-amber-100/15 dark:text-amber-100"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Left col: Statut + Note */}
        <div className="space-y-3">
          <fieldset>
            <legend className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-amber-900/55 dark:text-amber-100/50">
              Statut <span aria-hidden className="text-rose-700">*</span>
            </legend>
            <div className="grid grid-cols-3 gap-1.5">
              {statusOptions.map((opt, idx) => (
                <button
                  key={opt.value}
                  ref={idx === 0 ? firstFieldRef : undefined}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  aria-pressed={status === opt.value}
                  className={`flex min-h-[44px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 px-2 py-1.5 text-center transition ${
                    status === opt.value
                      ? "border-orange-700 bg-orange-700/10 text-orange-900 dark:border-orange-300 dark:bg-orange-300/10 dark:text-orange-100"
                      : "border-amber-900/15 text-[#1f140d]/70 hover:border-amber-900/30 dark:border-amber-100/15 dark:text-[#f7f1ea]/70"
                  }`}
                >
                  <span className="text-xs font-semibold leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-amber-900/55 dark:text-amber-100/50">
              Note (optionnel)
            </legend>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star === rating ? 0 : star)}
                  aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
                  aria-pressed={star <= rating}
                  className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md transition hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`size-6 transition ${
                      star <= rating
                        ? "fill-amber-500 text-amber-500"
                        : "text-amber-900/25 dark:text-amber-100/25"
                    }`}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
              {rating > 0 ? (
                <span className="ml-1.5 font-mono text-xs text-amber-900/70 dark:text-amber-100/65">
                  {rating}/5
                </span>
              ) : null}
            </div>
          </fieldset>
        </div>

        {/* Right col: Commentaire */}
        <div>
          <label
            htmlFor="discover-review"
            className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.25em] text-amber-900/55 dark:text-amber-100/50"
          >
            Commentaire (optionnel)
          </label>
          <textarea
            id="discover-review"
            rows={3}
            value={reviewContent}
            onChange={(e) => setReviewContent(e.target.value)}
            maxLength={800}
            placeholder="Ce que vous voulez en dire…"
            className="w-full resize-none rounded-lg border border-amber-900/15 bg-[#fdfaf5] px-3 py-2 text-sm leading-relaxed text-[#1f140d] placeholder:text-amber-900/35 focus:border-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-700/20 dark:border-amber-100/15 dark:bg-[#1a1612] dark:text-[#f7f1ea] dark:placeholder:text-amber-100/30"
          />
          {reviewContent.length > 0 ? (
            <div className="mt-1.5 flex items-center justify-between">
              <div className="inline-flex rounded-full border border-amber-900/15 bg-[#fdfaf5] p-0.5 dark:border-amber-100/15 dark:bg-[#1a1612]">
                {visibilityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisibility(opt.value)}
                    aria-pressed={visibility === opt.value}
                    className={`cursor-pointer rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-wider transition ${
                      visibility === opt.value
                        ? "bg-[#1f140d] text-[#fdfaf5] dark:bg-[#f7f1ea] dark:text-[#1f140d]"
                        : "text-amber-900/70 dark:text-amber-100/60"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <span className="font-mono text-[9px] text-amber-900/40 dark:text-amber-100/40">
                {reviewContent.length}/800
              </span>
            </div>
          ) : null}
        </div>

        {/* Recommander (full width) */}
        {follows.length > 0 ? (
          <div className="md:col-span-2">
            <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-amber-900/55 dark:text-amber-100/50">
              Recommander à (optionnel)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {follows.slice(0, 8).map((user) => {
                const active = recommendIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleRecommend(user.id)}
                    aria-pressed={active}
                    className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${
                      active
                        ? "border-emerald-700 bg-emerald-700/10 text-emerald-900 dark:border-emerald-300 dark:bg-emerald-300/10 dark:text-emerald-100"
                        : "border-amber-900/15 text-[#1f140d]/70 hover:border-amber-900/30 dark:border-amber-100/15 dark:text-[#f7f1ea]/70"
                    }`}
                  >
                    {active ? <Check className="size-3" /> : null}
                    {user.displayName}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            aria-live="assertive"
            className="md:col-span-2 rounded-lg border border-rose-700/30 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-300/30 dark:bg-rose-900/30 dark:text-rose-100"
          >
            {error}
          </div>
        ) : null}

        <div className="md:col-span-2 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1f140d] px-5 py-2.5 text-sm font-medium text-[#fdfaf5] transition hover:bg-[#2f1c11] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#f7f1ea] dark:text-[#1f140d] dark:hover:bg-amber-50"
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
          {book.slug ? (
            <Link
              href={`/books/${book.slug}`}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-amber-900/30 px-5 py-2.5 text-sm font-medium text-[#1f140d] transition hover:bg-amber-900/5 dark:border-amber-100/25 dark:text-[#f7f1ea] dark:hover:bg-amber-100/5"
            >
              Page complète
              <ArrowRight className="size-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
};
