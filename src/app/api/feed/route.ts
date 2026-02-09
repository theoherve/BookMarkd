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

    const activitiesPromise = (() => {
      // Ne récupérer que les activités des amis, pas celles de l'utilisateur connecté
      if (followingIds.length === 0) {
        return Promise.resolve([]);
      }

      return db.client
        .from("activities")
        .select(
          `
          id,
          type,
          payload,
          created_at,
          user:user_id ( id, display_name, avatar_url )
        `,
        )
        .in("user_id", followingIds)
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
      if (followingIds.length > 0) {
        q = q.in("user_id", followingIds);
      } else {
        // Si l'utilisateur ne suit personne, retourner un tableau vide
        return Promise.resolve([]);
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

    // Générer des recommandations basées sur les tags
    const recommendationsPromise = (async () => {
      if (!viewerId) {
        return [];
      }

      // 1. Récupérer les livres de l'utilisateur (terminés, en cours, dans la readlist)
      const { data: userBooks, error: userBooksErr } = await db.client
        .from("user_books")
        .select("book_id, status")
        .eq("user_id", viewerId)
        .in("status", ["finished", "reading", "to_read"]);
      
      if (userBooksErr) throw userBooksErr;
      if (!userBooks || userBooks.length === 0) {
        return [];
      }

      const userBookIds = (userBooks ?? []).map(
        (ub) => (ub as { book_id: string }).book_id,
      ).filter((id): id is string => Boolean(id));

      if (userBookIds.length === 0) {
        return [];
      }

      // 2. Récupérer les tags de ces livres avec pondération selon le statut
      // finished = 3, reading = 2, to_read = 1
      const { data: userBookTags, error: tagsErr } = await db.client
        .from("book_tags")
        .select(`
          book_id,
          tag:tag_id ( id, name )
        `)
        .in("book_id", userBookIds);
      
      if (tagsErr) throw tagsErr;

      // Créer une map des poids par tag (basé sur le statut du livre)
      const tagWeights = new Map<string, number>();
      const userBookStatusMap = new Map<string, string>();
      
      (userBooks ?? []).forEach((ub) => {
        const bookId = (ub as { book_id: string; status: string }).book_id;
        const status = (ub as { book_id: string; status: string }).status;
        if (bookId) {
          userBookStatusMap.set(bookId, status);
        }
      });

      const getTagName = (tag: unknown): string | null => {
        if (!tag || typeof tag !== "object") return null;
        const t = Array.isArray(tag) ? tag[0] : (tag as { name?: string | null });
        return (t as { name?: string | null })?.name ?? null;
      };

      (userBookTags ?? []).forEach((relation) => {
        const bookId = (relation as { book_id: string | null }).book_id;
        const tag = (relation as { tag: unknown }).tag;
        const tagName = getTagName(tag);
        
        if (!bookId || !tagName) {
          return;
        }

        const status = userBookStatusMap.get(bookId) ?? "to_read";
        const weight = status === "finished" ? 3 : status === "reading" ? 2 : 1;
        
        const currentWeight = tagWeights.get(tagName) ?? 0;
        tagWeights.set(tagName, currentWeight + weight);
      });

      if (tagWeights.size === 0) {
        return [];
      }

      // 3. Récupérer tous les livres qui ont au moins un tag en commun
      const relevantTagNames = Array.from(tagWeights.keys());
      const { data: relevantTagIds, error: relevantTagsErr } = await db.client
        .from("tags")
        .select("id, name")
        .in("name", relevantTagNames);
      
      if (relevantTagsErr) throw relevantTagsErr;
      if (!relevantTagIds || relevantTagIds.length === 0) {
        return [];
      }

      const relevantTagIdMap = new Map(
        (relevantTagIds ?? []).map((t) => [
          (t as { name: string }).name,
          (t as { id: string }).id,
        ]),
      );

      const { data: candidateBooks, error: candidateErr } = await db.client
        .from("book_tags")
        .select(`
          book_id,
          tag:tag_id ( name )
        `)
        .in(
          "tag_id",
          Array.from(relevantTagIdMap.values()),
        );
      
      if (candidateErr) throw candidateErr;

      // 4. Calculer les scores pour chaque livre candidat
      const bookScores = new Map<
        string,
        { score: number; matchingTags: string[] }
      >();

      (candidateBooks ?? []).forEach((relation) => {
        const bookId = (relation as { book_id: string | null }).book_id;
        const tag = (relation as { tag: unknown }).tag;
        const tagName = getTagName(tag);
        
        if (!bookId || !tagName) {
          return;
        }

        // Ignorer les livres déjà dans la readlist de l'utilisateur
        if (userBookIds.includes(bookId)) {
          return;
        }

        const tagWeight = tagWeights.get(tagName) ?? 0;
        const existing = bookScores.get(bookId);
        
        if (existing) {
          existing.score += tagWeight;
          if (!existing.matchingTags.includes(tagName)) {
            existing.matchingTags.push(tagName);
          }
        } else {
          bookScores.set(bookId, {
            score: tagWeight,
            matchingTags: [tagName],
          });
        }
      });

      if (bookScores.size === 0) {
        return [];
      }

      // 5. Récupérer les détails des livres avec les meilleurs scores
      const sortedBookIds = Array.from(bookScores.entries())
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, RECOMMENDATIONS_LIMIT)
        .map(([bookId]) => bookId);

      if (sortedBookIds.length === 0) {
        return [];
      }

      const { data: recommendedBooks, error: booksErr } = await db.client
        .from("books")
        .select("id, title, author, cover_url")
        .in("id", sortedBookIds);
      
      if (booksErr) throw booksErr;

      // 6. Formater les recommandations avec les scores normalisés (0-100)
      const allScores = Array.from(bookScores.values()).map((s) => s.score);
      const maxScore = Math.max(...allScores);
      const minScore = Math.min(...allScores);
      const scoreRange = maxScore - minScore;

      return (recommendedBooks ?? []).map((book) => {
        const bookId = (book as { id: string }).id;
        const scoreData = bookScores.get(bookId);
        const rawScore = scoreData?.score ?? 0;
        
        // Normaliser le score entre 0 et 100
        // Si tous les scores sont identiques, donner 50 (milieu)
        const normalizedScore = scoreRange === 0
          ? 50
          : Math.round(((rawScore - minScore) / scoreRange) * 100);

        return {
          id: `tag-recommendation-${bookId}`,
          score: normalizedScore,
          source: "similar",
          metadata: {
            reason: `Basé sur ${scoreData?.matchingTags.length ?? 0} tag(s) en commun : ${(scoreData?.matchingTags ?? []).slice(0, 3).join(", ")}`,
            matchingTags: scoreData?.matchingTags ?? [],
          },
          book: {
            id: (book as { id: string }).id,
            title: (book as { title: string }).title,
            author: (book as { author: string }).author,
            coverUrl: (book as { cover_url: string | null }).cover_url,
          },
        };
      });
    })();

    const [activities, friendsBooks, recommendationsRaw] = await Promise.all([
      activitiesPromise,
      friendsBooksPromise,
      recommendationsPromise,
    ]);

    const recommendations = (recommendationsRaw ?? []) as Array<{
      id: string;
      score: number;
      source: string;
      metadata: unknown;
      book?: { id: string; title: string; author: string; coverUrl: string | null };
    }>;

    const recommendationBookIds = recommendations
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

      const getTagNameFromRelation = (tag: unknown): string | undefined => {
        if (!tag || typeof tag !== "object") return undefined;
        const t = Array.isArray(tag) ? tag[0] : (tag as { name?: string | null });
        return (t as { name?: string | null })?.name ?? undefined;
      };

      const tagRelationsTyped = (tagRelations ?? []) as Array<{
        book_id: string | null;
        tag: unknown;
      }>;
      tagRelationsTyped.forEach((relation) => {
        const bookId = relation.book_id ?? undefined;
        const tagName = getTagNameFromRelation(relation.tag);
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

    // Helper : le payload est transformé en camelCase par db.toCamel
    const getPayloadValue = (p: Record<string, unknown>, key: string) => {
      const camel = p[key.replace(/_([a-z])/g, (_m, c) => c.toUpperCase())];
      const snake = p[key];
      return camel ?? snake;
    };

    // Récupérer les IDs des livres manquants dans les payloads
    const bookIdsToFetch = new Set<string>();
    activities.forEach((item) => {
      const payload = item.payload ?? {};
      const normalizedPayload =
        typeof payload === "object" &&
        payload !== null &&
        !Array.isArray(payload)
          ? (payload as Record<string, unknown>)
          : {};

      const bookId = getPayloadValue(normalizedPayload, "book_id") as string | null | undefined;
      const bookTitle = getPayloadValue(normalizedPayload, "book_title") as string | null | undefined;
      const bookAuthor = getPayloadValue(normalizedPayload, "book_author") as string | null | undefined;

      // Si on a un book_id mais pas titre ou auteur, on doit récupérer les détails
      if (bookId && (!bookTitle || !bookAuthor)) {
        bookIdsToFetch.add(bookId);
      }
    });

    // Récupérer les titres et auteurs des livres manquants
    const bookDetailsMap = new Map<
      string,
      { title: string; author: string }
    >();
    if (bookIdsToFetch.size > 0) {
      const { data: books, error: booksError } = await db.client
        .from("books")
        .select("id, title, author")
        .in("id", Array.from(bookIdsToFetch));

      if (!booksError && books) {
        (
          books as Array<{ id: string; title: string; author: string }>
        ).forEach((book) => {
          bookDetailsMap.set(book.id, {
            title: book.title,
            author: book.author,
          });
        });
      }
    }

    // Filtrer les activités selon la visibilité pour les reviews
    const filteredActivities = activities.filter((item) => {
      // Pour les reviews, vérifier la visibilité
      if (item.type === "review") {
        const payload = item.payload ?? {};
        const normalizedPayload =
          typeof payload === "object" &&
          payload !== null &&
          !Array.isArray(payload)
            ? (payload as Record<string, unknown>)
            : {};

        const visibility = getPayloadValue(normalizedPayload, "visibility") as string | null | undefined;
        // Ne montrer que les reviews "public" ou "friends" (les "private" sont exclues)
        if (visibility === "private") {
          return false;
        }
      }
      return true;
    });

    const formattedActivities: FeedActivity[] = filteredActivities.map((item) => {
      const payload = item.payload ?? {};
      const normalizedPayload =
        typeof payload === "object" &&
        payload !== null &&
        !Array.isArray(payload)
          ? (payload as Record<string, unknown>)
          : {};

      const bookId = getPayloadValue(normalizedPayload, "book_id") as string | null | undefined;
      const bookTitleFromPayload = getPayloadValue(normalizedPayload, "book_title") as string | null | undefined;
      const bookAuthorFromPayload = getPayloadValue(normalizedPayload, "book_author") as string | null | undefined;

      const bookDetails = bookId ? bookDetailsMap.get(bookId) : undefined;
      const bookTitle =
        bookTitleFromPayload ?? (bookDetails?.title ?? null) ?? null;
      const bookAuthor =
        bookAuthorFromPayload ?? (bookDetails?.author ?? null) ?? null;

      const note =
        (getPayloadValue(normalizedPayload, "note") as string | null | undefined) ??
        (getPayloadValue(normalizedPayload, "review_snippet") as string | null | undefined) ??
        (getPayloadValue(normalizedPayload, "status_note") as string | null | undefined) ??
        null;

      const rating = getPayloadValue(normalizedPayload, "rating") as number | null | undefined;

      return {
        id: item.id,
        type: isActivityType(item.type) ? item.type : "list_update",
        userName: item.user?.displayName ?? "Lectrice anonyme",
        userAvatarUrl: item.user?.avatarUrl ?? null,
        bookId: bookId ?? null,
        bookTitle,
        bookAuthor,
        note,
        rating: rating ?? null,
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

    const formattedRecommendations: FeedRecommendation[] = recommendations.map(
      (item) => {
        const bookId = item.book?.id ?? "";
        const friendContext = friendContextByBook.get(bookId);
        
        const metadata = item.metadata ?? {};
        const normalizedMetadata =
          typeof metadata === "object" &&
          metadata !== null &&
          !Array.isArray(metadata)
            ? (metadata as Record<string, unknown>)
            : {};

        // Utiliser tous les tags du livre depuis la base de données pour l'affichage
        const tags = tagsByBook.get(bookId) ?? [];

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

