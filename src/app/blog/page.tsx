import Link from "next/link";

import AppShell from "@/components/layout/app-shell";
import BackButton from "@/components/layout/back-button";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { getAllPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog",
  description:
    "Articles et actualités BookMarkd : tops livres, conseils pour organiser sa PAL, journal de lecture et découvertes de la communauté.",
  openGraph: {
    title: "Blog · BookMarkd",
    description:
      "Articles et actualités BookMarkd : tops livres, conseils pour organiser sa PAL, journal de lecture et découvertes de la communauté.",
    url: "https://bookmarkd.app/blog",
    siteName: "BookMarkd",
    type: "website",
  },
};

const BlogListPage = async () => {
  const posts = await getAllPosts();

  return (
    <AppShell>
      <div className="space-y-10">
        <div className="flex flex-wrap items-center gap-4">
          <BackButton ariaLabel="Retour à la page précédente" />
          <Breadcrumb
            items={[
              { label: "Accueil", href: "/" },
              { label: "Blog", href: "/blog" },
            ]}
          />
        </div>
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">Blog</h1>
          <p className="text-muted-foreground text-sm">
            Conseils lecture, tops de la communauté et actualités BookMarkd.
          </p>
        </header>
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                aria-label={`Lire l'article : ${post.title}`}
                className="group block rounded-xl border border-border/60 bg-card/80 p-6 transition hover:border-border hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <article className="space-y-2">
                  <time
                    dateTime={post.publishedAt.toISOString()}
                    className="text-muted-foreground text-xs"
                  >
                    {post.publishedAt.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                  <h2 className="mt-1 text-xl font-semibold text-foreground group-hover:text-primary">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {post.description}
                  </p>
                  <span className="mt-3 inline-flex items-center text-sm font-medium text-primary underline-offset-2 group-hover:underline">
                    Lire l&apos;article →
                  </span>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
};

export default BlogListPage;
