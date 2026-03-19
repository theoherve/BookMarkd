import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import {
  fetchNytimesBestsellerListByDate,
  getMondaysInRange,
  NYT_LISTS,
  formatSemesterLabel,
  type NytimesListName,
  type SemesterInfo,
} from "@/lib/nytimes";

const TOP_BOOKS_COUNT = 20;

// NYT API rate limit: 5 requests per minute
const DELAY_BETWEEN_REQUESTS_MS = 12_000;

const SEMESTERS: SemesterInfo[] = [
  { label: "S1 2025", start: "2025-01-01", end: "2025-06-30", year: 2025, half: 1 },
  { label: "S2 2025", start: "2025-07-01", end: "2025-12-31", year: 2025, half: 2 },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Admin-only endpoint: POST /api/admin/backfill-2025
// Fetches all 2025 NYT weekly rankings, stores in staging, then aggregates into 2 semester lists.
export async function POST(request: Request) {
  // Auth check
  const token = await getToken({ req: request as Parameters<typeof getToken>[0]["req"] });
  if (!token?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  const log: string[] = [];

  // ── Phase 1: Fetch weekly rankings into staging ──────────────────────────

  for (const semester of SEMESTERS) {
    const mondays = getMondaysInRange(semester.start, semester.end);
    log.push(`[${semester.label}] ${mondays.length} semaines à fetcher`);

    for (const monday of mondays) {
      // Skip future dates
      if (new Date(monday) > new Date()) {
        log.push(`[${semester.label}] Skip ${monday} (futur)`);
        continue;
      }

      for (const list of NYT_LISTS) {
        // Check if already in staging
        const { count } = await supabase
          .from("nytimes_weekly_rankings")
          .select("*", { count: "exact", head: true })
          .eq("list_name", list.name)
          .eq("week_date", monday);

        if (count && count > 0) {
          continue; // Already fetched
        }

        const data = await fetchNytimesBestsellerListByDate(
          list.name as NytimesListName,
          monday
        );

        if (!data) {
          log.push(`[${semester.label}] Erreur fetch ${list.name} ${monday}`);
          await sleep(DELAY_BETWEEN_REQUESTS_MS);
          continue;
        }

        const rows = data.books
          .filter((book) => book.primary_isbn13)
          .map((book) => ({
            list_name: list.name,
            week_date: data.bestsellers_date,
            isbn13: book.primary_isbn13,
            title: book.title,
            author: book.author,
            description: book.description || null,
            cover_url: book.book_image || null,
            rank: book.rank,
          }));

        if (rows.length > 0) {
          const { error } = await supabase
            .from("nytimes_weekly_rankings")
            .upsert(rows, { onConflict: "list_name,week_date,isbn13" });

          if (error) {
            log.push(`[${semester.label}] Erreur insert ${list.name} ${monday}: ${error.message}`);
          }
        }

        // Rate limiting
        await sleep(DELAY_BETWEEN_REQUESTS_MS);
      }
    }

    log.push(`[${semester.label}] Fetch terminé`);
  }

  // ── Phase 2: Aggregate into semester editorial lists ─────────────────────

  for (const semester of SEMESTERS) {
    // Check idempotency
    const { data: existing } = await supabase
      .from("editorial_lists")
      .select("id")
      .eq("semester_label", semester.label)
      .eq("period_type", "semester")
      .maybeSingle();

    if (existing) {
      log.push(`[${semester.label}] Liste semestrielle déjà existante, skip agrégation`);
      continue;
    }

    // Fetch all rankings for this semester
    const { data: rankings, error: rankError } = await supabase
      .from("nytimes_weekly_rankings")
      .select("*")
      .gte("week_date", semester.start)
      .lte("week_date", semester.end);

    if (rankError || !rankings || rankings.length === 0) {
      log.push(`[${semester.label}] Pas de données pour agrégation`);
      continue;
    }

    // Aggregate by ISBN
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
      entry.weekDates.add(r.week_date as string);
      entry.ranks.push(r.rank as number);

      if (!entry.coverUrl && r.cover_url) entry.coverUrl = r.cover_url as string;
      if (!entry.description && r.description) entry.description = r.description as string;
    }

    const aggregated = Array.from(bookMap.values())
      .map((book) => {
        const appearances = book.weekDates.size;
        const avgRank = book.ranks.reduce((a, b) => a + b, 0) / book.ranks.length;
        const bestRank = Math.min(...book.ranks);
        const aggregateScore = appearances * 10 + (16 - avgRank);
        return { ...book, appearances, avgRank, bestRank, aggregateScore };
      })
      .sort((a, b) => b.aggregateScore - a.aggregateScore)
      .slice(0, TOP_BOOKS_COUNT);

    // Create editorial list
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
      log.push(`[${semester.label}] Erreur création liste: ${listError?.message}`);
      continue;
    }

    const booksToInsert = aggregated.map((book, index) => ({
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
      log.push(`[${semester.label}] Erreur insert livres: ${booksError.message}`);
      continue;
    }

    log.push(`[${semester.label}] Liste créée avec ${aggregated.length} livres (id: ${newList.id})`);
  }

  return NextResponse.json({ ok: true, log });
}
