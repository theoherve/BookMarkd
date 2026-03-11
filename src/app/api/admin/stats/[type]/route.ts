import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import db from "@/lib/supabase/db";

export const dynamic = "force-dynamic";

type DetailItem = {
  id: string;
  primary: string;
  secondary?: string;
  meta?: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  href?: string;
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const session = await getCurrentSession();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await params;
  let items: DetailItem[] = [];

  try {
    switch (type) {
      case "users": {
        const { data } = await db.client
          .from("users")
          .select("id, email, username, display_name, avatar_url, created_at")
          .order("created_at", { ascending: false })
          .limit(10);

        items = (data ?? []).map((u: Record<string, unknown>) => ({
          id: u.id as string,
          primary: (u.display_name as string) ?? (u.username as string) ?? (u.email as string),
          secondary: u.email as string,
          meta: formatDate(u.created_at as string),
          avatarUrl: u.avatar_url as string | null,
          href: `/admin/users/${u.id}`,
        }));
        break;
      }

      case "active-users": {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: activities } = await db.client
          .from("activities")
          .select("user_id, created_at")
          .gte("created_at", thirtyDaysAgo)
          .order("created_at", { ascending: false });

        const userLastActivity = new Map<string, string>();
        for (const a of (activities ?? []) as Array<{ user_id: string; created_at: string }>) {
          if (!userLastActivity.has(a.user_id)) {
            userLastActivity.set(a.user_id, a.created_at);
          }
        }

        const topUserIds = Array.from(userLastActivity.entries())
          .sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime())
          .slice(0, 10)
          .map(([id]) => id);

        if (topUserIds.length > 0) {
          const { data: users } = await db.client
            .from("users")
            .select("id, display_name, username, email, avatar_url")
            .in("id", topUserIds);

          const userMap = new Map(
            (users ?? []).map((u: Record<string, unknown>) => [u.id as string, u]),
          );

          items = topUserIds
            .map((userId) => {
              const u = userMap.get(userId) as Record<string, unknown> | undefined;
              if (!u) return null;
              return {
                id: userId,
                primary: (u.display_name as string) ?? (u.username as string) ?? (u.email as string),
                secondary: u.email as string,
                meta: `Actif le ${formatDate(userLastActivity.get(userId)!)}`,
                avatarUrl: u.avatar_url as string | null,
                href: `/admin/users/${userId}`,
              };
            })
            .filter(Boolean) as DetailItem[];
        }
        break;
      }

      case "new-today": {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data } = await db.client
          .from("users")
          .select("id, email, username, display_name, avatar_url, created_at")
          .gte("created_at", today.toISOString())
          .order("created_at", { ascending: false })
          .limit(10);

        items = (data ?? []).map((u: Record<string, unknown>) => ({
          id: u.id as string,
          primary: (u.display_name as string) ?? (u.username as string) ?? (u.email as string),
          secondary: u.email as string,
          meta: new Date(u.created_at as string).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          avatarUrl: u.avatar_url as string | null,
          href: `/admin/users/${u.id}`,
        }));
        break;
      }

      case "new-week": {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const { data } = await db.client
          .from("users")
          .select("id, email, username, display_name, avatar_url, created_at")
          .gte("created_at", startOfWeek.toISOString())
          .order("created_at", { ascending: false })
          .limit(10);

        items = (data ?? []).map((u: Record<string, unknown>) => ({
          id: u.id as string,
          primary: (u.display_name as string) ?? (u.username as string) ?? (u.email as string),
          secondary: u.email as string,
          meta: formatDate(u.created_at as string),
          avatarUrl: u.avatar_url as string | null,
          href: `/admin/users/${u.id}`,
        }));
        break;
      }

      case "books": {
        const { data } = await db.client
          .from("books")
          .select("id, title, author, cover_url, created_at")
          .order("created_at", { ascending: false })
          .limit(10);

        items = (data ?? []).map((b: Record<string, unknown>) => ({
          id: b.id as string,
          primary: b.title as string,
          secondary: b.author as string,
          meta: formatDate(b.created_at as string),
          coverUrl: b.cover_url as string | null,
          href: `/admin/books/${b.id}`,
        }));
        break;
      }

      case "scanned-books": {
        const { data } = await db.client
          .from("books")
          .select("id, title, author, cover_url, created_at")
          .eq("source", "scan")
          .order("created_at", { ascending: false })
          .limit(10);

        items = (data ?? []).map((b: Record<string, unknown>) => ({
          id: b.id as string,
          primary: b.title as string,
          secondary: b.author as string,
          meta: formatDate(b.created_at as string),
          coverUrl: b.cover_url as string | null,
          href: `/admin/books/${b.id}`,
        }));
        break;
      }

      case "reviews": {
        const { data: reviewsData } = await db.client
          .from("reviews")
          .select("id, user_id, title, content, created_at, books(id, title, author, cover_url)")
          .order("created_at", { ascending: false })
          .limit(10);

        const rows = (reviewsData ?? []) as unknown as Array<{
          id: string;
          user_id: string;
          title: string | null;
          content: string;
          created_at: string;
          books: { id: string; title: string; author: string; cover_url: string | null } | Array<{ id: string; title: string; author: string; cover_url: string | null }> | null;
        }>;

        const userIds = [...new Set(rows.map((r) => r.user_id))];
        const { data: users } = userIds.length > 0
          ? await db.client.from("users").select("id, display_name").in("id", userIds)
          : { data: [] };

        const usersById = new Map(
          (users ?? []).map((u: Record<string, unknown>) => [u.id as string, u.display_name as string | null]),
        );

        items = rows.map((r) => {
          const book = Array.isArray(r.books) ? r.books[0] : r.books;
          const userName = usersById.get(r.user_id) ?? "Utilisateur";
          const snippet = r.title ?? r.content?.slice(0, 60) ?? "";
          return {
            id: r.id,
            primary: book?.title ?? "Livre inconnu",
            secondary: `${userName} · ${snippet}`,
            meta: formatDate(r.created_at),
            coverUrl: book?.cover_url ?? null,
          };
        });
        break;
      }

      case "lists": {
        const { data: listsData } = await db.client
          .from("lists")
          .select("id, title, owner_id, created_at")
          .order("created_at", { ascending: false })
          .limit(10);

        const rows = (listsData ?? []) as Array<{
          id: string;
          title: string;
          owner_id: string;
          created_at: string;
        }>;

        const listIds = rows.map((l) => l.id);
        const ownerIds = [...new Set(rows.map((l) => l.owner_id))];

        const [ownersResult, itemsResult] = await Promise.all([
          ownerIds.length > 0
            ? db.client.from("users").select("id, display_name").in("id", ownerIds)
            : Promise.resolve({ data: [] }),
          listIds.length > 0
            ? db.client.from("list_items").select("list_id").in("list_id", listIds)
            : Promise.resolve({ data: [] }),
        ]);

        const ownersById = new Map(
          (ownersResult.data ?? []).map((u: Record<string, unknown>) => [
            u.id as string,
            u.display_name as string | null,
          ]),
        );

        const itemCountByList = new Map<string, number>();
        for (const item of (itemsResult.data ?? []) as Array<{ list_id: string }>) {
          itemCountByList.set(item.list_id, (itemCountByList.get(item.list_id) ?? 0) + 1);
        }

        items = rows.map((l) => {
          const count = itemCountByList.get(l.id) ?? 0;
          return {
            id: l.id,
            primary: l.title,
            secondary: ownersById.get(l.owner_id) ?? "Utilisateur",
            meta: `${count} livre${count > 1 ? "s" : ""} · ${formatDate(l.created_at)}`,
          };
        });
        break;
      }

      case "pending-feedbacks": {
        const { data: feedbacksData } = await db.client
          .from("feedbacks")
          .select("id, user_id, type, title, description, created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(10);

        const rows = (feedbacksData ?? []) as Array<{
          id: string;
          user_id: string;
          type: string;
          title: string | null;
          description: string | null;
          created_at: string;
        }>;

        const userIds = [...new Set(rows.map((r) => r.user_id))];
        const { data: users } = userIds.length > 0
          ? await db.client.from("users").select("id, display_name, email").in("id", userIds)
          : { data: [] };

        const usersById = new Map(
          (users ?? []).map((u: Record<string, unknown>) => [
            u.id as string,
            { name: u.display_name as string | null, email: u.email as string | null },
          ]),
        );

        items = rows.map((f) => {
          const user = usersById.get(f.user_id);
          return {
            id: f.id,
            primary: user?.name ?? user?.email ?? "Utilisateur",
            secondary: f.title ?? f.description?.slice(0, 80) ?? "",
            meta: formatDate(f.created_at),
            href: `/admin/feedback`,
          };
        });
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error(`[admin/stats/${type}] Error:`, error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
