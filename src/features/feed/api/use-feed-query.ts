"use client";

import { useQuery } from "@tanstack/react-query";

import type { FeedResponse } from "@/features/feed/types";

const fetchFeed = async (): Promise<FeedResponse> => {
  const response = await fetch("/api/feed", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Erreur lors du chargement du feed.");
  }

  return response.json();
};

export const feedQueryKey = ["feed"];

export const useFeedQuery = () => {
  return useQuery({
    queryKey: feedQueryKey,
    queryFn: fetchFeed,
  });
};

