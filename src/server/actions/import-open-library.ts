"use server";

import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

import { prisma } from "@/lib/prisma/client";
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
    const existing = await prisma.book.findUnique({
      where: { openLibraryId: payload.openLibraryId },
      select: { id: true },
    });

    if (existing?.id) {
      return { success: true, bookId: existing.id };
    }

    const workDetails = await fetchOpenLibraryWorkDetails(payload.openLibraryId);
    const summary = payload.summary ?? (workDetails.description ?? null);
    const coverUrl = payload.coverUrl ?? workDetails.coverUrl ?? payload.coverUrl;

    // Créer le livre
    const newBook = await prisma.book.create({
      data: {
        openLibraryId: payload.openLibraryId,
        title: payload.title,
        author: payload.author,
        coverUrl,
        publicationYear: payload.publicationYear,
        summary,
        ratingsCount: 0,
        averageRating: new Decimal(0),
      },
    });

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
          await prisma.tag.upsert({
            where: { slug: subject.slug },
            update: { name: subject.name },
            create: {
              name: subject.name,
              slug: subject.slug,
            },
          });
        }

        // Récupérer les IDs des tags
        const tagRows = await prisma.tag.findMany({
          where: {
            slug: {
              in: uniqueSubjects.map((subject) => subject.slug),
            },
          },
          select: {
            id: true,
            slug: true,
          },
        });

        const tagMap = new Map(tagRows.map((row) => [row.slug, row.id]));

        // Créer les relations book_tags
        const bookTagData = uniqueSubjects
          .map((subject) => {
            const tagId = tagMap.get(subject.slug);
            if (!tagId) {
              return null;
            }
            return {
              bookId: newBook.id,
              tagId,
            };
          })
          .filter((row): row is { bookId: string; tagId: string } =>
            Boolean(row),
          );

        // Créer les relations (Prisma gère automatiquement les conflits avec createMany + skipDuplicates)
        if (bookTagData.length > 0) {
          await prisma.bookTag.createMany({
            data: bookTagData,
            skipDuplicates: true,
          });
        }
      }
    }

    revalidatePath("/search");
    revalidatePath(`/books/${newBook.id}`);

    return { success: true, bookId: newBook.id };
  } catch (error) {
    console.error("[import-open-library] error:", error);
    return {
      success: false,
      message: "Impossible d'importer ce livre depuis Open Library.",
    };
  }
};

