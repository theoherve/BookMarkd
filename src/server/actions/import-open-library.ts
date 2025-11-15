"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/supabase/db";
import { fetchOpenLibraryWorkDetails } from "@/lib/open-library";
import { upsertBookTags } from "@/server/actions/helpers/book-tags";

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

export const importOpenLibraryBook = async (
  payload: ImportPayload,
): Promise<ImportResult> => {
  try {
    // Vérifier si le livre existe déjà
    const { data: existing, error: findError } = await db.client
      .from("books")
      .select("id")
      .eq("open_library_id", payload.openLibraryId)
      .maybeSingle();
    if (findError) throw findError;

    if (existing?.id) {
      return { success: true, bookId: existing.id as string };
    }

    const workDetails = await fetchOpenLibraryWorkDetails(payload.openLibraryId);
    const summary = payload.summary ?? (workDetails.description ?? null);
    const coverUrl = payload.coverUrl ?? workDetails.coverUrl ?? null;

    // Créer le livre
    const { data: newBook, error: insertError } = await db.client
      .from("books")
      .insert([
        {
          open_library_id: payload.openLibraryId,
          title: payload.title,
          author: payload.author,
          cover_url: coverUrl,
          publication_year: payload.publicationYear ?? null,
          summary,
          ratings_count: 0,
          average_rating: 0,
        },
      ])
      .select("id")
      .single();
    if (insertError) throw insertError;

    const subjects = workDetails.subjects ?? [];
    if (subjects.length > 0) {
      await upsertBookTags(subjects, newBook.id as string);
    }

    revalidatePath("/search");
    revalidatePath(`/books/${newBook.id}`);

    return { success: true, bookId: newBook.id as string };
  } catch (error) {
    console.error("[import-open-library] error:", error);
    return {
      success: false,
      message: "Impossible d'importer ce livre depuis Open Library.",
    };
  }
};

