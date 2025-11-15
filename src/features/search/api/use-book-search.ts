"use client";

import { useQuery } from "@tanstack/react-query";

import type { SearchResponse } from "@/features/search/types";

type SearchParams = {
  q: string;
  genre?: string;
  minRating?: number;
  readingStatus?: "to_read" | "reading" | "finished";
  author?: string;
  includeExternal?: boolean;
};

const buildSearchPath = ({ q, genre, minRating, readingStatus, author, includeExternal = true }: SearchParams) => {
  const params = new URLSearchParams();
  if (q) {
    params.set("q", q);
  }
  if (genre) {
    params.set("genre", genre);
  }
  if (minRating !== undefined && minRating > 0) {
    params.set("minRating", minRating.toString());
  }
  if (readingStatus) {
    params.set("readingStatus", readingStatus);
  }
  if (author) {
    params.set("author", author);
  }
  if (includeExternal === false) {
    params.set("external", "false");
  }

  const queryString = params.toString();
  return queryString ? `/api/books/search?${queryString}` : "/api/books/search";
};

const fetchBookSearch = async (params: SearchParams): Promise<SearchResponse> => {
  const response = await fetch(buildSearchPath(params), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la recherche de livres.");
  }

  return response.json();
};

export const useBookSearch = (params: SearchParams, enabled: boolean) => {
  return useQuery({
    queryKey: ["book-search", params],
    queryFn: () => fetchBookSearch(params),
    enabled,
  });
};

