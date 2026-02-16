import { notFound } from "next/navigation";
import type { Metadata } from "next";

import AppShell from "@/components/layout/app-shell";
import { BlogBody } from "@/components/blog/blog-body";
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
      <article className="space-y-8">
        <Breadcrumb
          items={[
            { label: "Accueil", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: post.title, href: `/blog/${post.slug}` },
          ]}
        />
        <header className="space-y-2">
          <time
            dateTime={post.publishedAt.toISOString()}
            className="text-muted-foreground text-sm"
          >
            {post.publishedAt.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
          <h1 className="text-3xl font-semibold text-foreground">
            {post.title}
          </h1>
          <p className="text-muted-foreground text-lg">{post.description}</p>
        </header>
        <BlogBody body={post.body} />
      </article>
    </AppShell>
  );
};

export default BlogPostPage;
