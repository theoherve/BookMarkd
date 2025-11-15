"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/supabase/db";
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
    const coverUrl = payload.coverUrl ?? workDetails.coverUrl ?? payload.coverUrl;

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
      const uniqueSubjects = Array.from(
        new Map(
          subjects.map((subject) => [slugify(subject), subject]),
        ).entries(),
      )
        .slice(0, 8)
        .map(([slug, name]) => ({ slug, name }));

      if (uniqueSubjects.length > 0) {
        // Créer ou mettre à jour les tags
        for (const subject of uniqueSubjects) {
          // Upsert tag by slug
          const { data: tagRow } = await db.client
            .from("tags")
            .select("id")
            .eq("slug", subject.slug)
            .maybeSingle();
          if (!tagRow) {
            await db.client.from("tags").insert([
              {
                name: subject.name,
                slug: subject.slug,
              },
            ]);
          } else {
            await db.client
              .from("tags")
              .update({ name: subject.name })
              .eq("id", tagRow.id as string);
          }
        }

        // Récupérer les IDs des tags
        const { data: tagRows, error: tagsError } = await db.client
          .from("tags")
          .select("id, slug")
          .in(
            "slug",
            uniqueSubjects.map((subject) => subject.slug),
          );
        if (tagsError) throw tagsError;

        const tagMap = new Map(
          (tagRows ?? []).map((row) => [row.slug as string, row.id as string]),
        );

        // Créer les relations book_tags
        const bookTagData = uniqueSubjects
          .map((subject) => {
            const tagId = tagMap.get(subject.slug);
            if (!tagId) {
              return null;
            }
            return {
              book_id: newBook.id as string,
              tag_id: tagId,
            };
          })
          .filter((row): row is { book_id: string; tag_id: string } =>
            Boolean(row),
          );

        // Créer les relations (Prisma gère automatiquement les conflits avec createMany + skipDuplicates)
        if (bookTagData.length > 0) {
          // Upsert-like: try insert, ignore duplicates
          await db.client.from("book_tags").upsert(bookTagData, {
            onConflict: "book_id,tag_id",
            ignoreDuplicates: true,
          });
        }
      }
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

