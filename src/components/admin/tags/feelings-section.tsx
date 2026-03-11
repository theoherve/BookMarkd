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
import { createAdminFeeling, renameFeeling, deleteFeeling } from "@/server/actions/admin/feelings";
import { Plus, Trash2, Edit2, AlertTriangle, BookOpen } from "lucide-react";
import type { AdminFeeling } from "@/types/admin";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

type AdminFeelingsSectionProps = {
  feelings: AdminFeeling[];
  orphanedFeelings: AdminFeeling[];
};

export const AdminFeelingsSection = ({ feelings, orphanedFeelings }: AdminFeelingsSectionProps) => {
  const router = useRouter();
  const [newLabel, setNewLabel] = useState("");
  const [editingFeeling, setEditingFeeling] = useState<{ id: string; label: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminFeeling | null>(null);

  const handleCreate = async () => {
    if (!newLabel.trim()) return;
    await createAdminFeeling(newLabel.trim());
    setNewLabel("");
    router.refresh();
  };

  const handleRename = async () => {
    if (!editingFeeling || !editingFeeling.label.trim()) return;
    await renameFeeling(editingFeeling.id, editingFeeling.label.trim());
    setEditingFeeling(null);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteFeeling(deleteTarget.id);
    setDeleteTarget(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ressentis ({feelings.length})</h2>
        <div className="flex items-center gap-2">
          <Input placeholder="Nouveau ressenti..." value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} className="w-48" />
          <Button size="sm" onClick={handleCreate} disabled={!newLabel.trim()}>
            <Plus className="mr-1 size-4" /> Ajouter
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-center">Utilisations</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {feelings.map((f) => (
            <TableRow key={f.id}>
              <TableCell>
                {editingFeeling?.id === f.id ? (
                  <Input value={editingFeeling.label} onChange={(e) => setEditingFeeling({ ...editingFeeling, label: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleRename()} onBlur={handleRename} className="h-7 w-48" autoFocus />
                ) : (
                  <span className="font-medium">{f.label}</span>
                )}
              </TableCell>
              <TableCell><Badge variant={f.source === "admin" ? "default" : "secondary"} className="text-[10px]">{f.source}</Badge></TableCell>
              <TableCell className="text-center">
                {f.books.length > 0 ? (
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <button className="mx-auto">
                        <Badge variant="secondary" className="underline decoration-dotted underline-offset-4 cursor-pointer">{f.usageCount}</Badge>
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-72" side="left">
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          Livres avec le ressenti &quot;{f.label}&quot; ({f.books.length})
                        </p>
                        <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                          {f.books.slice(0, 10).map((book) => (
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
                        {f.books.length > 10 && (
                          <p className="text-[10px] text-muted-foreground text-center">+{f.books.length - 10} autres livres</p>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ) : (
                  <Badge variant="secondary">{f.usageCount}</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditingFeeling({ id: f.id, label: f.label })}><Edit2 className="size-3" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(f)}><Trash2 className="size-3" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {orphanedFeelings.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-yellow-600">
              <AlertTriangle className="size-4" /> Ressentis orphelins ({orphanedFeelings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {orphanedFeelings.map((f) => (
                <Badge key={f.id} variant="outline" className="gap-1">
                  {f.label}
                  <button onClick={() => setDeleteTarget(f)} className="ml-1 hover:text-destructive"><Trash2 className="size-3" /></button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Supprimer le ressenti"
        description={`Supprimer "${deleteTarget?.label}" ? Les associations existantes seront perdues.`}
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
};
