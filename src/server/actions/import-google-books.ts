"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/supabase/db";
import { fetchGoogleBooksDetails } from "@/lib/google-books";
import { incrementGoogleBooksQuota, canUseGoogleBooks } from "@/lib/google-books/quota-tracker";

type ImportPayload = {
  googleBooksId: string;
  title: string;
  author: string;
  coverUrl?: string | null;
  publicationYear?: number | null;
  summary?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  language?: string | null;
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

export const importGoogleBooksBook = async (
  payload: ImportPayload,
): Promise<ImportResult> => {
  try {
    // Vérifier si le quota est disponible avant de faire la requête
    const canUse = await canUseGoogleBooks();
    if (!canUse) {
      return {
        success: false,
        message: "Le quota quotidien de Google Books est atteint. Veuillez réessayer demain.",
      };
    }

    // Vérifier si le livre existe déjà
    const { data: existing, error: findError } = await db.client
      .from("books")
      .select("id")
      .eq("google_books_id", payload.googleBooksId)
      .maybeSingle();
    if (findError) throw findError;

    if (existing?.id) {
      return { success: true, bookId: existing.id as string };
    }

    // Vérifier aussi par ISBN si disponible
    if (payload.isbn) {
      const { data: existingByIsbn } = await db.client
        .from("books")
        .select("id")
        .eq("isbn", payload.isbn)
        .maybeSingle();
      
      if (existingByIsbn?.id) {
        // Mettre à jour avec le google_books_id si pas déjà présent
        await db.client
          .from("books")
          .update({ google_books_id: payload.googleBooksId })
          .eq("id", existingByIsbn.id);
        
        return { success: true, bookId: existingByIsbn.id as string };
      }
    }

    // Incrémenter le quota avant de faire la requête pour les détails
    const quotaOk = await incrementGoogleBooksQuota();
    if (!quotaOk) {
      return {
        success: false,
        message: "Le quota quotidien de Google Books est atteint. Veuillez réessayer demain.",
      };
    }

    // Récupérer les détails complets depuis Google Books
    const volumeDetails = await fetchGoogleBooksDetails(payload.googleBooksId);
    const summary = payload.summary ?? (volumeDetails.description ?? null);
    const coverUrl = payload.coverUrl ?? volumeDetails.coverUrl ?? payload.coverUrl;
    const isbn = payload.isbn ?? volumeDetails.isbn ?? null;
    const publisher = payload.publisher ?? volumeDetails.publisher ?? null;
    const language = payload.language ?? volumeDetails.language ?? null;

    // Créer le livre
    const { data: newBook, error: insertError } = await db.client
      .from("books")
      .insert([
        {
          google_books_id: payload.googleBooksId,
          title: payload.title,
          author: payload.author,
          cover_url: coverUrl,
          publication_year: payload.publicationYear ?? null,
          summary,
          isbn,
          publisher,
          language,
          ratings_count: 0,
          average_rating: 0,
        },
      ])
      .select("id")
      .single();
    if (insertError) throw insertError;

    // Traiter les catégories comme tags
    const categories = volumeDetails.categories ?? [];
    if (categories.length > 0) {
      const uniqueSubjects = Array.from(
        new Map(
          categories.map((category) => [slugify(category), category]),
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

        // Créer les relations (Supabase ignore automatiquement les doublons)
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
    console.error("[import-google-books] error:", error);
    return {
      success: false,
      message: "Impossible d'importer ce livre depuis Google Books.",
    };
  }
};

