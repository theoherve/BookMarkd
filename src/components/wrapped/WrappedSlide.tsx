"use client";

import { cn } from "@/lib/utils";

type WrappedSlideProps = {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
};

const WrappedSlide = ({ children, className, gradient }: WrappedSlideProps) => {
  return (
    <div
      className={cn(
        "flex min-h-screen w-full flex-col items-center justify-center px-4 py-12 text-center",
        gradient ||
          "bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500",
        className,
      )}
    >
      <div className="container mx-auto max-w-4xl">{children}</div>
    </div>
  );
};

export default WrappedSlide;
