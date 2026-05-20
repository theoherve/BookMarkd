"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runAwardsAggregation } from "@/server/actions/admin/awards";

type Props = {
  year: number;
  label?: string;
  overwrite?: boolean;
  variant?: "default" | "outline";
};

export const AwardsRunButton = ({
  year,
  label,
  overwrite = false,
  variant = "default",
}: Props) => {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    if (
      overwrite &&
      !window.confirm(
        `Recalculer les awards ${year} va écraser les gagnants existants. Continuer ?`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await runAwardsAggregation(year, overwrite);
      if (!result.success) {
        window.alert(result.message);
        return;
      }
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Play className="mr-2 size-4" />
      )}
      {label ?? `Lancer ${year}`}
    </Button>
  );
};
