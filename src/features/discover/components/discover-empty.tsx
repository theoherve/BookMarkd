import Link from "next/link";
import { Sparkles } from "lucide-react";

export const DiscoverEmpty = () => {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-6 py-16 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 -z-10 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="inline-flex size-20 items-center justify-center rounded-full border border-amber-900/15 bg-[#fdfaf5] dark:border-amber-100/15 dark:bg-[#1a1612]">
          <Sparkles
            className="size-9 text-amber-700 dark:text-amber-300"
            strokeWidth={1.5}
          />
        </div>
      </div>
      <h2 className="font-display text-3xl font-medium italic text-[#1f140d] dark:text-[#f7f1ea]">
        Plus rien à découvrir
      </h2>
      <p className="mt-3 text-sm text-amber-900/70 dark:text-amber-100/65">
        Vous avez parcouru toutes nos recommandations du moment. Revenez bientôt
        ou explorez les tendances pour trouver votre prochaine lecture.
      </p>
      <div className="mt-7 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/tendances"
          className="inline-flex items-center justify-center rounded-full bg-[#1f140d] px-5 py-3 text-sm font-medium text-amber-50 transition hover:bg-[#2f1c11] dark:bg-[#f7f1ea] dark:text-[#1f140d]"
        >
          Voir les tendances
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center justify-center rounded-full border border-amber-900/30 px-5 py-3 text-sm font-medium text-[#1f140d] transition hover:bg-amber-900/5 dark:border-amber-100/25 dark:text-[#f7f1ea]"
        >
          Rechercher un livre
        </Link>
      </div>
    </div>
  );
};
