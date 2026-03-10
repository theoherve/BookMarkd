import { unstable_noStore as noStore } from "next/cache";
import db from "@/lib/supabase/db";
import type { AdminEmailLog, AdminPaginationParams, PaginatedResult } from "@/types/admin";

export const getEmailLogs = async (
  params: AdminPaginationParams & { emailType?: string; status?: string }
): Promise<PaginatedResult<AdminEmailLog>> => {
  noStore();

  const { page = 1, pageSize = 20, search, sortBy = "created_at", sortOrder = "desc", emailType, status } = params;
  const offset = (page - 1) * pageSize;

  let query = db.client
    .from("email_logs")
    .select("*", { count: "exact" });

  if (emailType) query = query.eq("email_type", emailType);
  if (status) query = query.eq("status", status);
  if (search) query = query.ilike("recipient_email", `%${search}%`);

  query = query.order(sortBy, { ascending: sortOrder === "asc" }).range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error("[admin/emails] Error:", error);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const total = count ?? 0;
  const logs: AdminEmailLog[] = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    emailType: row.email_type as string,
    recipientEmail: row.recipient_email as string,
    subject: row.subject as string,
    status: row.status as "sent" | "failed" | "bounced",
    resendId: (row.resend_id as string | null) ?? null,
    errorMessage: (row.error_message as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  }));

  return { data: logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
};

export const getEmailStats = async (): Promise<{
  totalSent: number;
  totalFailed: number;
  failureRate: number;
}> => {
  noStore();

  const [sentResult, failedResult] = await Promise.all([
    db.client.from("email_logs").select("*", { count: "exact", head: true }).eq("status", "sent"),
    db.client.from("email_logs").select("*", { count: "exact", head: true }).eq("status", "failed"),
  ]);

  const sent = sentResult.count ?? 0;
  const failed = failedResult.count ?? 0;
  const total = sent + failed;

  return {
    totalSent: sent,
    totalFailed: failed,
    failureRate: total > 0 ? Math.round((failed / total) * 100) : 0,
  };
};
