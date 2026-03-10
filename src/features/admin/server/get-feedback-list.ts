import { unstable_noStore as noStore } from "next/cache";
import db from "@/lib/supabase/db";
import type { AdminPaginationParams, PaginatedResult } from "@/types/admin";
import type { FeedbackWithUser, FeedbackType } from "@/types/feedback";

export const getFeedbackList = async (
  params: AdminPaginationParams & { status?: string; type?: string }
): Promise<PaginatedResult<FeedbackWithUser>> => {
  noStore();

  const { page = 1, pageSize = 20, search, sortBy = "created_at", sortOrder = "desc", status, type } = params;
  const offset = (page - 1) * pageSize;

  let query = db.client
    .from("feedbacks")
    .select("id, user_id, type, title, description, browser_info, url, status, created_at, updated_at", { count: "exact" });

  if (status) query = query.eq("status", status);
  if (type) query = query.eq("type", type);
  if (search) query = query.ilike("title", `%${search}%`);

  query = query.order(sortBy, { ascending: sortOrder === "asc" }).range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error("[admin/feedback] Error:", error);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const rows = data ?? [];
  const userIds = [...new Set(rows.map((r: { user_id: string }) => r.user_id))];
  const { data: users } = userIds.length > 0
    ? await db.client.from("users").select("id, display_name, email, username").in("id", userIds)
    : { data: [] };

  const usersById = new Map<string, { display_name: string | null; email: string | null; username: string | null }>();
  for (const u of users ?? []) {
    usersById.set(u.id, { display_name: u.display_name, email: u.email, username: u.username });
  }

  const total = count ?? 0;
  const feedbacks: FeedbackWithUser[] = rows.map((row: Record<string, unknown>) => {
    const uid = row.user_id as string;
    const u = usersById.get(uid) ?? { display_name: null, email: null, username: null };
    return {
      id: row.id as string,
      userId: uid,
      type: row.type as FeedbackType,
      title: row.title as string,
      description: row.description as string,
      browserInfo: row.browser_info as FeedbackWithUser["browserInfo"],
      url: row.url as string | null,
      status: row.status as FeedbackWithUser["status"],
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      userDisplayName: u.display_name ?? "—",
      userEmail: u.email ?? "—",
      username: u.username ?? null,
    };
  });

  return { data: feedbacks, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
};
