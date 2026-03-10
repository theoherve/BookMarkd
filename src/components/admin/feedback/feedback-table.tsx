"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTablePagination } from "@/components/admin/shared/data-table-pagination";
import { EmptyState } from "@/components/admin/shared/empty-state";
import { ExportButton } from "@/components/admin/shared/export-button";
import { updateFeedbackStatus } from "@/server/actions/feedback";
import { exportData } from "@/server/actions/admin/export";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MessageSquare } from "lucide-react";
import type { FeedbackWithUser, FeedbackStatus } from "@/types/feedback";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  reviewed: "Examiné",
  resolved: "Résolu",
  rejected: "Rejeté",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  reviewed: "secondary",
  resolved: "default",
  rejected: "destructive",
};

type FeedbackAdminTableProps = {
  feedbacks: FeedbackWithUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  currentSearch: string;
  currentStatus: string;
  currentType: string;
};

export const FeedbackAdminTable = ({
  feedbacks, total, page, pageSize, totalPages, currentSearch, currentStatus, currentType,
}: FeedbackAdminTableProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val) params.set(key, val);
      else params.delete(key);
    }
    startTransition(() => router.push(`/admin/feedback?${params.toString()}`));
  };

  const handleStatusChange = async (feedbackId: string, status: FeedbackStatus) => {
    await updateFeedbackStatus(feedbackId, status);
    router.refresh();
  };

  const handleExport = async (format: "csv" | "json") => {
    const result = await exportData("feedback", format);
    if (!result.success) return null;
    return { data: result.data, filename: result.filename };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && updateParams({ search: search || undefined, page: undefined })} className="pl-8" />
        </div>
        <Select value={currentStatus || "all"} onValueChange={(v) => updateParams({ status: v === "all" ? undefined : v, page: undefined })}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="reviewed">Examiné</SelectItem>
            <SelectItem value="resolved">Résolu</SelectItem>
            <SelectItem value="rejected">Rejeté</SelectItem>
          </SelectContent>
        </Select>
        <Select value={currentType || "all"} onValueChange={(v) => updateParams({ type: v === "all" ? undefined : v, page: undefined })}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
            <SelectItem value="suggestion">Suggestion</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => updateParams({ search: search || undefined, page: undefined })} disabled={isPending}>Filtrer</Button>
        <div className="ml-auto"><ExportButton onExport={handleExport} /></div>
      </div>

      {feedbacks.length === 0 ? (
        <EmptyState icon={MessageSquare} title="Aucun feedback trouvé" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Utilisateur</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="hidden lg:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedbacks.map((fb) => (
              <TableRow key={fb.id}>
                <TableCell>
                  <div className="font-medium line-clamp-1">{fb.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1 md:hidden">{fb.type === "bug" ? "Bug" : "Suggestion"}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant={fb.type === "bug" ? "destructive" : "secondary"} className="text-[10px]">{fb.type === "bug" ? "Bug" : "Suggestion"}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{fb.userDisplayName}</TableCell>
                <TableCell>
                  <Select value={fb.status} onValueChange={(v) => handleStatusChange(fb.id, v as FeedbackStatus)}>
                    <SelectTrigger className="h-7 w-[120px] text-xs">
                      <Badge variant={STATUS_VARIANTS[fb.status] ?? "outline"} className="text-[10px]">{STATUS_LABELS[fb.status] ?? fb.status}</Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="reviewed">Examiné</SelectItem>
                      <SelectItem value="resolved">Résolu</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{new Date(fb.createdAt).toLocaleDateString("fr-FR")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <DataTablePagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={(p) => updateParams({ page: String(p) })} />
    </div>
  );
};
