"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import db from "@/lib/supabase/db";
import type { SystemHealthCheck } from "@/types/admin";

export const getSystemHealthChecks = async (): Promise<SystemHealthCheck[]> => {
  await requireAdmin();

  const checks: SystemHealthCheck[] = [];

  // 1. Google Books API quota
  try {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await db.client
      .from("google_books_quota")
      .select("request_count")
      .eq("date", today)
      .maybeSingle();

    const count = (data?.request_count as number) ?? 0;
    checks.push({
      service: "Google Books API",
      status: count > 900 ? "error" : count > 700 ? "warning" : "healthy",
      message: `${count} / 950 requêtes utilisées aujourd'hui`,
      lastChecked: new Date().toISOString(),
    });
  } catch {
    checks.push({
      service: "Google Books API",
      status: "error",
      message: "Impossible de vérifier le quota",
      lastChecked: new Date().toISOString(),
    });
  }

  // 2. Supabase health
  const dbStart = Date.now();
  try {
    await db.client.from("users").select("id").limit(1);
    checks.push({
      service: "Supabase (PostgreSQL)",
      status: "healthy",
      message: "Connexion active",
      latency: Date.now() - dbStart,
      lastChecked: new Date().toISOString(),
    });
  } catch {
    checks.push({
      service: "Supabase (PostgreSQL)",
      status: "error",
      message: "Connexion échouée",
      latency: Date.now() - dbStart,
      lastChecked: new Date().toISOString(),
    });
  }

  // 3. Resend
  const hasResendKey = !!(process.env.RESEND_API_KEY || process.env.BOOK_MARKD_RESEND_API_KEY);
  checks.push({
    service: "Resend (Email)",
    status: hasResendKey ? "healthy" : "error",
    message: hasResendKey ? "Clé API configurée" : "Clé API manquante",
    lastChecked: new Date().toISOString(),
  });

  return checks;
};

export const getQuotaHistory = async (
  days: number = 30
): Promise<{ date: string; count: number }[]> => {
  await requireAdmin();

  const { data, error } = await db.client
    .from("google_books_quota")
    .select("date, request_count")
    .order("date", { ascending: false })
    .limit(days);

  if (error || !data) return [];

  return (data as Array<{ date: string; request_count: number }>).map((row) => ({
    date: row.date,
    count: row.request_count,
  }));
};
