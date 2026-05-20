/**
 * Seed BookMarkd Awards 2026.
 *
 * Lance l’agrégation pour 2026 sur les données réelles déjà en base
 * (user_books, reviews, follows, etc.). Si la base est vide en 2026, le
 * script ne crée pas de gagnants mais crée bien `awards_years` en draft.
 *
 * Usage : pnpm tsx scripts/seed-awards-2026.ts [--overwrite] [--publish]
 */

import "dotenv/config";

import db from "../src/lib/supabase/db";
import {
  computeAwardsForYear,
  persistAwards,
} from "../src/features/awards/server/aggregate";

const args = new Set(process.argv.slice(2));
const overwrite = args.has("--overwrite");
const publish = args.has("--publish");

const main = async () => {
  const year = 2026;
  console.log(`[seed-awards] year=${year} overwrite=${overwrite} publish=${publish}`);

  const result = await computeAwardsForYear(db.client, year);
  console.log(`[seed-awards] computed winners: ${result.winners.length}`);
  console.log(`[seed-awards] summary:`, result.summary);

  const persisted = await persistAwards(db.client, result, { overwrite });
  console.log(`[seed-awards] persist:`, persisted);

  if (publish) {
    const { error } = await db.client
      .from("awards_years")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("year", year);
    if (error) {
      console.error("[seed-awards] publish failed:", error);
      process.exit(1);
    }
    console.log(`[seed-awards] published ${year}`);
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed-awards] failed:", error);
    process.exit(1);
  });
