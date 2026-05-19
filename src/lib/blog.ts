import db from "@/lib/supabase/db";
import {
  getAllPosts as getHardcodedPosts,
  getPostBySlug as getHardcodedPostBySlug,
} from "@/content/blog/posts";
import type { BlogFeaturedCover, BlogPost } from "@/content/blog/posts";

export type { BlogPost, BlogFeaturedCover } from "@/content/blog/posts";

const resolveFeaturedCovers = async (
  posts: BlogPost[],
): Promise<BlogPost[]> => {
  const allIds = Array.from(
    new Set(posts.flatMap((p) => p.featuredBooks ?? [])),
  ).filter(Boolean);

  if (allIds.length === 0) return posts;

  const { data: books, error } = await db.client
    .from("books")
    .select("id, title, cover_url")
    .in("id", allIds);

  if (error || !books) return posts;

  const coverById = new Map<string, BlogFeaturedCover>();
  for (const book of books as Array<{
    id: string;
    title: string;
    cover_url: string | null;
  }>) {
    if (!book.cover_url) continue;
    coverById.set(book.id, {
      id: book.id,
      title: book.title,
      coverUrl: book.cover_url,
    });
  }

  return posts.map((post) => {
    if (!post.featuredBooks || post.featuredBooks.length === 0) return post;
    const featuredCovers = post.featuredBooks
      .map((id) => coverById.get(id))
      .filter((c): c is BlogFeaturedCover => Boolean(c));
    return featuredCovers.length > 0 ? { ...post, featuredCovers } : post;
  });
};

/**
 * Récupère tous les articles publiés depuis la base de données,
 * avec fallback sur les articles hardcodés si la table n'existe pas encore.
 */
export const getAllPosts = async (): Promise<BlogPost[]> => {
  try {
    const { data, error } = await db.client
      .from("blog_posts")
      .select(
        "slug, title, description, body, image_url, published_at, updated_at, featured_books",
      )
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return resolveFeaturedCovers(await getHardcodedPosts());
    }

    const posts = data.map(
      (row: {
        slug: string;
        title: string;
        description: string;
        body: string;
        image_url: string | null;
        published_at: string;
        updated_at: string | null;
        featured_books: string[] | null;
      }): BlogPost => ({
        slug: row.slug,
        title: row.title,
        description: row.description,
        body: row.body,
        image: row.image_url ?? undefined,
        featuredBooks: row.featured_books ?? undefined,
        publishedAt: new Date(row.published_at),
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      }),
    );

    return resolveFeaturedCovers(posts);
  } catch {
    return resolveFeaturedCovers(await getHardcodedPosts());
  }
};

/**
 * Récupère un article par slug depuis la base de données,
 * avec fallback sur les articles hardcodés.
 */
export const getPostBySlug = async (
  slug: string,
): Promise<BlogPost | null> => {
  const enrich = async (post: BlogPost | null): Promise<BlogPost | null> => {
    if (!post) return null;
    const [enriched] = await resolveFeaturedCovers([post]);
    return enriched ?? post;
  };

  try {
    const { data, error } = await db.client
      .from("blog_posts")
      .select(
        "slug, title, description, body, image_url, published_at, updated_at, featured_books",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) {
      return enrich(getHardcodedPostBySlug(slug) ?? null);
    }

    return enrich({
      slug: data.slug as string,
      title: data.title as string,
      description: data.description as string,
      body: data.body as string,
      image: (data.image_url as string | null) ?? undefined,
      featuredBooks:
        ((data.featured_books as string[] | null) ?? undefined) || undefined,
      publishedAt: new Date(data.published_at as string),
      updatedAt: data.updated_at
        ? new Date(data.updated_at as string)
        : undefined,
    });
  } catch {
    return enrich(getHardcodedPostBySlug(slug) ?? null);
  }
};

export type BlogSearchResult = {
  slug: string;
  title: string;
  description: string;
};

/**
 * Recherche des articles publiés par titre et description,
 * avec fallback sur les articles hardcodés.
 */
export const searchBlogPosts = async (
  q: string,
  limit = 3,
): Promise<BlogSearchResult[]> => {
  const term = q.trim();
  try {
    const { data, error } = await db.client
      .from("blog_posts")
      .select("slug, title, description")
      .eq("status", "published")
      .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      const hardcoded = await getHardcodedPosts();
      const lower = term.toLowerCase();
      return hardcoded
        .filter(
          (p) =>
            p.title.toLowerCase().includes(lower) ||
            p.description.toLowerCase().includes(lower),
        )
        .slice(0, limit)
        .map(({ slug, title, description }) => ({ slug, title, description }));
    }

    return (data as BlogSearchResult[]).slice(0, limit);
  } catch {
    const hardcoded = await getHardcodedPosts();
    const lower = term.toLowerCase();
    return hardcoded
      .filter(
        (p) =>
          p.title.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower),
      )
      .slice(0, limit)
      .map(({ slug, title, description }) => ({ slug, title, description }));
  }
};
