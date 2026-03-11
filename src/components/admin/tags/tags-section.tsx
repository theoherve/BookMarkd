"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { createTag, renameTag, deleteTag } from "@/server/actions/admin/tags";
import { Plus, Trash2, Edit2, AlertTriangle, BookOpen } from "lucide-react";
import type { AdminTag } from "@/types/admin";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

type AdminTagsSectionProps = {
  tags: AdminTag[];
  orphanedTags: AdminTag[];
};

export const AdminTagsSection = ({ tags, orphanedTags }: AdminTagsSectionProps) => {
  const router = useRouter();
  const [newTagName, setNewTagName] = useState("");
  const [editingTag, setEditingTag] = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminTag | null>(null);

  const handleCreate = async () => {
    if (!newTagName.trim()) return;
    await createTag(newTagName.trim());
    setNewTagName("");
    router.refresh();
  };

  const handleRename = async () => {
    if (!editingTag || !editingTag.name.trim()) return;
    await renameTag(editingTag.id, editingTag.name.trim());
    setEditingTag(null);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteTag(deleteTarget.id);
    setDeleteTarget(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tags ({tags.length})</h2>
        <div className="flex items-center gap-2">
          <Input placeholder="Nouveau tag..." value={newTagName} onChange={(e) => setNewTagName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} className="w-48" />
          <Button size="sm" onClick={handleCreate} disabled={!newTagName.trim()}>
            <Plus className="mr-1 size-4" /> Ajouter
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead className="text-center">Livres</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags.map((tag) => (
            <TableRow key={tag.id}>
              <TableCell>
                {editingTag?.id === tag.id ? (
                  <Input value={editingTag.name} onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleRename()} onBlur={handleRename} className="h-7 w-48" autoFocus />
                ) : (
                  <span className="font-medium">{tag.name}</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{tag.slug}</TableCell>
              <TableCell className="text-center">
                {tag.books.length > 0 ? (
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <button className="mx-auto">
                        <Badge variant="secondary" className="underline decoration-dotted underline-offset-4 cursor-pointer">{tag.booksCount}</Badge>
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-72" side="left">
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          Livres avec le tag &quot;{tag.name}&quot; ({tag.booksCount})
                        </p>
                        <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                          {tag.books.slice(0, 10).map((book) => (
                            <div key={book.id} className="flex gap-2">
                              {book.coverUrl ? (
                                <Image src={book.coverUrl} alt={book.title} width={28} height={40} className="h-10 w-7 shrink-0 rounded object-cover" />
                              ) : (
                                <div className="flex h-10 w-7 shrink-0 items-center justify-center rounded bg-muted">
                                  <BookOpen className="size-3 text-muted-foreground" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium">{book.title}</p>
                                <p className="truncate text-[10px] text-muted-foreground">{book.author}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {tag.booksCount > 10 && (
                          <p className="text-[10px] text-muted-foreground text-center">+{tag.booksCount - 10} autres livres</p>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ) : (
                  <Badge variant="secondary">{tag.booksCount}</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditingTag({ id: tag.id, name: tag.name })}><Edit2 className="size-3" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(tag)}><Trash2 className="size-3" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {orphanedTags.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-yellow-600">
              <AlertTriangle className="size-4" /> Tags orphelins ({orphanedTags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {orphanedTags.map((tag) => (
                <Badge key={tag.id} variant="outline" className="gap-1">
                  {tag.name}
                  <button onClick={() => setDeleteTarget(tag)} className="ml-1 hover:text-destructive"><Trash2 className="size-3" /></button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Supprimer le tag"
        description={`Supprimer le tag "${deleteTarget?.name}" ? Les livres associés perdront ce tag.`}
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
};
