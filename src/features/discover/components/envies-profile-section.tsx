import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Heart, Sparkles } from "lucide-react";

import type { WishlistPreviewEntry } from "@/features/profile/types";

type Props = {
  preview: WishlistPreviewEntry[];
  total: number;
};

export const EnviesProfileSection = ({ preview, total }: Props) => {
  const hasItems = total > 0;

  return (
    <div className="rounded-2xl border border-amber-900/10 bg-card/80 p-6 shadow-sm dark:border-amber-100/10 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-700/30 bg-rose-50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-rose-900 dark:border-rose-300/30 dark:bg-rose-900/30 dark:text-rose-100">
            <Heart className="size-3 fill-current" />
            Envies
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            {hasItems
              ? `${total} livre${total > 1 ? "s" : ""} en attente`
              : "Vos envies vous attendent"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Livres ajoutés via la découverte (swipe à droite).
          </p>
        </div>
        {hasItems ? (
          <Link
            href="/discover/envies"
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-amber-900/20 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-amber-900/5 dark:border-amber-100/15 dark:hover:bg-amber-100/5"
          >
            Tout voir
            <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </div>

      {!hasItems ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-amber-900/20 px-4 py-8 text-center dark:border-amber-100/15">
          <Sparkles
            className="mb-3 size-7 text-amber-700/70 dark:text-amber-300/70"
            strokeWidth={1.5}
          />
          <p className="max-w-xs text-sm text-muted-foreground">
            Swipez à droite dans la découverte pour ajouter des livres ici.
          </p>
          <Link
            href="/discover"
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#1f140d] px-4 py-2 text-xs font-medium text-[#fdfaf5] transition hover:bg-[#2f1c11] dark:bg-[#f7f1ea] dark:text-[#1f140d]"
          >
            Découvrir des livres
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {preview.map((entry) => {
            const hasSlug = Boolean(entry.slug);
            const className =
              "group relative block aspect-2/3 overflow-hidden rounded-md bg-[#e8dfd0] shadow-sm transition dark:bg-[#2a221c]";

            const content = (
              <>
                {entry.coverUrl ? (
                  <Image
                    src={entry.coverUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 33vw, 16vw"
                    className={`object-cover ${hasSlug ? "transition group-hover:scale-105" : ""}`}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookOpen className="size-8 text-amber-900/40 dark:text-amber-100/40" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                  <p className="line-clamp-2 text-[10px] font-medium leading-tight text-white">
                    {entry.title}
                  </p>
                </div>
              </>
            );

            return (
              <li key={entry.bookId}>
                {hasSlug ? (
                  <Link
                    href={`/books/${entry.slug}`}
                    className={`${className} cursor-pointer hover:shadow-md`}
                    aria-label={`${entry.title} de ${entry.author}`}
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    className={`${className} cursor-default`}
                    aria-label={`${entry.title} de ${entry.author}`}
                    title="Page produit indisponible"
                  >
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
