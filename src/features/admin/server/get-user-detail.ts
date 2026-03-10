import { unstable_noStore as noStore } from "next/cache";
import db from "@/lib/supabase/db";
import type { AdminUserDetail, AdminActivity } from "@/types/admin";

export const getUserDetail = async (
  userId: string,
): Promise<AdminUserDetail | null> => {
  noStore();

  const { data: user, error } = await db.client
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !user) return null;

  const [
    booksResult,
    reviewsResult,
    listsResult,
    followersResult,
    followingResult,
    activitiesResult,
    toReadResult,
    readingResult,
    finishedResult,
  ] = await Promise.all([
    db.client
      .from("user_books")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    db.client
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    db.client
      .from("lists")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", userId),
    db.client
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId),
    db.client
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId),
    db.client
      .from("activities")
      .select("id, type, payload, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    db.client
      .from("user_books")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "to_read"),
    db.client
      .from("user_books")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "reading"),
    db.client
      .from("user_books")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "finished"),
  ]);

  const recentActivity: AdminActivity[] = (activitiesResult.data ?? []).map(
    (a: Record<string, unknown>) => ({
      id: a.id as string,
      type: a.type as string,
      payload: (a.payload as Record<string, unknown>) ?? {},
      createdAt: a.created_at as string,
    }),
  );

  return {
    id: user.id,
    email: user.email,
    username: user.username ?? null,
    displayName: user.display_name ?? "",
    avatarUrl: user.avatar_url ?? null,
    bio: user.bio ?? null,
    isAdmin: user.is_admin ?? false,
    disabledAt: user.disabled_at ?? null,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    booksCount: booksResult.count ?? 0,
    reviewsCount: reviewsResult.count ?? 0,
    listsCount: listsResult.count ?? 0,
    reviews: [],
    followersCount: followersResult.count ?? 0,
    followingCount: followingResult.count ?? 0,
    recentActivity,
    readingStats: {
      toRead: toReadResult.count ?? 0,
      reading: readingResult.count ?? 0,
      finished: finishedResult.count ?? 0,
    },
  };
};
