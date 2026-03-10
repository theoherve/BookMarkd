import { NextResponse } from "next/server";
import db from "@/lib/supabase/db";
import { normalizeToISBN13 } from "@/lib/isbn";
import { lookupGoogleBooksByISBN, canUseGoogleBooks } from "@/lib/google-books";
import { incrementGoogleBooksQuota } from "@/lib/google-books/quota-tracker";
import { lookupOpenLibraryByISBN } from "@/lib/open-library";
import type { SearchBook } from "@/features/search/types";

export type IsbnLookupResponse = {
  found: boolean;
  book?: SearchBook;
  source?: "supabase" | "google_books" | "open_library";
};

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ isbn: string }> }
) {
  const { isbn: rawIsbn } = await params;

  // Validate and normalize ISBN
  const isbn = normalizeToISBN13(rawIsbn);

  if (!isbn) {
    return NextResponse.json(
      { found: false, error: "Format ISBN invalide." },
      { status: 400 }
    );
  }

  try {
    // 1. Local DB lookup
    const { data: localBook, error: dbError } = await db.client
      .from("books")
      .select(
        `
        id,
        title,
        author,
        cover_url,
        summary,
        average_rating,
        publication_year,
        book_tags:book_tags(
          tags:tags(
            id,
            name,
            slug
          )
        )
      `
      )
      .eq("isbn", isbn)
      .limit(1)
      .maybeSingle();

    if (dbError) {
      throw dbError;
    }

    if (localBook) {
      const book = db.toCamel<{
        id: string;
        title: string;
        author: string;
        coverUrl: string | null;
        summary: string | null;
        averageRating: number | null;
        publicationYear: number | null;
        bookTags?: Array<{ tags?: { id: string; name: string; slug: string } }>;
      }>(localBook);

      const response: IsbnLookupResponse = {
        found: true,
        source: "supabase",
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl,
          summary: book.summary,
          averageRating: book.averageRating,
          publicationYear: book.publicationYear,
          tags: (book.bookTags ?? [])
            .map((bt) => bt.tags)
            .filter(Boolean)
            .map((t) => ({ id: t!.id, name: t!.name, slug: t!.slug })),
          source: "supabase",
        },
      };

      return NextResponse.json(response);
    }

    // 2. Google Books lookup
    const canUseGoogle = await canUseGoogleBooks();

    if (canUseGoogle) {
      const quotaOk = await incrementGoogleBooksQuota();

      if (quotaOk) {
        const googleResult = await lookupGoogleBooksByISBN(isbn);

        if (googleResult) {
          const response: IsbnLookupResponse = {
            found: true,
            source: "google_books",
            book: {
              id: googleResult.id,
              title: googleResult.title,
              author: googleResult.author,
              coverUrl: googleResult.coverUrl,
              summary: googleResult.summary,
              publicationYear: googleResult.publicationYear,
              source: "google_books",
            },
          };

          return NextResponse.json(response);
        }
      }
    }

    // 3. OpenLibrary fallback
    const openLibResult = await lookupOpenLibraryByISBN(isbn);

    if (openLibResult) {
      const response: IsbnLookupResponse = {
        found: true,
        source: "open_library",
        book: {
          id: openLibResult.id,
          title: openLibResult.title,
          author: openLibResult.author,
          coverUrl: openLibResult.coverUrl,
          publicationYear: openLibResult.publicationYear,
          source: "open_library",
        },
      };

      return NextResponse.json(response);
    }

    // 4. Not found anywhere
    return NextResponse.json(
      { found: false } satisfies IsbnLookupResponse,
      { status: 404 }
    );
  } catch (error) {
    console.error("[books/isbn] GET error:", error);
    return NextResponse.json(
      { found: false, error: "Erreur lors de la recherche par ISBN." },
      { status: 500 }
    );
  }
}
