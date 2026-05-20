"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2, Send, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  archiveAwards,
  publishAwards,
  unpublishAwards,
} from "@/server/actions/admin/awards";
import type { AwardsYearStatus } from "@/features/awards/types";

type Props = {
  year: number;
  status: AwardsYearStatus;
};

export const AwardsPublishControls = ({ year, status }: Props) => {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const wrap = (fn: () => Promise<{ success: true } | { success: false; message: string }>, confirmMessage?: string) => {
    return () => {
      if (confirmMessage && !window.confirm(confirmMessage)) return;
      startTransition(async () => {
        const result = await fn();
        if (!result.success) window.alert(result.message);
        else router.refresh();
      });
    };
  };

  return (
    <div className="flex items-center gap-2">
      {status === "draft" && (
        <Button
          type="button"
          onClick={wrap(
            () => publishAwards(year),
            `Publier les Awards ${year} ? Tous les utilisateurs recevront une notification.`,
          )}
          disabled={pending}
        >
          {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
          Publier
        </Button>
      )}
      {status === "published" && (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={wrap(() => unpublishAwards(year))}
            disabled={pending}
          >
            <Undo2 className="mr-2 size-4" />
            Repasser en brouillon
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={wrap(
              () => archiveAwards(year),
              `Archiver les Awards ${year} ?`,
            )}
            disabled={pending}
          >
            <Archive className="mr-2 size-4" />
            Archiver
          </Button>
        </>
      )}
      {status === "archived" && (
        <Button
          type="button"
          variant="outline"
          onClick={wrap(() => publishAwards(year))}
          disabled={pending}
        >
          <Send className="mr-2 size-4" />
          Republier
        </Button>
      )}
    </div>
  );
};
