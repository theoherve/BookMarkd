import { describe, expect, it } from "vitest";

import {
  compareByScoreThenCreatedAt,
  round,
  scoreBestNewcomer,
  scoreBookOfTheYear,
  scoreReaderOfTheYear,
  scoreTopReviewer,
} from "@/features/awards/server/scoring";

describe("scoreBookOfTheYear (Bayesian-light)", () => {
  it("returns 0 when no one finished the book", () => {
    expect(
      scoreBookOfTheYear({
        bookId: "b",
        finishCount: 0,
        avgRating: 5,
        ratingCount: 0,
        earliestFinishedAt: "",
      }),
    ).toBe(0);
  });

  it("penalises a single 5-star rating against a many-rating book", () => {
    const lone = scoreBookOfTheYear({
      bookId: "lone",
      finishCount: 1,
      avgRating: 5,
      ratingCount: 1,
      earliestFinishedAt: "",
    });
    const popular = scoreBookOfTheYear({
      bookId: "pop",
      finishCount: 50,
      avgRating: 4.2,
      ratingCount: 50,
      earliestFinishedAt: "",
    });
    expect(popular).toBeGreaterThan(lone);
  });

  it("respects formula avg_rating × √finish_count × log10(ratings+2)", () => {
    const score = scoreBookOfTheYear({
      bookId: "x",
      finishCount: 4,
      avgRating: 4,
      ratingCount: 8,
      earliestFinishedAt: "",
    });
    // 4 × 2 × log10(10) = 4 × 2 × 1 = 8
    expect(round(score, 4)).toBe(8);
  });
});

describe("scoreReaderOfTheYear", () => {
  it("counts finishes 1×, reviews 0.5×, lists 0.3×", () => {
    expect(
      scoreReaderOfTheYear({
        userId: "u",
        finishCount: 10,
        reviewsWritten: 4,
        listsCreated: 2,
        earliestFinishedAt: "",
      }),
    ).toBe(10 + 0.5 * 4 + 0.3 * 2);
  });

  it("weights finishes more per unit than reviews", () => {
    const a = scoreReaderOfTheYear({
      userId: "a",
      finishCount: 10,
      reviewsWritten: 0,
      listsCreated: 0,
      earliestFinishedAt: "",
    });
    const b = scoreReaderOfTheYear({
      userId: "b",
      finishCount: 0,
      reviewsWritten: 10,
      listsCreated: 0,
      earliestFinishedAt: "",
    });
    expect(a).toBeGreaterThan(b);
  });
});

describe("scoreTopReviewer", () => {
  it("counts reviews twice and likes once", () => {
    expect(
      scoreTopReviewer({
        userId: "u",
        reviewCount: 3,
        likesReceived: 4,
        earliestReviewAt: "",
      }),
    ).toBe(4 + 2 * 3);
  });
});

describe("scoreBestNewcomer", () => {
  it("weights finishes plus 0.3 reviews", () => {
    expect(
      scoreBestNewcomer({
        userId: "u",
        joinedAt: "",
        finishCount: 5,
        reviewsWritten: 10,
      }),
    ).toBe(5 + 0.3 * 10);
  });
});

describe("compareByScoreThenCreatedAt (tie-break)", () => {
  it("sorts higher score first", () => {
    const arr = [
      { score: 5, createdAt: "2026-06-01" },
      { score: 10, createdAt: "2026-06-01" },
    ];
    arr.sort(compareByScoreThenCreatedAt);
    expect(arr[0]!.score).toBe(10);
  });

  it("breaks ties by earlier createdAt", () => {
    const arr = [
      { score: 5, createdAt: "2026-07-01" },
      { score: 5, createdAt: "2026-03-01" },
    ];
    arr.sort(compareByScoreThenCreatedAt);
    expect(arr[0]!.createdAt).toBe("2026-03-01");
  });
});

describe("round", () => {
  it("rounds to 4 decimals by default", () => {
    expect(round(1.234567)).toBe(1.2346);
  });
});
