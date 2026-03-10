"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { SuggestionsResponse } from "@/features/search/types";

const DEBOUNCE_MS = 300;

const fetchSuggestions = async (q: string): Promise<SuggestionsResponse> => {
  const response = await fetch(
    `/api/search/suggestions?q=${encodeURIComponent(q)}`,
    { method: "GET" },
  );
  if (!response.ok) {
    throw new Error("Erreur lors du chargement des suggestions.");
  }
  return response.json();
};

export const useSearchSuggestions = (query: string) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ["search-suggestions", debouncedQuery],
    queryFn: () => fetchSuggestions(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 1000 * 30,
  });
};
