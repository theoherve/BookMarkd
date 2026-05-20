"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AwardsSlideBase } from "./awards-slide-base";

type Props = {
  year: number;
};

export const AwardsOutroSlide = ({ year }: Props) => {
  return (
    <AwardsSlideBase>
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-foreground">
        <Sparkles className="size-6" aria-hidden />
      </span>
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Fin de la cérémonie
      </p>
      <h2 className="text-4xl font-semibold text-foreground sm:text-5xl">
        Merci d’avoir lu avec nous.
      </h2>
      <p className="mx-auto max-w-xl text-base text-muted-foreground">
        Rendez-vous l’année prochaine pour une nouvelle édition. D’ici là, continuez à
        partager vos lectures.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/awards/${year}`}
          className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Revoir le récap
        </Link>
        <Link
          href="/feed"
          className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Retour au feed
        </Link>
      </div>
    </AwardsSlideBase>
  );
};
