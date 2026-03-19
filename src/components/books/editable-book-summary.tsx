"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { updateBookMetadata } from "@/server/actions/admin/books";

type EditableBookSummaryProps = {
  bookId: string;
  summary: string | null;
};

const PLACEHOLDER =
  "Pas encore de résumé sur BookMarkd. Ajoutez votre avis après lecture pour aider la communauté.";

const EditableBookSummary = ({ bookId, summary }: EditableBookSummaryProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(summary ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setValue(summary ?? "");
      setErrorMessage(null);
    }
    setOpen(nextOpen);
  };

  const handleSubmit = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await updateBookMetadata(bookId, {
        summary: value.trim() || null,
      });

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="group relative cursor-pointer rounded-md p-2 -m-2 transition-colors hover:bg-muted/60"
        aria-label="Modifier le résumé"
      >
        <p className="text-sm leading-6 text-muted-foreground">
          {summary ?? PLACEHOLDER}
        </p>
        <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le résumé</DialogTitle>
            <DialogDescription>
              Modifiez le résumé de ce livre. Laissez vide pour supprimer le résumé.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Résumé du livre…"
              rows={8}
              disabled={isPending}
              className="resize-y"
            />
            {errorMessage ? (
              <p role="alert" className="text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditableBookSummary;
