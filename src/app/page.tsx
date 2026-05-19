import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import BlogPreview from "@/components/blog/blog-preview";
import FeedPreview from "@/components/feed/feed-preview";
import HomeSearchBar from "@/components/search/home-search-bar";
import { ArrowRight, BookOpen, ChevronRight, ListChecks } from "lucide-react";
import { EditorialPreview } from "@/components/editorial/editorial-preview";
import { WebsiteJsonLd } from "@/components/seo/website-json-ld";
import { Badge } from "@/components/ui/badge";
import { getPublishedEditorialLists } from "@/features/editorial/server/get-published-editorial-lists";
import { getPublicLists } from "@/features/lists/server/get-public-lists";
import { getInitials } from "@/lib/utils";

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
  const publicLists = await getPublicLists(6);
  if (publicLists.length === 0) return null;
  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-chart-2/15 text-chart-2"
          >
            <ListChecks className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold text-foreground">
                Listes de la communauté
              </h2>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                {publicLists.length}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Les sélections partagées par les lecteur·rice·s.
            </p>
          </div>
        </div>
        <Link
          href="/lists"
          aria-label="Voir toutes les listes publiques"
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent/15 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="hidden sm:inline">Voir tout</span>
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </header>
      <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur">
        {publicLists.map((list) => (
          <li key={list.id}>
            <Link
              href={`/lists/${list.id}`}
              aria-label={`Voir la liste « ${list.title} » de ${list.owner.displayName}`}
              className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
            >
              <span className="relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary ring-1 ring-border">
                {list.owner.avatarUrl ? (
                  <Image
                    src={list.owner.avatarUrl}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-xs font-semibold text-secondary-foreground">
                    {getInitials(list.owner.displayName)}
                  </span>
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate text-sm font-semibold text-foreground">
                  {list.title}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="truncate">
                    par {list.owner.displayName}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1">
                    <BookOpen className="size-3" aria-hidden />
                    {list.itemCount} livre{list.itemCount > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
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
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold text-foreground">
                Derniers articles du blog
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Conseils lecture, tops communauté et actualités BookMarkd.
              </p>
            </div>
            <Link
              href="/blog"
              aria-label="Voir tous les articles du blog"
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent/15 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="hidden sm:inline">Voir tout</span>
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </header>
          <BlogPreview />
        </section>
      </div>
    </>
  );
};

export default HomePage;
