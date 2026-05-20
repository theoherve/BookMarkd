"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import db from "@/lib/supabase/db";
import {
  KNOWN_MODULE_KEYS,
  MODULE_DEFAULTS,
  type SiteModuleKey,
} from "@/features/modules/types";

type ActionResult =
  | { success: true }
  | { success: false; message: string };

const mapAuthError = (error: unknown): ActionResult | null => {
  const message = (error as Error)?.message;
  if (message === "AUTH_REQUIRED")
    return { success: false, message: "Authentification requise." };
  if (message === "ADMIN_REQUIRED")
    return { success: false, message: "Accès réservé aux administrateurs." };
  return null;
};

const isKnownKey = (key: string): key is SiteModuleKey =>
  (KNOWN_MODULE_KEYS as readonly string[]).includes(key);

export const setModuleEnabled = async (
  key: string,
  enabled: boolean,
): Promise<ActionResult> => {
  try {
    await requireAdmin();
  } catch (error) {
    const authResult = mapAuthError(error);
    if (authResult) return authResult;
    throw error;
  }

  if (!isKnownKey(key)) {
    return { success: false, message: "Module inconnu." };
  }

  const defaults = MODULE_DEFAULTS[key];

  const { error } = await db.client
    .from("site_modules")
    .upsert(
      {
        key,
        label: defaults.label,
        description: defaults.description,
        enabled,
      },
      { onConflict: "key" },
    );

  if (error) {
    return {
      success: false,
      message: `Échec de la mise à jour : ${error.message}`,
    };
  }

  revalidatePath("/");
  revalidatePath("/admin/modules");

  return { success: true };
};
