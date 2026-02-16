import { redirect } from "next/navigation";

import AppShell from "@/components/layout/app-shell";
import BackButton from "@/components/layout/back-button";
import BookCreateForm from "@/components/books/book-create-form";

import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CreateBookPage = async () => {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=/books/create");
  }

  const userId = await resolveSessionUserId(session);

  if (!userId) {
    redirect("/login?callbackUrl=/books/create");
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <BackButton ariaLabel="Retour à la page précédente" />
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold text-foreground">Ajouter un livre</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Créez une nouvelle entrée dans le catalogue BookMarkd en renseignant les informations du livre.
          </p>
        </header>

        <BookCreateForm />
      </div>
    </AppShell>
  );
};

export default CreateBookPage;

