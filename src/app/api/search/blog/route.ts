import { NextResponse } from "next/server";
import { searchBlogPosts } from "@/lib/blog";
import type { BlogSuggestion } from "@/features/search/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ blog: [], count: 0 });
  }

  try {
    const results = await searchBlogPosts(query.trim(), 10);
    return NextResponse.json<{ blog: BlogSuggestion[]; count: number }>({
      blog: results,
      count: results.length,
    });
  } catch (error) {
    console.error("[search/blog] GET error:", error);
    return NextResponse.json(
      { error: "Impossible de rechercher les articles." },
      { status: 500 },
    );
  }
}
