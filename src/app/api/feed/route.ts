import { NextResponse } from "next/server";

import db from "@/lib/supabase/db";
import type {
  FeedActivity,
  FeedFriendBook,
  FeedRecommendation,
} from "@/features/feed/types";
import { getCurrentSession } from "@/lib/auth/session";


const ACTIVITY_TYPES: FeedActivity["type"][] = [
  "rating",
  "review",
  "status_change",
  "list_update",
  "follow",
];

const isActivityType = (value: string): value is FeedActivity["type"] => {
  return ACTIVITY_TYPES.includes(value as FeedActivity["type"]);
};

const RECOMMENDATION_SOURCES: FeedRecommendation["source"][] = [
  "friends",
  "global",
  "similar",
];

const isRecommendationSource = (
  value: string,
): value is FeedRecommendation["source"] => {
  return RECOMMENDATION_SOURCES.includes(
    value as FeedRecommendation["source"],
  );
};

const ACTIVITY_LIMIT = 6;
const FRIENDS_BOOKS_LIMIT = 6;
const RECOMMENDATIONS_LIMIT = 6;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    const viewerId = session?.user?.id ?? null;

    let followingIds: string[] = [];

    if (viewerId) {
      const { data: follows, error: followsErr } = await db.client
        .from("follows")
        .select("following_id")
        .eq("follower_id", viewerId);
      if (followsErr) throw followsErr;

      followingIds = (follows ?? []).map(
        (f) => (f as { following_id: string }).following_id,
      );
    }

    const audienceIds =
      viewerId || followingIds.length > 0
        ? [viewerId, ...followingIds].filter(
            (value): value is string => Boolean(value),
          )
        : null;

    const activitiesPromise = (() => {
      let q = db.client
        .from("activities")
        .select(
          `
          id,
          type,
          payload,
          created_at,
          user:user_id ( id, display_name, avatar_url )
        `,
        );
      if (audienceIds?.length) {
        q = q.in("user_id", audienceIds);
      }
      return q
        .order("created_at", { ascending: false })
        .limit(ACTIVITY_LIMIT)
        .then((r) =>
          db.toCamel<
            Array<{
              id: string;
              type: string;
              payload: unknown;
              createdAt: string;
              user?: { id: string; displayName: string | null; avatarUrl: string | null };
            }>
          >(r.data ?? []),
        );
    })();

    const friendsBooksPromise = (() => {
      let q = db.client
        .from("user_books")
        .select(
          `
          id,
          status,
          updated_at,
          rating,
          user:user_id ( id, display_name, avatar_url ),
          book:book_id ( id, title, author, cover_url, average_rating )
        `,
        );
      if (audienceIds?.length) {
        q = q.in("user_id", audienceIds);
      }
      return q
        .order("updated_at", { ascending: false })
        .limit(FRIENDS_BOOKS_LIMIT)
        .then((r) =>
          db.toCamel<
            Array<{
              id: string;
              status: string | null;
              updatedAt: string;
              rating: number | null;
              user?: { id: string; displayName: string | null; avatarUrl: string | null };
              book?: {
                id: string;
                title: string;
                author: string;
                coverUrl: string | null;
                averageRating: number | null;
              };
            }>
          >(r.data ?? []),
        );
    })();

    const recommendationsPromise = db.client
      .from("recommendations")
      .select(
          `
          id,
          score,
          source,
          metadata,
          book:book_id ( id, title, author, cover_url )
        `,
      )
      .match(viewerId ? { user_id: viewerId } : {})
      .order("score", { ascending: false })
      .limit(RECOMMENDATIONS_LIMIT)
      .then((r) =>
        db.toCamel<
          Array<{
            id: string;
            score: number;
            source: string;
            metadata: unknown;
            book?: { id: string; title: string; author: string; coverUrl: string | null };
          }>
        >(r.data ?? []),
      );

    const [activities, friendsBooks, recommendations] = await Promise.all([
      activitiesPromise,
      friendsBooksPromise,
      recommendationsPromise,
    ]);

    const recommendationBookIds = (recommendations ?? [])
      .map((item) => item.book?.id)
      .filter((id): id is string => Boolean(id));

    let viewerReadlistBooks = new Set<string>();
    if (viewerId && recommendationBookIds.length > 0) {
      const { data: viewerEntries, error: viewerErr } = await db.client
        .from("user_books")
        .select("book_id")
        .eq("user_id", viewerId)
        .in("book_id", recommendationBookIds);
      if (viewerErr) throw viewerErr;
      viewerReadlistBooks = new Set(
        (viewerEntries ?? [])
          .map((e) => (e as { book_id?: string }).book_id)
          .filter((id): id is string => Boolean(id)),
      );
    }

    const friendContextByBook = new Map<
      string,
      { names: string[]; count: number; highlights: string[] }
    >();
    if (followingIds.length > 0 && recommendationBookIds.length > 0) {
      const { data: friendEntries, error: friendErr } = await db.client
        .from("user_books")
        .select(
          `
          status,
          book_id,
          user:user_id ( id, display_name )
        `,
        )
        .in("user_id", followingIds)
        .in("book_id", recommendationBookIds);
      if (friendErr) throw friendErr;

      const friendEntriesTyped = (friendEntries ?? []) as Array<{
        status: string | null;
        book_id: string | null;
        user: Array<{ id: string; display_name: string | null }> | null;
      }>;
      friendEntriesTyped.forEach((entry) => {
        const bookId = entry.book_id ?? undefined;
        if (!bookId) {
          return;
        }

        const friendName = Array.isArray(entry.user)
          ? entry.user[0]?.display_name ?? null
          : null;
        if (!friendName) {
          return;
        }

        const statusLabel =
          (entry.status ?? "") === "finished"
            ? `${friendName} l'a terminé`
            : (entry.status ?? "") === "reading"
              ? `${friendName} est en cours de lecture`
              : `${friendName} l'a ajouté à sa liste`;

        const existing = friendContextByBook.get(bookId);
        if (existing) {
          existing.names.push(friendName);
          existing.count += 1;
          if (existing.highlights.length < 3) {
            existing.highlights.push(statusLabel);
          }
          return;
        }

        friendContextByBook.set(bookId, {
          names: [friendName],
          count: 1,
          highlights: [statusLabel],
        });
      });
    }

    const tagsByBook = new Map<string, string[]>();
    if (recommendationBookIds.length > 0) {
      const { data: tagRelations, error: tagsErr } = await db.client
        .from("book_tags")
        .select("book_id, tag:tag_id ( name )")
        .in("book_id", recommendationBookIds);
      if (tagsErr) throw tagsErr;

      const tagRelationsTyped = (tagRelations ?? []) as Array<{
        book_id: string | null;
        tag: Array<{ name: string | null }> | null;
      }>;
      tagRelationsTyped.forEach((relation) => {
        const bookId = relation.book_id ?? undefined;
        const tagName = Array.isArray(relation.tag)
          ? relation.tag[0]?.name ?? undefined
          : undefined;
        if (!bookId || !tagName) {
          return;
        }

        const existing = tagsByBook.get(bookId);
        if (existing) {
          existing.push(tagName);
          return;
        }

        tagsByBook.set(bookId, [tagName]);
      });
    }

    const formattedActivities: FeedActivity[] = activities.map((item) => {
      const payload = item.payload ?? {};
      const normalizedPayload =
        typeof payload === "object" &&
        payload !== null &&
        !Array.isArray(payload)
          ? (payload as Record<string, unknown>)
          : {};

      return {
        id: item.id,
        type: isActivityType(item.type) ? item.type : "list_update",
        userName: item.user?.displayName ?? "Lectrice anonyme",
        userAvatarUrl: item.user?.avatarUrl ?? null,
        bookTitle:
          (normalizedPayload.book_title as string | null | undefined) ?? null,
        note:
          (normalizedPayload.note as string | null | undefined) ??
          (normalizedPayload.review_snippet as string | null | undefined) ??
          (normalizedPayload.status_note as string | null | undefined) ??
          null,
        rating:
          (normalizedPayload.rating as number | null | undefined) ?? null,
        occurredAt: item.createdAt,
      };
    });

    const formattedFriendsBooks: FeedFriendBook[] = friendsBooks.map((item) => ({
      id: item.id,
      bookId: item.book?.id ?? "",
      title: item.book?.title ?? "",
      author: item.book?.author ?? "",
      coverUrl: item.book?.coverUrl ?? null,
      averageRating: typeof item.book?.averageRating === "number"
        ? item.book!.averageRating!
        : null,
      status: item.status as "to_read" | "reading" | "finished",
      updatedAt: item.updatedAt,
      readerName: item.user?.displayName ?? "Lectrice anonyme",
      readerAvatarUrl: item.user?.avatarUrl ?? null,
    }));

    const formattedRecommendations: FeedRecommendation[] = (recommendations ?? []).map(
      (item) => {
        const bookId = item.book?.id ?? "";
        const friendContext = friendContextByBook.get(bookId);
        const tags = tagsByBook.get(bookId) ?? [];

        const metadata = item.metadata ?? {};
        const normalizedMetadata =
          typeof metadata === "object" &&
          metadata !== null &&
          !Array.isArray(metadata)
            ? (metadata as Record<string, unknown>)
            : {};

        return {
          id: item.id,
          bookId,
          title: item.book?.title ?? "",
          author: item.book?.author ?? "",
          coverUrl: item.book?.coverUrl ?? null,
          reason:
            (normalizedMetadata.reason as string | null | undefined) ??
            (normalizedMetadata.explanation as string | null | undefined) ??
            (normalizedMetadata.match as string | null | undefined) ??
            (friendContext
              ? `${friendContext.names.slice(0, 2).join(", ")} l'a recommandé`
              : null),
          source: isRecommendationSource(item.source)
            ? item.source
            : "global",
          score: typeof item.score === "number" ? item.score : Number(item.score ?? 0),
          friendNames: friendContext?.names ?? [],
          friendCount: friendContext?.count ?? 0,
          viewerHasInReadlist: viewerReadlistBooks.has(bookId),
          friendHighlights: friendContext?.highlights ?? [],
          tags: tags.slice(0, 5),
        };
      },
    );

    return NextResponse.json({
      activities: formattedActivities,
      friendsBooks: formattedFriendsBooks,
      recommendations: formattedRecommendations,
    });
  } catch (error) {
    console.error("[feed] GET error:", error);
    return NextResponse.json(
      { error: "Unable to fetch feed data." },
      { status: 500 },
    );
  }
}

