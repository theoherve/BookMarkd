"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { recommendBookToUser } from "@/server/actions/recommend";
import { cn } from "@/lib/utils";

export type FollowingEntry = {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl?: string | null;
};

const fallbackAvatarText = (name: string): string => {
  const segments = name.trim().split(" ").filter(Boolean);
  if (segments.length === 0) return "?";
  if (segments.length === 1) return segments[0]!.slice(0, 2).toUpperCase();
  return `${segments[0]!.slice(0, 1)}${segments[segments.length - 1]!.slice(0, 1)}`.toUpperCase();
};

type SuggestBookToFriendButtonProps = {
  book: { id: string; title: string; author: string };
  followingList: FollowingEntry[];
  disabled?: boolean;
  className?: string;
  /** Afficher le libellé « Recommander à… » à côté de l’icône (ex. page détail livre) */
  showLabel?: boolean;
};

const SuggestBookToFriendButton = ({
  book,
  followingList,
  disabled,
  className,
  showLabel = false,
}: SuggestBookToFriendButtonProps) => {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setMessage(null);
      setSelectedId(null);
    }
  };

  const handleRecommend = (recipientUserId: string) => {
    setMessage(null);
    setSelectedId(recipientUserId);
    startTransition(async () => {
      const result = await recommendBookToUser(
        recipientUserId,
        book.id,
        book.title,
        book.author,
      );
      if (result.success) {
        setMessage({ type: "success", text: "Recommandation envoyée." });
      } else {
        setMessage({ type: "error", text: result.message });
      }
    });
  };

  const isEmpty = followingList.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={showLabel ? "outline" : "ghost"}
          size={showLabel ? "default" : "icon"}
          disabled={disabled || isEmpty}
          aria-label={`Recommander « ${book.title} » à une personne que vous suivez`}
          className={cn("shrink-0 gap-2", className)}
        >
          <Share2 className="h-4 w-4 shrink-0" aria-hidden />
          {showLabel ? "Recommander à…" : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Recommander ce livre</DialogTitle>
          <DialogDescription>
            Choisissez une personne que vous suivez pour lui suggérer « {book.title} ».
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {isEmpty ? (
            <p className="text-sm text-muted-foreground">
              Vous ne suivez personne pour le moment. Recommandez uniquement aux personnes que vous
              suivez et qui vous ont accepté.
            </p>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border/60 p-2">
              {followingList.map((user) => (
                <li key={user.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-start gap-3 py-2.5 pl-2 pr-3 text-left font-normal"
                    disabled={isPending}
                    onClick={() => handleRecommend(user.id)}
                    aria-label={`Recommander à ${user.displayName}`}
                  >
                    <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="36px"
                          unoptimized
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
                          {fallbackAvatarText(user.displayName)}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium text-foreground">{user.displayName}</span>
                      {user.username ? (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          @{user.username}
                        </span>
                      ) : null}
                    </span>
                    {selectedId === user.id && isPending ? (
                      <span className="shrink-0 text-xs text-muted-foreground">Envoi…</span>
                    ) : null}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {message ? (
            <p
              className={cn(
                "text-sm",
                message.type === "success" ? "text-green-600 dark:text-green-400" : "text-destructive",
              )}
              role="status"
            >
              {message.text}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestBookToFriendButton;
