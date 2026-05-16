/**
 * Backfill covers for books with NULL or placeholder cover_url.
 *
 * Sources tried in order:
 *   1. Open Library (ISBN, then title+author)
 *   2. Google Books hi-res (zoom=3) via google_books_id
 *   3. Babelio (HTML scrape, FR)
 *
 * Cover stored in Supabase Storage bucket `covers`, then `books.cover_url` updated.
 *
 * Usage:
 *   pnpm covers:find-missing                      # full run
 *   pnpm covers:find-missing -- --dry-run         # log only, no upload/update
 *   pnpm covers:find-missing -- --batch-size=20   # custom batch
 *   pnpm covers:find-missing -- --limit=100       # cap total processed
 */
import "dotenv/config";

import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { isMissingOrPlaceholderCoverAsync } from "@/lib/covers/placeholder-detect";
import { findAndUploadMissingCover } from "@/lib/covers/find-missing-cover";

type Args = {
  dryRun: boolean;
  batchSize: number;
  limit: number | null;
  delayMs: number;
};

const parseArgs = (): Args => {
  const argv = process.argv.slice(2);
  let dryRun = false;
  let batchSize = 50;
  let limit: number | null = null;
  let delayMs = 800;

  for (const arg of argv) {
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg.startsWith("--batch-size=")) {
      batchSize = Number.parseInt(arg.split("=")[1], 10) || 50;
    } else if (arg.startsWith("--limit=")) {
      limit = Number.parseInt(arg.split("=")[1], 10) || null;
    } else if (arg.startsWith("--delay-ms=")) {
      delayMs = Number.parseInt(arg.split("=")[1], 10) || 0;
    }
  }

  return { dryRun, batchSize, limit, delayMs };
};

type BookRow = {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  google_books_id: string | null;
  cover_url: string | null;
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const fetchCandidates = async (
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  from: number,
  to: number,
): Promise<BookRow[]> => {
  const { data, error } = await supabase
    .from("books")
    .select("id, title, author, isbn, google_books_id, cover_url")
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) {
    throw error;
  }

  return (data ?? []) as BookRow[];
};

const main = async () => {
  const args = parseArgs();
  console.log("[covers-backfill] args:", args);

  const supabase = createSupabaseServiceClient();

  let cursor = 0;
  let totalSeen = 0;
  let totalMissing = 0;
  let totalFixed = 0;
  let totalFailed = 0;
  const perSource: Record<string, number> = {};

  while (true) {
    if (args.limit !== null && totalSeen >= args.limit) {
      break;
    }

    const to = cursor + args.batchSize - 1;
    const rows = await fetchCandidates(supabase, cursor, to);

    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      totalSeen += 1;
      if (args.limit !== null && totalSeen > args.limit) {
        break;
      }

      const missing = await isMissingOrPlaceholderCoverAsync(row.cover_url);
      if (!missing) {
        continue;
      }

      totalMissing += 1;

      const prefix = `[${totalSeen}] ${row.id} "${row.title}" — ${row.author}`;

      if (args.dryRun) {
        console.log(`${prefix} :: would lookup cover (current=${row.cover_url ?? "NULL"})`);
        continue;
      }

      try {
        const result = await findAndUploadMissingCover({
          bookId: row.id,
          title: row.title,
          author: row.author,
          isbn: row.isbn,
          googleBooksId: row.google_books_id,
          currentCoverUrl: row.cover_url,
        });

        if (result.success) {
          totalFixed += 1;
          perSource[result.source] = (perSource[result.source] ?? 0) + 1;
          console.log(`${prefix} :: OK [${result.source}] ${result.publicUrl}`);
        } else {
          totalFailed += 1;
          console.log(`${prefix} :: FAIL ${result.reason}`);
        }
      } catch (error) {
        totalFailed += 1;
        console.error(`${prefix} :: THROW`, error);
      }

      if (args.delayMs > 0) {
        await sleep(args.delayMs);
      }
    }

    cursor += args.batchSize;
  }

  console.log("\n[covers-backfill] summary");
  console.log("  total seen   :", totalSeen);
  console.log("  missing      :", totalMissing);
  console.log("  fixed        :", totalFixed);
  console.log("  failed       :", totalFailed);
  console.log("  per source   :", perSource);
};

main().catch((error) => {
  console.error("[covers-backfill] fatal:", error);
  process.exit(1);
});
