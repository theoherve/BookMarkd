import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";

import AppShell from "@/components/layout/app-shell";
import FeedbackForm from "@/components/feedback/feedback-form";
import { Badge } from "@/components/ui/badge";

import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FeedbackPage = async () => {
  noStore();

  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=/feedback");
  }

  const userId = await resolveSessionUserId(session);

  if (!userId) {
    redirect("/login?callbackUrl=/feedback");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <Badge className="w-fit bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Feedback
          </Badge>
          <h1 className="text-3xl font-semibold text-foreground">
            Suggérer une fonctionnalité ou rapporter une erreur
          </h1>
          <p className="text-sm text-muted-foreground">
            Votre opinion est importante ! Aidez-nous à améliorer BookMarkd en
            partageant vos suggestions ou en signalant les problèmes que vous
            rencontrez.
          </p>
        </header>

        <FeedbackForm />
      </div>
    </AppShell>
  );
};

export default FeedbackPage;
