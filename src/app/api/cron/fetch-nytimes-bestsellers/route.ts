import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { fetchNytimesBestsellerList, getNytimesListLabel, NYT_LISTS } from "@/lib/nytimes";

// Vercel Cron: runs every Monday at 8:00 UTC (see vercel.json)
// Secured with CRON_SECRET header set by Vercel
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  const results: { list: string; status: "created" | "skipped" | "error" }[] = [];

  for (const list of NYT_LISTS) {
    try {
      const data = await fetchNytimesBestsellerList(list.name);
      if (!data) {
        results.push({ list: list.name, status: "error" });
        continue;
      }

      const weekDate = data.bestsellers_date;

      // Deduplication: skip if we already have this list for this week
      const { data: existing } = await supabase
        .from("editorial_lists")
        .select("id")
        .eq("nytimes_list_name", list.name)
        .eq("week_date", weekDate)
        .maybeSingle();

      if (existing) {
        results.push({ list: list.name, status: "skipped" });
        continue;
      }

      // Create the draft editorial list
      const { data: newList, error: listError } = await supabase
        .from("editorial_lists")
        .insert({
          title: `${getNytimesListLabel(list.name)} — semaine du ${formatWeekDate(weekDate)}`,
          description: `Les ${data.books.length} titres du classement NY Times "${data.list_name}" pour la semaine du ${formatWeekDate(weekDate)}.`,
          type: "bestseller",
          source: "nytimes",
          status: "draft",
          nytimes_list_name: list.name,
          week_date: weekDate,
          badge_label: "NY Times",
        })
        .select("id")
        .single();

      if (listError || !newList) {
        console.error(`[cron/nytimes] Failed to create list ${list.name}:`, listError);
        results.push({ list: list.name, status: "error" });
        continue;
      }

      // Insert books
      const booksToInsert = data.books.map((book, index) => ({
        list_id: newList.id,
        external_title: book.title,
        external_author: book.author,
        external_isbn: book.primary_isbn13 || null,
        external_cover_url: book.book_image || null,
        nytimes_rank: book.rank,
        nytimes_description: book.description || null,
        position: index,
      }));

      const { error: booksError } = await supabase
        .from("editorial_list_books")
        .insert(booksToInsert);

      if (booksError) {
        console.error(`[cron/nytimes] Failed to insert books for ${list.name}:`, booksError);
        // List was created, books failed — still counts as error but list exists
        results.push({ list: list.name, status: "error" });
        continue;
      }

      results.push({ list: list.name, status: "created" });
    } catch (err) {
      console.error(`[cron/nytimes] Unexpected error for ${list.name}:`, err);
      results.push({ list: list.name, status: "error" });
    }
  }

  const created = results.filter((r) => r.status === "created").length;
  console.log(`[cron/nytimes] Done. ${created} new lists created.`, results);

  return NextResponse.json({ ok: true, results });
}

function formatWeekDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
