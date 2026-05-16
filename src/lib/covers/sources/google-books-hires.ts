const GOOGLE_BOOKS_CONTENT = "https://books.google.com/books/content";

const extractVolumeId = (googleBooksId: string): string => {
  if (!googleBooksId) {
    return "";
  }
  return googleBooksId.startsWith("googlebooks:")
    ? googleBooksId.replace("googlebooks:", "")
    : googleBooksId;
};

export const buildGoogleBooksHiResUrl = (
  googleBooksId: string,
  zoom: 1 | 2 | 3 = 3,
): string | null => {
  const volumeId = extractVolumeId(googleBooksId);
  if (!volumeId) {
    return null;
  }

  const url = new URL(GOOGLE_BOOKS_CONTENT);
  url.searchParams.set("id", volumeId);
  url.searchParams.set("printsec", "frontcover");
  url.searchParams.set("img", "1");
  url.searchParams.set("zoom", String(zoom));
  url.searchParams.set("edge", "curl");

  return url.toString();
};

export const findGoogleBooksCover = async (
  googleBooksId: string | null | undefined,
): Promise<string | null> => {
  if (!googleBooksId) {
    return null;
  }

  const url = buildGoogleBooksHiResUrl(googleBooksId, 3);
  if (!url) {
    return null;
  }

  try {
    const head = await fetch(url, { method: "HEAD" });
    if (!head.ok) {
      return null;
    }

    const contentType = head.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return null;
    }

    const len = head.headers.get("content-length");
    if (len && Number.parseInt(len, 10) < 2048) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
};
