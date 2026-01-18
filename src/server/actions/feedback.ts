"use server";

import { revalidatePath } from "next/cache";

import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";
import db from "@/lib/supabase/db";
import type {
  CreateFeedbackInput,
  Feedback,
  FeedbackType,
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
