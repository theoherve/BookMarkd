import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { searchOpenLibrary } from "@/lib/open-library";
import type { SearchBook, SearchResponse } from "@/features/search/types";

type SupabaseTag = {
  id: string;
  name: string;
  slug: string;
};

type SupabaseTagRelation = {
  tag?: SupabaseTag | SupabaseTag[] | null;
};

type SupabaseSearchBook = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  summary: string | null;
  average_rating: number | null;
  publication_year: number | null;
  book_tags?: SupabaseTagRelation[] | null;
};

const extractTagFromRelation = (
  relation: SupabaseTagRelation | null | undefined,
): SupabaseTag | null => {
  if (!relation?.tag) {
    return null;
  }

  if (Array.isArray(relation.tag)) {
    return relation.tag[0] ?? null;
  }

  return relation.tag;
};

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

    const { data: supabaseBooksRaw, error } =
      await booksQuery.returns<SupabaseSearchBook[]>();

    if (error) {
      throw error;
    }

    const filteredSupabaseBooks =
      supabaseBooksRaw?.filter((book) => {
        if (!genre) {
          return true;
        }

        const tags = Array.isArray(book.book_tags) ? book.book_tags : [];
        const normalizedGenre = genre.toLowerCase();

        return tags.some((tagRelation) => {
          const tag = extractTagFromRelation(tagRelation);
          if (!tag) {
            return false;
          }

          if (tag.slug === genre) {
            return true;
          }

          return tag.name?.toLowerCase() === normalizedGenre;
        });
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
          book.book_tags
            ?.map((relation) => {
              const tag = extractTagFromRelation(relation);
              if (!tag) {
                return null;
              }

              return {
                id: tag.id,
                name: tag.name,
                slug: tag.slug,
              };
            })
            .filter((tag): tag is SupabaseTag => Boolean(tag)) ?? [],
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

