import type { SearchBook } from "@/features/search/types";

export type IsbnLookupResult = {
  found: boolean;
  book?: SearchBook;
  source?: "supabase" | "google_books" | "open_library";
  error?: string;
};

export type ScanFlowState =
  | "idle"
  | "scanning"
  | "looking-up"
  | "result"
  | "error";
