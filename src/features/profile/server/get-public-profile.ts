import db from "@/lib/supabase/db";
import { getUserAvatarUrl } from "@/lib/storage/avatars";

export type PublicProfile = {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  stats: {
    booksRead: number;
    booksReading: number;
    booksToRead: number;
    followers: number;
    following: number;
    listsOwned: number;
    reviews: number;
  };
  topBooks: Array<{
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
    position: number;
  }>;
  recentBooks: Array<{
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
    status: "to_read" | "reading" | "finished";
    rating: number | null;
    updatedAt: string;
  }>;
  publicLists: Array<{
    id: string;
    title: string;
    description: string | null;
    itemsCount: number;
  }>;
};

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );

export const getPublicProfile = async (
  usernameOrId: string,
): Promise<PublicProfile | null> => {
  try {
    // 1) User by username or by id (UUID) pour supporter /profiles/:id
    const query = db.client
      .from("users")
      .select("id, username, display_name, avatar_url, bio");

    const { data: userRow, error: userError } = await (isUuid(usernameOrId)
      ? query.eq("id", usernameOrId.trim())
      : query.eq("username", usernameOrId)
    ).maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!userRow) {
      return null;
    }

    const user = db.toCamel<{
      id: string;
      username: string | null;
      displayName: string;
      avatarUrl: string | null;
      bio: string | null;
    }>(userRow);

    // Résoudre l'URL de l'avatar avec priorité Supabase Storage
    const resolvedAvatarUrl = await getUserAvatarUrl(user.id, user.avatarUrl);

    // 2) Tous les user_books avec jointure book (pour stats correctes et affichage de tous les livres)
    const { data: userBooksRows, error: userBooksError } = await db.client
      .from("user_books")
      .select(
        `
        status,
        rating,
        updated_at,
        book:book_id (
          id,
          title,
          author,
          cover_url
        )
      `,
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (userBooksError) throw userBooksError;

    const userBooks = (userBooksRows ?? []).map((row) =>
      db.toCamel<{
        status: "to_read" | "reading" | "finished";
        rating: number | null;
        updatedAt: string;
        book?: { id: string; title: string; author: string; coverUrl: string | null };
      }>(row),
    );

    // 3) Top books
    const { data: topBooksRows, error: topBooksError } = await db.client
      .from("user_top_books")
      .select(
        `
        position,
        book:book_id (
          id,
          title,
          author,
          cover_url
        )
      `,
      )
      .eq("user_id", user.id)
      .order("position", { ascending: true });
    if (topBooksError) throw topBooksError;

    const topBooks = (topBooksRows ?? [])
      .map((row) =>
        db.toCamel<{
          position: number;
          book?: { id: string; title: string; author: string; coverUrl: string | null };
        }>(row),
      )
      .filter((r) => r.book)
      .map((r) => ({
        id: r.book!.id,
        title: r.book!.title,
        author: r.book!.author,
        coverUrl: r.book!.coverUrl,
        position: r.position,
      }));

    // 4) Public lists owned
    const { data: listsRows, error: listsError } = await db.client
      .from("lists")
      .select("id, title, description")
      .eq("owner_id", user.id)
      .eq("visibility", "public")
      .limit(10);
    if (listsError) throw listsError;

    const lists = db.toCamel<Array<{ id: string; title: string; description: string | null }>>(
      listsRows ?? [],
    );

    // Count items per list
    const listIds = lists.map((l) => l.id);
    const itemsCountByList = new Map<string, number>();
    if (listIds.length > 0) {
      const { data: itemsRows, error: itemsError } = await db.client
        .from("list_items")
        .select("list_id")
        .in("list_id", listIds);
      if (itemsError) throw itemsError;
      for (const row of itemsRows ?? []) {
        const { listId } = db.toCamel<{ listId: string }>(row);
        itemsCountByList.set(listId, (itemsCountByList.get(listId) ?? 0) + 1);
      }
    }

    // 5) Followers / Following counts
    const [{ data: followersRows }, { data: followingRows }] = await Promise.all([
      db.client.from("follows").select("following_id").eq("following_id", user.id),
      db.client.from("follows").select("follower_id").eq("follower_id", user.id),
    ]);
    const followers = followersRows?.length ?? 0;
    const following = followingRows?.length ?? 0;

    // 6) Public reviews count
    const { data: publicReviewsRows, error: reviewsError } = await db.client
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("visibility", "public");
    if (reviewsError) throw reviewsError;
    const publicReviewsCount = publicReviewsRows?.length ?? 0;

    const booksRead = userBooks.filter((ub) => ub.status === "finished").length;
    const booksReading = userBooks.filter((ub) => ub.status === "reading").length;
    const booksToRead = userBooks.filter((ub) => ub.status === "to_read").length;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: resolvedAvatarUrl,
      bio: user.bio,
      stats: {
        booksRead,
        booksReading,
        booksToRead,
        followers,
        following,
        listsOwned: lists.length,
        reviews: publicReviewsCount,
      },
      topBooks,
      recentBooks: userBooks
        .filter((ub) => ub.book)
        .map((ub) => ({
          id: ub.book!.id,
          title: ub.book!.title,
          author: ub.book!.author,
          coverUrl: ub.book!.coverUrl,
          status: ub.status,
          rating: typeof ub.rating === "number" ? ub.rating : null,
          updatedAt: ub.updatedAt,
        })),
      publicLists: lists.map((list) => ({
        id: list.id,
        title: list.title,
        description: list.description,
        itemsCount: itemsCountByList.get(list.id) ?? 0,
      })),
    };
  } catch (error) {
    console.error("[profile] getPublicProfile error:", error);
    return null;
  }
};

export type PublicProfileBookRead = {
  bookId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  rating: number | null;
  updatedAt: string;
};

export const getPublicProfileBooksRead = async (
  username: string,
): Promise<{ displayName: string; books: PublicProfileBookRead[] } | null> => {
  try {
    const { data: userRow, error: userError } = await db.client
      .from("users")
      .select("id, display_name")
      .eq("username", username)
      .maybeSingle();
    if (userError || !userRow) return null;

    const user = db.toCamel<{ id: string; displayName: string }>(userRow);

    const { data: rows, error } = await db.client
      .from("user_books")
      .select(
        `
        rating,
        updated_at,
        book:book_id (
          id,
          title,
          author,
          cover_url
        )
      `,
      )
      .eq("user_id", user.id)
      .eq("status", "finished")
      .order("updated_at", { ascending: false });
    if (error) throw error;

    const books = (rows ?? [])
      .map((row) =>
        db.toCamel<{
          rating: number | null;
          updatedAt: string;
          book?: { id: string; title: string; author: string; coverUrl: string | null };
        }>(row),
      )
      .filter((r) => r.book)
      .map((r) => ({
        bookId: r.book!.id,
        title: r.book!.title,
        author: r.book!.author,
        coverUrl: r.book!.coverUrl,
        rating: r.rating,
        updatedAt: r.updatedAt,
      }));

    return { displayName: user.displayName, books };
  } catch (err) {
    console.error("[profile] getPublicProfileBooksRead error:", err);
    return null;
  }
};

