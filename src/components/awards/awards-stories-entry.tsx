import Link from "next/link";
import { Play } from "lucide-react";

type Props = {
  year: number;
};

export const AwardsStoriesEntry = ({ year }: Props) => {
  return (
    <Link
      href={`/awards/${year}/stories`}
      className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-accent/40 bg-accent/15 px-6 py-8 transition-colors hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-row sm:items-center sm:justify-between sm:px-10"
    >
      <div className="space-y-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/70">
          Mode cérémonie
        </span>
        <h3 className="text-xl font-semibold text-foreground sm:text-2xl">
          Vivre la cérémonie {year}
        </h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Une dizaine de slides — un trophée à la fois, dans l’ordre. Comme un
          Wrapped, mais à l’échelle de la communauté.
        </p>
      </div>
      <span className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform motion-safe:duration-300 group-hover:translate-x-0.5">
        <Play className="size-4" aria-hidden />
        Lancer
      </span>
    </Link>
  );
};
