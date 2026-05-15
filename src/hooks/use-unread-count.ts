"use client";

import { useQuery } from "@tanstack/react-query";

import { getUnreadCount } from "@/server/actions/notifications";

export const UNREAD_COUNT_QUERY_KEY = ["notifications", "unread-count"] as const;

export const useUnreadCount = () => {
  const query = useQuery({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: async () => {
      const result = await getUnreadCount();
      return result.success ? result.count : 0;
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  return query.data ?? 0;
};
