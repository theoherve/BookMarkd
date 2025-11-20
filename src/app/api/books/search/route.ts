import { NextResponse } from "next/server";
import db from "@/lib/supabase/db";
import { searchOpenLibrary } from "@/lib/open-library";
import { searchGoogleBooks, canUseGoogleBooks } from "@/lib/google-books";
import { incrementGoogleBooksQuota } from "@/lib/google-books/quota-tracker";
import type { SearchBook, SearchResponse } from "@/features/search/types";

const DB_LIMIT = 12;
const EXTERNAL_LIMIT = 6;

type DbBookRow = {
  id: string;
  title: string;
  author: string;
  cover_url?: string | null;
  summary?: string | null;
  average_rating?: number | null;
  publication_year?: number | null;
  book_tags?: Array<{
    tags?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }> | null;
};

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const genre = url.searchParams.get("genre") ?? "";
  const minRating = url.searchParams.get("minRating");
  const readingStatus = url.searchParams.get("readingStatus") as
    | "to_read"
    | "reading"
    | "finished"
    | null;
  const author = url.searchParams.get("author") ?? "";
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

    if (author) {
      booksQuery = booksQuery.ilike("author", `%${author}%`);
    }

    if (minRating) {
      const ratingValue = parseFloat(minRating);
      if (!isNaN(ratingValue) && ratingValue >= 0 && ratingValue <= 5) {
        booksQuery = booksQuery.gte("average_rating", ratingValue);
      }
    }

    // Filtrer par état de lecture du viewer si fourni et si session disponible
    if (readingStatus) {
      // Récupérer l'id du viewer via la session côté serveur
      const { getCurrentSession } = await import("@/lib/auth/session");
      const session = await getCurrentSession();
      const viewerId = session?.user?.id ? String(session.user.id) : null;

      if (viewerId) {
        const { data: rows, error: userBooksError } = await db.client
          .from("user_books")
          .select("book_id")
          .eq("user_id", viewerId)
          .eq("status", readingStatus);
        if (userBooksError) {
          throw userBooksError;
        }
        const bookIds = (rows ?? []).map((r: { book_id: string }) => r.book_id);
        if (bookIds.length === 0) {
          return NextResponse.json({
            books: [],
            supabaseCount: 0,
            externalCount: 0,
          } as SearchResponse);
        }
        booksQuery = booksQuery.in("id", bookIds);
      }
    }

    const result = await booksQuery;
    let booksData = result.data as DbBookRow[] | null;
    const booksError = result.error;

    if (booksError) {
      throw booksError;
    }

    // Filtre par genre côté JS si nécessaire
    if (genre) {
      const normalizedGenre = genre.trim().toLowerCase();
      booksData =
        (booksData ?? []).filter((b: DbBookRow) => {
          const relations = b.book_tags ?? [];
          return relations.some((bt) => {
            const tag = bt?.tags;
            if (!tag) return false;
            return (
              tag.slug === normalizedGenre ||
              (tag.name ?? "").toLowerCase().includes(normalizedGenre)
            );
          });
        });
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
      // Priorité 1: Essayer Google Books si le quota n'est pas atteint
      const canUseGoogle = await canUseGoogleBooks();
      const remainingSlots = DB_LIMIT - formattedDbBooks.length;
      const externalLimit = Math.min(remainingSlots, EXTERNAL_LIMIT);

      if (canUseGoogle) {
        try {
          // Incrémenter le quota avant la requête
          const quotaOk = await incrementGoogleBooksQuota();
          
          if (quotaOk) {
            const googleBooksResults = await searchGoogleBooks(
              query,
              externalLimit,
            );

            // Si Google Books retourne des résultats, les utiliser
            if (googleBooksResults.length > 0) {
              externalBooks = googleBooksResults.map((item) => ({
                id: item.id,
                title: item.title,
                author: item.author,
                coverUrl: item.coverUrl,
                summary: item.summary ?? null,
                publicationYear: item.publicationYear,
                source: "google_books",
                reason:
                  "Résultat Google Books – à ajouter à BookMarkd si vous ne le trouvez pas.",
              }));
            } else {
              // Aucun résultat ou erreur (403, etc.) - le fallback sera utilisé
              console.log(
                "[books/search] Google Books returned no results, falling back to OpenLibrary"
              );
            }
          } else {
            console.warn(
              "[books/search] Google Books quota limit reached, falling back to OpenLibrary"
            );
          }
        } catch (error) {
          console.error("[books/search] Google Books error:", error);
          // En cas d'erreur inattendue, on continue avec OpenLibrary
        }
      }

      // Priorité 2: Fallback vers OpenLibrary si Google Books n'a rien retourné ou quota atteint
      if (externalBooks.length === 0) {
        const openLibraryResults = await searchOpenLibrary(
          query,
          externalLimit,
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

