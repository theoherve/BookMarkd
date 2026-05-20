"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import db from "@/lib/supabase/db";
import {
  AwardsYearGuardError,
  computeAwardsForYear,
  persistAwards,
} from "@/features/awards/server/aggregate";
import {
  notifyAwardsPublished,
  type WinnerNotificationInput,
} from "@/features/awards/server/notify";
import {
  MIN_AWARDS_YEAR,
  type AwardCategory,
  type WinnerSnapshot,
} from "@/features/awards/types";

type ActionResult =
  | { success: true }
  | { success: false; message: string };

type AuthFailure = { success: false; message: string };

const mapAuthError = (error: unknown): AuthFailure | null => {
  const message = (error as Error)?.message;
  if (message === "AUTH_REQUIRED")
    return { success: false, message: "Authentification requise." };
  if (message === "ADMIN_REQUIRED")
    return { success: false, message: "Accès réservé aux administrateurs." };
  return null;
};

const revalidate = (year?: number) => {
  revalidatePath("/admin/awards");
  if (year !== undefined) {
    revalidatePath(`/admin/awards/${year}`);
    revalidatePath(`/awards/${year}`);
    revalidatePath(`/awards/${year}/stories`);
  }
};

// ─── Run aggregation ────────────────────────────────────────────────────────

export const runAwardsAggregation = async (
  year: number,
  overwrite = false,
): Promise<
  | { success: true; year: number; winnersCount: number; skipped?: boolean }
  | { success: false; message: string }
> => {
  try {
    await requireAdmin();

    if (year < MIN_AWARDS_YEAR) {
      return {
        success: false,
        message: `Les awards ne peuvent pas être calculés avant ${MIN_AWARDS_YEAR}.`,
      };
    }

    const result = await computeAwardsForYear(db.client, year);
    const persisted = await persistAwards(db.client, result, { overwrite });

    revalidate(year);

    return {
      success: true,
      year,
      winnersCount: result.winners.length,
      skipped: persisted.skipped,
    };
  } catch (error) {
    const authErr = mapAuthError(error);
    if (authErr) return authErr;
    if (error instanceof AwardsYearGuardError) {
      return { success: false, message: error.message };
    }
    console.error("[admin/awards] runAwardsAggregation error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

// ─── Publish / Unpublish / Archive ─────────────────────────────────────────

export const publishAwards = async (year: number): Promise<ActionResult> => {
  try {
    await requireAdmin();

    const { data: existing } = await db.client
      .from("awards_years")
      .select("year, status, published_at")
      .eq("year", year)
      .maybeSingle();

    if (!existing) {
      return {
        success: false,
        message: `Aucune édition ${year} à publier.`,
      };
    }

    const wasAlreadyPublished = existing.status === "published";

    const { error: updateError } = await db.client
      .from("awards_years")
      .update({
        status: "published",
        published_at:
          (existing.published_at as string | null) ?? new Date().toISOString(),
      })
      .eq("year", year);
    if (updateError) throw updateError;

    if (!wasAlreadyPublished) {
      const { data: userWinners } = await db.client
        .from("awards_winners")
        .select("winner_id, category, rank, winner_type")
        .eq("year", year)
        .eq("winner_type", "user");

      const winnerInputs: WinnerNotificationInput[] = (userWinners ?? [])
        .filter((row): row is { winner_id: string; category: AwardCategory; rank: number; winner_type: "user" } => row.winner_id !== null)
        .map((row) => ({
          userId: row.winner_id,
          year,
          category: row.category,
          rank: row.rank,
        }));

      // Notifier l'auteur d'une review primée (Most Loved Review).
      const { data: reviewWinners } = await db.client
        .from("awards_winners")
        .select("metadata, category, rank")
        .eq("year", year)
        .eq("winner_type", "review");

      for (const row of reviewWinners ?? []) {
        const metadata = (row.metadata as Record<string, unknown>) ?? {};
        const authorId = metadata.authorId as string | undefined;
        if (authorId) {
          winnerInputs.push({
            userId: authorId,
            year,
            category: row.category as AwardCategory,
            rank: row.rank as number,
          });
        }
      }

      await notifyAwardsPublished(db.client, year, winnerInputs);
    }

    revalidate(year);
    return { success: true };
  } catch (error) {
    const authErr = mapAuthError(error);
    if (authErr) return authErr;
    console.error("[admin/awards] publishAwards error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const unpublishAwards = async (year: number): Promise<ActionResult> => {
  try {
    await requireAdmin();
    const { error } = await db.client
      .from("awards_years")
      .update({ status: "draft" })
      .eq("year", year);
    if (error) throw error;
    revalidate(year);
    return { success: true };
  } catch (error) {
    const authErr = mapAuthError(error);
    if (authErr) return authErr;
    console.error("[admin/awards] unpublishAwards error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const archiveAwards = async (year: number): Promise<ActionResult> => {
  try {
    await requireAdmin();
    const { error } = await db.client
      .from("awards_years")
      .update({ status: "archived" })
      .eq("year", year);
    if (error) throw error;
    revalidate(year);
    return { success: true };
  } catch (error) {
    const authErr = mapAuthError(error);
    if (authErr) return authErr;
    console.error("[admin/awards] archiveAwards error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

// ─── Update theme / intro ──────────────────────────────────────────────────

export const updateAwardsYearMeta = async (
  year: number,
  patch: { theme?: string | null; intro?: string | null },
): Promise<ActionResult> => {
  try {
    await requireAdmin();
    const update: Record<string, unknown> = {};
    if (patch.theme !== undefined) update.theme = patch.theme?.trim() ?? null;
    if (patch.intro !== undefined) update.intro = patch.intro?.trim() ?? null;

    if (Object.keys(update).length === 0) return { success: true };

    const { error } = await db.client
      .from("awards_years")
      .update(update)
      .eq("year", year);
    if (error) throw error;
    revalidate(year);
    return { success: true };
  } catch (error) {
    const authErr = mapAuthError(error);
    if (authErr) return authErr;
    console.error("[admin/awards] updateAwardsYearMeta error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

// ─── Update / Reorder / Delete winners ─────────────────────────────────────

export const updateWinnerSnapshot = async (
  winnerId: string,
  patch: {
    snapshot?: WinnerSnapshot;
    metadata?: Record<string, unknown>;
  },
): Promise<ActionResult> => {
  try {
    await requireAdmin();

    const update: Record<string, unknown> = {};
    if (patch.snapshot !== undefined) update.snapshot = patch.snapshot;
    if (patch.metadata !== undefined) update.metadata = patch.metadata;

    if (Object.keys(update).length === 0) return { success: true };

    const { data: existing, error: fetchError } = await db.client
      .from("awards_winners")
      .select("year")
      .eq("id", winnerId)
      .maybeSingle();
    if (fetchError) throw fetchError;

    const { error } = await db.client
      .from("awards_winners")
      .update(update)
      .eq("id", winnerId);
    if (error) throw error;

    revalidate(existing?.year as number | undefined);
    return { success: true };
  } catch (error) {
    const authErr = mapAuthError(error);
    if (authErr) return authErr;
    console.error("[admin/awards] updateWinnerSnapshot error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const reorderWinners = async (
  year: number,
  category: AwardCategory,
  orderedIds: string[],
): Promise<ActionResult> => {
  try {
    await requireAdmin();

    if (orderedIds.length === 0) return { success: true };

    // Two-pass to dodge unique (year, category, rank): temporarily push to
    // negative ranks, then set definitive ones.
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await db.client
        .from("awards_winners")
        .update({ rank: -(i + 1) })
        .eq("id", orderedIds[i])
        .eq("year", year)
        .eq("category", category);
      if (error) throw error;
    }
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await db.client
        .from("awards_winners")
        .update({ rank: i + 1 })
        .eq("id", orderedIds[i])
        .eq("year", year)
        .eq("category", category);
      if (error) throw error;
    }

    revalidate(year);
    return { success: true };
  } catch (error) {
    const authErr = mapAuthError(error);
    if (authErr) return authErr;
    console.error("[admin/awards] reorderWinners error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const deleteWinner = async (winnerId: string): Promise<ActionResult> => {
  try {
    await requireAdmin();

    const { data: existing, error: fetchError } = await db.client
      .from("awards_winners")
      .select("year")
      .eq("id", winnerId)
      .maybeSingle();
    if (fetchError) throw fetchError;

    const { error } = await db.client
      .from("awards_winners")
      .delete()
      .eq("id", winnerId);
    if (error) throw error;

    revalidate(existing?.year as number | undefined);
    return { success: true };
  } catch (error) {
    const authErr = mapAuthError(error);
    if (authErr) return authErr;
    console.error("[admin/awards] deleteWinner error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};
