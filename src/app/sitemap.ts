import type { MetadataRoute } from "next";
import db from "@/lib/supabase/db";
import { generateBookSlug } from "@/lib/slug";

const BASE_URL = "https://bookmarkd.app";

type BookRow = {
  id: string;
  title: string;
  author: string;
  updated_at: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  let bookEntries: MetadataRoute.Sitemap = [];
  try {
    const { data: books } = await db.client
      .from("books")
      .select("id, title, author, updated_at")
      .returns<BookRow[]>();

    if (books && books.length > 0) {
      bookEntries = books.map((book) => {
        const slug = generateBookSlug(book.title, book.author);
        return {
          url: `${BASE_URL}/books/${slug}`,
          lastModified: book.updated_at
            ? new Date(book.updated_at)
            : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        };
      });
    }
  } catch (error) {
    console.error("[sitemap] Error fetching books:", error);
  }

  const blogSlugs = await getBlogSlugs();
  const blogEntries: MetadataRoute.Sitemap = blogSlugs.map(
    ({ slug, lastModified }) => ({
      url: `${BASE_URL}/blog/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }),
  );

  let profileEntries: MetadataRoute.Sitemap = [];
  try {
    const { data: profiles } = await db.client
      .from("users")
      .select("username, updated_at")
      .not("username", "is", null);

    if (profiles && profiles.length > 0) {
      profileEntries = profiles
        .filter((p: { username: string | null }) => p.username)
        .map((p: { username: string | null; updated_at: string | null }) => ({
          url: `${BASE_URL}/profiles/${p.username}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }));
    }
  } catch (error) {
    console.error("[sitemap] Error fetching profiles:", error);
  }

  let listEntries: MetadataRoute.Sitemap = [];
  try {
    const { data: lists } = await db.client
      .from("lists")
      .select("id, updated_at")
      .eq("visibility", "public");

    if (lists && lists.length > 0) {
      listEntries = lists.map(
        (l: { id: string; updated_at: string | null }) => ({
          url: `${BASE_URL}/lists/${l.id}`,
          lastModified: l.updated_at ? new Date(l.updated_at) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.5,
        }),
      );
    }
  } catch (error) {
    console.error("[sitemap] Error fetching public lists:", error);
  }

  return [
    ...staticPages,
    ...blogEntries,
    ...bookEntries,
    ...profileEntries,
    ...listEntries,
  ];
}

async function getBlogSlugs(): Promise<
  Array<{ slug: string; lastModified: Date }>
> {
  try {
    const { getAllPosts } = await import("@/lib/blog");
    const posts = await getAllPosts();
    return posts.map((p) => ({
      slug: p.slug,
      lastModified: p.updatedAt ?? p.publishedAt,
    }));
  } catch {
    return [];
  }
}
