import { describe, expect, it } from "vitest";

import { computeCompatibilityScore } from "@/features/recommendations/compatibility-score";

/**
 * Tests pour la logique de scoring "discover" — la fonction principale
 * `getDiscoverCandidates` fait des appels Supabase et ne se teste pas en unit
 * sans mock complet. On vérifie ici les propriétés-clés du blend score
 * que le module attend (tag + auteur + popularité + amis).
 */

const blendTagAuthor = (tagScore: number, authorMatch: boolean): number => {
  if (!authorMatch) return tagScore;
  return Math.max(tagScore, 100 * 0.8 + tagScore * 0.2);
};

describe("discover blend score (tag + author)", () => {
  it("returns plain tagScore when no author match", () => {
    expect(blendTagAuthor(60, false)).toBe(60);
  });

  it("boosts score when author matches even with 0 tags", () => {
    expect(blendTagAuthor(0, true)).toBe(80);
  });

  it("keeps tagScore if already higher than author bonus", () => {
    // tag 100 vs blend 80+20 = 100 → no change
    expect(blendTagAuthor(100, true)).toBe(100);
  });

  it("favors author match over weak tags", () => {
    const onlyTags = blendTagAuthor(40, false);
    const withAuthor = blendTagAuthor(40, true);
    expect(withAuthor).toBeGreaterThan(onlyTags);
  });
});

describe("discover final compatibility flow", () => {
  it("a book with author match + popular rating scores high", () => {
    const blended = blendTagAuthor(20, true); // 84
    const score = computeCompatibilityScore({
      tagScore: blended,
      friendsAvgRating: null,
      popularityScore: 90,
    });
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it("a book with only weak tags and no other signal stays low", () => {
    const score = computeCompatibilityScore({
      tagScore: 15,
      friendsAvgRating: null,
      popularityScore: null,
    });
    expect(score).toBeLessThan(30);
  });

  it("friends signal lifts an otherwise weak candidate", () => {
    const noFriends = computeCompatibilityScore({
      tagScore: 30,
      friendsAvgRating: null,
      popularityScore: 50,
    });
    const withFriends = computeCompatibilityScore({
      tagScore: 30,
      friendsAvgRating: 4.5,
      popularityScore: 50,
    });
    expect(withFriends).toBeGreaterThan(noFriends);
  });
});
