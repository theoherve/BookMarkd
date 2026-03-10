"use client";

import { useQuery } from "@tanstack/react-query";
import type { BlogSuggestion } from "@/features/search/types";

type BlogSearchResponse = {
  blog: BlogSuggestion[];
  count: number;
};

const fetchBlogSearch = async (q: string): Promise<BlogSearchResponse> => {
  const response = await fetch(
    `/api/search/blog?q=${encodeURIComponent(q)}`,
    { method: "GET" },
  );
  if (!response.ok) {
    throw new Error("Erreur lors de la recherche dans le blog.");
  }
  return response.json();
};

export const useBlogSearch = (q: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["blog-search", q],
    queryFn: () => fetchBlogSearch(q),
    enabled,
  });
};
