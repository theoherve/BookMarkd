import { notFound } from "next/navigation";
import type { Metadata } from "next";

import AppShell from "@/components/layout/app-shell";
import { BlogBody } from "@/components/blog/blog-body";
import BackLink from "@/components/layout/back-link";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { ArticleJsonLd } from "@/components/seo/article-json-ld";
import { getPostBySlug, getAllPosts } from "@/lib/blog";

const BASE_URL = "https://bookmarkd.app";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export const generateStaticParams = async () => {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
};

export const generateMetadata = async ({
  params,
}: BlogPostPageProps): Promise<Metadata> => {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return {};
  }
  const url = `${BASE_URL}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: "BookMarkd",
      locale: "fr_FR",
      type: "article",
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      images: post.image ? [post.image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : undefined,
    },
  };
};

const BlogPostPage = async ({ params }: BlogPostPageProps) => {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const url = `${BASE_URL}/blog/${post.slug}`;

  return (
    <AppShell>
      <ArticleJsonLd
        headline={post.title}
        description={post.description}
        url={url}
        datePublished={post.publishedAt}
        dateModified={post.updatedAt}
        image={post.image}
      />
      <div className="mx-auto flex max-w-5xl flex-col gap-6 py-8 sm:py-10 lg:py-12">
        <BackLink
          href="/blog"
          label="Retour au blog"
          ariaLabel="Retour à la liste des articles du blog"
        />
        <Breadcrumb
          items={[
            { label: "Accueil", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: post.title, href: `/blog/${post.slug}` },
          ]}
        />
        <section
          aria-label={`Article du blog : ${post.title}`}
          className="relative w-full max-w-4xl px-4 sm:px-0"
        >
          {/* Reliure détachée sur la gauche, avec gros relief vers l'intérieur */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-1 left-0 w-12 rounded-r-3xl bg-[#e0d0b8] shadow-[40px_0_120px_rgba(0,0,0,0.30)] ring-1 ring-black/5 dark:bg-zinc-800 dark:shadow-[40px_0_120px_rgba(0,0,0,0.70)] z-20"
          />
          <div className="relative z-10 ml-10 overflow-hidden rounded-l-3xl border border-border/60 bg-[#f6f1e7] shadow-[0_24px_70px_rgba(0,0,0,0.16)] dark:bg-zinc-900">
            <div className="px-7 py-7 pl-12 sm:px-10 sm:py-9 sm:pl-16 lg:px-12 lg:py-10">
              <header className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="inline-flex items-center rounded-full bg-muted/80 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.25em] text-muted-foreground">
                    Article du blog
                  </p>
                  <time
                    dateTime={post.publishedAt.toISOString()}
                    className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground"
                  >
                    {post.publishedAt.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {post.title}
                </h1>
                <p className="text-base text-muted-foreground sm:text-lg">
                  {post.description}
                </p>
              </header>
              <div className="mt-6">
                <BlogBody body={post.body} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default BlogPostPage;
