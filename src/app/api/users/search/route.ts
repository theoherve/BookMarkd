import { NextResponse } from "next/server";
import db from "@/lib/supabase/db";

const LIMIT = 20;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";

  try {
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        users: [],
        count: 0,
      });
    }

    const searchTerm = query.trim();

    // Recherche côté Supabase (ILIKE sur display_name et email)
    const { data: usersData, error: usersError } = await db.client
      .from("users")
      .select("id, display_name, avatar_url, bio, email")
      .or(`display_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order("display_name", { ascending: true })
      .limit(LIMIT);

    if (usersError) {
      throw usersError;
    }

    const users = db.toCamel<
      Array<{
        id: string;
        displayName: string;
        avatarUrl: string | null;
        bio: string | null;
        email: string;
      }>
    >(usersData ?? []);

    const userIds = users.map((u) => u.id);

    // Followers: count rows where following_id in userIds
    const { data: followersRows, error: followersError } = await db.client
      .from("follows")
      .select("following_id")
      .in("following_id", userIds);

    if (followersError) {
      throw followersError;
    }

    const followersByUser = new Map<string, number>();
    for (const row of followersRows ?? []) {
      const { followingId } = db.toCamel<{ followingId: string }>(row);
      followersByUser.set(
        followingId,
        (followersByUser.get(followingId) ?? 0) + 1,
      );
    }

    // Books read: rows in user_books where status = 'finished' and user_id in userIds
    const { data: booksRows, error: booksError } = await db.client
      .from("user_books")
      .select("user_id, status")
      .in("user_id", userIds)
      .eq("status", "finished");

    if (booksError) {
      throw booksError;
    }

    const booksReadByUser = new Map<string, number>();
    for (const row of booksRows ?? []) {
      const { userId } = db.toCamel<{ userId: string }>(row);
      booksReadByUser.set(userId, (booksReadByUser.get(userId) ?? 0) + 1);
    }

    const formattedUsers = users.map((user) => ({
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      stats: {
        followers: followersByUser.get(user.id) ?? 0,
        booksRead: booksReadByUser.get(user.id) ?? 0,
      },
    }));

    return NextResponse.json({
      users: formattedUsers,
      count: formattedUsers.length,
    });
  } catch (error) {
    console.error("[users/search] GET error:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les résultats de recherche." },
      { status: 500 },
    );
  }
}

