"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, Trash2, Archive, Pencil, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EditorialTypeBadge, EditorialSourceBadge } from "./editorial-list-type-badge";
import {
  publishEditorialList,
  unpublishEditorialList,
  archiveEditorialList,
  deleteEditorialList,
} from "@/server/actions/admin/editorial";
import type { AdminEditorialList } from "@/types/editorial";

const STATUS_LABELS: Record<AdminEditorialList["status"], { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  published: { label: "Publié", className: "bg-green-100 text-green-800 border-green-200" },
  archived: { label: "Archivé", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

type Props = {
  lists: AdminEditorialList[];
  total: number;
};

export const EditorialListsTable = ({ lists, total }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [actionListId, setActionListId] = useState<string | null>(null);

  const handlePublish = (id: string) => {
    setActionListId(id);
    startTransition(async () => {
      await publishEditorialList(id);
      setActionListId(null);
    });
  };

  const handleUnpublish = (id: string) => {
    setActionListId(id);
    startTransition(async () => {
      await unpublishEditorialList(id);
      setActionListId(null);
    });
  };

  const handleArchive = (id: string) => {
    setActionListId(id);
    startTransition(async () => {
      await archiveEditorialList(id);
      setActionListId(null);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteEditorialList(id);
    });
  };

  if (lists.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 px-4 py-12 text-center text-sm text-muted-foreground">
        Aucune liste éditoriale. Créez-en une ou attendez le prochain polling NY Times.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{total} liste{total > 1 ? "s" : ""} au total</p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Livres</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lists.map((list) => {
              const statusConfig = STATUS_LABELS[list.status];
              const isLoading = isPending && actionListId === list.id;

              return (
                <TableRow key={list.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-medium text-sm leading-tight">{list.title}</p>
                      {list.weekDate && (
                        <p className="text-xs text-muted-foreground">
                          Semaine du {new Date(list.weekDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <EditorialTypeBadge type={list.type} />
                  </TableCell>
                  <TableCell>
                    <EditorialSourceBadge source={list.source} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusConfig.className}>
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {list.bookCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <Link href={`/admin/tendances/${list.id}`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>

                      {list.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700"
                          onClick={() => handlePublish(list.id)}
                          disabled={isLoading}
                          title="Publier"
                        >
                          <CheckCircle className="size-4" />
                        </Button>
                      )}

                      {list.status === "published" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUnpublish(list.id)}
                            disabled={isLoading}
                            title="Dépublier"
                          >
                            <EyeOff className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => handleArchive(list.id)}
                            disabled={isLoading}
                            title="Archiver"
                          >
                            <Archive className="size-4" />
                          </Button>
                        </>
                      )}

                      {list.status === "archived" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700"
                          onClick={() => handlePublish(list.id)}
                          disabled={isLoading}
                          title="Republier"
                        >
                          <Eye className="size-4" />
                        </Button>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            disabled={isPending}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer la liste ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. La liste &ldquo;{list.title}&rdquo; et tous ses livres seront définitivement supprimés.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(list.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
