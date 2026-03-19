import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { getPreviousSemester, formatSemesterLabel } from "@/lib/nytimes";

const TOP_BOOKS_COUNT = 20;

// Vercel Cron: runs Jan 1 and Jul 1 at 10:00 UTC (see vercel.json)
// Aggregates weekly NYT rankings from the previous semester into one editorial list.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();

  // Determine which semester to aggregate
  const semester = getPreviousSemester(new Date());

  // Idempotency: check if we already created this semester's list
  const { data: existing } = await supabase
    .from("editorial_lists")
    .select("id")
    .eq("semester_label", semester.label)
    .eq("period_type", "semester")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: `Semester list for ${semester.label} already exists`,
    });
  }

  // Fetch all weekly rankings for this semester period
  const { data: rankings, error: rankError } = await supabase
    .from("nytimes_weekly_rankings")
    .select("*")
    .gte("week_date", semester.start)
    .lte("week_date", semester.end);

  if (rankError) {
    console.error("[cron/semester] Failed to fetch rankings:", rankError);
    return NextResponse.json({ ok: false, error: rankError.message }, { status: 500 });
  }

  if (!rankings || rankings.length === 0) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: `No weekly rankings found for ${semester.label}`,
    });
  }

  // Aggregate by ISBN (merge fiction + non-fiction)
  // For books without ISBN, fall back to normalized title+author
  const bookMap = new Map<
    string,
    {
      isbn13: string;
      title: string;
      author: string;
      description: string | null;
      coverUrl: string | null;
      ranks: number[];
      weekDates: Set<string>;
    }
  >();

  for (const r of rankings) {
    const key = r.isbn13 as string;

    if (!bookMap.has(key)) {
      bookMap.set(key, {
        isbn13: key,
        title: r.title as string,
        author: r.author as string,
        description: (r.description as string | null) ?? null,
        coverUrl: (r.cover_url as string | null) ?? null,
        ranks: [],
        weekDates: new Set(),
      });
    }

    const entry = bookMap.get(key)!;
    const weekDate = r.week_date as string;

    // If same book appears in both fiction + non-fiction same week, count once
    if (!entry.weekDates.has(weekDate)) {
      entry.weekDates.add(weekDate);
    }

    entry.ranks.push(r.rank as number);

    // Keep the best cover/description available
    if (!entry.coverUrl && r.cover_url) {
      entry.coverUrl = r.cover_url as string;
    }
    if (!entry.description && r.description) {
      entry.description = r.description as string;
    }
  }

  // Calculate aggregate scores and sort
  const aggregated = Array.from(bookMap.values()).map((book) => {
    const appearances = book.weekDates.size;
    const avgRank = book.ranks.reduce((a, b) => a + b, 0) / book.ranks.length;
    const bestRank = Math.min(...book.ranks);
    // Score: heavy weight on presence, bonus for high rank
    const aggregateScore = appearances * 10 + (16 - avgRank);

    return { ...book, appearances, avgRank, bestRank, aggregateScore };
  });

  aggregated.sort((a, b) => b.aggregateScore - a.aggregateScore);
  const topBooks = aggregated.slice(0, TOP_BOOKS_COUNT);

  // Create the semester editorial list
  const monthsLabel = formatSemesterLabel(semester);
  const { data: newList, error: listError } = await supabase
    .from("editorial_lists")
    .insert({
      title: `Tendances du semestre — ${semester.label}`,
      description: `Les livres les plus présents dans les classements NY Times (fiction et non-fiction) de ${monthsLabel}.`,
      type: "bestseller",
      source: "nytimes",
      status: "draft",
      period_type: "semester",
      semester_label: semester.label,
      period_start: semester.start,
      period_end: semester.end,
      badge_label: "NY Times",
    })
    .select("id")
    .single();

  if (listError || !newList) {
    console.error("[cron/semester] Failed to create semester list:", listError);
    return NextResponse.json({ ok: false, error: listError?.message }, { status: 500 });
  }

  // Insert aggregated books
  const booksToInsert = topBooks.map((book, index) => ({
    list_id: newList.id,
    external_title: book.title,
    external_author: book.author,
    external_isbn: book.isbn13,
    external_cover_url: book.coverUrl,
    nytimes_description: book.description,
    position: index,
    appearances: book.appearances,
    avg_rank: Math.round(book.avgRank * 100) / 100,
    best_rank: book.bestRank,
    aggregate_score: Math.round(book.aggregateScore * 100) / 100,
  }));

  const { error: booksError } = await supabase
    .from("editorial_list_books")
    .insert(booksToInsert);

  if (booksError) {
    console.error("[cron/semester] Failed to insert books:", booksError);
    return NextResponse.json({ ok: false, error: booksError.message }, { status: 500 });
  }

  console.log(`[cron/semester] Created semester list "${semester.label}" with ${topBooks.length} books.`);

  return NextResponse.json({
    ok: true,
    semester: semester.label,
    listId: newList.id,
    bookCount: topBooks.length,
  });
}
