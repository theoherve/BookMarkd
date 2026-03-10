import { unstable_noStore as noStore } from "next/cache";
import db from "@/lib/supabase/db";

export type FeedbackStatsData = {
  total: number;
  pending: number;
  reviewed: number;
  resolved: number;
  rejected: number;
};

export const getFeedbackStats = async (): Promise<FeedbackStatsData> => {
  noStore();

  const [totalR, pendingR, reviewedR, resolvedR, rejectedR] = await Promise.all([
    db.client.from("feedbacks").select("*", { count: "exact", head: true }),
    db.client.from("feedbacks").select("*", { count: "exact", head: true }).eq("status", "pending"),
    db.client.from("feedbacks").select("*", { count: "exact", head: true }).eq("status", "reviewed"),
    db.client.from("feedbacks").select("*", { count: "exact", head: true }).eq("status", "resolved"),
    db.client.from("feedbacks").select("*", { count: "exact", head: true }).eq("status", "rejected"),
  ]);

  return {
    total: totalR.count ?? 0,
    pending: pendingR.count ?? 0,
    reviewed: reviewedR.count ?? 0,
    resolved: resolvedR.count ?? 0,
    rejected: rejectedR.count ?? 0,
  };
};
