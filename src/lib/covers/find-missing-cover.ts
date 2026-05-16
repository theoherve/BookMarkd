import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { STORAGE_BUCKETS } from "@/lib/storage/storage";
import { isPlaceholderImageBuffer } from "./placeholder-detect";
import { findOpenLibraryCoverByIsbn, findOpenLibraryCoverByTitleAuthor } from "./sources/open-library";
import { findGoogleBooksCover } from "./sources/google-books-hires";
import { findGoogleBooksCoverBySearch } from "./sources/google-books-search";

export type FindCoverInput = {
  bookId: string;
  title: string;
  author: string;
  isbn?: string | null;
  googleBooksId?: string | null;
  currentCoverUrl?: string | null;
};

export type FindCoverResult =
  | { success: true; source: CoverSource; publicUrl: string }
  | { success: false; reason: string };

export type CoverSource =
  | "open-library-isbn"
  | "open-library-search"
  | "google-books-hires"
  | "google-books-search";

const DOWNLOAD_TIMEOUT_MS = 8000;

const DEBUG = process.env.DEBUG_COVERS === "1";
const debugLog = (...args: unknown[]) => {
  if (DEBUG) console.log("[covers/debug]", ...args);
};

const detectExtensionFromContentType = (contentType: string | null): string => {
  if (!contentType) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return "jpg";
};

const downloadImage = async (
  url: string,
): Promise<{ buffer: ArrayBuffer; contentType: string } | null> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "BookMarkd/1.0 (https://bookmarkd.app)",
      },
    });
    clearTimeout(timer);

    if (!response.ok) {
      debugLog(`download !ok ${response.status} ${url}`);
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      debugLog(`download non-image content-type=${contentType} ${url}`);
      return null;
    }

    const buffer = await response.arrayBuffer();

    if (isPlaceholderImageBuffer(buffer)) {
      debugLog(`download too small ${buffer.byteLength}B ${url}`);
      return null;
    }

    debugLog(`download OK ${buffer.byteLength}B ${url}`);
    return { buffer, contentType };
  } catch (error) {
    debugLog(`download threw ${url}`, error);
    return null;
  }
};

const uploadCoverBuffer = async (
  bookId: string,
  buffer: ArrayBuffer,
  contentType: string,
): Promise<string | null> => {
  const supabase = createSupabaseServiceClient();
  const extension = detectExtensionFromContentType(contentType);
  const fileName = `${bookId}.${extension}`;

  const { data: existingFiles } = await supabase.storage
    .from(STORAGE_BUCKETS.COVERS)
    .list("", { search: bookId });

  if (existingFiles?.length) {
    const toRemove = existingFiles
      .filter((f) => f.name.startsWith(`${bookId}.`))
      .map((f) => f.name);
    if (toRemove.length > 0) {
      await supabase.storage.from(STORAGE_BUCKETS.COVERS).remove(toRemove);
    }
  }

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.COVERS)
    .upload(fileName, buffer, {
      contentType,
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error("[covers/find] upload error:", error);
    return null;
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.COVERS)
    .getPublicUrl(fileName);

  return data.publicUrl;
};

type SourceAttempt = {
  source: CoverSource;
  run: () => Promise<string | null>;
};

const buildAttempts = (input: FindCoverInput): SourceAttempt[] => {
  const attempts: SourceAttempt[] = [];

  if (input.isbn) {
    attempts.push({
      source: "open-library-isbn",
      run: () => findOpenLibraryCoverByIsbn(input.isbn!),
    });
  }

  attempts.push({
    source: "open-library-search",
    run: () => findOpenLibraryCoverByTitleAuthor(input.title, input.author),
  });

  if (input.googleBooksId) {
    attempts.push({
      source: "google-books-hires",
      run: () => findGoogleBooksCover(input.googleBooksId!),
    });
  }

  attempts.push({
    source: "google-books-search",
    run: () => findGoogleBooksCoverBySearch(input.title, input.author),
  });

  return attempts;
};

export const findAndUploadMissingCover = async (
  input: FindCoverInput,
): Promise<FindCoverResult> => {
  const attempts = buildAttempts(input);

  for (const attempt of attempts) {
    let sourceUrl: string | null = null;
    try {
      sourceUrl = await attempt.run();
    } catch (error) {
      console.error(`[covers/find] source ${attempt.source} threw:`, error);
      continue;
    }

    if (!sourceUrl) {
      debugLog(`source ${attempt.source} returned null`);
      continue;
    }

    debugLog(`source ${attempt.source} URL = ${sourceUrl}`);
    const downloaded = await downloadImage(sourceUrl);
    if (!downloaded) {
      continue;
    }

    const publicUrl = await uploadCoverBuffer(
      input.bookId,
      downloaded.buffer,
      downloaded.contentType,
    );

    if (!publicUrl) {
      continue;
    }

    const supabase = createSupabaseServiceClient();
    const { error: updateError } = await supabase
      .from("books")
      .update({ cover_url: publicUrl })
      .eq("id", input.bookId);

    if (updateError) {
      console.error("[covers/find] DB update error:", updateError);
      continue;
    }

    return { success: true, source: attempt.source, publicUrl };
  }

  await cleanupPlaceholderForBook(input.bookId, input.currentCoverUrl);

  return { success: false, reason: "no-source-matched" };
};

const cleanupPlaceholderForBook = async (
  bookId: string,
  currentCoverUrl: string | null | undefined,
) => {
  try {
    const supabase = createSupabaseServiceClient();

    const { data: files } = await supabase.storage
      .from(STORAGE_BUCKETS.COVERS)
      .list("", { search: bookId });

    if (files?.length) {
      const toRemove = files
        .filter((f) => f.name.startsWith(`${bookId}.`))
        .map((f) => f.name);
      if (toRemove.length > 0) {
        await supabase.storage
          .from(STORAGE_BUCKETS.COVERS)
          .remove(toRemove);
        debugLog(`removed ${toRemove.length} placeholder file(s) for ${bookId}`);
      }
    }

    if (currentCoverUrl) {
      await supabase
        .from("books")
        .update({ cover_url: null })
        .eq("id", bookId);
      debugLog(`cleared cover_url for ${bookId}`);
    }
  } catch (error) {
    console.error("[covers/find] cleanup error:", error);
  }
};
