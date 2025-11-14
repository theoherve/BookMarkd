import type { Metadata } from "next";

import AppShell from "@/components/layout/app-shell";
import SignUpForm from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Rejoignez BookMarkd pour suivre vos lectures et celles de vos ami·e·s.",
};

const SignUpPage = () => {
  return (
    <AppShell>
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 lg:flex-row">
          <section className="w-full space-y-6 rounded-3xl border border-border bg-card/50 p-10 shadow-sm backdrop-blur lg:w-1/2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              BookMarkd
            </p>
            <h1 className="text-3xl font-semibold text-foreground">
              Le club de lecture social
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Créez votre compte pour organiser vos lectures, suivre celles de
              vos ami·e·s et obtenir des recommandations personnalisées. Votre
              bibliothèque devient collaborative et inspirante.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Vous pourrez :</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Classer vos livres (À lire / En cours / Terminé).</li>
                <li>Noter et commenter chaque lecture.</li>
                <li>Créer des listes collaboratives avec vos proches.</li>
                <li>Recevoir des recommandations basées sur vos goûts.</li>
              </ul>
            </div>
          </section>
          <section className="w-full lg:w-1/2">
            <SignUpForm />
          </section>
        </div>
      </div>
    </AppShell>
  );
};

export default SignUpPage;

