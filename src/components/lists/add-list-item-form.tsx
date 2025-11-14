"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";

import type { AvailableBook } from "@/features/lists/types";

import { addBookToList } from "@/server/actions/lists";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AddListItemFormProps = {
  listId: string;
  availableBooks: AvailableBook[];
  canEdit: boolean;
};

const AddListItemForm = ({
  listId,
  availableBooks,
  canEdit,
}: AddListItemFormProps) => {
  const initialBookId = useMemo(
    () => (availableBooks.length > 0 ? availableBooks[0].id : ""),
    [availableBooks],
  );

  const [selectedBookId, setSelectedBookId] = useState(initialBookId);
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedBookId) {
      setFeedback("Sélectionnez un livre à ajouter.");
      return;
    }

    startTransition(async () => {
      setFeedback(null);
      const result = await addBookToList(listId, selectedBookId, note.trim() ? note.trim() : null);

      if (!result.success) {
        setFeedback(result.message);
        return;
      }

      setFeedback("Livre ajouté à la liste ✅");
      setNote("");
    });
  };

  const isDisabled = !canEdit || availableBooks.length === 0;

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Ajouter un livre à la liste"
      className="space-y-4 rounded-lg border border-border/60 bg-card/80 p-4"
    >
      <div className="space-y-2">
        <Label htmlFor="list-book">Livre à ajouter</Label>
        <select
          id="list-book"
          name="bookId"
          value={selectedBookId}
          disabled={isDisabled || isPending}
          onChange={(event) => setSelectedBookId(event.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {availableBooks.length === 0 ? (
            <option value="">Aucun livre disponible</option>
          ) : (
            availableBooks.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} — {book.author}
              </option>
            ))
          )}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="list-note">Note (facultatif)</Label>
        <Textarea
          id="list-note"
          name="note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Ajoutez un mot d’ordre, une consigne de lecture..."
          disabled={isDisabled || isPending}
        />
      </div>
      {feedback ? (
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {feedback}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={isDisabled || isPending}
        aria-busy={isPending}
        className="w-full"
      >
        {isPending ? "Ajout en cours..." : "Ajouter à la liste"}
      </Button>
    </form>
  );
};

export default AddListItemForm;

