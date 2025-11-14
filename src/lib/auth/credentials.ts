import bcrypt from "bcryptjs";

import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

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

  if (!user.password_hash) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, user.password_hash);

  if (!isValidPassword) {
    return null;
  }

  return user;
};

type SupabaseUserRow = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
};

const fetchUserByEmail = async (email: string) => {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, email, password_hash, display_name, avatar_url, bio",
    )
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("Supabase error while fetching user:", error);
    return null;
  }

  return data as SupabaseUserRow | null;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  bio?: string | null;
};

export const toPublicUser = (user: SupabaseUserRow): PublicUser => ({
  id: user.id,
  name: user.display_name,
  email: user.email,
  avatarUrl: user.avatar_url,
  bio: user.bio,
});

