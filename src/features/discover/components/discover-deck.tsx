"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Heart,
  X as XIcon,
} from "lucide-react";

import type { DiscoverCandidate } from "../types";
import { DiscoverCard, type SwipeDirection } from "./discover-card";
import { DiscoverDetailsPanel } from "./discover-details-panel";
import { DiscoverActionsSheet } from "./discover-actions-sheet";
import { DiscoverEmpty } from "./discover-empty";
import {
  addToDiscoverWishlist,
  removeFromDiscoverWishlist,
} from "@/server/actions/discover";

type FollowOption = {
  id: string;
  displayName: string;
  username: string | null;
};

type Props = {
  initialCandidates: DiscoverCandidate[];
  follows: FollowOption[];
};

const VISIBLE_STACK = 3;

export const DiscoverDeck = ({ initialCandidates, follows }: Props) => {
  const [queue, setQueue] = useState<DiscoverCandidate[]>(initialCandidates);
  const [exitMap, setExitMap] = useState<Record<string, SwipeDirection>>({});
  const [showDetails, setShowDetails] = useState<DiscoverCandidate | null>(null);
  const [showActions, setShowActions] = useState<DiscoverCandidate | null>(null);
  const [toast, setToast] = useState<{
    id: string;
    label: string;
    undoBook: DiscoverCandidate | null;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const reduceMotion = useReducedMotion();

  const top = queue[0];

  const advance = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  const handleWishlist = useCallback((book: DiscoverCandidate) => {
    setToast({
      id: book.id,
      label: `« ${book.title} » ajouté à vos envies`,
      undoBook: book,
    });
    startTransition(async () => {
      const res = await addToDiscoverWishlist(book.id);
      if (!res.success) {
        setToast({ id: book.id, label: res.message, undoBook: null });
      }
    });
  }, []);

  const handleUndo = useCallback((book: DiscoverCandidate) => {
    setToast(null);
    startTransition(async () => {
      await removeFromDiscoverWishlist(book.id);
    });
    setQueue((q) => [book, ...q]);
    setExitMap((m) => {
      const next = { ...m };
      delete next[book.id];
      return next;
    });
  }, []);

  const handleSwipe = useCallback(
    (book: DiscoverCandidate, dir: SwipeDirection) => {
      setExitMap((m) => ({ ...m, [book.id]: dir }));

      if (dir === "right") {
        handleWishlist(book);
        window.setTimeout(advance, reduceMotion ? 50 : 320);
        return;
      }
      if (dir === "left") {
        window.setTimeout(advance, reduceMotion ? 50 : 320);
        return;
      }
      if (dir === "up") {
        setShowDetails(book);
        // Reset position si user ferme panel: ne pas advance
        window.setTimeout(() => {
          setExitMap((m) => {
            const next = { ...m };
            delete next[book.id];
            return next;
          });
        }, 50);
        return;
      }
      if (dir === "down") {
        setShowActions(book);
        window.setTimeout(() => {
          setExitMap((m) => {
            const next = { ...m };
            delete next[book.id];
            return next;
          });
        }, 50);
      }
    },
    [advance, handleWishlist, reduceMotion],
  );

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Prefetch suivants — TODO phase 2 (API route /api/discover/candidates)
  // pour l'instant on charge un batch initial unique

  // Empty state
  if (queue.length === 0) {
    return <DiscoverEmpty />;
  }

  const visibleStack = queue.slice(0, VISIBLE_STACK);

  return (
    <div className="relative mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col items-center gap-2 pt-1">
      {/* Deck zone — fills remaining vertical space, stays centered */}
      <div className="relative min-h-0 w-full flex-1 pb-4">
        <div className="absolute inset-0 mx-auto flex items-center justify-center">
          <div className="relative aspect-[3/4.2] h-full max-h-[calc(100%-1rem)] w-auto max-w-full">
            <AnimatePresence>
              {visibleStack.map((book, index) => (
                <DiscoverCard
                  key={book.id}
                  book={book}
                  stackIndex={index}
                  isTop={index === 0}
                  onSwipe={(dir) => handleSwipe(book, dir)}
                  exitDirection={exitMap[book.id] ?? null}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Action buttons — desktop only (mobile: drag suffit) */}
      <div className="hidden shrink-0 items-center justify-center gap-3 pb-1 md:flex">
        <ActionButton
          label="Passer"
          tone="rose"
          onClick={() => top && handleSwipe(top, "left")}
          disabled={!top || isPending}
        >
          <XIcon className="size-5" strokeWidth={2.5} />
        </ActionButton>
        <ActionButton
          label="Détails"
          tone="amber"
          onClick={() => top && handleSwipe(top, "up")}
          disabled={!top || isPending}
        >
          <ArrowUp className="size-4" strokeWidth={2.5} />
        </ActionButton>
        <ActionButton
          label="Ranger"
          tone="orange"
          onClick={() => top && handleSwipe(top, "down")}
          disabled={!top || isPending}
        >
          <ArrowDown className="size-4" strokeWidth={2.5} />
        </ActionButton>
        <ActionButton
          label="Envie"
          tone="emerald"
          onClick={() => top && handleSwipe(top, "right")}
          disabled={!top || isPending}
        >
          <Heart className="size-5" strokeWidth={2.5} />
        </ActionButton>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast ? (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full border border-emerald-700/30 bg-[#1a1612] px-4 py-2.5 text-sm text-amber-50 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-emerald-400" aria-hidden />
              <span>{toast.label}</span>
              {toast.undoBook ? (
                <button
                  type="button"
                  onClick={() => toast.undoBook && handleUndo(toast.undoBook)}
                  className="ml-2 rounded-full border border-amber-100/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-amber-100 hover:bg-amber-100/10"
                >
                  Annuler
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Panels */}
      <DiscoverDetailsPanel
        book={showDetails}
        open={!!showDetails}
        onClose={() => setShowDetails(null)}
        onOpenActions={(book) => {
          setShowDetails(null);
          setShowActions(book);
        }}
      />
      <DiscoverActionsSheet
        book={showActions}
        open={!!showActions}
        follows={follows}
        onClose={() => setShowActions(null)}
        onSaved={(book) => {
          setShowActions(null);
          setQueue((q) => q.filter((b) => b.id !== book.id));
        }}
      />
    </div>
  );
};

type ActionButtonProps = {
  label: string;
  tone: "rose" | "amber" | "orange" | "emerald";
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
};

const toneMap: Record<ActionButtonProps["tone"], string> = {
  rose: "border-rose-700/40 text-rose-700 hover:bg-rose-700 hover:text-rose-50 dark:border-rose-300/40 dark:text-rose-200 dark:hover:bg-rose-700",
  amber:
    "border-amber-700/40 text-amber-700 hover:bg-amber-700 hover:text-amber-50 dark:border-amber-300/40 dark:text-amber-200 dark:hover:bg-amber-700",
  orange:
    "border-orange-700/40 text-orange-700 hover:bg-orange-700 hover:text-orange-50 dark:border-orange-300/40 dark:text-orange-200 dark:hover:bg-orange-700",
  emerald:
    "border-emerald-700/40 text-emerald-700 hover:bg-emerald-700 hover:text-emerald-50 dark:border-emerald-300/40 dark:text-emerald-200 dark:hover:bg-emerald-700",
};

const ActionButton = ({
  label,
  tone,
  onClick,
  disabled,
  children,
}: ActionButtonProps) => {
  const isPrimary = tone === "emerald" || tone === "rose";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`group inline-flex ${
        isPrimary ? "size-12" : "size-11"
      } items-center justify-center rounded-full border-2 bg-[#fdfaf5] dark:bg-[#1a1612] transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${toneMap[tone]}`}
    >
      {children}
    </button>
  );
};
