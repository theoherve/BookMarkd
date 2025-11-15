import db from "@/lib/supabase/db";

import type { AvailableBook } from "../types";

export const getAvailableBooks = async (
  excludeBookIds: string[],
  limit = 20,
): Promise<AvailableBook[]> => {
  let query = db.client
    .from("books")
    .select("id, title, author")
    .order("title", { ascending: true })
    .limit(limit);

  if (excludeBookIds.length > 0) {
    query = query.not("id", "in", `(${excludeBookIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[lists] getAvailableBooks error:", error);
    return [];
  }

  const books = db.toCamel<Array<{ id: string; title: string; author: string }>>(
    data ?? [],
  );

  return books.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
  }));
};

