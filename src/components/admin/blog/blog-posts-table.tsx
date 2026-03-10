"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTablePagination } from "@/components/admin/shared/data-table-pagination";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { EmptyState } from "@/components/admin/shared/empty-state";
import { deleteBlogPost } from "@/server/actions/admin/blog";
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, FileText, Trash2, Edit2 } from "lucide-react";
import type { AdminBlogPost } from "@/types/admin";

const STATUS_LABELS: Record<string, string> = { draft: "Brouillon", published: "Publié", archived: "Archivé" };
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = { draft: "outline", published: "default", archived: "secondary" };

type BlogPostsTableProps = {
  posts: AdminBlogPost[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  currentSearch: string;
};

export const BlogPostsTable = ({ posts, total, page, pageSize, totalPages, currentSearch }: BlogPostsTableProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val) params.set(key, val); else params.delete(key);
    }
    startTransition(() => router.push(`/admin/blog?${params.toString()}`));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteBlogPost(deleteTarget.id);
    setDeleteTarget(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher un article..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && updateParams({ search: search || undefined, page: undefined })} className="pl-8" />
        </div>
        <Button variant="outline" size="sm" onClick={() => updateParams({ search: search || undefined, page: undefined })} disabled={isPending}>Rechercher</Button>
      </div>

      {posts.length === 0 ? (
        <EmptyState icon={FileText} title="Aucun article trouvé" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead className="hidden md:table-cell">Slug</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="hidden lg:table-cell">Publié le</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{post.slug}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[post.status] ?? "outline"} className="text-[10px]">{STATUS_LABELS[post.status] ?? post.status}</Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("fr-FR") : "—"}</TableCell>
                <TableCell>
                  <DropdownMenuRoot>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.preventDefault(); router.push(`/admin/blog/${post.id}/edit`); }}>
                        <Edit2 className="mr-2 size-4" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.preventDefault(); setDeleteTarget({ id: post.id, title: post.title }); }}>
                        <Trash2 className="mr-2 size-4" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenuRoot>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <DataTablePagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={(p) => updateParams({ page: String(p) })} />

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Supprimer l'article" description={`Supprimer "${deleteTarget?.title}" ? Cette action est irréversible.`} confirmLabel="Supprimer" variant="destructive" onConfirm={handleDelete} />
    </div>
  );
};
