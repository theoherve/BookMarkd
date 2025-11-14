import { createClient } from "@supabase/supabase-js";

const getRequiredEnvVar = (key: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Supabase environment variable "${key}" is missing.`);
  }

  return value;
};

export const createSupabaseServiceClient = () => {
  const supabaseUrl = getRequiredEnvVar("SUPABASE_URL");
  const serviceRoleKey = getRequiredEnvVar("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
};

