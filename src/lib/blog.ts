import db from "@/lib/supabase/db";
import {
  getAllPosts as getHardcodedPosts,
  getPostBySlug as getHardcodedPostBySlug,
} from "@/content/blog/posts";

export type { BlogPost } from "@/content/blog/posts";

/**
 * Récupère tous les articles publiés depuis la base de données,
 * avec fallback sur les articles hardcodés si la table n'existe pas encore.
 */
export const getAllPosts = async () => {
  try {
    const { data, error } = await db.client
      .from("blog_posts")
      .select(
        "slug, title, description, body, image_url, published_at, updated_at",
      )
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return getHardcodedPosts();
    }

    return data.map(
      (row: {
        slug: string;
        title: string;
        description: string;
        body: string;
        image_url: string | null;
        published_at: string;
        updated_at: string | null;
      }) => ({
        slug: row.slug,
        title: row.title,
        description: row.description,
        body: row.body,
        image: row.image_url ?? undefined,
        publishedAt: new Date(row.published_at),
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      }),
    );
  } catch {
    return getHardcodedPosts();
  }
};

/**
 * Récupère un article par slug depuis la base de données,
 * avec fallback sur les articles hardcodés.
 */
export const getPostBySlug = async (slug: string) => {
  try {
    const { data, error } = await db.client
      .from("blog_posts")
      .select(
        "slug, title, description, body, image_url, published_at, updated_at",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) {
      return getHardcodedPostBySlug(slug) ?? null;
    }

    return {
      slug: data.slug as string,
      title: data.title as string,
      description: data.description as string,
      body: data.body as string,
      image: (data.image_url as string | null) ?? undefined,
      publishedAt: new Date(data.published_at as string),
      updatedAt: data.updated_at
        ? new Date(data.updated_at as string)
        : undefined,
    };
  } catch {
    return getHardcodedPostBySlug(slug) ?? null;
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
