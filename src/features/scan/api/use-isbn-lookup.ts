import { useQuery } from "@tanstack/react-query";
import type { IsbnLookupResult } from "@/features/scan/types";

export const useIsbnLookup = (isbn: string | null) => {
  return useQuery<IsbnLookupResult>({
    queryKey: ["isbn-lookup", isbn],
    queryFn: async () => {
      const response = await fetch(`/api/books/isbn/${isbn}`);
      const data = await response.json();

      // 404 means not found but is not an error
      if (response.status === 404) {
        return { found: false };
      }

      if (!response.ok) {
        throw new Error(data.error ?? "Erreur lors de la recherche.");
      }

      return data;
    },
    enabled: isbn !== null,
    staleTime: 1000 * 60 * 60, // 1h
    retry: 1,
  });
};
