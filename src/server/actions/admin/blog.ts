"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import db from "@/lib/supabase/db";

type ActionResult = { success: true } | { success: false; message: string };

export const createBlogPost = async (data: {
  title: string;
  slug: string;
  description: string;
  body: string;
  imageUrl?: string | null;
  status: "draft" | "published";
}): Promise<{ success: true; postId: string } | { success: false; message: string }> => {
  try {
    const adminId = await requireAdmin();

    const publishedAt = data.status === "published" ? new Date().toISOString() : null;

    const { data: post, error } = await db.client
      .from("blog_posts")
      .insert({
        title: data.title.trim(),
        slug: data.slug.trim(),
        description: data.description.trim(),
        body: data.body,
        image_url: data.imageUrl ?? null,
        status: data.status,
        author_id: adminId,
        published_at: publishedAt,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "Un article avec ce slug existe déjà." };
      }
      throw error;
    }

    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    return { success: true, postId: post.id };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Authentification requise." };
    }
    if ((error as Error).message === "ADMIN_REQUIRED") {
      return { success: false, message: "Accès réservé aux administrateurs." };
    }
    console.error("[admin/blog] createBlogPost error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const updateBlogPost = async (
  postId: string,
  data: {
    title?: string;
    slug?: string;
    description?: string;
    body?: string;
    imageUrl?: string | null;
    status?: "draft" | "published" | "archived";
  }
): Promise<ActionResult> => {
  try {
    await requireAdmin();

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.slug !== undefined) updateData.slug = data.slug.trim();
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.body !== undefined) updateData.body = data.body;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
    if (data.status !== undefined) updateData.status = data.status;

    // If publishing for the first time, set published_at
    if (data.status === "published") {
      const { data: existing } = await db.client
        .from("blog_posts")
        .select("published_at")
        .eq("id", postId)
        .single();

      if (existing && !existing.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { error } = await db.client
      .from("blog_posts")
      .update(updateData)
      .eq("id", postId);

    if (error) throw error;

    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Authentification requise." };
    }
    if ((error as Error).message === "ADMIN_REQUIRED") {
      return { success: false, message: "Accès réservé aux administrateurs." };
    }
    console.error("[admin/blog] updateBlogPost error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const deleteBlogPost = async (postId: string): Promise<ActionResult> => {
  try {
    await requireAdmin();

    const { error } = await db.client
      .from("blog_posts")
      .delete()
      .eq("id", postId);

    if (error) throw error;

    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Authentification requise." };
    }
    if ((error as Error).message === "ADMIN_REQUIRED") {
      return { success: false, message: "Accès réservé aux administrateurs." };
    }
    console.error("[admin/blog] deleteBlogPost error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};
