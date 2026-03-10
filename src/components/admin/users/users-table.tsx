"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTablePagination } from "@/components/admin/shared/data-table-pagination";
import { ExportButton } from "@/components/admin/shared/export-button";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { EmptyState } from "@/components/admin/shared/empty-state";
import { toggleUserAdmin, disableUserAccount, enableUserAccount, deleteUserAccount } from "@/server/actions/admin/users";
import { exportData } from "@/server/actions/admin/export";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Users, Shield, ShieldOff, UserX, UserCheck, BookOpen, Trash2 } from "lucide-react";
import type { AdminUser } from "@/types/admin";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import Link from "next/link";

type UsersTableProps = {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  currentSearch: string;
};

export const UsersTable = ({
  users,
  total,
  page,
  pageSize,
  totalPages,
  currentSearch,
}: UsersTableProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);
  const [confirmAction, setConfirmAction] = useState<{
    type: "admin" | "disable" | "enable" | "delete";
    userId: string;
    userName: string;
    makeAdmin?: boolean;
  } | null>(null);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  const handleSearch = () => {
    updateParams({ search: search || undefined, page: undefined });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: String(newPage) });
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    if (confirmAction.type === "admin") {
      await toggleUserAdmin(confirmAction.userId, confirmAction.makeAdmin ?? false);
    } else if (confirmAction.type === "disable") {
      await disableUserAccount(confirmAction.userId);
    } else if (confirmAction.type === "delete") {
      await deleteUserAccount(confirmAction.userId);
    } else {
      await enableUserAccount(confirmAction.userId);
    }
    setConfirmAction(null);
    router.refresh();
  };

  const handleExport = async (format: "csv" | "json") => {
    const result = await exportData("users", format);
    if (!result.success) return null;
    return { data: result.data, filename: result.filename };
  };

  return (
    <div className="space-y-4">
      {/* Search + Export */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleSearch} disabled={isPending}>
          Rechercher
        </Button>
        <div className="ml-auto">
          <ExportButton onExport={handleExport} />
        </div>
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <EmptyState icon={Users} title="Aucun utilisateur trouvé" description="Modifiez vos critères de recherche." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Statut</TableHead>
              <TableHead className="hidden sm:table-cell text-center">Livres</TableHead>
              <TableHead className="hidden sm:table-cell text-center">Avis</TableHead>
              <TableHead className="hidden lg:table-cell">Inscrit le</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Link href={`/admin/users/${user.id}`} className="hover:underline">
                    <div className="font-medium">{user.displayName}</div>
                    {user.username && (
                      <div className="text-xs text-muted-foreground">@{user.username}</div>
                    )}
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex gap-1">
                    {user.isAdmin && <Badge variant="default" className="text-[10px]">Admin</Badge>}
                    {user.disabledAt && <Badge variant="destructive" className="text-[10px]">Désactivé</Badge>}
                    {!user.isAdmin && !user.disabledAt && <Badge variant="secondary" className="text-[10px]">Actif</Badge>}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-center text-sm">{user.booksCount}</TableCell>
                <TableCell className="hidden sm:table-cell text-center text-sm">
                  {user.reviews.length > 0 ? (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <button className="mx-auto flex items-center gap-1 underline decoration-dotted underline-offset-4 hover:text-foreground transition-colors">
                          {user.reviewsCount}
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80" side="left">
                        <div className="space-y-3">
                          <p className="text-xs font-medium text-muted-foreground">
                            Avis ({user.reviewsCount})
                          </p>
                          <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
                            {user.reviews.slice(0, 10).map((review) => (
                              <div key={review.id} className="flex gap-2">
                                {review.bookCoverUrl ? (
                                  <img
                                    src={review.bookCoverUrl}
                                    alt={review.bookTitle}
                                    className="h-12 w-8 shrink-0 rounded object-cover"
                                  />
                                ) : (
                                  <div className="flex h-12 w-8 shrink-0 items-center justify-center rounded bg-muted">
                                    <BookOpen className="size-3 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-medium">
                                    {review.bookTitle}
                                  </p>
                                  <p className="truncate text-[10px] text-muted-foreground">
                                    {review.bookAuthor}
                                  </p>
                                  <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                                    {review.title ? <span className="font-medium">{review.title} — </span> : null}
                                    {review.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          {user.reviewsCount > 10 && (
                            <p className="text-[10px] text-muted-foreground text-center">
                              +{user.reviewsCount - 10} autres avis
                            </p>
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  ) : (
                    <span className="text-muted-foreground">{user.reviewsCount}</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell>
                  <DropdownMenuRoot>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/admin/users/${user.id}`);
                        }}
                      >
                        Voir le détail
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          setConfirmAction({
                            type: "admin",
                            userId: user.id,
                            userName: user.displayName,
                            makeAdmin: !user.isAdmin,
                          });
                        }}
                      >
                        {user.isAdmin ? (
                          <><ShieldOff className="mr-2 size-4" /> Révoquer admin</>
                        ) : (
                          <><Shield className="mr-2 size-4" /> Promouvoir admin</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          setConfirmAction({
                            type: user.disabledAt ? "enable" : "disable",
                            userId: user.id,
                            userName: user.displayName,
                          });
                        }}
                      >
                        {user.disabledAt ? (
                          <><UserCheck className="mr-2 size-4" /> Réactiver</>
                        ) : (
                          <><UserX className="mr-2 size-4" /> Désactiver</>
                        )}
                      </DropdownMenuItem>
                      {!user.isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.preventDefault();
                              setConfirmAction({
                                type: "delete",
                                userId: user.id,
                                userName: user.displayName,
                              });
                            }}
                          >
                            <Trash2 className="mr-2 size-4" /> Supprimer
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenuRoot>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <DataTablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={
          confirmAction?.type === "admin"
            ? confirmAction.makeAdmin ? "Promouvoir admin" : "Révoquer admin"
            : confirmAction?.type === "disable" ? "Désactiver le compte"
            : confirmAction?.type === "delete" ? "Supprimer le compte"
            : "Réactiver le compte"
        }
        description={
          confirmAction?.type === "delete"
            ? `Supprimer définitivement le compte de ${confirmAction?.userName ?? ""} ? Toutes ses données (livres, avis, listes, activités) seront supprimées. Cette action est irréversible.`
            : `Voulez-vous ${
                confirmAction?.type === "admin"
                  ? confirmAction?.makeAdmin ? "promouvoir" : "révoquer les droits admin de"
                  : confirmAction?.type === "disable" ? "désactiver le compte de" : "réactiver le compte de"
              } ${confirmAction?.userName ?? ""} ?`
        }
        variant={confirmAction?.type === "disable" || confirmAction?.type === "delete" ? "destructive" : "default"}
        onConfirm={handleConfirm}
      />
    </div>
  );
};
