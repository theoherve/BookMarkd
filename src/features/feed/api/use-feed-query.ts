"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { FeedActivity, FeedResponse } from "@/features/feed/types";

export type FeedQueryParams = {
  activitiesLimit?: number;
  activitiesOffset?: number;
};

const fetchFeed = async (
  params?: FeedQueryParams,
): Promise<FeedResponse> => {
  const url = new URL("/api/feed", window.location.origin);
  if (params?.activitiesLimit != null) {
    url.searchParams.set("activitiesLimit", String(params.activitiesLimit));
  }
  if (params?.activitiesOffset != null) {
    url.searchParams.set("activitiesOffset", String(params.activitiesOffset));
  }
  const response = await fetch(url.toString(), {
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

export const useFeedQuery = (params?: FeedQueryParams) => {
  return useQuery({
    queryKey: [...feedQueryKey, params?.activitiesLimit ?? null, params?.activitiesOffset ?? null],
    queryFn: () => fetchFeed(params),
  });
};

const ACTIVITIES_PAGE_SIZE = 8;

export const useInfiniteFeedQuery = () => {
  const [allRawActivities, setAllRawActivities] = useState<FeedActivity[]>([]);
  const [friendsBooks, setFriendsBooks] = useState<FeedResponse["friendsBooks"]>([]);
  const [recommendations, setRecommendations] = useState<FeedResponse["recommendations"]>([]);
  const [hasMoreActivities, setHasMoreActivities] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const initialFetched = useRef(false);

  const initialQuery = useQuery({
    queryKey: [...feedQueryKey, "infinite", ACTIVITIES_PAGE_SIZE, 0],
    queryFn: () => fetchFeed({ activitiesLimit: ACTIVITIES_PAGE_SIZE, activitiesOffset: 0 }),
  });

  useEffect(() => {
    if (!initialQuery.data || initialFetched.current) return;
    initialFetched.current = true;
    setAllRawActivities(initialQuery.data.activities);
    setFriendsBooks(initialQuery.data.friendsBooks);
    setRecommendations(initialQuery.data.recommendations);
    setHasMoreActivities(initialQuery.data.hasMoreActivities ?? false);
  }, [initialQuery.data]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMoreActivities) return;
    setIsLoadingMore(true);
    try {
      const next = await fetchFeed({
        activitiesLimit: ACTIVITIES_PAGE_SIZE,
        activitiesOffset: allRawActivities.length,
      });
      setAllRawActivities((prev) => [...prev, ...next.activities]);
      setHasMoreActivities(next.hasMoreActivities ?? false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [allRawActivities.length, hasMoreActivities, isLoadingMore]);

  const data: FeedResponse | undefined = initialQuery.data
    ? {
        activities: allRawActivities,
        friendsBooks,
        recommendations,
        hasMoreActivities,
      }
    : undefined;

  return {
    data,
    isLoading: initialQuery.isLoading,
    isError: initialQuery.isError,
    refetch: initialQuery.refetch,
    isRefetching: initialQuery.isRefetching,
    hasMoreActivities,
    loadMore,
    isLoadingMore,
  };
};

