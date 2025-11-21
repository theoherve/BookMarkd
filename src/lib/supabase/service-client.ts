import { createClient } from "@supabase/supabase-js";

const resolveEnvVar = (primaryKey: string, fallbackKeys: string[]) => {
  const keysToInspect = [primaryKey, ...fallbackKeys];

  for (const key of keysToInspect) {
    const value = process.env[key];

    if (value) {
      return value;
    }
  }

  throw new Error(
    `Supabase environment variable "${primaryKey}" is missing. Tried fallbacks: ${fallbackKeys.join(
      ", "
    )}`
  );
};

export const createSupabaseServiceClient = () => {
  const supabaseUrl = resolveEnvVar("SUPABASE_URL", [
    "BOOK_MARKD_SUPABASE_URL",
  ]);
  const serviceRoleKey = resolveEnvVar("SUPABASE_SERVICE_ROLE_KEY", [
    "BOOK_MARKD_SUPABASE_SERVICE_ROLE_KEY",
  ]);

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
};
