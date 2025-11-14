import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("[tags] GET error:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les tags." },
      { status: 500 },
    );
  }
}

