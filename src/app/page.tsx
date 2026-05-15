import { Suspense } from "react";
import Link from "next/link";
import BlogPreview from "@/components/blog/blog-preview";
import FeedPreview from "@/components/feed/feed-preview";
import HomeSearchBar from "@/components/search/home-search-bar";
import { BookOpen, ChevronRight, User } from "lucide-react";
import { EditorialPreview } from "@/components/editorial/editorial-preview";
import { WebsiteJsonLd } from "@/components/seo/website-json-ld";
import { Badge } from "@/components/ui/badge";
import { getPublishedEditorialLists } from "@/features/editorial/server/get-published-editorial-lists";
import { getPublicLists } from "@/features/lists/server/get-public-lists";

const SectionSkeleton = () => (
  <div className="space-y-4">
    <div className="h-6 w-1/3 animate-pulse rounded-md bg-muted/70" />
    <div className="h-32 animate-pulse rounded-xl bg-muted/50" />
  </div>
);

const EditorialSection = async () => {
  const editorialLists = await getPublishedEditorialLists(4);
  if (editorialLists.length === 0) return null;
  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold text-foreground">Tendances & Actu littéraire</h2>
        <p className="text-sm text-muted-foreground">
          Best-sellers internationaux, prix littéraires et sélections du moment.
        </p>
      </header>
      <EditorialPreview lists={editorialLists} />
    </section>
  );
};

const PublicListsSection = async () => {
  const publicLists = await getPublicLists(4);
  if (publicLists.length === 0) return null;
  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Listes de la communauté</h2>
          <p className="text-sm text-muted-foreground">
            Les sélections partagées par les lecteur·rice·s de BookMarkd.
          </p>
        </div>
        <Link
          href="/lists"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          aria-label="Voir toutes les listes publiques"
        >
          Voir tout →
        </Link>
      </header>
      <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card/80 backdrop-blur">
        {publicLists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.id}`}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex flex-1 flex-col gap-0.5 min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {list.title}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {list.itemCount} livre{list.itemCount > 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {list.owner.displayName}
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </section>
  );
};

const HomePage = () => {
  return (
    <>
      <WebsiteJsonLd />
      <div className="space-y-12">
        <section className="space-y-6">
          <Badge className="w-fit bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Bienvenue
          </Badge>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold text-foreground">
              Pilotez votre univers de lecture avec BookMarkd
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground">
              Accédez rapidement à votre fil social, composez vos listes collaboratives, et suivez vos
              statistiques personnelles. Tout est prêt, choisissez votre prochaine action.
            </p>
          </div>
          <HomeSearchBar />
        </section>

        <section className="space-y-4">
          <header className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold text-foreground">Aperçu du fil</h2>
            <p className="text-sm text-muted-foreground">
              Un extrait de votre activité récente pour rester informé·e en un clin d’œil.
            </p>
          </header>
          <FeedPreview />
        </section>

        <Suspense fallback={<SectionSkeleton />}>
          <EditorialSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <PublicListsSection />
        </Suspense>

        <section className="space-y-4">
          <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Derniers articles du blog</h2>
              <p className="text-sm text-muted-foreground">
                Découvrez nos conseils lecture, tops de la communauté et actualités BookMarkd.
              </p>
            </div>
            <Link
              href="/blog"
              className="text-sm font-medium text-primary underline-offset-2 hover:underline"
              aria-label="Voir tous les articles du blog"
            >
              Voir tout →
            </Link>
          </header>
          <BlogPreview />
        </section>
      </div>
    </>
  );
};

export default HomePage;
