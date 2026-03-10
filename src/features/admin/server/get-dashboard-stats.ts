import { unstable_noStore as noStore } from "next/cache";
import db from "@/lib/supabase/db";
import type { DashboardStats } from "@/types/admin";

export const getDashboardStats = async (): Promise<DashboardStats> => {
  noStore();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    usersResult,
    booksResult,
    scannedBooksResult,
    reviewsResult,
    listsResult,
    activeResult,
    newTodayResult,
    newWeekResult,
    pendingFeedbackResult,
  ] = await Promise.all([
    db.client.from("users").select("*", { count: "exact", head: true }),
    db.client.from("books").select("*", { count: "exact", head: true }),
    db.client.from("books").select("*", { count: "exact", head: true }).eq("source", "scan"),
    db.client.from("reviews").select("*", { count: "exact", head: true }),
    db.client.from("lists").select("*", { count: "exact", head: true }),
    db.client.from("activities").select("user_id").gte("created_at", thirtyDaysAgo),
    db.client.from("users").select("*", { count: "exact", head: true }).gte("created_at", today),
    db.client.from("users").select("*", { count: "exact", head: true }).gte("created_at", startOfWeek.toISOString()),
    db.client.from("feedbacks").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  // Count distinct active users
  const activeUserIds = new Set(
    (activeResult.data ?? []).map((r: { user_id: string }) => r.user_id)
  );

  return {
    totalUsers: usersResult.count ?? 0,
    totalBooks: booksResult.count ?? 0,
    totalScannedBooks: scannedBooksResult.count ?? 0,
    totalReviews: reviewsResult.count ?? 0,
    totalLists: listsResult.count ?? 0,
    activeUsers30d: activeUserIds.size,
    newUsersToday: newTodayResult.count ?? 0,
    newUsersThisWeek: newWeekResult.count ?? 0,
    pendingFeedbacks: pendingFeedbackResult.count ?? 0,
  };
};
