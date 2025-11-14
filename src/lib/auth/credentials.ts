import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma/client";

export const verifyPassword = async (
  plainPassword: string,
  passwordHash: string,
) => {
  if (!plainPassword || !passwordHash) {
    return false;
  }

  return bcrypt.compare(plainPassword, passwordHash);
};

export const authenticateWithCredentials = async (
  email: string,
  password: string,
) => {
  const user = await fetchUserByEmail(email);

  if (!user) {
    return null;
  }

  if (!user.passwordHash) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    return null;
  }

  return user;
};

type UserRow = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
};

const fetchUserByEmail = async (email: string): Promise<UserRow | null> => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    };
  } catch (error) {
    console.error("Prisma error while fetching user:", error);
    return null;
  }
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  bio?: string | null;
};

export const toPublicUser = (user: UserRow): PublicUser => ({
  id: user.id,
  name: user.displayName,
  email: user.email,
  avatarUrl: user.avatarUrl,
  bio: user.bio,
});

