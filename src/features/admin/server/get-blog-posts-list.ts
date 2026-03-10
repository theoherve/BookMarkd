import { unstable_noStore as noStore } from "next/cache";
import db from "@/lib/supabase/db";
import type { AdminBlogPost, AdminPaginationParams, PaginatedResult } from "@/types/admin";

export const getBlogPostsList = async (
  params: AdminPaginationParams & { status?: string }
): Promise<PaginatedResult<AdminBlogPost>> => {
  noStore();

  const { page = 1, pageSize = 20, search, sortBy = "created_at", sortOrder = "desc", status } = params;
  const offset = (page - 1) * pageSize;

  let query = db.client
    .from("blog_posts")
    .select("*", { count: "exact" });

  if (status) query = query.eq("status", status);
  if (search) query = query.ilike("title", `%${search}%`);

  query = query.order(sortBy, { ascending: sortOrder === "asc" }).range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error("[admin/blog] Error:", error);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const total = count ?? 0;
  const posts: AdminBlogPost[] = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: row.description as string,
    body: row.body as string,
    imageUrl: (row.image_url as string | null) ?? null,
    status: row.status as "draft" | "published" | "archived",
    authorId: (row.author_id as string | null) ?? null,
    publishedAt: (row.published_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));

  return { data: posts, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
};

export const getBlogPostDetail = async (postId: string): Promise<AdminBlogPost | null> => {
  noStore();

  const { data, error } = await db.client
    .from("blog_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    body: data.body,
    imageUrl: data.image_url ?? null,
    status: data.status as "draft" | "published" | "archived",
    authorId: data.author_id ?? null,
    publishedAt: data.published_at ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};
