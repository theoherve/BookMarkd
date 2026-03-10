"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTablePagination } from "@/components/admin/shared/data-table-pagination";
import { ExportButton } from "@/components/admin/shared/export-button";
import { EmptyState } from "@/components/admin/shared/empty-state";
import { exportData } from "@/server/actions/admin/export";
import { Search, Mail } from "lucide-react";
import type { AdminEmailLog } from "@/types/admin";

type EmailLogsTableProps = {
  logs: AdminEmailLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  currentSearch: string;
};

const STATUS_VARIANTS: Record<string, "default" | "destructive" | "secondary"> = {
  sent: "default",
  failed: "destructive",
  bounced: "secondary",
};

export const EmailLogsTable = ({ logs, total, page, pageSize, totalPages, currentSearch }: EmailLogsTableProps) => {
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
    startTransition(() => router.push(`/admin/emails?${params.toString()}`));
  };

  const handleExport = async (format: "csv" | "json") => {
    const result = await exportData("email_logs", format);
    if (!result.success) return null;
    return { data: result.data, filename: result.filename };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par email..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && updateParams({ search: search || undefined, page: undefined })} className="pl-8" />
        </div>
        <Button variant="outline" size="sm" onClick={() => updateParams({ search: search || undefined, page: undefined })} disabled={isPending}>Rechercher</Button>
        <div className="ml-auto"><ExportButton onExport={handleExport} /></div>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={Mail} title="Aucun email enregistré" description="Les emails envoyés apparaîtront ici." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Destinataire</TableHead>
              <TableHead className="hidden md:table-cell">Sujet</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="hidden lg:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell><Badge variant="secondary" className="text-[10px]">{log.emailType}</Badge></TableCell>
                <TableCell className="text-sm">{log.recipientEmail}</TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground line-clamp-1">{log.subject}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[log.status] ?? "outline"} className="text-[10px]">
                    {log.status === "sent" ? "Envoyé" : log.status === "failed" ? "Échoué" : "Rebond"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <DataTablePagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={(p) => updateParams({ page: String(p) })} />
    </div>
  );
};
