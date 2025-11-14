import type { Session } from "next-auth";

import { prisma } from "@/lib/prisma/client";

export const resolveSessionUserId = async (
  session: Session | null,
): Promise<string | null> => {
  if (!session?.user) {
    return null;
  }

  if (session.user.id) {
    return session.user.id;
  }

  if (!session.user.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  return user?.id ?? null;
};

