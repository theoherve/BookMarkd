import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import LoginForm from "@/components/auth/login-form";
import { getCurrentSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à BookMarkd pour retrouver vos lectures.",
};

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const session = await getCurrentSession();
  const params = await searchParams;

  if (session?.user) {
    const callbackUrlRaw = params?.callbackUrl;
    const callbackUrl = Array.isArray(callbackUrlRaw)
      ? callbackUrlRaw[0]
      : callbackUrlRaw;
    const redirectUrl = callbackUrl && typeof callbackUrl === "string" && callbackUrl.startsWith("/")
      ? callbackUrl
      : "/";
    redirect(redirectUrl);
  }

  const callbackUrlRaw = params?.callbackUrl;
  const callbackUrl = Array.isArray(callbackUrlRaw)
    ? callbackUrlRaw[0]
    : callbackUrlRaw;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 lg:flex-row">
        <section className="w-full space-y-6 rounded-3xl border border-border bg-card/60 p-10 shadow-sm backdrop-blur lg:w-1/2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            BookMarkd
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            Lettre de noblesse pour vos lectures
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Connectez-vous pour suivre vos lectures, découvrir celles de vos
            ami·e·s et recevoir des recommandations sélectionnées rien que pour
            vous.
          </p>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Ce que vous débloquez :</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Feed social personnalisé et historique d’activité.</li>
              <li>Notation rapide et commentaires privés ou partagés.</li>
              <li>Listes thématiques collaboratives.</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            En vous connectant, vous acceptez nos{" "}
            <Link
              href="#"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              conditions d’utilisation
            </Link>{" "}
            et notre{" "}
            <Link
              href="#"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              politique de confidentialité
            </Link>
            .
          </p>
        </section>

        <section className="w-full lg:w-1/2">
          <LoginForm callbackUrl={callbackUrl} />
        </section>
      </div>
    </div>
  );
};

export default LoginPage;

