"use server";

import db from "@/lib/supabase/db";
import { generateBookSlug } from "@/lib/slug";
import { normalizeToISBN13 } from "@/lib/isbn";
import { lookupGoogleBooksByISBN, searchGoogleBooks, canUseGoogleBooks, fetchGoogleBooksDetails } from "@/lib/google-books";
import { incrementGoogleBooksQuota } from "@/lib/google-books/quota-tracker";
import { lookupOpenLibraryByISBN } from "@/lib/open-library";

type ResolveResult =
  | { success: true; slug: string }
  | { success: false; message: string };

async function importFromGoogleResult(
  result: { id: string; title: string; author: string; coverUrl?: string | null; publicationYear?: number | null; isbn?: string | null },
  fallbackCoverUrl: string | null,
  isbn: string | null,
): Promise<ResolveResult | null> {
  const { data: existing } = await db.client
    .from("books")
    .select("id, title, author")
    .eq("google_books_id", result.id)
    .maybeSingle();

  if (existing) {
    return {
      success: true,
      slug: generateBookSlug(existing.title as string, existing.author as string),
    };
  }

  const details = await fetchGoogleBooksDetails(result.id);

  const { data: newBook, error } = await db.client
    .from("books")
    .insert({
      google_books_id: result.id,
      title: result.title,
      author: result.author,
      cover_url: result.coverUrl ?? fallbackCoverUrl,
      publication_year: result.publicationYear ?? null,
      summary: details.description ?? null,
      isbn: isbn ?? result.isbn ?? null,
      publisher: details.publisher ?? null,
      language: details.language ?? null,
      ratings_count: 0,
      average_rating: 0,
      source: "search",
    })
    .select("id, title, author")
    .single();

  if (!error && newBook) {
    return {
      success: true,
      slug: generateBookSlug(newBook.title as string, newBook.author as string),
    };
  }

  return null;
}

export const resolveEditorialBook = async (params: {
  bookId: string | null;
  externalIsbn: string | null;
  externalTitle: string | null;
  externalAuthor: string | null;
  externalCoverUrl: string | null;
}): Promise<ResolveResult> => {
  try {
    // 1. Already linked to a local book
    if (params.bookId) {
      const { data: book } = await db.client
        .from("books")
        .select("title, author")
        .eq("id", params.bookId)
        .single();

      if (book) {
        return {
          success: true,
          slug: generateBookSlug(book.title as string, book.author as string),
        };
      }
    }

    // 2. Try to find by ISBN in local DB
    const isbn = params.externalIsbn ? normalizeToISBN13(params.externalIsbn) : null;

    if (isbn) {
      const { data: localBook } = await db.client
        .from("books")
        .select("id, title, author")
        .eq("isbn", isbn)
        .maybeSingle();

      if (localBook) {
        return {
          success: true,
          slug: generateBookSlug(localBook.title as string, localBook.author as string),
        };
      }
    }

    // 3. Import via Google Books (by ISBN)
    if (isbn) {
      const canUse = await canUseGoogleBooks();
      if (canUse) {
        const quotaOk = await incrementGoogleBooksQuota();
        if (quotaOk) {
          const googleResult = await lookupGoogleBooksByISBN(isbn);
          if (googleResult) {
            const imported = await importFromGoogleResult(googleResult, params.externalCoverUrl, isbn);
            if (imported) return imported;
          }
        }
      }
    }

    // 4. Fallback: import via OpenLibrary (by ISBN)
    if (isbn) {
      const olResult = await lookupOpenLibraryByISBN(isbn);
      if (olResult) {
        const { data: newBook, error } = await db.client
          .from("books")
          .insert({
            title: olResult.title,
            author: olResult.author,
            cover_url: olResult.coverUrl ?? params.externalCoverUrl,
            publication_year: olResult.publicationYear ?? null,
            isbn,
            ratings_count: 0,
            average_rating: 0,
            source: "search",
          })
          .select("id, title, author")
          .single();

        if (!error && newBook) {
          return {
            success: true,
            slug: generateBookSlug(newBook.title as string, newBook.author as string),
          };
        }
      }
    }

    // 5. Fallback: search by title + author via Google Books (no lang restriction)
    if (params.externalTitle) {
      const query = params.externalAuthor
        ? `${params.externalTitle} ${params.externalAuthor}`
        : params.externalTitle;

      const canUse = await canUseGoogleBooks();
      if (canUse) {
        const quotaOk = await incrementGoogleBooksQuota();
        if (quotaOk) {
          const results = await searchGoogleBooks(query, 1, { langRestrict: null });
          const match = results[0];
          if (match) {
            const imported = await importFromGoogleResult(match, params.externalCoverUrl, isbn);
            if (imported) return imported;
          }
        }
      }
    }

    return { success: false, message: "Impossible de trouver ce livre." };
  } catch (error) {
    console.error("[resolve-editorial-book] error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};
