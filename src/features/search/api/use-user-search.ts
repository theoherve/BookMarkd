"use client";

import { useQuery } from "@tanstack/react-query";

import type { UserSearchResponse } from "@/features/search/types";

type UserSearchParams = {
  q: string;
};

const buildUserSearchPath = ({ q }: UserSearchParams) => {
  const params = new URLSearchParams();
  if (q) {
    params.set("q", q);
  }

  const queryString = params.toString();
  return queryString ? `/api/users/search?${queryString}` : "/api/users/search";
};

const fetchUserSearch = async (params: UserSearchParams): Promise<UserSearchResponse> => {
  const response = await fetch(buildUserSearchPath(params), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la recherche d'utilisateurs.");
  }

  return response.json();
};

export const useUserSearch = (params: UserSearchParams, enabled: boolean) => {
  return useQuery({
    queryKey: ["user-search", params],
    queryFn: () => fetchUserSearch(params),
    enabled,
  });
};

