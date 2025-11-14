import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
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

