"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

type DataTablePaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export const DataTablePagination = ({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: DataTablePaginationProps) => {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-2 py-3">
      <p className="text-xs text-muted-foreground">
        {total > 0 ? `${from}–${to} sur ${total}` : "Aucun résultat"}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="px-2 text-xs text-muted-foreground">
          {page} / {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
};
