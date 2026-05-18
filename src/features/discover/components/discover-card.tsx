"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  useReducedMotion,
  type MotionValue,
  type PanInfo,
} from "framer-motion";
import Image from "next/image";
import { BookOpen } from "lucide-react";

import type { DiscoverCandidate } from "../types";

export type SwipeDirection = "left" | "right" | "up" | "down";

type Props = {
  book: DiscoverCandidate;
  isTop: boolean;
  stackIndex: number;
  onSwipe: (direction: SwipeDirection) => void;
  exitDirection?: SwipeDirection | null;
};

const SWIPE_THRESHOLD = 90;
const SWIPE_VELOCITY = 600;
const RESET_SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

const directionLabels: Record<
  SwipeDirection,
  { label: string; bg: string; fg: string }
> = {
  right: { label: "ENVIE", bg: "bg-emerald-700/90", fg: "text-emerald-50" },
  left: { label: "PASSE", bg: "bg-rose-700/85", fg: "text-rose-50" },
  up: { label: "DÉTAILS", bg: "bg-amber-700/90", fg: "text-amber-50" },
  down: { label: "RANGER", bg: "bg-orange-700/90", fg: "text-orange-50" },
};

export const DiscoverCard = ({
  book,
  isTop,
  stackIndex,
  onSwipe,
  exitDirection,
}: Props) => {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12]);
  const opacityRight = useTransform(x, [20, 130], [0, 1]);
  const opacityLeft = useTransform(x, [-130, -20], [1, 0]);
  const opacityUp = useTransform(y, [-130, -20], [1, 0]);
  const opacityDown = useTransform(y, [20, 130], [0, 1]);

  // Seul left/right sortent la carte; up/down ouvrent un panel mais la carte reste.
  const isExitingAway = exitDirection === "left" || exitDirection === "right";

  const resetCardPosition = useCallback(() => {
    animate(x, 0, RESET_SPRING);
    animate(y, 0, RESET_SPRING);
  }, [x, y]);

  useEffect(() => {
    if (!isExitingAway) resetCardPosition();
  }, [isExitingAway, resetCardPosition]);

  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (!isTop) return;

    const { offset, velocity } = info;
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);
    const absVx = Math.abs(velocity.x);
    const absVy = Math.abs(velocity.y);

    if (absX > absY) {
      if (absX > SWIPE_THRESHOLD || absVx > SWIPE_VELOCITY) {
        onSwipe(offset.x > 0 ? "right" : "left");
        return;
      }
    } else if (absY > SWIPE_THRESHOLD || absVy > SWIPE_VELOCITY) {
      onSwipe(offset.y > 0 ? "down" : "up");
      resetCardPosition();
      return;
    }

    resetCardPosition();
  };

  const exitTarget = useMemo(() => {
    if (!isExitingAway) return null;
    if (exitDirection === "right") return { x: 800, y: 0, rotate: 25 };
    if (exitDirection === "left") return { x: -800, y: 0, rotate: -25 };
    return null;
  }, [isExitingAway, exitDirection]);

  const baseTransform = useMemo(() => {
    if (stackIndex === 0) return { scale: 1, y: 0 };
    if (stackIndex === 1) return { scale: 0.96, y: 8 };
    return { scale: 0.92, y: 16 };
  }, [stackIndex]);

  return (
    <motion.article
      className="absolute inset-0 origin-bottom touch-none select-none"
      style={{
        x,
        y: isTop ? y : baseTransform.y,
        rotate: isTop ? rotate : 0,
        zIndex: 10 - stackIndex,
      }}
      drag={isTop && !isExitingAway}
      dragElastic={0.65}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: baseTransform.scale, y: baseTransform.y, opacity: 0 }}
      animate={
        exitTarget && !reduceMotion
          ? { ...exitTarget, opacity: 0 }
          : { scale: baseTransform.scale, y: baseTransform.y, opacity: 1 }
      }
      transition={
        reduceMotion
          ? { duration: 0.15 }
          : exitTarget
            ? { duration: 0.32, ease: [0.32, 0.72, 0, 1] }
            : { type: "spring", stiffness: 280, damping: 28 }
      }
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-[28px] border border-amber-900/15 dark:border-amber-100/10 bg-[#f4efe6] dark:bg-[#1a1612] shadow-[0_30px_80px_-30px_rgba(31,20,13,0.55)]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 0%, rgba(194,65,12,0.08), transparent 55%), radial-gradient(circle at 100% 100%, rgba(101,128,106,0.08), transparent 60%)",
        }}
      >
        {/* Paper grain overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-multiply dark:mix-blend-screen dark:opacity-[0.12]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0.1 0 0 0 0 0.07 0 0 0 0 0.05 0 0 0 0.9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Cover background blurred */}
        {book.coverUrl ? (
          <div className="absolute inset-0">
            <Image
              src={book.coverUrl}
              alt=""
              fill
              draggable={false}
              priority={isTop}
              sizes="(max-width: 768px) 100vw, 500px"
              className="object-cover opacity-30 blur-2xl scale-110"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f4efe6]/40 to-[#f4efe6]/95 dark:via-[#1a1612]/50 dark:to-[#1a1612]/95" />
          </div>
        ) : null}

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col p-3">
          {/* Score badge */}
          <div className="flex shrink-0 items-start justify-between">
            <div className="inline-flex items-center gap-1 rounded-full border border-amber-900/20 dark:border-amber-100/15 bg-[#fdfaf5]/80 dark:bg-[#0f0c0a]/70 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-amber-900/80 dark:text-amber-100/75 backdrop-blur">
              <span className="size-1 rounded-full bg-amber-700 dark:bg-amber-300" />
              {book.compatibilityScore}% match
            </div>
            {book.publicationYear ? (
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber-900/60 dark:text-amber-100/60">
                {book.publicationYear}
              </span>
            ) : null}
          </div>

          {/* Cover */}
          <div className="my-2 flex min-h-0 flex-1 items-center justify-center">
            <div className="relative aspect-2/3 h-full max-h-full w-auto max-w-full overflow-hidden rounded-[6px] shadow-[0_20px_40px_-15px_rgba(31,20,13,0.6)] ring-1 ring-amber-900/10 dark:ring-amber-100/15">
              {book.coverUrl ? (
                <Image
                  src={book.coverUrl}
                  alt={`Couverture de ${book.title}`}
                  fill
                  draggable={false}
                  priority={isTop}
                  sizes="(max-width: 768px) 60vw, 220px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#e8dfd0] dark:bg-[#2a221c]">
                  <BookOpen
                    className="size-10 text-amber-900/40 dark:text-amber-100/40"
                    strokeWidth={1.5}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Title + author */}
          <div className="shrink-0 text-center">
            <h2 className="text-lg font-semibold leading-tight text-[#1f140d] dark:text-[#f7f1ea] sm:text-xl line-clamp-2">
              {book.title}
            </h2>
            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-900/70 dark:text-amber-100/60 truncate">
              {book.author}
            </p>
          </div>

          {/* Reasons */}
          {book.matchReasons.length > 0 ? (
            <div className="mt-1.5 flex shrink-0 flex-wrap justify-center gap-1">
              {book.matchReasons.slice(0, 2).map((reason) => (
                <span
                  key={`${reason.kind}-${reason.label}`}
                  className="rounded-full border border-amber-900/15 dark:border-amber-100/10 bg-[#fdfaf5]/60 dark:bg-[#0f0c0a]/50 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-amber-900/75 dark:text-amber-100/70 truncate max-w-[50%]"
                >
                  {reason.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Direction overlays */}
        {isTop ? (
          <>
            <DirectionOverlay
              opacity={opacityRight}
              dir="right"
              position="left-6 top-6"
              rotate="-rotate-12"
            />
            <DirectionOverlay
              opacity={opacityLeft}
              dir="left"
              position="right-6 top-6"
              rotate="rotate-12"
            />
            <DirectionOverlay
              opacity={opacityUp}
              dir="up"
              position="left-1/2 -translate-x-1/2 bottom-6"
              rotate=""
            />
            <DirectionOverlay
              opacity={opacityDown}
              dir="down"
              position="left-1/2 -translate-x-1/2 top-6"
              rotate=""
            />
          </>
        ) : null}
      </div>
    </motion.article>
  );
};

type OverlayProps = {
  opacity: MotionValue<number>;
  dir: SwipeDirection;
  position: string;
  rotate: string;
};

const DirectionOverlay = ({ opacity, dir, position, rotate }: OverlayProps) => {
  const cfg = directionLabels[dir];
  return (
    <motion.div
      style={{ opacity }}
      className={`pointer-events-none absolute ${position} ${rotate} z-20 inline-flex items-center gap-2 rounded-md border-2 border-white/70 ${cfg.bg} ${cfg.fg} px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.25em] shadow-xl`}
    >
      {cfg.label}
    </motion.div>
  );
};
