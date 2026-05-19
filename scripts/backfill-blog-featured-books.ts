/**
 * Backfill featured_books for blog posts.
 *
 * Auto-detects book titles in post body using common markdown patterns
 * (e.g. `**N. Title** – Author`, `[Title](book-url)`), matches them against
 * the books table by title+author (fuzzy), and proposes a featured_books
 * mapping. Review interactively before applying.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-blog-featured-books.ts --dry-run
 *   pnpm tsx scripts/backfill-blog-featured-books.ts --apply
 *   pnpm tsx scripts/backfill-blog-featured-books.ts --slug=top-10-livres-2024
 *
 * Defaults to dry-run. --apply writes to DB.
 */
import "dotenv/config";

import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { searchGoogleBooks } from "@/lib/google-books";

type Args = {
  apply: boolean;
  slugFilter: string | null;
  limitPerPost: number;
  autoCreate: boolean;
};

const parseArgs = (): Args => {
  const args = process.argv.slice(2);
  let apply = false;
  let slugFilter: string | null = null;
  let limitPerPost = 5;
  let autoCreate = false;

  for (const arg of args) {
    if (arg === "--apply") apply = true;
    else if (arg === "--dry-run") apply = false;
    else if (arg === "--auto-create") autoCreate = true;
    else if (arg.startsWith("--slug=")) slugFilter = arg.slice("--slug=".length);
    else if (arg.startsWith("--limit-per-post=")) {
      limitPerPost = Number(arg.slice("--limit-per-post=".length)) || 5;
    }
  }
  return { apply, slugFilter, limitPerPost, autoCreate };
};

type Candidate = { title: string; author: string };

const stripPublisher = (s: string): string =>
  s.replace(/\s*\([^)]*\)\s*$/, "").trim();

/**
 * Patterns supported (title→author OR author→title):
 *   ### 1. Title — Author (Publisher)
 *   ### Title — Author
 *   **N. Title** – Author (Publisher)
 *   **Title** – Author
 *   - **Author** — *Title* (Publisher)
 *   - **Title** par Author
 */
const PATTERNS: Array<{
  re: RegExp;
  titleFirst: boolean;
}> = [
  // ### 1. Title — Author (Publisher)
  { re: /^#{2,4}\s*\d+\.\s+(.+?)\s*[–—-]\s*(.+?)\s*$/gm, titleFirst: true },
  // ### Title — Author
  { re: /^#{2,4}\s+([^\d\n][^—–\n]+?)\s*[–—-]\s*(.+?)\s*$/gm, titleFirst: true },
  // **N. Title** – Author
  {
    re: /\*\*\d+\.\s+([^*]+?)\*\*\s*[–—-]\s*([^*\n()]+?)(?:\s*\([^)]+\))?(?:\s*\n|$)/g,
    titleFirst: true,
  },
  // - **Author** — *Title* (Publisher)
  {
    re: /^\s*[-*]\s+\*\*([^*]+?)\*\*\s*[–—-]\s*\*([^*]+?)\*/gm,
    titleFirst: false,
  },
];

const looksLikeName = (s: string): boolean => {
  // Heuristic: 1–4 words, starts uppercase, no sentence punctuation
  if (s.length < 2 || s.length > 60) return false;
  if (/[.;:!?]/.test(s)) return false;
  const words = s.split(/\s+/);
  if (words.length === 0 || words.length > 5) return false;
  if (!/^[A-ZÀ-ÖØ-Þ]/.test(s)) return false;
  return true;
};

const extractCandidates = (body: string, limit: number): Candidate[] => {
  const found = new Map<string, Candidate>();
  for (const { re, titleFirst } of PATTERNS) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(body)) !== null) {
      const a = match[1]?.trim();
      const b = match[2]?.trim();
      if (!a || !b) continue;
      const title = stripPublisher(titleFirst ? a : b);
      const author = stripPublisher(titleFirst ? b : a);
      if (!title || !author) continue;
      if (!looksLikeName(author)) continue;
      // Reject markdown-only stripped strings
      if (title.startsWith("*") || author.startsWith("*")) continue;
      const key = `${title.toLowerCase()}|${author.toLowerCase()}`;
      if (!found.has(key)) found.set(key, { title, author });
      if (found.size >= limit) return Array.from(found.values());
    }
  }
  return Array.from(found.values()).slice(0, limit);
};

type BookMatch = {
  id: string;
  title: string;
  author: string;
  confidence: "exact" | "fuzzy";
};

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const matchBook = async (
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  candidate: Candidate,
): Promise<BookMatch | null> => {
  // Exact match first
  const { data: exact } = await supabase
    .from("books")
    .select("id, title, author")
    .ilike("title", candidate.title)
    .ilike("author", `%${candidate.author}%`)
    .limit(1);

  if (exact && exact.length > 0) {
    return { ...(exact[0] as BookMatch), confidence: "exact" };
  }

  // Fuzzy: search by normalized title, filter by author
  const titleQuery = candidate.title.split(/\s+/)[0]; // first word as anchor
  const { data: fuzzy } = await supabase
    .from("books")
    .select("id, title, author")
    .ilike("title", `%${titleQuery}%`)
    .limit(10);

  if (!fuzzy || fuzzy.length === 0) return null;

  const candNormTitle = normalize(candidate.title);
  const candNormAuthor = normalize(candidate.author);

  for (const book of fuzzy as Array<{
    id: string;
    title: string;
    author: string;
  }>) {
    const bookNormTitle = normalize(book.title);
    const bookNormAuthor = normalize(book.author);
    if (
      bookNormTitle.includes(candNormTitle) ||
      candNormTitle.includes(bookNormTitle)
    ) {
      if (
        bookNormAuthor.includes(candNormAuthor) ||
        candNormAuthor.includes(bookNormAuthor)
      ) {
        return { ...book, confidence: "fuzzy" };
      }
    }
  }
  return null;
};

/** Pick the substring of best.title that we want to compare to candidate.title.
 * Google Books often appends prize/edition suffixes:
 *   "La nuit au cœur - Prix Femina 2025 - Prix Goncourt..."
 * We split on " - " / " — " and try each chunk.
 */
const cleanTitleChunks = (title: string): string[] => {
  const chunks = title.split(/\s+[-–—]\s+/).map((c) => c.trim()).filter(Boolean);
  return [title, ...chunks];
};

const createBookFromGoogle = async (
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  candidate: Candidate,
): Promise<BookMatch | null> => {
  const query = `intitle:${candidate.title} inauthor:${candidate.author}`;
  const results = await searchGoogleBooks(query, 5, { langRestrict: "fr" });
  if (results.length === 0) return null;

  const candNormTitle = normalize(candidate.title);
  const candNormAuthor = normalize(candidate.author);

  // Strict: title must match (after stripping suffixes) AND author must match
  const best = results.find((r) => {
    if (!r.coverUrl) return false;
    const ra = normalize(r.author);
    const authorOk =
      ra.includes(candNormAuthor) || candNormAuthor.includes(ra);
    if (!authorOk) return false;
    const titleOk = cleanTitleChunks(r.title).some((chunk) => {
      const nc = normalize(chunk);
      return nc === candNormTitle || nc.includes(candNormTitle) || candNormTitle.includes(nc);
    });
    return titleOk;
  });

  if (!best || !best.coverUrl) return null;

  // Persist a clean title (first chunk) rather than the full prize-decorated one
  const cleanTitle = best.title.split(/\s+[-–—]\s+/)[0]?.trim() || best.title;

  const { data, error } = await supabase
    .from("books")
    .insert({
      title: cleanTitle,
      author: best.author,
      cover_url: best.coverUrl,
      publication_year: best.publicationYear ?? null,
      summary: best.summary ?? null,
    })
    .select("id, title, author")
    .single();

  if (error || !data) {
    console.error(`    ! Insert failed: ${error?.message ?? "unknown"}`);
    return null;
  }
  return { ...(data as { id: string; title: string; author: string }), confidence: "fuzzy" };
};

const main = async () => {
  const { apply, slugFilter, limitPerPost, autoCreate } = parseArgs();
  const supabase = createSupabaseServiceClient();

  console.log(
    `[blog-backfill] mode=${apply ? "APPLY" : "DRY-RUN"} slug=${slugFilter ?? "*"} limit-per-post=${limitPerPost} auto-create=${autoCreate}`,
  );

  let query = supabase
    .from("blog_posts")
    .select("slug, title, body, featured_books")
    .eq("status", "published");
  if (slugFilter) query = query.eq("slug", slugFilter);

  const { data: posts, error } = await query;

  if (error) {
    console.error("Failed to fetch blog posts:", error);
    process.exit(1);
  }
  if (!posts || posts.length === 0) {
    console.log("No posts found.");
    return;
  }

  let totalMatched = 0;
  let totalApplied = 0;

  for (const post of posts as Array<{
    slug: string;
    title: string;
    body: string;
    featured_books: string[] | null;
  }>) {
    console.log(`\n─── ${post.slug} ───`);
    console.log(`Title: ${post.title}`);
    console.log(`Current featured_books: ${(post.featured_books ?? []).length}`);

    const candidates = extractCandidates(post.body, limitPerPost);
    if (candidates.length === 0) {
      console.log("  No book candidates detected in body.");
      continue;
    }

    const matched: BookMatch[] = [];
    for (const c of candidates) {
      let match = await matchBook(supabase, c);
      if (match) {
        matched.push(match);
        console.log(
          `  ✓ ${c.title} → ${match.title} by ${match.author} (${match.confidence})`,
        );
        continue;
      }
      if (autoCreate && apply) {
        console.log(`  ↻ ${c.title} by ${c.author} — fetching Google Books...`);
        match = await createBookFromGoogle(supabase, c);
        if (match) {
          matched.push(match);
          console.log(
            `    + Created book ${match.id}: ${match.title} by ${match.author}`,
          );
          continue;
        }
      }
      console.log(`  ✗ ${c.title} by ${c.author} — no match`);
    }

    if (matched.length === 0) {
      console.log("  → No matches, skipping.");
      continue;
    }

    totalMatched += matched.length;
    const bookIds = matched.map((m) => m.id);

    if (apply) {
      const { error: updateError } = await supabase
        .from("blog_posts")
        .update({ featured_books: bookIds })
        .eq("slug", post.slug);
      if (updateError) {
        console.error(`  ✗ Update failed: ${updateError.message}`);
      } else {
        console.log(`  ✓ Applied ${bookIds.length} featured_books.`);
        totalApplied += bookIds.length;
      }
    } else {
      console.log(
        `  → Would set featured_books = [${bookIds.join(", ")}] (${bookIds.length} books)`,
      );
    }
  }

  console.log(`\nSummary: matched=${totalMatched} applied=${totalApplied}`);
  if (!apply) {
    console.log("Re-run with --apply to write changes.");
  }
};

void main();
