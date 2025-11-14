"use client";

import Image from "next/image";
import { useState, useTransition, useEffect } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
} from "@/server/actions/follow";

type FollowRequest = {
  id: string;
  requester: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
  };
  createdAt: string;
};

const FollowRequestsPanel = () => {
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadRequests = async () => {
    const result = await getFollowRequests();
    if (result.success && result.requests) {
      setRequests(result.requests);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      const result = await getFollowRequests();
      if (result.success && result.requests) {
        setRequests(result.requests);
      }
      setIsLoading(false);
    })();
  }, []);

  const handleAccept = (requestId: string) => {
    startTransition(async () => {
      const result = await acceptFollowRequest(requestId);
      if (result.success) {
        await loadRequests();
      }
    });
  };

  const handleReject = (requestId: string) => {
    startTransition(async () => {
      const result = await rejectFollowRequest(requestId);
      if (result.success) {
        await loadRequests();
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Demandes de suivi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Demandes de suivi</CardTitle>
          <CardDescription>
            Vous n&apos;avez aucune demande en attente
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demandes de suivi</CardTitle>
        <CardDescription>
          {requests.length} demande{requests.length > 1 ? "s" : ""} en attente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request) => {
          const avatarInitials = request.requester.displayName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <div
              key={request.id}
              className="flex items-start gap-4 rounded-lg border border-border/50 bg-card/70 p-4"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border/50 bg-muted">
                {request.requester.avatarUrl ? (
                  <Image
                    src={request.requester.avatarUrl}
                    alt={request.requester.displayName}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                    {avatarInitials}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="font-semibold text-foreground">
                    {request.requester.displayName}
                  </p>
                  {request.requester.bio ? (
                    <p className="text-sm text-muted-foreground">
                      {request.requester.bio}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(request.id)}
                    disabled={isPending}
                    aria-label={`Accepter la demande de ${request.requester.displayName}`}
                  >
                    Accepter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(request.id)}
                    disabled={isPending}
                    aria-label={`Refuser la demande de ${request.requester.displayName}`}
                  >
                    Refuser
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default FollowRequestsPanel;

