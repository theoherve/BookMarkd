const GOOGLE_PLACEHOLDER_HOSTS = [
  "books.google.com",
  "books.googleusercontent.com",
];

export const isMissingOrPlaceholderCover = (
  coverUrl: string | null | undefined,
): boolean => {
  if (!coverUrl) {
    return true;
  }

  const trimmed = coverUrl.trim();

  if (!trimmed) {
    return true;
  }

  if (/image[\s-]?not[\s-]?available/i.test(trimmed)) {
    return true;
  }

  try {
    const url = new URL(trimmed);

    if (GOOGLE_PLACEHOLDER_HOSTS.some((host) => url.hostname.includes(host))) {
      if (!url.searchParams.get("id")) {
        return true;
      }
    }
  } catch {
    return true;
  }

  return false;
};

const PLACEHOLDER_BYTE_THRESHOLD = 4 * 1024;
const GOOGLE_PLACEHOLDER_EXACT_SIZE = 9103;
const GOOGLE_PLACEHOLDER_TOLERANCE = 200;

export const isPlaceholderImageBuffer = (buffer: ArrayBuffer): boolean => {
  if (buffer.byteLength < PLACEHOLDER_BYTE_THRESHOLD) {
    return true;
  }

  const delta = Math.abs(buffer.byteLength - GOOGLE_PLACEHOLDER_EXACT_SIZE);
  if (delta <= GOOGLE_PLACEHOLDER_TOLERANCE) {
    return true;
  }

  return false;
};

const SUPABASE_PLACEHOLDER_BYTE_THRESHOLD = 12 * 1024;

const isSupabaseStorageUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.endsWith(".supabase.co") &&
      parsed.pathname.includes("/storage/v1/object/public/covers/")
    );
  } catch {
    return false;
  }
};

export const isMissingOrPlaceholderCoverAsync = async (
  coverUrl: string | null | undefined,
): Promise<boolean> => {
  if (isMissingOrPlaceholderCover(coverUrl)) {
    return true;
  }

  if (!isSupabaseStorageUrl(coverUrl!)) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(coverUrl!, {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) {
      return true;
    }
    const len = response.headers.get("content-length");
    if (!len) {
      return false;
    }
    return Number.parseInt(len, 10) < SUPABASE_PLACEHOLDER_BYTE_THRESHOLD;
  } catch {
    return false;
  }
};
