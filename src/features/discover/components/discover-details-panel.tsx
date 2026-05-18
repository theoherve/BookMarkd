"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BookOpen, Star, X } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import type { DiscoverCandidate } from "../types";

type Props = {
  book: DiscoverCandidate | null;
  open: boolean;
  onClose: () => void;
  onOpenActions: (book: DiscoverCandidate) => void;
};

export const DiscoverDetailsPanel = ({
  book,
  open,
  onClose,
  onOpenActions,
}: Props) => {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-dvh rounded-t-[28px] border-amber-900/15 bg-[#fdfaf5] p-0 dark:border-amber-100/15 dark:bg-[#0f0c0a]"
      >
        {book ? (
          <div className="relative flex max-h-dvh flex-col">
            <div className="h-1.5 w-full bg-linear-to-r from-amber-700 via-orange-600 to-rose-700" />

            <div className="grid grid-cols-1 gap-x-6 gap-y-3 px-5 pb-4 pt-4 md:grid-cols-[180px_1fr] md:gap-y-4 md:px-6 md:pb-5 md:pt-5">
              {/* Cover (left col on desktop, top on mobile) */}
              <div className="flex justify-center md:row-span-3 md:justify-start">
                <div className="relative aspect-2/3 w-24 shrink-0 overflow-hidden rounded-sm shadow-[0_15px_30px_-10px_rgba(31,20,13,0.5)] ring-1 ring-amber-900/10 dark:ring-amber-100/15 md:w-full">
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt={`Couverture de ${book.title}`}
                      fill
                      sizes="(max-width: 768px) 96px, 180px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#e8dfd0] dark:bg-[#2a221c]">
                      <BookOpen className="size-10 text-amber-900/40 dark:text-amber-100/40" />
                    </div>
                  )}
                </div>
              </div>

              {/* Title + meta */}
              <div className="min-w-0">
                <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-900/55 dark:text-amber-100/50">
                  Détails du livre
                </div>
                <SheetTitle className="mt-0.5 text-xl font-semibold leading-tight text-[#1f140d] dark:text-[#f7f1ea] md:text-2xl">
                  {book.title}
                </SheetTitle>
                <SheetDescription className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-900/70 dark:text-amber-100/60">
                  {book.author}
                  {book.publicationYear ? ` · ${book.publicationYear}` : ""}
                </SheetDescription>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-900/15 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-900 dark:border-amber-100/15 dark:bg-amber-900/30 dark:text-amber-100">
                    <span className="size-1.5 rounded-full bg-amber-700 dark:bg-amber-300" />
                    {book.compatibilityScore}% match
                  </div>
                  {typeof book.averageRating === "number" &&
                  book.averageRating > 0 ? (
                    <div className="inline-flex items-center gap-1 text-xs text-[#1f140d]/80 dark:text-[#f7f1ea]/80">
                      <Star className="size-3.5 fill-amber-500 text-amber-500" />
                      <span className="font-mono">
                        {book.averageRating.toFixed(1)}
                      </span>
                      <span className="text-amber-900/50 dark:text-amber-100/50">
                        ({book.ratingsCount})
                      </span>
                    </div>
                  ) : null}
                </div>

                {book.tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {book.tags.slice(0, 5).map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-full bg-amber-100/60 px-2 py-0.5 text-[9px] uppercase tracking-wider text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Résumé */}
              <div className="min-h-0 overflow-y-auto">
                <h3 className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-amber-900/55 dark:text-amber-100/50">
                  Résumé
                </h3>
                {book.summary ? (
                  <p className="line-clamp-5 text-xs leading-relaxed text-[#1f140d]/85 dark:text-[#f7f1ea]/80 md:line-clamp-6 md:text-sm">
                    {book.summary}
                  </p>
                ) : (
                  <p className="text-xs italic text-amber-900/55 dark:text-amber-100/55">
                    Aucun résumé disponible.
                  </p>
                )}
              </div>

              {/* Match reasons */}
              {book.matchReasons.length > 0 ? (
                <div>
                  <h3 className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-amber-900/55 dark:text-amber-100/50">
                    Pourquoi ce livre
                  </h3>
                  <ul className="flex flex-wrap gap-1.5">
                    {book.matchReasons.slice(0, 4).map((reason) => (
                      <li
                        key={`${reason.kind}-${reason.label}`}
                        className="inline-flex items-center gap-1 rounded-full border border-amber-900/15 bg-[#fdfaf5] px-2.5 py-1 text-xs text-[#1f140d]/80 dark:border-amber-100/15 dark:bg-[#1a1612] dark:text-[#f7f1ea]/75"
                      >
                        <span className="size-1 rounded-full bg-orange-600" />
                        {reason.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* CTAs (full width) */}
              <div className="flex flex-col gap-2 sm:flex-row md:col-span-2">
                <button
                  type="button"
                  onClick={() => onOpenActions(book)}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1f140d] px-5 py-2.5 text-sm font-medium text-[#fdfaf5] transition hover:bg-[#2f1c11] dark:bg-[#f7f1ea] dark:text-[#1f140d] dark:hover:bg-amber-50"
                >
                  <ArrowDown className="size-4" />
                  Ranger ce livre
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

            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-amber-900/15 bg-[#fdfaf5]/80 text-amber-900 backdrop-blur transition hover:bg-amber-900/10 dark:border-amber-100/15 dark:bg-[#0f0c0a]/70 dark:text-amber-100"
              aria-label="Fermer les détails"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};
