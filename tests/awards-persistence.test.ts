import { describe, expect, it, vi } from "vitest";
import {
  persistAwards,
  AwardsYearGuardError,
} from "@/features/awards/server/aggregate";
import type { AggregationResult } from "@/features/awards/types";

type Op = { table: string; op: string; payload?: unknown };

const makeMockClient = (existing: { year: number; status: string } | null = null) => {
  const ops: Op[] = [];
  let existingYear = existing;

  const builder = (table: string) => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => {
          if (table === "awards_years") {
            return { data: existingYear, error: null };
          }
          return { data: null, error: null };
        },
      }),
    }),
    insert: async (rows: unknown) => {
      ops.push({ table, op: "insert", payload: rows });
      if (table === "awards_years") {
        const row = rows as { year: number; status: string };
        existingYear = { year: row.year, status: row.status };
      }
      return { error: null };
    },
    delete: () => ({
      eq: async () => {
        ops.push({ table, op: "delete" });
        return { error: null };
      },
    }),
    update: (patch: Record<string, unknown>) => ({
      eq: async () => {
        ops.push({ table, op: "update", payload: patch });
        if (table === "awards_years" && existingYear) {
          existingYear = { ...existingYear, ...(patch as { status?: string }) };
        }
        return { error: null };
      },
    }),
  });

  return {
    ops,
    client: {
      from: vi.fn(builder),
    },
  };
};

const buildResult = (year: number): AggregationResult => ({
  year,
  summary: {
    totalBooksFinished: 100,
    totalUsersActive: 20,
    totalReviewsPublished: 30,
    totalFeelings: 50,
    totalNewcomers: 5,
  },
  winners: [
    {
      category: "book_of_the_year",
      rank: 1,
      winnerType: "book",
      winnerId: "book-1",
      snapshot: {
        type: "book",
        title: "Test",
        author: "Author",
        coverUrl: null,
        slug: "test-par-author",
      },
      score: 42,
      metadata: { finishCount: 10 },
    },
  ],
});

describe("persistAwards", () => {
  it("rejects sub-MIN_AWARDS_YEAR", async () => {
    const { client } = makeMockClient();
    await expect(
      // @ts-expect-error mock client shape
      persistAwards(client, buildResult(2025)),
    ).rejects.toBeInstanceOf(AwardsYearGuardError);
  });

  it("inserts awards_years (draft) and winners on first run", async () => {
    const { client, ops } = makeMockClient(null);
    // @ts-expect-error mock client shape
    const outcome = await persistAwards(client, buildResult(2026));
    expect(outcome.ok).toBe(true);
    expect(outcome.inserted).toBe(1);
    const yearsOp = ops.find((o) => o.table === "awards_years" && o.op === "insert");
    expect(yearsOp).toBeTruthy();
    expect((yearsOp!.payload as { status: string }).status).toBe("draft");
    const winnersOp = ops.find(
      (o) => o.table === "awards_winners" && o.op === "insert",
    );
    expect(winnersOp).toBeTruthy();
  });

  it("skips when year already exists and overwrite=false", async () => {
    const { client, ops } = makeMockClient({ year: 2026, status: "draft" });
    // @ts-expect-error mock client shape
    const outcome = await persistAwards(client, buildResult(2026));
    expect(outcome.ok).toBe(true);
    expect(outcome.skipped).toBe(true);
    const insertOps = ops.filter((o) => o.op === "insert");
    expect(insertOps).toHaveLength(0);
  });

  it("replaces winners when overwrite=true", async () => {
    const { client, ops } = makeMockClient({ year: 2026, status: "draft" });
    const outcome = await persistAwards(
      // @ts-expect-error mock client shape
      client,
      buildResult(2026),
      { overwrite: true },
    );
    expect(outcome.ok).toBe(true);
    const deleted = ops.filter(
      (o) => o.table === "awards_winners" && o.op === "delete",
    );
    expect(deleted.length).toBeGreaterThan(0);
    const updatedYear = ops.find(
      (o) => o.table === "awards_years" && o.op === "update",
    );
    expect(updatedYear).toBeTruthy();
    expect((updatedYear!.payload as { status: string }).status).toBe("draft");
  });
});
