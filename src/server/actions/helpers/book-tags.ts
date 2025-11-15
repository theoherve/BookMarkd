"use server";

import db from "@/lib/supabase/db";

const normalizeTagName = (value: string) => {
  return value.replace(/\s+/g, " ").trim();
};

const slugifyTag = (value: string) => {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

type NormalizedTag = {
  name: string;
  slug: string;
};

const buildNormalizedTags = (rawTags: string[]): NormalizedTag[] => {
  const uniqueMap = new Map<string, NormalizedTag>();

  rawTags.forEach((rawTag) => {
    const cleanedName = normalizeTagName(rawTag);
    if (!cleanedName) {
      return;
    }
    const slug = slugifyTag(cleanedName);
    if (!slug || uniqueMap.has(slug)) {
      return;
    }
    uniqueMap.set(slug, { name: cleanedName, slug });
  });

  return Array.from(uniqueMap.values()).slice(0, 8);
};

export const upsertBookTags = async (
  tagNames: string[],
  bookId: string,
): Promise<void> => {
  const normalizedTags = buildNormalizedTags(tagNames);

  if (normalizedTags.length === 0) {
    return;
  }

  const { error: upsertTagsError } = await db.client
    .from("tags")
    .upsert(
      normalizedTags.map((tag) => ({
        name: tag.name,
        slug: tag.slug,
      })),
      { onConflict: "slug" },
    );

  if (upsertTagsError) {
    throw upsertTagsError;
  }

  const { data: tagRows, error: fetchTagsError } = await db.client
    .from("tags")
    .select("id, slug")
    .in(
      "slug",
      normalizedTags.map((tag) => tag.slug),
    );

  if (fetchTagsError) {
    throw fetchTagsError;
  }

  const slugToId = new Map(
    (tagRows ?? []).map((row) => [row.slug as string, row.id as string]),
  );

  const bookTagRows = normalizedTags
    .map((tag) => {
      const tagId = slugToId.get(tag.slug);
      if (!tagId) {
        return null;
      }
      return {
        book_id: bookId,
        tag_id: tagId,
      };
    })
    .filter(
      (
        row,
      ): row is {
        book_id: string;
        tag_id: string;
      } => Boolean(row),
    );

  if (bookTagRows.length === 0) {
    return;
  }

  const { error: linkError } = await db.client.from("book_tags").upsert(
    bookTagRows,
    {
      onConflict: "book_id,tag_id",
      ignoreDuplicates: true,
    },
  );

  if (linkError) {
    throw linkError;
  }
};

