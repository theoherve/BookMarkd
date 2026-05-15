export const TAG_WEIGHT = 0.5;
export const FRIENDS_WEIGHT = 0.3;
export const POPULARITY_WEIGHT = 0.2;

const RATING_MAX = 5;

export type CompatibilityInputs = {
  /** Score tags normalisé 0–100 */
  tagScore: number;
  /** Note moyenne amis 0–5, ou null si aucun ami n'a noté */
  friendsAvgRating: number | null;
  /** Score popularité 0–100 (ex: average_rating * 20), ou null si inconnu */
  popularityScore: number | null;
};

/**
 * Combine 3 signaux en score compatibilité 0–100.
 * Poids cibles : 50% tags, 30% amis, 20% popularité.
 * Si amis manquent : renormalise sur tags+popularité.
 * Si popularité manque : renormalise sur tags+amis (ou tags seul).
 */
export const computeCompatibilityScore = ({
  tagScore,
  friendsAvgRating,
  popularityScore,
}: CompatibilityInputs): number => {
  const tag = clamp01to100(tagScore);
  const friends =
    friendsAvgRating !== null
      ? clamp01to100((friendsAvgRating / RATING_MAX) * 100)
      : null;
  const popularity =
    popularityScore !== null ? clamp01to100(popularityScore) : null;

  let weightedSum = tag * TAG_WEIGHT;
  let totalWeight = TAG_WEIGHT;

  if (friends !== null) {
    weightedSum += friends * FRIENDS_WEIGHT;
    totalWeight += FRIENDS_WEIGHT;
  }
  if (popularity !== null) {
    weightedSum += popularity * POPULARITY_WEIGHT;
    totalWeight += POPULARITY_WEIGHT;
  }

  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
};

const clamp01to100 = (v: number) => Math.max(0, Math.min(100, v));
