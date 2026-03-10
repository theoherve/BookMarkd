import db from "@/lib/supabase/db";

export const trackPageView = async (params: {
  path: string;
  userId?: string | null;
  sessionId?: string;
  referrer?: string;
  userAgent?: string;
}): Promise<void> => {
  try {
    await db.client.from("page_views").insert({
      path: params.path,
      user_id: params.userId ?? null,
      session_id: params.sessionId ?? null,
      referrer: params.referrer ?? null,
      user_agent: params.userAgent ?? null,
    });
  } catch (error) {
    console.error("[analytics] trackPageView error:", error);
  }
};
