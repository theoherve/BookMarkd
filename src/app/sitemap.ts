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
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/lists`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/feed`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
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
          lastModified: book.updated_at ? new Date(book.updated_at) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        };
      });
    }
  } catch (error) {
    console.error("[sitemap] Error fetching books:", error);
  }

  const blogSlugs = await getBlogSlugs();
  const blogEntries: MetadataRoute.Sitemap = blogSlugs.map(({ slug, lastModified }) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogEntries, ...bookEntries];
}

async function getBlogSlugs(): Promise<Array<{ slug: string; lastModified: Date }>> {
  try {
    const { getAllPosts } = await import("@/lib/blog");
    const posts = getAllPosts();
    return posts.map((p) => ({
      slug: p.slug,
      lastModified: p.updatedAt ?? p.publishedAt,
    }));
  } catch {
    return [];
  }
}

