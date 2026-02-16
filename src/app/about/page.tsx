import Link from "next/link";

import AppShell from "@/components/layout/app-shell";

export const metadata = {
  title: "À propos",
  description:
    "BookMarkd est votre hub lecture social : suivez vos livres, découvrez ceux de vos amis et recevez des recommandations personnalisées.",
  openGraph: {
    title: "À propos · BookMarkd",
    description:
      "BookMarkd est votre hub lecture social : suivez vos livres, découvrez ceux de vos amis et recevez des recommandations personnalisées.",
    url: "https://bookmarkd.app/about",
    siteName: "BookMarkd",
    type: "website",
  },
};

const AboutPage = () => {
  return (
    <AppShell>
      <div className="space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            À propos de BookMarkd
          </h1>
          <p className="text-muted-foreground text-lg">
            Votre hub lecture social pour suivre, noter et partager vos lectures.
          </p>
        </header>
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-foreground">
          <p className="text-sm leading-6">
            BookMarkd permet de garder une trace de vos livres (à lire, en cours,
            terminés), de noter et rédiger des avis, de créer des listes
            personnelles ou collaboratives, et de suivre l’activité de vos amis
            pour découvrir de nouvelles lectures.
          </p>
          <p className="text-sm leading-6">
            Que vous teniez un simple journal de lecture ou que vous aimiez
            partager vos coups de cœur, BookMarkd s’adapte à votre usage.
          </p>
          <p className="text-sm leading-6">
            <Link
              href="/signup"
              className="text-primary underline underline-offset-2 hover:no-underline"
            >
              Créer un compte
            </Link>
            {" · "}
            <Link
              href="/search"
              className="text-primary underline underline-offset-2 hover:no-underline"
            >
              Rechercher un livre
            </Link>
            {" · "}
            <Link
              href="/blog"
              className="text-primary underline underline-offset-2 hover:no-underline"
            >
              Blog
            </Link>
          </p>
        </div>
      </div>
    </AppShell>
  );
};

export default AboutPage;
