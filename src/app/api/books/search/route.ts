import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { searchOpenLibrary } from "@/lib/open-library";
import type { SearchBook, SearchResponse } from "@/features/search/types";

const SUPABASE_LIMIT = 12;
const OPEN_LIBRARY_LIMIT = 6;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const genre = url.searchParams.get("genre") ?? "";
  const includeExternal =
    url.searchParams.get("external") !== "false" && query.length > 0;

  try {
    const supabase = createSupabaseServiceClient();

    const booksQuery = supabase
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
            tag:tags(
              id,
              name,
              slug
            )
          )
        `,
      )
      .limit(SUPABASE_LIMIT)
      .order("average_rating", { ascending: false });

    if (query) {
      booksQuery.or(
        `title.ilike.%${query}%,author.ilike.%${query}%`,
      );
    }

    const { data: supabaseBooksRaw, error } = await booksQuery;

    if (error) {
      throw error;
    }

    const filteredSupabaseBooks =
      supabaseBooksRaw?.filter((book) => {
        if (!genre) {
          return true;
        }

        const tags = Array.isArray(book.book_tags)
          ? book.book_tags
          : [];

        return tags.some(
          (tagRelation) =>
            tagRelation?.tag?.slug === genre ||
            tagRelation?.tag?.name?.toLowerCase() === genre.toLowerCase(),
        );
      }) ?? [];

    const formattedSupabaseBooks: SearchBook[] = filteredSupabaseBooks.map(
      (book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.cover_url,
        summary: book.summary,
        averageRating: book.average_rating,
        publicationYear: book.publication_year,
        tags:
          book.book_tags?.map((relation) => ({
            id: relation.tag?.id ?? "",
            name: relation.tag?.name ?? "",
            slug: relation.tag?.slug ?? "",
          })) ?? [],
        source: "supabase",
      }),
    );

    let externalBooks: SearchBook[] = [];

    if (
      includeExternal &&
      formattedSupabaseBooks.length < SUPABASE_LIMIT
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
      books: [...formattedSupabaseBooks, ...externalBooks],
      supabaseCount: formattedSupabaseBooks.length,
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

