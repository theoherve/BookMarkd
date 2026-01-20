"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cancelFollowRequest } from "@/server/actions/follow";
import type { FollowStatus } from "@/server/actions/follow";
import { useOfflineQueue } from "@/hooks/use-offline-queue";

type FollowRequestButtonProps = {
  targetUserId: string;
  initialStatus?: FollowStatus;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
};

const FollowRequestButton = ({
  targetUserId,
  initialStatus = "not_following",
  className,
  size = "sm",
}: FollowRequestButtonProps) => {
  const [status, setStatus] = useState<FollowStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const { queueAction } = useOfflineQueue();

  const handleRequest = () => {
    startTransition(async () => {
      try {
        const queueResult = await queueAction({
          type: "requestFollow",
          targetUserId,
        });

        if (queueResult.success) {
          setStatus("request_pending");
          setFeedback(null);
        } else {
          setFeedback("Impossible d'envoyer la demande");
        }
      } catch {
        setFeedback("Erreur lors de la demande");
      }
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelFollowRequest(targetUserId);
      if (result.success) {
        setStatus("not_following");
        setFeedback(null);
      } else {
        setFeedback(result.message);
      }
    });
  };

  const handleUnfollow = () => {
    startTransition(async () => {
      try {
        const queueResult = await queueAction({
          type: "unfollowUser",
          targetUserId,
        });

        if (queueResult.success) {
          setStatus("not_following");
          setFeedback(null);
        } else {
          setFeedback("Impossible de se désabonner");
        }
      } catch {
        setFeedback("Erreur lors du désabonnement");
      }
    });
  };

  if (status === "following") {
    return (
      <div className="w-full">
        <Button
          variant="destructive"
          onClick={handleUnfollow}
          disabled={isPending}
          aria-label="Se désabonner"
          className="w-full"
        >
          Se désabonner
        </Button>
        {feedback ? (
          <p className="text-xs text-destructive">{feedback}</p>
        ) : null}
      </div>
    );
  }

  if (status === "request_pending") {
    return (
      <div className="w-full">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isPending}
          aria-label="Annuler la demande"
          className="w-full"
        >
          Demande envoyée
        </Button>
        {feedback ? (
          <p className="text-xs text-destructive">{feedback}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="w-full">
      <Button
        onClick={handleRequest}
        disabled={isPending}
        aria-label="Demander à suivre"
        className="w-full"
      >
        Demander à suivre
      </Button>
      {feedback ? (
        <p className="text-xs text-destructive">{feedback}</p>
      ) : null}
    </div>
  );
};

export default FollowRequestButton;

