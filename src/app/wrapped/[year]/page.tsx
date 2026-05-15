import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";
import { getWrappedStats } from "@/features/wrapped/server/get-wrapped-stats";
import { isValidYear } from "@/lib/wrapped/utils";
import WrappedContainer from "@/components/wrapped/WrappedContainer";
import BackButton from "@/components/layout/back-button";

type WrappedPageProps = {
  params: Promise<{ year: string }>;
};

export const metadata: Metadata = {
  title: "Bookmarkd Wrapped",
  description: "Découvrez vos statistiques de lecture de l'année",
  robots: { index: false, follow: false },
};

const WrappedPage = async ({ params }: WrappedPageProps) => {
  const session = await getCurrentSession();
  const userId = await resolveSessionUserId(session);

  if (!userId) {
    redirect("/login");
  }

  const { year: yearParam } = await params;
  const year = parseInt(yearParam, 10);

  if (isNaN(year) || !isValidYear(year)) {
    redirect("/feed");
  }

  const stats = await getWrappedStats(userId, year);

  if (!stats) {
    return (
      <>
        <div className="flex min-h-screen flex-col items-center justify-center gap-6">
          <BackButton ariaLabel="Retour à la page précédente" />
          <div className="text-center">
            <h1 className="text-2xl font-bold">Erreur</h1>
            <p className="mt-2 text-muted-foreground">
              Impossible de charger vos statistiques. Veuillez réessayer plus
              tard.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-201px)] flex-col overflow-hidden px-4 py-4 md:-mx-6 md:-my-10 md:h-[calc(100dvh-225px)] md:px-6 md:py-6">
      <WrappedContainer stats={stats} />
    </div>
  );
};

export default WrappedPage;
