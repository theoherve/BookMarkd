import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";

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

    // Construire la condition de recherche
    const whereCondition: Prisma.UserWhereInput = {
      OR: [
        { displayName: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        // Note: username sera ajouté plus tard quand le champ existera
      ],
    };

    // Récupérer les utilisateurs
    const users = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        email: true,
        // Compter les followers
        _count: {
          select: {
            followsAsFollowing: true,
            userBooks: {
              where: {
                status: "finished",
              },
            },
          },
        },
      },
      take: LIMIT,
      orderBy: {
        displayName: "asc",
      },
    });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      stats: {
        followers: user._count.followsAsFollowing,
        booksRead: user._count.userBooks,
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

