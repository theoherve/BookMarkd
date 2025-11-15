import bcrypt from "bcryptjs";
import db from "@/lib/supabase/db";

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
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await db.client
    .from("users")
    .select(
      "id, email, password_hash, display_name, avatar_url, bio",
    )
    .eq("email", normalizedEmail)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Supabase error while fetching user:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const row = db.toCamel<{
    id: string;
    email: string;
    passwordHash: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
  }>(data);

  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
  };
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

