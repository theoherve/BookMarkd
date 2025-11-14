"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { fetchOpenLibraryWorkDetails } from "@/lib/open-library";

type ImportPayload = {
  openLibraryId: string;
  title: string;
  author: string;
  coverUrl?: string | null;
  publicationYear?: number | null;
  summary?: string | null;
};

type ImportResult =
  | { success: true; bookId: string }
  | { success: false; message: string };

const slugify = (value: string) => {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
};

export const importOpenLibraryBook = async (
  payload: ImportPayload,
): Promise<ImportResult> => {
  try {
    const supabase = createSupabaseServiceClient();

    const { data: existing } = await supabase
      .from("books")
      .select("id")
      .eq("open_library_id", payload.openLibraryId)
      .maybeSingle();

    if (existing?.id) {
      return { success: true, bookId: existing.id };
    }

    const workDetails = await fetchOpenLibraryWorkDetails(payload.openLibraryId);
    const summary = payload.summary ?? (workDetails.description ?? null);
    const coverUrl = payload.coverUrl ?? workDetails.coverUrl ?? payload.coverUrl;

    const newBookId = crypto.randomUUID();
    const { error } = await supabase.from("books").insert({
      id: newBookId,
      open_library_id: payload.openLibraryId,
      title: payload.title,
      author: payload.author,
      cover_url: coverUrl,
      publication_year: payload.publicationYear,
      summary,
      ratings_count: 0,
      average_rating: 0,
    });

    if (error) {
      throw error;
    }

    const subjects = workDetails.subjects ?? [];
    if (subjects.length > 0) {
      const uniqueSubjects = Array.from(
        new Map(
          subjects.map((subject) => [slugify(subject), subject]),
        ).entries(),
      )
        .slice(0, 8)
        .map(([slug, name]) => ({ slug, name }));

      if (uniqueSubjects.length > 0) {
        await supabase
          .from("tags")
          .upsert(
            uniqueSubjects.map((subject) => ({
              name: subject.name,
              slug: subject.slug,
            })),
            { onConflict: "slug" },
          );

        const { data: tagRows } = await supabase
          .from("tags")
          .select("id, slug")
          .in(
            "slug",
            uniqueSubjects.map((subject) => subject.slug),
          );

        const tagMap = new Map(tagRows?.map((row) => [row.slug, row.id]));

        const bookTagPayload = uniqueSubjects
          .map((subject) => {
            const tagId = tagMap.get(subject.slug);
            if (!tagId) {
              return null;
            }
            return {
              book_id: newBookId,
              tag_id: tagId,
            };
          })
          .filter((row): row is { book_id: string; tag_id: string } =>
            Boolean(row),
          );

        if (bookTagPayload.length > 0) {
          await supabase
            .from("book_tags")
            .upsert(bookTagPayload, { onConflict: "book_id,tag_id" });
        }
      }
    }

    revalidatePath("/search");
    revalidatePath(`/books/${newBookId}`);

    return { success: true, bookId: newBookId };
  } catch (error) {
    console.error("[import-open-library] error:", error);
    return {
      success: false,
      message: "Impossible d'importer ce livre depuis Open Library.",
    };
  }
};

