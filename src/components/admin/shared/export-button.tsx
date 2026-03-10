"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type ExportButtonProps = {
  onExport: (format: "csv" | "json") => Promise<{ data: string; filename: string } | null>;
};

export const ExportButton = ({ onExport }: ExportButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: "csv" | "json") => {
    setLoading(true);
    try {
      const result = await onExport(format);
      if (!result) return;

      const blob = new Blob([result.data], {
        type: format === "csv" ? "text/csv;charset=utf-8;" : "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          <Download className="size-4" />
          {loading ? "Export..." : "Exporter"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          Exporter en CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          Exporter en JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
