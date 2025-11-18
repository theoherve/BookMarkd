import type { OfflineAction } from "@/types/offline-actions";
import {
  getPendingActions,
  deleteOfflineAction,
  updateOfflineAction,
} from "./offline-queue";

const MAX_RETRIES = 3;

const performAction = async (action: OfflineAction): Promise<boolean> => {
  try {
    const response = await fetch("/api/pwa/offline-actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(action.payload),
    });

    const result = await response.json();

    if (!result.success || !response.ok) {
      throw new Error(result.message || "Action échouée");
    }

    return true;
  } catch (error) {
    throw error;
  }
};

export const syncOfflineActions = async (): Promise<{
  success: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}> => {
  const actions = await getPendingActions();
  let success = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const action of actions) {
    try {
      await performAction(action);
      await deleteOfflineAction(action.id);
      success++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      const newRetries = action.retries + 1;

      if (newRetries >= MAX_RETRIES) {
        await updateOfflineAction(action.id, {
          lastError: errorMessage,
          retries: newRetries,
        });
        failed++;
        errors.push({ id: action.id, error: errorMessage });
      } else {
        await updateOfflineAction(action.id, {
          retries: newRetries,
          lastError: errorMessage,
        });
      }
    }
  }

  return { success, failed, errors };
};

