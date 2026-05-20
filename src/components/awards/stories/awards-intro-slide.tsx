"use client";

import { Trophy } from "lucide-react";
import { AwardsSlideBase } from "./awards-slide-base";

type Props = {
  year: number;
  theme: string | null;
};

export const AwardsIntroSlide = ({ year, theme }: Props) => {
  return (
    <AwardsSlideBase>
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-foreground">
        <Trophy className="size-6" aria-hidden />
      </span>
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
        BookMarkd Awards · Édition {year}
      </p>
      <h1 className="text-5xl font-semibold text-foreground sm:text-6xl">
        {theme ?? `Cérémonie ${year}`}
      </h1>
      <p className="mx-auto max-w-xl text-base text-muted-foreground">
        Une dizaine de trophées, une seule communauté. Utilisez les flèches du
        clavier ou les boutons pour avancer.
      </p>
    </AwardsSlideBase>
  );
};
