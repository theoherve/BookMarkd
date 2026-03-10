import { NextResponse } from "next/server";
import db from "@/lib/supabase/db";
import { searchBlogPosts } from "@/lib/blog";
import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";
import type { SuggestionsResponse, SearchBook, SearchUser } from "@/features/search/types";

const LIMIT = 3;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";

  if (!query || query.trim().length < 2) {
    return NextResponse.json<SuggestionsResponse>({ books: [], users: [], blog: [] });
  }

  const term = query.trim();

  try {
    const session = await getCurrentSession();
    const viewerId = await resolveSessionUserId(session);

    const [booksResult, usersResult, blogResult] = await Promise.all([
      // Livres — catalogue Supabase uniquement
      db.client
        .from("books")
        .select("id, title, author, cover_url, average_rating, publication_year")
        .or(`title.ilike.%${term}%,author.ilike.%${term}%`)
        .order("average_rating", { ascending: false })
        .limit(LIMIT),

      // Utilisateurs
      db.client
        .from("users")
        .select("id, username, display_name, avatar_url, bio")
        .or(`display_name.ilike.%${term}%,email.ilike.%${term}%`)
        .order("display_name", { ascending: true })
        .limit(LIMIT),

      // Blog
      searchBlogPosts(term, LIMIT),
    ]);

    // --- Livres ---
    const books: SearchBook[] = (booksResult.data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      author: row.author as string,
      coverUrl: row.cover_url as string | null,
      averageRating: row.average_rating as number | null,
      publicationYear: row.publication_year as number | null,
      source: "supabase" as const,
    }));

    // --- Utilisateurs ---
    const rawUsers = db.toCamel<
      Array<{
        id: string;
        username: string | null;
        displayName: string;
        avatarUrl: string | null;
        bio: string | null;
      }>
    >(usersResult.data ?? []);

    const userIds = rawUsers.map((u) => u.id);

    // Statuts de suivi pour l'utilisateur connecté
    const followStatusByUser = new Map<string, "following" | "request_pending" | "request_rejected" | "not_following">();
    if (viewerId && userIds.length > 0) {
      const [followsResult, requestsResult] = await Promise.all([
        db.client.from("follows").select("following_id").eq("follower_id", viewerId).in("following_id", userIds),
        db.client.from("follow_requests").select("target_id, status").eq("requester_id", viewerId).in("target_id", userIds),
      ]);
      for (const row of followsResult.data ?? []) {
        followStatusByUser.set(row.following_id as string, "following");
      }
      for (const row of requestsResult.data ?? []) {
        if (!followStatusByUser.has(row.target_id as string)) {
          const status = row.status as string;
          if (status === "pending") followStatusByUser.set(row.target_id as string, "request_pending");
          else if (status === "rejected") followStatusByUser.set(row.target_id as string, "request_rejected");
        }
      }
    }

    const users: SearchUser[] = rawUsers.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      stats: { followers: 0, booksRead: 0 },
      followStatus: followStatusByUser.get(u.id) ?? "not_following",
    }));

    return NextResponse.json<SuggestionsResponse>({ books, users, blog: blogResult });
  } catch (error) {
    console.error("[search/suggestions] GET error:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les suggestions." },
      { status: 500 },
    );
  }
}
