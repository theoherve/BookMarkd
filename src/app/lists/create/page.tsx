import { redirect } from "next/navigation";

import AppShell from "@/components/layout/app-shell";
import BackLink from "@/components/layout/back-link";
import ListCreateForm from "@/components/lists/list-create-form";

import { getCurrentSession } from "@/lib/auth/session";

const CreateListPage = async () => {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/lists/create");
  }

  const ownerName = session.user.name ?? "Vous";

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <BackLink href="/lists" label="Retour aux listes" ariaLabel="Retour à la page des listes" />
        <ListCreateForm ownerName={ownerName} />
      </div>
    </AppShell>
  );
};

export default CreateListPage;

