import db from "@/lib/supabase/db";
import { generateBookSlug } from "@/lib/slug";
import { getUserAvatarUrl } from "@/lib/storage/avatars";

import type {
  ProfileDashboard,
  ReadingStats,
  TopBook,
  RecentActivity,
  ReadListBook,
} from "../types";

const buildReadingStats = (
  rows: Array<{ status: string | null }>
): ReadingStats => {
  const initial: ReadingStats = {
    toRead: 0,
    reading: 0,
    finished: 0,
  };

  return rows.reduce((accumulator, row) => {
    if (!row.status) {
      return accumulator;
    }

    if (row.status === "to_read") {
      accumulator.toRead += 1;
    }

    if (row.status === "reading") {
      accumulator.reading += 1;
    }

    if (row.status === "finished") {
      accumulator.finished += 1;
    }

    return accumulator;
  }, initial);
};

export const getProfileDashboard = async (
  userId: string
): Promise<ProfileDashboard> => {
  try {
    // Étape 1 : Données utilisateur (critique, doit être récupéré en premier)
    const { data: userRow, error: userError } = await db.client
      .from("users")
      .select("display_name, email, bio, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!userRow) {
      throw new Error("Utilisateur introuvable.");
    }
    const user = db.toCamel<{
      displayName: string | null;
      email: string | null;
      bio: string | null;
      avatarUrl: string | null;
    }>(userRow);

    // Résoudre l'URL de l'avatar avec priorité Supabase Storage
    const resolvedAvatarUrl = await getUserAvatarUrl(userId, user.avatarUrl);

    // Étape 2 : Statistiques de base (3 requêtes en parallèle)
    const [ownedListsCount, collaborativeListsCount, recommendationsCount] =
      await Promise.all([
        db.client
          .from("lists")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", userId)
          .then((r) => r.count ?? 0),
        db.client
          .from("list_collaborators")
          .select("user_id", { count: "exact", head: true })
          .eq("user_id", userId)
          .then((r) => r.count ?? 0),
        db.client
          .from("recommendations")
          .select("user_id", { count: "exact", head: true })
          .eq("user_id", userId)
          .then((r) => r.count ?? 0),
      ]);

    // Étape 3 : Données de lecture (2 requêtes en parallèle)
    const [readingRows, topBooksData] = await Promise.all([
      db.client
        .from("user_books")
        .select("status")
        .eq("user_id", userId)
        .then((r) =>
          db.toCamel<Array<{ status: string | null }>>(r.data ?? [])
        ),
      db.client
        .from("user_top_books")
        .select(
          `
          id,
          user_id,
          book_id,
          position,
          updated_at,
          book:book_id ( id, title, author, cover_url )
        `
        )
        .eq("user_id", userId)
        .order("position", { ascending: true })
        .then((r) =>
          db.toCamel<
            Array<{
              id: string;
              bookId: string;
              position: number;
              updatedAt: string;
              book?: {
                id: string;
                title: string;
                author: string;
                coverUrl: string | null;
              };
            }>
          >(r.data ?? [])
        ),
    ]);

    // Étape 4 : Données des listes (2 requêtes en parallèle)
    const [ownedListsIds, collaboratorListsIds] = await Promise.all([
      db.client
        .from("lists")
        .select("id, title, created_at")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)
        .then((r) =>
          db.toCamel<Array<{ id: string; title: string; createdAt: string }>>(
            r.data ?? []
          )
        ),
      db.client
        .from("list_collaborators")
        .select("list_id")
        .eq("user_id", userId)
        .then((r) => db.toCamel<Array<{ listId: string }>>(r.data ?? [])),
    ]);

    const listIds = [
      ...ownedListsIds.map((l) => l.id),
      ...collaboratorListsIds.map((c) => c.listId),
    ];
    const listsForActivities = ownedListsIds;

    // Étape 5 : Activités - groupe 1 (3 requêtes en parallèle)
    const [oldActivities, userBooks, reviews] = await Promise.all([
      db.client
        .from("activities")
        .select("id, type, payload, created_at")
        .eq("user_id", userId)
        .then((r) =>
          db.toCamel<
            Array<{
              id: string;
              type: string;
              payload: unknown;
              createdAt: string;
            }>
          >(r.data ?? [])
        ),
      db.client
        .from("user_books")
        .select(
          `
          id,
          book_id,
          status,
          rating,
          rated_at,
          note_private,
          created_at,
          updated_at,
          book:book_id ( id, title, author )
        `
        )
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(50)
        .then((r) =>
          db.toCamel<
            Array<{
              id: string;
              bookId: string;
              status: string | null;
              rating: number | null;
              ratedAt: string | null;
              notePrivate: string | null;
              createdAt: string;
              updatedAt: string;
              book?: { id: string; title: string; author: string };
            }>
          >(r.data ?? [])
        ),
      db.client
        .from("reviews")
        .select(
          `
          id,
          book_id,
          content,
          created_at,
          book:book_id ( id, title, author )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)
        .then((r) =>
          db.toCamel<
            Array<{
              id: string;
              bookId: string;
              content: string;
              createdAt: string;
              book?: { id: string; title: string; author: string };
            }>
          >(r.data ?? [])
        ),
    ]);

    // Étape 6 : Activités - groupe 2 (2 requêtes en parallèle)
    const [reviewComments, listItems] = await Promise.all([
      db.client
        .from("review_comments")
        .select(
          `
          id,
          content,
          created_at,
          review:review_id (
            book:book_id ( id, title, author )
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)
        .then((r) =>
          db.toCamel<
            Array<{
              id: string;
              content: string;
              createdAt: string;
              review?: { book?: { id: string; title: string; author: string } };
            }>
          >(r.data ?? [])
        ),
      listIds.length > 0
        ? db.client
            .from("list_items")
            .select(
              `
              id,
              note,
              created_at,
              book:book_id ( id, title, author ),
              list:list_id ( title, owner_id )
            `
            )
            .in("list_id", listIds)
            .order("created_at", { ascending: false })
            .limit(50)
            .then((r) =>
              db.toCamel<
                Array<{
                  id: string;
                  note: string | null;
                  createdAt: string;
                  book?: { id: string; title: string; author: string };
                  list?: { title: string; ownerId: string };
                }>
              >(r.data ?? [])
            )
        : Promise.resolve(
            [] as Array<{
              id: string;
              note: string | null;
              createdAt: string;
              book?: { id: string; title: string; author: string };
              list?: { title: string; ownerId: string };
            }>
          ),
    ]);

    // Étape 7 : Activités - groupe 3 (3 requêtes en parallèle)
    const [reviewLikes, follows, topBooksUpdates] = await Promise.all([
      db.client
        .from("review_likes")
        .select(
          `
          review_id,
          user_id,
          created_at,
          review:review_id (
            book:book_id ( id, title, author )
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)
        .then((r) =>
          db.toCamel<
            Array<{
              reviewId: string;
              userId: string;
              createdAt: string;
              review?: { book?: { id: string; title: string; author: string } };
            }>
          >(r.data ?? [])
        ),
      db.client
        .from("follows")
        .select(
          `
          follower_id,
          following_id,
          created_at,
          following:following_id ( id, username, display_name )
        `
        )
        .eq("follower_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)
        .then((r) =>
          db.toCamel<
            Array<{
              followerId: string;
              followingId: string;
              createdAt: string;
              following?: { id: string; username: string | null; displayName: string | null };
            }>
          >(r.data ?? [])
        ),
      db.client
        .from("user_top_books")
        .select(
          `
          id,
          updated_at,
          book:book_id ( id, title, author )
        `
        )
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(50)
        .then((r) =>
          db.toCamel<
            Array<{
              id: string;
              updatedAt: string;
              book?: { id: string; title: string; author: string };
            }>
          >(r.data ?? [])
        ),
    ]);

    // Étape 8 : Récupérer la read list (sérialisée à la fin)
    const readListData = await db.client
      .from("user_books")
      .select(
        `
        id,
        book_id,
        status,
        rating,
        updated_at,
        book:book_id ( id, title, author, cover_url )
      `
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(20)
      .then((r) =>
        db.toCamel<
          Array<{
            id: string;
            bookId: string;
            status: string | null;
            rating: number | null;
            updatedAt: string;
            book?: {
              id: string;
              title: string;
              author: string;
              coverUrl: string | null;
            };
          }>
        >(r.data ?? [])
      );

    const readingStats = buildReadingStats(readingRows);

    const topBooks: TopBook[] = topBooksData
      .filter((item) => item.book)
      .map((item) => ({
        id: item.id,
        bookId: item.bookId,
        position: item.position,
        book: {
          id: item.book!.id,
          title: item.book!.title,
          author: item.book!.author,
          coverUrl: item.book!.coverUrl,
        },
      }));

    // Normaliser toutes les activités dans un format unifié
    const lists = listsForActivities;

    const allActivities: RecentActivity[] = [];

    // Anciennes activités depuis la table Activity
    oldActivities.forEach((item) => {
      const payload = item.payload ?? {};
      const normalizedPayload =
        typeof payload === "object" &&
        payload !== null &&
        !Array.isArray(payload)
          ? (payload as Record<string, unknown>)
          : {};

      const bookTitle =
        (normalizedPayload.book_title as string | null | undefined) ?? null;
      allActivities.push({
        id: item.id,
        type: item.type as RecentActivity["type"],
        bookTitle,
        bookId: null, // Les anciennes activités n'ont pas l'ID du livre dans le payload
        bookSlug: null, // Les anciennes activités n'ont pas l'auteur dans le payload
        listTitle: null,
        note:
          (normalizedPayload.note as string | null | undefined) ??
          (normalizedPayload.review_snippet as string | null | undefined) ??
          (normalizedPayload.status_note as string | null | undefined) ??
          null,
        rating: (normalizedPayload.rating as number | null | undefined) ?? null,
        status: null,
        occurredAt: item.createdAt,
      });
    });

    // UserBook - ajout à la read list, changement de statut, ajout de note/rating
    userBooks.forEach((userBook) => {
      const createdAtTime = new Date(userBook.createdAt).getTime();
      const updatedAtTime = new Date(userBook.updatedAt).getTime();
      const ratedAtTime = userBook.ratedAt
        ? new Date(userBook.ratedAt).getTime()
        : null;

      // Si c'est un ajout récent (createdAt proche de updatedAt), c'est un ajout à la read list
      const isNewAddition =
        createdAtTime === updatedAtTime ||
        Math.abs(createdAtTime - updatedAtTime) < 1000;

      // Ajouter l'activité d'ajout à la read list si c'est un nouvel ajout
      if (isNewAddition) {
        if (!userBook.book) {
          return;
        }
        allActivities.push({
          id: `readlist_${userBook.id}`,
          type: "readlist_add",
          bookTitle: userBook.book.title,
          bookId: userBook.bookId,
          bookSlug: generateBookSlug(userBook.book.title, userBook.book.author),
          listTitle: null,
          note: userBook.notePrivate ?? null,
          rating: null,
          status: userBook.status as "to_read" | "reading" | "finished" | null,
          occurredAt: userBook.createdAt,
        });
      }

      // Ajouter l'activité de note si ratedAt existe et est différent de createdAt
      if (ratedAtTime && Math.abs(ratedAtTime - createdAtTime) > 1000) {
        if (!userBook.book) {
          return;
        }
        allActivities.push({
          id: `rating_${userBook.id}_${ratedAtTime}`,
          type: "rating",
          bookTitle: userBook.book.title,
          bookId: userBook.bookId,
          bookSlug: generateBookSlug(userBook.book.title, userBook.book.author),
          listTitle: null,
          note: userBook.notePrivate ?? null,
          rating: userBook.rating ? Number(userBook.rating) : null,
          status: userBook.status as "to_read" | "reading" | "finished" | null,
          occurredAt: userBook.ratedAt!,
        });
      }

      // Ajouter l'activité de changement de statut si updatedAt est différent de createdAt et ratedAt
      if (
        !isNewAddition &&
        (!ratedAtTime || Math.abs(updatedAtTime - ratedAtTime) > 1000)
      ) {
        if (!userBook.book) {
          return;
        }
        allActivities.push({
          id: `status_${userBook.id}_${updatedAtTime}`,
          type: "status_change",
          bookTitle: userBook.book.title,
          bookId: userBook.bookId,
          bookSlug: generateBookSlug(userBook.book.title, userBook.book.author),
          listTitle: null,
          note: userBook.notePrivate ?? null,
          rating: userBook.rating ? Number(userBook.rating) : null,
          status: userBook.status as "to_read" | "reading" | "finished" | null,
          occurredAt: userBook.updatedAt,
        });
      }
    });

    // Reviews - publication de critiques
    reviews.forEach((review) => {
      if (!review.book) {
        return;
      }
      allActivities.push({
        id: `review_${review.id}`,
        type: "review",
        bookTitle: review.book.title,
        bookId: review.bookId,
        bookSlug: generateBookSlug(review.book.title, review.book.author),
        listTitle: null,
        note: review.content,
        rating: null,
        status: null,
        occurredAt: review.createdAt,
      });
    });

    // ReviewComments - commentaires sur des critiques
    reviewComments.forEach((comment) => {
      if (!comment.review || !comment.review.book) {
        return;
      }
      allActivities.push({
        id: `comment_${comment.id}`,
        type: "review_comment",
        bookTitle: comment.review.book.title,
        bookId: comment.review.book.id,
        bookSlug: generateBookSlug(
          comment.review.book.title,
          comment.review.book.author
        ),
        listTitle: null,
        note: comment.content,
        rating: null,
        status: null,
        occurredAt: comment.createdAt,
      });
    });

    // Lists - création de listes
    lists.forEach((list) => {
      allActivities.push({
        id: `list_${list.id}`,
        type: "list_create",
        bookTitle: null,
        bookId: null,
        bookSlug: null,
        listTitle: list.title,
        note: null,
        rating: null,
        status: null,
        occurredAt: list.createdAt,
      });
    });

    // ListItems - ajout de livres à des listes
    listItems.forEach((item) => {
      if (!item.book || !item.list) {
        return;
      }
      allActivities.push({
        id: `listitem_${item.id}`,
        type: "list_item_add",
        bookTitle: item.book.title,
        bookId: item.book.id,
        bookSlug: generateBookSlug(item.book.title, item.book.author),
        listTitle: item.list.title,
        note: item.note ?? null,
        rating: null,
        status: null,
        occurredAt: item.createdAt,
      });
    });

    // ReviewLikes - likes sur des critiques
    reviewLikes.forEach((like) => {
      if (!like.review || !like.review.book) {
        return;
      }
      allActivities.push({
        id: `like_${like.reviewId}_${like.userId}`,
        type: "review_like",
        bookTitle: like.review.book.title,
        bookId: like.review.book.id,
        bookSlug: generateBookSlug(
          like.review.book.title,
          like.review.book.author
        ),
        listTitle: null,
        note: null,
        rating: null,
        status: null,
        occurredAt: like.createdAt,
      });
    });

    // Follows - suivi de profils
    follows.forEach((follow) => {
      if (!follow.following) {
        return;
      }
      allActivities.push({
        id: `follow_${follow.followerId}_${follow.followingId}`,
        type: "follow",
        bookTitle: null,
        bookId: null,
        bookSlug: null,
        listTitle: null,
        note: follow.following.displayName,
        rating: null,
        status: null,
        occurredAt: follow.createdAt,
        followedUserId: follow.following.id,
        followedUserUsername: follow.following.username,
      });
    });

    // UserTopBook - mise à jour des top books
    topBooksUpdates.forEach((topBook) => {
      if (!topBook.book) {
        return;
      }
      allActivities.push({
        id: `topbook_${topBook.id}_${new Date(topBook.updatedAt).getTime()}`,
        type: "top_book_update",
        bookTitle: topBook.book.title,
        bookId: topBook.book.id,
        bookSlug: generateBookSlug(topBook.book.title, topBook.book.author),
        listTitle: null,
        note: null,
        rating: null,
        status: null,
        occurredAt: topBook.updatedAt,
      });
    });

    // Trier toutes les activités par date décroissante et prendre les 20 plus récentes
    const recentActivities: RecentActivity[] = allActivities
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      )
      .slice(0, 20);

    const readList: ReadListBook[] = readListData
      .filter((item) => Boolean(item.book))
      .map((item) => ({
        id: item.id,
        bookId: item.bookId,
        status: item.status as "to_read" | "reading" | "finished",
        rating: item.rating ? Number(item.rating) : null,
        book: {
          id: item.book!.id,
          title: item.book!.title,
          author: item.book!.author,
          coverUrl: item.book!.coverUrl,
        },
        updatedAt: item.updatedAt,
      }));

    return {
      displayName: user.displayName ?? "Utilisateur·rice",
      email: user.email ?? "",
      bio: user.bio ?? null,
      avatarUrl: resolvedAvatarUrl ?? null,
      ownedLists: ownedListsCount,
      collaborativeLists: collaborativeListsCount,
      recommendationsCount,
      readingStats,
      topBooks,
      recentActivities,
      readList,
    };
  } catch (error) {
    throw error;
  }
};
