"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles, Trash2 } from "lucide-react";

import {
  removeFromDiscoverWishlist,
  saveBookFromDiscover,
} from "@/server/actions/discover";

import type { DiscoverWishlistEntry } from "../types";

type Props = {
  entries: DiscoverWishlistEntry[];
};

export const EnviesGrid = ({ entries }: Props) => {
  const [items, setItems] = useState(entries);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const runOptimisticAction = (
    bookId: string,
    action: () => Promise<{ success: true } | { success: false; message: string }>,
  ) => {
    setPendingId(bookId);
    setError(null);
    const prev = items;
    setItems((cur) => cur.filter((e) => e.bookId !== bookId));
    startTransition(async () => {
      const res = await action();
      if (!res.success) {
        setItems(prev);
        setError(res.message);
      }
      setPendingId(null);
    });
  };

  const handleRemove = (bookId: string) =>
    runOptimisticAction(bookId, () => removeFromDiscoverWishlist(bookId));

  const handleQuickAdd = (entry: DiscoverWishlistEntry) =>
    runOptimisticAction(entry.bookId, () =>
      saveBookFromDiscover({ bookId: entry.bookId, status: "to_read" }),
    );

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-900/20 bg-[#fdfaf5]/50 px-6 py-16 text-center dark:border-amber-100/15 dark:bg-[#1a1612]/50">
        <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full border border-amber-900/15 bg-[#fdfaf5] dark:border-amber-100/15 dark:bg-[#0f0c0a]">
          <Sparkles
            className="size-7 text-amber-700 dark:text-amber-300"
            strokeWidth={1.5}
          />
        </div>
        <h2 className="font-display text-xl font-medium italic text-[#1f140d] dark:text-[#f7f1ea]">
          Aucune envie pour le moment
        </h2>
        <p className="mt-2 max-w-sm text-sm text-amber-900/65 dark:text-amber-100/55">
          Découvrez de nouveaux livres et swipez à droite pour les ajouter à
          vos envies.
        </p>
        <Link
          href="/discover"
          className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#1f140d] px-5 py-2.5 text-sm font-medium text-[#fdfaf5] transition hover:bg-[#2f1c11] dark:bg-[#f7f1ea] dark:text-[#1f140d]"
        >
          Découvrir des livres
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-700/30 bg-rose-50 px-4 py-2.5 text-sm text-rose-900 dark:border-rose-300/30 dark:bg-rose-900/30 dark:text-rose-100"
        >
          {error}
        </div>
      ) : null}

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((entry) => {
          const isPending = pendingId === entry.bookId;
          const detailHref = entry.slug ? `/books/${entry.slug}` : null;

          return (
            <li
              key={entry.bookId}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border border-amber-900/10 bg-[#fdfaf5] shadow-sm transition hover:shadow-md dark:border-amber-100/10 dark:bg-[#1a1612] ${
                isPending ? "opacity-50" : ""
              }`}
            >
              {detailHref ? (
                <Link
                  href={detailHref}
                  className="relative block aspect-2/3 w-full overflow-hidden bg-[#e8dfd0] dark:bg-[#2a221c]"
                >
                  {entry.coverUrl ? (
                    <Image
                      src={entry.coverUrl}
                      alt={`Couverture de ${entry.title}`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BookOpen className="size-10 text-amber-900/40 dark:text-amber-100/40" />
                    </div>
                  )}
                </Link>
              ) : (
                <div className="relative aspect-2/3 w-full overflow-hidden bg-[#e8dfd0] dark:bg-[#2a221c]">
                  {entry.coverUrl ? (
                    <Image
                      src={entry.coverUrl}
                      alt={`Couverture de ${entry.title}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 20vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BookOpen className="size-10 text-amber-900/40 dark:text-amber-100/40" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex-1">
                  <h3 className="font-display text-sm font-medium italic leading-tight text-[#1f140d] line-clamp-2 dark:text-[#f7f1ea]">
                    {entry.title}
                  </h3>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-900/65 dark:text-amber-100/55 truncate">
                    {entry.author}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(entry)}
                    disabled={isPending}
                    className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-full bg-[#1f140d] px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[#fdfaf5] transition hover:bg-[#2f1c11] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#f7f1ea] dark:text-[#1f140d]"
                  >
                    À lire
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(entry.bookId)}
                    disabled={isPending}
                    aria-label={`Retirer ${entry.title} des envies`}
                    className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-amber-900/15 text-amber-900/70 transition hover:border-rose-700 hover:bg-rose-700/10 hover:text-rose-700 disabled:cursor-not-allowed dark:border-amber-100/15 dark:text-amber-100/55"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
