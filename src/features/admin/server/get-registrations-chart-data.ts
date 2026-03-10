import { unstable_noStore as noStore } from "next/cache";
import db from "@/lib/supabase/db";
import type { ChartDataPoint } from "@/types/admin";

export const getRegistrationsChartData = async (
  days: number = 30
): Promise<ChartDataPoint[]> => {
  noStore();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await db.client
    .from("users")
    .select("created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  // Group by day
  const grouped = new Map<string, number>();
  for (const row of data) {
    const date = new Date(row.created_at).toISOString().split("T")[0]!;
    grouped.set(date, (grouped.get(date) ?? 0) + 1);
  }

  // Fill gaps
  const result: ChartDataPoint[] = [];
  const start = new Date(since);
  const end = new Date();
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0]!;
    result.push({
      date: dateStr,
      value: grouped.get(dateStr) ?? 0,
    });
  }

  return result;
};
