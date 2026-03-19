import Link from "next/link";
import AppShell from "@/components/layout/app-shell";
import BlogPreview from "@/components/blog/blog-preview";
import FeedPreview from "@/components/feed/feed-preview";
import HomeSearchBar from "@/components/search/home-search-bar";
import PublicListCard from "@/components/lists/public-list-card";
import { EditorialPreview } from "@/components/editorial/editorial-preview";
import { WebsiteJsonLd } from "@/components/seo/website-json-ld";
import { Badge } from "@/components/ui/badge";
import { getPublishedEditorialLists } from "@/features/editorial/server/get-published-editorial-lists";
import { getPublicLists } from "@/features/lists/server/get-public-lists";

const HomePage = async () => {
  const [editorialLists, publicLists] = await Promise.all([
    getPublishedEditorialLists(4),
    getPublicLists(4),
  ]);
  return (
    <AppShell>
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
          {/* <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/60 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Fil d’actualité</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Explorez les notes, activités et recommandations de votre réseau.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full text-primary-foreground!">
                  <Link href="/feed" aria-label="Ouvrir le fil d’actualité">
                    Ouvrir le feed
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Vos listes</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Retrouvez toutes vos collections personnelles et collaboratives.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/lists" aria-label="Accéder à vos listes">
                    Voir les listes
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Profil</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Consultez votre bio, vos statistiques et vos prochaines lectures.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/profiles/me" aria-label="Accéder à votre profil">
                    Voir mon profil
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div> */}


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

        {editorialLists.length > 0 && (
          <section className="space-y-4">
            <header className="flex flex-col gap-1">
              <h2 className="text-2xl font-semibold text-foreground">Tendances & Actu littéraire</h2>
              <p className="text-sm text-muted-foreground">
                Best-sellers internationaux, prix littéraires et sélections du moment.
              </p>
            </header>
            <EditorialPreview lists={editorialLists} />
          </section>
        )}

        {publicLists.length > 0 && (
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
            <div className="grid gap-6 md:grid-cols-2">
              {publicLists.map((list) => (
                <PublicListCard key={list.id} list={list} />
              ))}
            </div>
          </section>
        )}

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
    </AppShell>
  );
};

export default HomePage;
