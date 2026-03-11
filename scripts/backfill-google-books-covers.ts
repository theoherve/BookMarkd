/**
 * Script de backfill des couvertures Google Books vers Supabase Storage.
 *
 * Objectif long terme :
 * - Stocker les covers dans le bucket `covers` de Supabase Storage
 * - Mettre à jour `books.cover_url` avec l'URL publique Supabase
 * - Ne plus dépendre des URLs Google Books pour l'affichage
 *
 * Usage : pnpm tsx scripts/backfill-google-books-covers.ts
 */
import "dotenv/config";

import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { STORAGE_BUCKETS, getCoverPublicUrl } from "@/lib/storage/storage";

const supabase = createSupabaseServiceClient();

const GOOGLE_BOOKS_COVER_ENDPOINT = "https://books.google.com/books/content";

const buildHighResCoverUrlFromVolumeId = (volumeId: string): string => {
  const url = new URL(GOOGLE_BOOKS_COVER_ENDPOINT);
  url.searchParams.set("id", volumeId);
  url.searchParams.set("printsec", "frontcover");
  url.searchParams.set("img", "1");
  url.searchParams.set("zoom", "3");
  url.searchParams.set("edge", "curl");

  return url.toString();
};

const extractVolumeIdFromGoogleBooksId = (googleBooksId: string): string => {
  if (!googleBooksId) {
    return "";
  }

  if (googleBooksId.startsWith("googlebooks:")) {
    return googleBooksId.replace("googlebooks:", "");
  }

  return googleBooksId;
};

const detectExtensionFromContentType = (contentType: string | null): string => {
  if (!contentType) {
    return "jpg";
  }

  if (contentType.includes("png")) {
    return "png";
  }

  if (contentType.includes("webp")) {
    return "webp";
  }

  if (contentType.includes("jpeg") || contentType.includes("jpg")) {
    return "jpg";
  }

  return "jpg";
};

type BookRow = {
  id: string;
  cover_url: string | null;
  google_books_id: string | null;
};

const migrateBatch = async (from: number, to: number): Promise<number> => {
  const { data, error } = await supabase
    .from("books")
    .select("id, cover_url, google_books_id")
    .not("google_books_id", "is", null)
    .range(from, to);

  if (error) {
    console.error(
      "[covers-backfill] Erreur lors de la sélection des livres :",
      error,
    );
    throw error;
  }

  const books = (data ?? []) as BookRow[];

  if (books.length === 0) {
    return 0;
  }

  console.log(
    `[covers-backfill] Traitement des livres ${from + 1} à ${from + books.length}...`,
  );

  for (const book of books) {
    const googleBooksId = book.google_books_id;

    if (!googleBooksId) {
      console.log(
        `[covers-backfill] Livre ${book.id} sans google_books_id, ignoré.`,
      );
      continue;
    }

    const volumeId = extractVolumeIdFromGoogleBooksId(googleBooksId);
    if (!volumeId) {
      console.log(
        `[covers-backfill] Livre ${book.id} : google_books_id invalide (${googleBooksId}), ignoré.`,
      );
      continue;
    }

    // Si une cover existe déjà dans le bucket, on la laisse telle quelle
    const existingPublicUrl = await getCoverPublicUrl(book.id);
    if (existingPublicUrl) {
      // Optionnel : mettre à jour cover_url en base si ce n'est pas déjà l'URL Supabase
      if (book.cover_url !== existingPublicUrl) {
        await supabase
          .from("books")
          .update({ cover_url: existingPublicUrl })
          .eq("id", book.id);
        console.log(
          `[covers-backfill] Livre ${book.id} : cover déjà en Storage, URL DB synchronisée.`,
        );
      } else {
        console.log(
          `[covers-backfill] Livre ${book.id} : cover déjà en Storage, rien à faire.`,
        );
      }

      continue;
    }

    const sourceUrl =
      book.cover_url && book.cover_url.includes("books.google.")
        ? (() => {
            try {
              const url = new URL(book.cover_url);
              if (!url.searchParams.get("img")) {
                url.searchParams.set("img", "1");
              }
              if (!url.searchParams.get("printsec")) {
                url.searchParams.set("printsec", "frontcover");
              }
              const currentZoom = url.searchParams.get("zoom");
              if (!currentZoom || Number.parseInt(currentZoom, 10) < 3) {
                url.searchParams.set("zoom", "3");
              }
              return url.toString();
            } catch {
              return buildHighResCoverUrlFromVolumeId(volumeId);
            }
          })()
        : buildHighResCoverUrlFromVolumeId(volumeId);

    console.log(
      `[covers-backfill] Livre ${book.id} : téléchargement de la cover depuis ${sourceUrl}`,
    );

    try {
      const response = await fetch(sourceUrl);

      if (!response.ok) {
        console.warn(
          `[covers-backfill] Livre ${book.id} : échec du téléchargement (${response.status} ${response.statusText}), ignoré.`,
        );
        continue;
      }

      const contentType = response.headers.get("content-type");
      const extension = detectExtensionFromContentType(contentType);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileName = `${book.id}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.COVERS)
        .upload(fileName, buffer, {
          contentType: contentType ?? "image/jpeg",
          cacheControl: "31536000",
          upsert: true,
        });

      if (uploadError) {
        console.error(
          `[covers-backfill] Livre ${book.id} : erreur lors de l'upload dans Storage :`,
          uploadError,
        );
        continue;
      }

      const publicUrl = await getCoverPublicUrl(book.id);

      if (!publicUrl) {
        console.warn(
          `[covers-backfill] Livre ${book.id} : upload réussi mais impossible de récupérer l'URL publique.`,
        );
        continue;
      }

      await supabase
        .from("books")
        .update({ cover_url: publicUrl })
        .eq("id", book.id);

      console.log(
        `[covers-backfill] Livre ${book.id} : cover migrée vers Storage (${publicUrl}).`,
      );
    } catch (error) {
      console.error(
        `[covers-backfill] Livre ${book.id} : erreur inattendue lors de la migration :`,
        error,
      );
    }
  }

  return books.length;
};

const backfillGoogleBooksCovers = async () => {
  console.log(
    "🚀 Lancement du backfill des couvertures Google Books vers Supabase Storage...",
  );

  const batchSize = 200;
  let from = 0;
  let processedTotal = 0;

  // Boucle paginée jusqu'à ce qu'il n'y ait plus de résultats
  // On reste simple (range avec offset) vu que c'est un script ponctuel
  // et que le volume de données reste maîtrisé.
  // Si le volume grossit beaucoup, on pourra passer à une pagination par curseur.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const to = from + batchSize - 1;
    const processed = await migrateBatch(from, to);

    if (processed === 0) {
      break;
    }

    processedTotal += processed;
    from += batchSize;
  }

  console.log(
    `✅ Backfill terminé. Nombre total de livres traités (ayant un google_books_id) : ${processedTotal}.`,
  );
};

backfillGoogleBooksCovers()
  .catch((error) => {
    console.error("❌ Erreur lors du backfill des couvertures :", error);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
