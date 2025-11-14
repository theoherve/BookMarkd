"use client";

import { create } from "zustand";

type RecommendationSource = "all" | "friends" | "global" | "similar";

type FeedFiltersState = {
  recommendationSource: RecommendationSource;
  setRecommendationSource: (source: RecommendationSource) => void;
};

export const useFeedFiltersStore = create<FeedFiltersState>((set) => ({
  recommendationSource: "all",
  setRecommendationSource: (source) => set({ recommendationSource: source }),
}));

