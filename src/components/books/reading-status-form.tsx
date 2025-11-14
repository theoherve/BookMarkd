"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { updateReadingStatus } from "@/server/actions/book";

type ReadingStatus = "to_read" | "reading" | "finished";

type ReadingStatusFormProps = {
  bookId: string;
  currentStatus?: ReadingStatus | null;
};

const statusOptions: Array<{ value: ReadingStatus; label: string }> = [
  { value: "to_read", label: "À lire" },
  { value: "reading", label: "En cours" },
  { value: "finished", label: "Terminé" },
];

const ReadingStatusForm = ({
  bookId,
  currentStatus,
}: ReadingStatusFormProps) => {
  const [isPending, startTransition] = useTransition();
  const handleUpdate = (status: ReadingStatus) => {
    startTransition(() => {
      updateReadingStatus(bookId, status);
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Statut de lecture
      </p>
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <Button
            key={option.value}
            variant={currentStatus === option.value ? "default" : "outline"}
            disabled={isPending}
            onClick={() => handleUpdate(option.value)}
            aria-pressed={currentStatus === option.value}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ReadingStatusForm;

