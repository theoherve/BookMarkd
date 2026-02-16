"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ListPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getMyLists, addBookToList } from "@/server/actions/lists";
import type { ListSummary } from "@/features/lists/types";
import { cn } from "@/lib/utils";

type AddToListButtonProps = {
  bookId: string;
  disabled?: boolean;
  className?: string;
};

const AddToListButton = ({ bookId, disabled, className }: AddToListButtonProps) => {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ListSummary[] | null>(null);
  const [listsLoading, setListsLoading] = useState(false);
  const [pendingListId, setPendingListId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ listId: string; message: string } | null>(null);
  const [, startTransition] = useTransition();

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setFeedback(null);
      setListsLoading(true);
      setLists(null);
      getMyLists().then((data) => {
        setLists(data ?? []);
        setListsLoading(false);
      });
    }
  };

  const handleSelectList = (listId: string) => {
    setFeedback(null);
    setPendingListId(listId);
    startTransition(async () => {
      const result = await addBookToList(listId, bookId, null);
      setPendingListId(null);
      const list = lists?.find((l) => l.id === listId);
      const listTitle = list?.title ?? "cette liste";
      if (result.success) {
        setFeedback({
          listId,
          message: `Ajouté à « ${listTitle} »`,
        });
      } else {
        setFeedback({
          listId,
          message: result.message,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label="Ajouter ce livre à une liste"
          className={cn("gap-2", className)}
        >
          <ListPlus className="h-4 w-4" aria-hidden />
          Ajouter à une liste
        </Button>
      </DialogTrigger>
      <DialogContent
        className="flex max-h-[85vh] flex-col gap-4 sm:max-w-md"
        aria-describedby="add-to-list-description"
      >
        <DialogHeader>
          <DialogTitle>Ajouter à une liste</DialogTitle>
          <DialogDescription id="add-to-list-description">
            Choisissez une liste dans laquelle ajouter ce livre.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {listsLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des listes…</p>
          ) : lists === null || lists.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Vous n&apos;avez pas encore de liste.
              </p>
              <Button asChild variant="secondary" size="sm">
                <Link href="/lists/create">Créer une liste</Link>
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-1" role="list">
              {lists.map((list) => {
                const isPending = pendingListId === list.id;
                const listFeedback = feedback?.listId === list.id ? feedback.message : null;
                return (
                  <li key={list.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectList(list.id)}
                      disabled={isPending || !!pendingListId}
                      className={cn(
                        "flex w-full flex-col items-start gap-0.5 rounded-lg border border-border/60 bg-card px-4 py-3 text-left transition",
                        "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                        "disabled:pointer-events-none disabled:opacity-60",
                      )}
                      aria-busy={isPending}
                      aria-label={`Ajouter à la liste ${list.title}`}
                    >
                      <span className="font-medium text-foreground">{list.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {list.itemCount} livre{list.itemCount !== 1 ? "s" : ""}
                      </span>
                      {listFeedback ? (
                        <span
                          className={cn(
                            "mt-1 text-xs",
                            listFeedback.startsWith("Ajouté")
                              ? "text-green-600 dark:text-green-400"
                              : "text-muted-foreground",
                          )}
                          role="status"
                        >
                          {listFeedback}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToListButton;
