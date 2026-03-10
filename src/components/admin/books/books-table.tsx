"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTablePagination } from "@/components/admin/shared/data-table-pagination";
import { ExportButton } from "@/components/admin/shared/export-button";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { EmptyState } from "@/components/admin/shared/empty-state";
import { deleteBook } from "@/server/actions/admin/books";
import { exportData } from "@/server/actions/admin/export";
import {
  DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, BookOpen, Trash2, Star } from "lucide-react";
import type { AdminBook } from "@/types/admin";

type BooksTableProps = {
  books: AdminBook[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  currentSearch: string;
};

export const BooksTable = ({ books, total, page, pageSize, totalPages, currentSearch }: BooksTableProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val) params.set(key, val);
      else params.delete(key);
    }
    startTransition(() => router.push(`/admin/books?${params.toString()}`));
  };

  const handleSearch = () => updateParams({ search: search || undefined, page: undefined });
  const handlePageChange = (p: number) => updateParams({ page: String(p) });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteBook(deleteTarget.id);
    setDeleteTarget(null);
    router.refresh();
  };

  const handleExport = async (format: "csv" | "json") => {
    const result = await exportData("books", format);
    if (!result.success) return null;
    return { data: result.data, filename: result.filename };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher un livre..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="pl-8" />
        </div>
        <Button variant="outline" size="sm" onClick={handleSearch} disabled={isPending}>Rechercher</Button>
        <div className="ml-auto"><ExportButton onExport={handleExport} /></div>
      </div>

      {books.length === 0 ? (
        <EmptyState icon={BookOpen} title="Aucun livre trouvé" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Livre</TableHead>
              <TableHead className="hidden md:table-cell">Auteur</TableHead>
              <TableHead className="hidden sm:table-cell text-center">Lecteurs</TableHead>
              <TableHead className="hidden sm:table-cell text-center">Avis</TableHead>
              <TableHead className="hidden lg:table-cell text-center">Note</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.map((book) => (
              <TableRow key={book.id}>
                <TableCell>
                  <Link href={`/admin/books/${book.id}`} className="flex items-center gap-3 hover:underline">
                    {book.coverUrl ? (
                      <Image src={book.coverUrl} alt="" width={32} height={48} className="rounded-sm object-cover" />
                    ) : (
                      <div className="flex size-8 items-center justify-center rounded-sm bg-muted"><BookOpen className="size-4 text-muted-foreground" /></div>
                    )}
                    <div>
                      <div className="font-medium line-clamp-1">{book.title}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{book.author}</div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{book.author}</TableCell>
                <TableCell className="hidden sm:table-cell text-center text-sm">{book.readersCount}</TableCell>
                <TableCell className="hidden sm:table-cell text-center text-sm">{book.reviewsCount}</TableCell>
                <TableCell className="hidden lg:table-cell text-center text-sm">
                  {book.averageRating > 0 ? (
                    <span className="flex items-center justify-center gap-1"><Star className="size-3 fill-chart-4 text-chart-4" />{book.averageRating.toFixed(1)}</span>
                  ) : "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenuRoot>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.preventDefault(); router.push(`/admin/books/${book.id}`); }}>Voir le détail</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.preventDefault(); setDeleteTarget({ id: book.id, title: book.title }); }}>
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

      <DataTablePagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={handlePageChange} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Supprimer le livre"
        description={`Voulez-vous supprimer "${deleteTarget?.title ?? ""}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
};
