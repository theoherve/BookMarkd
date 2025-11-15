import { NextResponse } from "next/server";
import db from "@/lib/supabase/db";
import { searchOpenLibrary } from "@/lib/open-library";
import type { SearchBook, SearchResponse } from "@/features/search/types";

const DB_LIMIT = 12;
const OPEN_LIBRARY_LIMIT = 6;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const genre = url.searchParams.get("genre") ?? "";
  const minRating = url.searchParams.get("minRating");
  const includeExternal =
    url.searchParams.get("external") !== "false" && query.length > 0;

  try {
    // Construire la requête Supabase
    let booksQuery = db.client
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
      `,
      )
      .order("average_rating", { ascending: false })
      .limit(DB_LIMIT);

    if (query) {
      booksQuery = booksQuery.or(
        `title.ilike.%${query}%,author.ilike.%${query}%`,
      );
    }

    if (minRating) {
      const ratingValue = parseFloat(minRating);
      if (!isNaN(ratingValue) && ratingValue >= 0 && ratingValue <= 5) {
        booksQuery = booksQuery.gte("average_rating", ratingValue);
      }
    }

    let { data: booksData, error: booksError } = await booksQuery;

    if (booksError) {
      throw booksError;
    }

    // Filtre par genre côté JS si nécessaire
    if (genre) {
      const normalizedGenre = genre.trim().toLowerCase();
      booksData =
        (booksData ?? []).filter((b: any) =>
          (b.book_tags ?? []).some(
            (bt: any) =>
              bt?.tags?.slug === normalizedGenre ||
              (bt?.tags?.name ?? "")
                .toLowerCase()
                .includes(normalizedGenre),
          ),
        );
    }

    const formattedDbBooks: SearchBook[] = (booksData ?? []).map((raw) => {
      const book = db.toCamel<{
        id: string;
        title: string;
        author: string;
        coverUrl: string | null;
        summary: string | null;
        averageRating: number | null;
        publicationYear: number | null;
        bookTags?: Array<{ tags?: { id: string; name: string; slug: string } }>;
      }>(raw);

      return {
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        summary: book.summary ?? null,
        averageRating:
          typeof book.averageRating === "number" ? book.averageRating : null,
        publicationYear: book.publicationYear ?? null,
        tags: (book.bookTags ?? [])
          .map((bt) => bt.tags)
          .filter(Boolean)
          .map((t) => ({
            id: t!.id,
            name: t!.name,
            slug: t!.slug,
          })),
        source: "supabase",
      };
    });

    let externalBooks: SearchBook[] = [];

    if (
      includeExternal &&
      formattedDbBooks.length < DB_LIMIT
    ) {
      const openLibraryResults = await searchOpenLibrary(
        query,
        OPEN_LIBRARY_LIMIT,
      );

      externalBooks = openLibraryResults.map((item) => ({
        id: item.id,
        title: item.title,
        author: item.author,
        coverUrl: item.coverUrl,
        publicationYear: item.publicationYear,
        source: "open_library",
        reason:
          "Résultat Open Library – à ajouter à BookMarkd si vous ne le trouvez pas.",
      }));
    }

    const payload: SearchResponse = {
      books: [...formattedDbBooks, ...externalBooks],
      supabaseCount: formattedDbBooks.length,
      externalCount: externalBooks.length,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[books/search] GET error:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les résultats de recherche." },
      { status: 500 },
    );
  }
}

