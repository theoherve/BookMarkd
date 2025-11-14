import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

import type { AvailableBook } from "../types";

export const getAvailableBooks = async (
  excludeBookIds: string[],
  limit = 20,
): Promise<AvailableBook[]> => {
  const supabase = createSupabaseServiceClient();
  const query = supabase
    .from("books")
    .select("id, title, author")
    .order("title", { ascending: true })
    .limit(limit);

  if (excludeBookIds.length > 0) {
    const quotedIds = excludeBookIds.map((value) => `'${value}'`).join(",");
    query.not("id", "in", `(${quotedIds})`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
  }));
};

