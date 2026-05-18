import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Heart } from "lucide-react";

import BackButton from "@/components/layout/back-button";
import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";
import { getDiscoverWishlist } from "@/features/discover/server/get-discover-wishlist";
import { EnviesGrid } from "@/features/discover/components/envies-grid";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Mes envies",
  description:
    "Les livres que vous avez ajoutés à votre liste d'envies depuis la découverte.",
  robots: { index: false, follow: false },
};

const EnviesPage = async () => {
  const session = await getCurrentSession();
  const userId = await resolveSessionUserId(session);

  if (!userId) {
    redirect("/login?callbackUrl=/discover/envies");
  }

  const entries = await getDiscoverWishlist(userId);

  return (
    <div className="space-y-8">
      <BackButton ariaLabel="Retour à la découverte" />

      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-700/30 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-900 dark:border-rose-300/30 dark:bg-rose-900/30 dark:text-rose-100">
          <Heart className="size-3.5 fill-current" />
          Mes envies
        </div>
        <h1 className="text-3xl font-semibold leading-tight text-[#1f140d] dark:text-[#f7f1ea] sm:text-4xl">
          {entries.length === 0
            ? "Pas encore d'envies"
            : `${entries.length} livre${entries.length > 1 ? "s" : ""} en attente`}
        </h1>
        <p className="max-w-2xl text-sm text-amber-900/70 dark:text-amber-100/65">
          Les livres ajoutés via la découverte. Rangez-les dans votre liste de
          lecture ou retirez-les.
        </p>
      </header>

      <EnviesGrid entries={entries} />
    </div>
  );
};

export default EnviesPage;
