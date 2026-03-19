import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { fetchNytimesBestsellerList, NYT_LISTS } from "@/lib/nytimes";

// Vercel Cron: runs every Monday at 8:00 UTC (see vercel.json)
// Stores raw weekly rankings in nytimes_weekly_rankings staging table.
// These are later aggregated into semester editorial lists by the semester cron.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  const results: { list: string; status: "stored" | "skipped" | "error"; count?: number }[] = [];

  for (const list of NYT_LISTS) {
    try {
      const data = await fetchNytimesBestsellerList(list.name);
      if (!data) {
        results.push({ list: list.name, status: "error" });
        continue;
      }

      const weekDate = data.bestsellers_date;

      // Check if we already have data for this week+list
      const { count } = await supabase
        .from("nytimes_weekly_rankings")
        .select("*", { count: "exact", head: true })
        .eq("list_name", list.name)
        .eq("week_date", weekDate);

      if (count && count > 0) {
        results.push({ list: list.name, status: "skipped" });
        continue;
      }

      // Insert all books into staging table
      const rows = data.books
        .filter((book) => book.primary_isbn13)
        .map((book) => ({
          list_name: list.name,
          week_date: weekDate,
          isbn13: book.primary_isbn13,
          title: book.title,
          author: book.author,
          description: book.description || null,
          cover_url: book.book_image || null,
          rank: book.rank,
        }));

      if (rows.length === 0) {
        results.push({ list: list.name, status: "skipped" });
        continue;
      }

      const { error } = await supabase
        .from("nytimes_weekly_rankings")
        .upsert(rows, { onConflict: "list_name,week_date,isbn13" });

      if (error) {
        console.error(`[cron/nytimes] Failed to store rankings for ${list.name}:`, error);
        results.push({ list: list.name, status: "error" });
        continue;
      }

      results.push({ list: list.name, status: "stored", count: rows.length });
    } catch (err) {
      console.error(`[cron/nytimes] Unexpected error for ${list.name}:`, err);
      results.push({ list: list.name, status: "error" });
    }
  }

  const stored = results.filter((r) => r.status === "stored").length;
  console.log(`[cron/nytimes] Done. ${stored} list(s) stored in staging.`, results);

  return NextResponse.json({ ok: true, results });
}
