import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";
import { getWrappedStats } from "@/features/wrapped/server/get-wrapped-stats";
import { isValidYear } from "@/lib/wrapped/utils";
import WrappedContainer from "@/components/wrapped/WrappedContainer";
import AppShell from "@/components/layout/app-shell";

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
      <AppShell>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Erreur</h1>
            <p className="mt-2 text-muted-foreground">
              Impossible de charger vos statistiques. Veuillez réessayer plus
              tard.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <div className="overflow-hidden">
      <WrappedContainer stats={stats} />
    </div>
  );
};

export default WrappedPage;
