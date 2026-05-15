"use client";

import { cn } from "@/lib/utils";

type WrappedSlideProps = {
  children: React.ReactNode;
  className?: string;
  background?: string;
  textColorClass?: string;
};

const WrappedSlide = ({
  children,
  className,
  background,
  textColorClass = "text-[#1f140d] dark:text-[#f7f1ea]",
}: WrappedSlideProps) => {
  return (
    <div
      className={cn(
        "relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl px-4 py-8 text-center sm:py-10",
        textColorClass,
        background ||
          "bg-[radial-gradient(ellipse_at_top,#fdfaf5_0%,#efe6dc_55%,#e4d7c6_100%)] dark:bg-[radial-gradient(ellipse_at_top,#1a1410_0%,#0f0c0a_60%,#0a0806_100%)]",
        className,
      )}
    >
      {/* Subtle paper grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply dark:opacity-25 dark:mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(214,176,135,0.18), transparent 45%), radial-gradient(circle at 80% 70%, rgba(182,111,75,0.14), transparent 45%)",
        }}
      />
      <div className="relative z-10 mx-auto w-full max-w-4xl">{children}</div>
    </div>
  );
};

export default WrappedSlide;
