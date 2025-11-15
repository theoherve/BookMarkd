import { NextResponse } from "next/server";
import db from "@/lib/supabase/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await db.client
      .from("tags")
      .select("id, name, slug")
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ tags: data ?? [] });
  } catch (error) {
    console.error("[tags] GET error:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les tags." },
      { status: 500 },
    );
  }
}

