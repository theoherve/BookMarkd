import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";
import { searchOpenLibrary } from "@/lib/open-library";
import type { SearchBook, SearchResponse } from "@/features/search/types";

const DB_LIMIT = 12;
const OPEN_LIBRARY_LIMIT = 6;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const genre = url.searchParams.get("genre") ?? "";
  const includeExternal =
    url.searchParams.get("external") !== "false" && query.length > 0;

  try {
    // Construire la condition de recherche
    const whereCondition: Prisma.BookWhereInput = {};

    // Recherche par titre ou auteur
    if (query) {
      whereCondition.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { author: { contains: query, mode: "insensitive" } },
      ];
    }

    // Filtre par genre
    if (genre) {
      const normalizedGenre = genre.toLowerCase();
      whereCondition.bookTags = {
        some: {
          tag: {
            OR: [
              { slug: genre },
              { name: { contains: normalizedGenre, mode: "insensitive" } },
            ],
          },
        },
      };
    }

    // Récupérer les livres avec Prisma
    const dbBooks = await prisma.book.findMany({
      where: whereCondition,
      include: {
        bookTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        averageRating: "desc",
      },
      take: DB_LIMIT,
    });

    const formattedDbBooks: SearchBook[] = dbBooks.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      summary: book.summary,
      averageRating: book.averageRating ? Number(book.averageRating) : null,
      publicationYear: book.publicationYear,
      tags: book.bookTags.map((bt) => ({
        id: bt.tag.id,
        name: bt.tag.name,
        slug: bt.tag.slug,
      })),
      source: "supabase",
    }));

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

