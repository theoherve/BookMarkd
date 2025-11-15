import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

const supabase = createSupabaseServiceClient();

const toCamelCaseKey = (key: string) => {
  return key.replace(/_([a-z])/g, (_m, c) => c.toUpperCase());
};

const toCamel = <T = unknown>(input: unknown): T => {
  if (Array.isArray(input)) {
    return input.map((item) => toCamel(item)) as T;
  }

  if (input && typeof input === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      result[toCamelCaseKey(k)] = toCamel(v);
    }
    return result as T;
  }

  // primitives
  return input as T;
};

export const db = {
  client: supabase,
  toCamel,
};

export type DbClient = ReturnType<typeof createSupabaseServiceClient>;

export default db;


