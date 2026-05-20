import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import {
  AwardsYearGuardError,
  computeAwardsForYear,
  persistAwards,
} from "@/features/awards/server/aggregate";
import { MIN_AWARDS_YEAR } from "@/features/awards/types";

// Vercel Cron: 1er janvier 10h UTC (voir vercel.json).
// Agrège l'année N-1 dans `awards_years` + `awards_winners` (status 'draft').
// Admin publie ensuite via /admin/awards.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const overwrite = url.searchParams.get("overwrite") === "true";
  const testYearParam = url.searchParams.get("testYear");

  const targetYear = testYearParam
    ? Number.parseInt(testYearParam, 10)
    : new Date().getUTCFullYear() - 1;

  if (!Number.isFinite(targetYear)) {
    return NextResponse.json(
      { ok: false, error: "Invalid year" },
      { status: 400 },
    );
  }

  if (targetYear < MIN_AWARDS_YEAR) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: `Year ${targetYear} is below MIN_AWARDS_YEAR=${MIN_AWARDS_YEAR}.`,
    });
  }

  const supabase = createSupabaseServiceClient();

  try {
    const result = await computeAwardsForYear(supabase, targetYear);
    const persisted = await persistAwards(supabase, result, { overwrite });

    console.log(
      `[cron/awards] year=${targetYear} winners=${result.winners.length} persisted=`,
      persisted,
    );

    return NextResponse.json({
      ok: true,
      year: targetYear,
      summary: result.summary,
      winnersCount: result.winners.length,
      persisted,
    });
  } catch (error) {
    if (error instanceof AwardsYearGuardError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[cron/awards] year=${targetYear} failed:`, error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
