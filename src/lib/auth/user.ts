import type { Session } from "next-auth";

import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

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

  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .maybeSingle();

  return data?.id ?? null;
};

