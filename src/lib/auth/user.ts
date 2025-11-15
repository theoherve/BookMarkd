import type { Session } from "next-auth";
import db from "@/lib/supabase/db";

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

  const { data, error } = await db.client
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Supabase error while resolving session user id:", error);
    return null;
  }

  return data?.id ?? null;
};

