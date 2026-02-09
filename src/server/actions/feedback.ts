"use server";

import { revalidatePath } from "next/cache";

import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";
import db from "@/lib/supabase/db";
import { isUserAdmin } from "@/lib/auth/admin";
import { createNotification } from "@/server/actions/notifications";
import type {
  CreateFeedbackInput,
  Feedback,
  FeedbackStatus,
  FeedbackType,
  FeedbackWithUser,
} from "@/types/feedback";

type ActionResult =
  | { success: true }
  | { success: false; message: string };

const requireSession = async () => {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error("AUTH_REQUIRED");
  }
  const userId = await resolveSessionUserId(session);
  if (!userId) {
    throw new Error("AUTH_REQUIRED");
  }
  return userId;
};

const validateFeedbackInput = (
  input: CreateFeedbackInput,
): { valid: boolean; message?: string } => {
  const trimmedTitle = input.title.trim();
  const trimmedDescription = input.description.trim();

  if (!input.type || (input.type !== "bug" && input.type !== "suggestion")) {
    return {
      valid: false,
      message: "Le type de feedback doit être 'bug' ou 'suggestion'.",
    };
  }

  if (trimmedTitle.length < 3 || trimmedTitle.length > 200) {
    return {
      valid: false,
      message: "Le titre doit contenir entre 3 et 200 caractères.",
    };
  }

  if (trimmedDescription.length < 10 || trimmedDescription.length > 5000) {
    return {
      valid: false,
      message: "La description doit contenir entre 10 et 5000 caractères.",
    };
  }

  return { valid: true };
};

export const createFeedback = async (
  input: CreateFeedbackInput,
): Promise<ActionResult> => {
  try {
    const userId = await requireSession();

    const validation = validateFeedbackInput(input);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message ?? "Données invalides.",
      };
    }

    const { error } = await db.client.from("feedbacks").insert({
      user_id: userId,
      type: input.type,
      title: input.title.trim(),
      description: input.description.trim(),
      browser_info: input.browserInfo ?? null,
      url: input.url?.trim() ?? null,
      status: "pending",
    });

    if (error) {
      console.error("Error creating feedback:", error);
      throw error;
    }

    revalidatePath("/feedback");
    revalidatePath("/profiles/me");

    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e pour soumettre un feedback.",
      };
    }

    console.error("Error in createFeedback:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de l'envoi du feedback.",
    };
  }
};

export const getUserFeedbacks = async (): Promise<{
  success: true;
  feedbacks: Feedback[];
} | { success: false; message: string }> => {
  try {
    const userId = await requireSession();

    const { data, error } = await db.client
      .from("feedbacks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user feedbacks:", error);
      throw error;
    }

    const feedbacks: Feedback[] = (data ?? []).map((fb) => ({
      id: fb.id,
      userId: fb.user_id,
      type: fb.type as FeedbackType,
      title: fb.title,
      description: fb.description,
      browserInfo: fb.browser_info,
      url: fb.url,
      status: fb.status as Feedback["status"],
      createdAt: new Date(fb.created_at),
      updatedAt: new Date(fb.updated_at),
    }));

    return { success: true, feedbacks };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e pour voir vos feedbacks.",
      };
    }

    console.error("Error in getUserFeedbacks:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de la récupération des feedbacks.",
    };
  }
};

export const getAllSuggestionsForAdmin = async (): Promise<
  | { success: true; suggestions: FeedbackWithUser[] }
  | { success: false; message: string }
> => {
  try {
    const userId = await requireSession();

    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return {
        success: false,
        message: "Accès réservé aux administrateurs.",
      };
    }

    const { data: feedbacksData, error: feedbacksError } = await db.client
      .from("feedbacks")
      .select("id, user_id, type, title, description, browser_info, url, status, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (feedbacksError) {
      console.error("Error fetching feedbacks for admin:", feedbacksError);
      throw feedbacksError;
    }

    const rows = feedbacksData ?? [];
    if (rows.length === 0) {
      return { success: true, suggestions: [] };
    }

    const userIds = [...new Set(rows.map((r: { user_id: string }) => r.user_id))];
    const { data: usersData, error: usersError } = await db.client
      .from("users")
      .select("id, display_name, email, username")
      .in("id", userIds);

    if (usersError) {
      console.error("Error fetching users for admin feedbacks:", usersError);
      throw usersError;
    }

    const usersById = new Map<
      string,
      { display_name: string | null; email: string | null; username: string | null }
    >();
    for (const u of usersData ?? []) {
      usersById.set(u.id, {
        display_name: u.display_name ?? null,
        email: u.email ?? null,
        username: u.username ?? null,
      });
    }

    const suggestions: FeedbackWithUser[] = rows.map((row: Record<string, unknown>) => {
      const uid = row.user_id as string;
      const u = usersById.get(uid) ?? { display_name: null, email: null, username: null };
      return {
        id: row.id as string,
        userId: uid,
        type: row.type as FeedbackType,
        title: row.title as string,
        description: row.description as string,
        browserInfo: row.browser_info as Feedback["browserInfo"],
        url: row.url as string | null,
        status: row.status as Feedback["status"],
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        userDisplayName: u.display_name ?? "—",
        userEmail: u.email ?? "—",
        username: u.username ?? null,
      };
    });

    return { success: true, suggestions };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e.",
      };
    }

    console.error("Error in getAllSuggestionsForAdmin:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de la récupération des suggestions.",
    };
  }
};

const VALID_STATUSES: FeedbackStatus[] = ["pending", "reviewed", "resolved", "rejected"];

export const updateFeedbackStatus = async (
  feedbackId: string,
  status: FeedbackStatus,
): Promise<ActionResult> => {
  try {
    const userId = await requireSession();

    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return {
        success: false,
        message: "Accès réservé aux administrateurs.",
      };
    }

    if (!VALID_STATUSES.includes(status)) {
      return {
        success: false,
        message: "Statut invalide.",
      };
    }

    const { data: feedbackRow, error: fetchError } = await db.client
      .from("feedbacks")
      .select("user_id, title")
      .eq("id", feedbackId)
      .maybeSingle();

    if (fetchError || !feedbackRow) {
      return {
        success: false,
        message: "Feedback introuvable.",
      };
    }

    const feedbackUserId = feedbackRow.user_id as string;
    const feedbackTitle = (feedbackRow.title as string) ?? "";

    const { error: updateError } = await db.client
      .from("feedbacks")
      .update({ status })
      .eq("id", feedbackId);

    if (updateError) {
      console.error("Error updating feedback status:", updateError);
      throw updateError;
    }

    if (status === "resolved") {
      await createNotification(feedbackUserId, "feedback_resolved", {
        feedbackId,
        feedbackTitle,
      });
    }

    revalidatePath("/profiles/me");

    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e.",
      };
    }

    console.error("Error in updateFeedbackStatus:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de la mise à jour du statut.",
    };
  }
};
