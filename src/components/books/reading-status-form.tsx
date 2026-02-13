"use client";

import { useState, useTransition, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useOfflineQueue } from "@/hooks/use-offline-queue";

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
  const { queueAction } = useOfflineQueue();
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState<ReadingStatus | null>(null);
  
  // Use prop as source of truth, but allow local overrides
  const selectedStatus = useMemo(() => {
    return localStatus ?? currentStatus ?? null;
  }, [localStatus, currentStatus]);

  const handleUpdate = (status: ReadingStatus) => {
    if (status === selectedStatus) {
      return;
    }

    const previousStatus = selectedStatus;
    setLocalStatus(status);
    startTransition(async () => {
      try {
        await queueAction({
          type: "updateReadingStatus",
          bookId,
          status,
        });
      } catch (error) {
        console.error("Impossible de mettre à jour le statut :", error);
        setLocalStatus(previousStatus ?? null);
      }
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
            variant={selectedStatus === option.value ? "default" : "outline"}
            disabled={isPending}
            onClick={() => handleUpdate(option.value)}
            aria-pressed={selectedStatus === option.value}
            className={
              selectedStatus !== option.value
                ? "dark:hover:border-primary dark:hover:text-primary dark:hover:bg-primary/15"
                : undefined
            }
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ReadingStatusForm;

