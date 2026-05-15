import { describe, expect, it } from "vitest";

import { computeCompatibilityScore } from "@/features/recommendations/compatibility-score";

describe("computeCompatibilityScore", () => {
  it("uses only tags when friends and popularity are null", () => {
    expect(
      computeCompatibilityScore({
        tagScore: 80,
        friendsAvgRating: null,
        popularityScore: null,
      }),
    ).toBe(80);
  });

  it("returns weighted average when all signals present", () => {
    // tags 100 * 0.5 + amis (5/5 * 100) * 0.3 + pop 100 * 0.2 = 100
    expect(
      computeCompatibilityScore({
        tagScore: 100,
        friendsAvgRating: 5,
        popularityScore: 100,
      }),
    ).toBe(100);
  });

  it("renormalizes when friends rating is missing", () => {
    // tags 80 * 0.5 + pop 60 * 0.2 = 52 ; total weight 0.7 → 74.28
    expect(
      computeCompatibilityScore({
        tagScore: 80,
        friendsAvgRating: null,
        popularityScore: 60,
      }),
    ).toBe(74);
  });

  it("renormalizes when popularity is missing", () => {
    // tags 80 * 0.5 + amis (4/5 * 100=80) * 0.3 = 64 ; total weight 0.8 → 80
    expect(
      computeCompatibilityScore({
        tagScore: 80,
        friendsAvgRating: 4,
        popularityScore: null,
      }),
    ).toBe(80);
  });

  it("converts friends rating from 0-5 scale to 0-100 score", () => {
    // tags 0 * 0.5 + amis (2.5/5*100=50) * 0.3 = 15 ; / 0.8 = 18.75 → 19
    expect(
      computeCompatibilityScore({
        tagScore: 0,
        friendsAvgRating: 2.5,
        popularityScore: null,
      }),
    ).toBe(19);
  });

  it("friends rating boosts score over tags alone", () => {
    const withoutFriends = computeCompatibilityScore({
      tagScore: 50,
      friendsAvgRating: null,
      popularityScore: 50,
    });
    const withFriends = computeCompatibilityScore({
      tagScore: 50,
      friendsAvgRating: 5,
      popularityScore: 50,
    });
    expect(withFriends).toBeGreaterThan(withoutFriends);
  });

  it("low friends rating drags score down", () => {
    const withGoodFriends = computeCompatibilityScore({
      tagScore: 80,
      friendsAvgRating: 5,
      popularityScore: 80,
    });
    const withBadFriends = computeCompatibilityScore({
      tagScore: 80,
      friendsAvgRating: 1,
      popularityScore: 80,
    });
    expect(withBadFriends).toBeLessThan(withGoodFriends);
  });

  it("clamps inputs out of range", () => {
    expect(
      computeCompatibilityScore({
        tagScore: 150,
        friendsAvgRating: null,
        popularityScore: null,
      }),
    ).toBe(100);
    expect(
      computeCompatibilityScore({
        tagScore: -50,
        friendsAvgRating: null,
        popularityScore: null,
      }),
    ).toBe(0);
  });
});
