"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  requestFollow,
  cancelFollowRequest,
  unfollowUser,
} from "@/server/actions/follow";
import type { FollowStatus } from "@/server/actions/follow";

type FollowRequestButtonProps = {
  targetUserId: string;
  initialStatus?: FollowStatus;
};

const FollowRequestButton = ({
  targetUserId,
  initialStatus = "not_following",
}: FollowRequestButtonProps) => {
  const [status, setStatus] = useState<FollowStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleRequest = () => {
    startTransition(async () => {
      const result = await requestFollow(targetUserId);
      if (result.success) {
        setStatus("request_pending");
        setFeedback(null);
      } else {
        setFeedback(result.message);
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
      const result = await unfollowUser(targetUserId);
      if (result.success) {
        setStatus("not_following");
        setFeedback(null);
      } else {
        setFeedback(result.message);
      }
    });
  };

  if (status === "following") {
    return (
      <div className="space-y-2">
        <Button
          variant="outline"
          onClick={handleUnfollow}
          disabled={isPending}
          aria-label="Se désabonner"
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
      <div className="space-y-2">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isPending}
          aria-label="Annuler la demande"
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
    <div className="space-y-2">
      <Button
        onClick={handleRequest}
        disabled={isPending}
        aria-label="Demander à suivre"
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

