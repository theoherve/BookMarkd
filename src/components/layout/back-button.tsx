"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type BackButtonProps = {
  label?: string;
  ariaLabel?: string;
  className?: string;
};

const BackButton = ({
  label = "Retour",
  ariaLabel = "Retour à la page précédente",
  className,
}: BackButtonProps) => {
  const router = useRouter();

  const handleClick = () => {
    router.back();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      tabIndex={0}
      className={
        className ??
        "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md w-fit"
      }
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </button>
  );
};

export default BackButton;
