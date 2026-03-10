"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import db from "@/lib/supabase/db";
import type { ExportFormat } from "@/types/admin";

const objectsToCsv = (data: Record<string, unknown>[]): string => {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]!);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        const str = val === null || val === undefined ? "" : String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
};

export const exportData = async (
  entity: "users" | "books" | "feedback" | "tags" | "feelings" | "email_logs",
  format: ExportFormat
): Promise<{ success: true; data: string; filename: string } | { success: false; message: string }> => {
  try {
    await requireAdmin();

    let rows: Record<string, unknown>[] = [];
    const timestamp = new Date().toISOString().split("T")[0];

    switch (entity) {
      case "users": {
        const { data } = await db.client
          .from("users")
          .select("id, email, username, display_name, is_admin, disabled_at, created_at")
          .order("created_at", { ascending: false });
        rows = (data ?? []) as Record<string, unknown>[];
        break;
      }
      case "books": {
        const { data } = await db.client
          .from("books")
          .select("id, title, author, isbn, publication_year, average_rating, ratings_count, publisher, language, created_at")
          .order("created_at", { ascending: false });
        rows = (data ?? []) as Record<string, unknown>[];
        break;
      }
      case "feedback": {
        const { data } = await db.client
          .from("feedbacks")
          .select("id, user_id, type, title, description, status, url, created_at")
          .order("created_at", { ascending: false });
        rows = (data ?? []) as Record<string, unknown>[];
        break;
      }
      case "tags": {
        const { data } = await db.client
          .from("tags")
          .select("id, name, slug, created_at")
          .order("name");
        rows = (data ?? []) as Record<string, unknown>[];
        break;
      }
      case "feelings": {
        const { data } = await db.client
          .from("feeling_keywords")
          .select("id, label, slug, source, created_at")
          .order("label");
        rows = (data ?? []) as Record<string, unknown>[];
        break;
      }
      case "email_logs": {
        const { data } = await db.client
          .from("email_logs")
          .select("id, email_type, recipient_email, subject, status, created_at")
          .order("created_at", { ascending: false });
        rows = (data ?? []) as Record<string, unknown>[];
        break;
      }
    }

    const filename = `bookmarkd-${entity}-${timestamp}.${format}`;
    const content = format === "csv" ? objectsToCsv(rows) : JSON.stringify(rows, null, 2);

    return { success: true, data: content, filename };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Authentification requise." };
    }
    if ((error as Error).message === "ADMIN_REQUIRED") {
      return { success: false, message: "Accès réservé aux administrateurs." };
    }
    console.error("[admin/export] exportData error:", error);
    return { success: false, message: "Une erreur est survenue lors de l'export." };
  }
};
