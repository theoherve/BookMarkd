import db from "@/lib/supabase/db";

export const trackBlogView = async (params: {
  slug: string;
  userId?: string | null;
  sessionId?: string;
}): Promise<void> => {
  try {
    await db.client.from("blog_views").insert({
      slug: params.slug,
      user_id: params.userId ?? null,
      session_id: params.sessionId ?? null,
    });
  } catch (error) {
    console.error("[analytics] trackBlogView error:", error);
  }
};
