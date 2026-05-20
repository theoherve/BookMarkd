import db from "@/lib/supabase/db";
import {
  KNOWN_MODULE_KEYS,
  MODULE_DEFAULTS,
  type SiteModule,
  type SiteModuleKey,
} from "../types";

type ModuleRow = {
  key: SiteModuleKey;
  label: string;
  description: string | null;
  enabled: boolean;
  updatedAt: string;
};

const isTolerableError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  if (code === "PGRST205" || code === "42P01") return true;
  const name = (error as { name?: string }).name;
  if (name === "TypeError") return true;
  const message = (error as { message?: string }).message ?? "";
  return /fetch failed|ENOTFOUND|ECONNREFUSED|getaddrinfo/i.test(message);
};

const fallbackModule = (key: SiteModuleKey): SiteModule => ({
  key,
  label: MODULE_DEFAULTS[key].label,
  description: MODULE_DEFAULTS[key].description,
  enabled: true,
  updatedAt: new Date(0).toISOString(),
});

const mergeWithDefaults = (rows: ModuleRow[]): SiteModule[] => {
  const map = new Map<SiteModuleKey, SiteModule>(
    rows.map((row) => [row.key, row]),
  );
  return KNOWN_MODULE_KEYS.map((key) => map.get(key) ?? fallbackModule(key));
};

export const listSiteModules = async (): Promise<SiteModule[]> => {
  try {
    const { data, error } = await db.client
      .from("site_modules")
      .select("key, label, description, enabled, updated_at");
    if (error) {
      if (isTolerableError(error)) return KNOWN_MODULE_KEYS.map(fallbackModule);
      throw error;
    }
    const rows = (data ?? []).map((row) => db.toCamel<ModuleRow>(row));
    return mergeWithDefaults(rows);
  } catch (error) {
    if (isTolerableError(error)) return KNOWN_MODULE_KEYS.map(fallbackModule);
    throw error;
  }
};

export const getModulesEnabledMap = async (): Promise<
  Record<SiteModuleKey, boolean>
> => {
  const modules = await listSiteModules();
  return modules.reduce(
    (acc, m) => {
      acc[m.key] = m.enabled;
      return acc;
    },
    {} as Record<SiteModuleKey, boolean>,
  );
};

export const isModuleEnabled = async (key: SiteModuleKey): Promise<boolean> => {
  const map = await getModulesEnabledMap();
  return map[key] ?? true;
};
