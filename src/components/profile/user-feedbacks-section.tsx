"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUserFeedbacks } from "@/server/actions/feedback";
import { formatRelativeTimeFromNow } from "@/lib/datetime";
import type { Feedback, FeedbackStatus } from "@/types/feedback";

const statusLabels: Record<FeedbackStatus, string> = {
  pending: "En attente",
  reviewed: "Examiné",
  resolved: "Résolu",
  rejected: "Rejeté",
};

const statusBadgeVariants: Record<FeedbackStatus, "default" | "secondary" | "outline"> = {
  pending: "secondary",
  reviewed: "default",
  resolved: "default",
  rejected: "outline",
};

const typeLabels: Record<Feedback["type"], string> = {
  bug: "Bug",
  suggestion: "Suggestion",
};

const UserFeedbacksSection = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getUserFeedbacks();
        if (result.success) {
          setFeedbacks(result.feedbacks);
        } else {
          setError(result.message);
        }
      } catch (err) {
        console.error("Error fetching feedbacks:", err);
        setError("Une erreur est survenue lors du chargement des feedbacks.");
      } finally {
        setLoading(false);
      }
    };

    void fetchFeedbacks();
  }, []);

  if (loading) {
    return (
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            Mes feedbacks
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Vos suggestions et rapports de bugs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            Mes feedbacks
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Vos suggestions et rapports de bugs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            Mes feedbacks
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Vos suggestions et rapports de bugs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Vous n&apos;avez pas encore soumis de feedback.
          </p>
          <Button asChild variant="outline">
            <Link href="/feedback">Soumettre un feedback</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">
          Mes feedbacks
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Vos suggestions et rapports de bugs ({feedbacks.length}).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedbacks.map((feedback) => {
          const createdAtLabel = formatRelativeTimeFromNow(feedback.createdAt);
          const statusVariant = statusBadgeVariants[feedback.status];

          return (
            <div
              key={feedback.id}
              className="space-y-3 rounded-lg border border-border/50 bg-background/60 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant} className="text-xs">
                    {statusLabels[feedback.status]}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {typeLabels[feedback.type]}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {createdAtLabel}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">
                  {feedback.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {feedback.description}
                </p>
              </div>

              {feedback.url && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">URL:</span>{" "}
                  <a
                    href={feedback.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-foreground hover:underline break-all"
                  >
                    {feedback.url}
                  </a>
                </div>
              )}

              {feedback.status === "pending" && (
                <p className="text-xs text-muted-foreground italic">
                  Votre feedback est en cours d&apos;examen. Nous vous tiendrons au
                  courant de son évolution.
                </p>
              )}
            </div>
          );
        })}
        <div className="pt-2">
          <Button asChild variant="outline" className="w-full">
            <Link href="/feedback">Soumettre un nouveau feedback</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserFeedbacksSection;
