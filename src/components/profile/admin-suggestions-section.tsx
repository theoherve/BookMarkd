"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { getAllSuggestionsForAdmin, updateFeedbackStatus } from "@/server/actions/feedback";
import { formatRelativeTimeFromNow } from "@/lib/datetime";
import type { FeedbackStatus, FeedbackType, FeedbackWithUser } from "@/types/feedback";

const typeLabels: Record<FeedbackType, string> = {
  bug: "Bug",
  suggestion: "Suggestion",
};

const statusLabels: Record<FeedbackStatus, string> = {
  pending: "En attente",
  reviewed: "En cours",
  resolved: "Résolu",
  rejected: "Rejeté",
};

const statusBadgeStyles: Record<
  FeedbackStatus,
  { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
> = {
  pending: { variant: "secondary" },
  reviewed: {
    variant: "outline",
    className:
      "border-blue-400/60 bg-blue-500/15 text-blue-700 dark:border-blue-400 dark:bg-blue-500/35 dark:text-blue-100",
  },
  resolved: {
    variant: "outline",
    className:
      "border-emerald-400/60 bg-emerald-500/15 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-500/35 dark:text-emerald-100",
  },
  rejected: { variant: "destructive" },
};

const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "reviewed", label: "En cours" },
  { value: "resolved", label: "Résolu" },
  { value: "rejected", label: "Rejeté" },
];

const AdminSuggestionsSection = () => {
  const [suggestions, setSuggestions] = useState<FeedbackWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();
  const [statusError, setStatusError] = useState<string | null>(null);

  const loadFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllSuggestionsForAdmin();
      if (result.success) {
        setIsAdmin(true);
        setSuggestions(result.suggestions);
      } else {
        setIsAdmin(false);
        setError(result.message);
      }
    } catch (err) {
      console.error("Error fetching admin suggestions:", err);
      setIsAdmin(false);
      setError("Une erreur est survenue lors du chargement des suggestions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFeedbacks();
  }, []);

  const handleStatusChange = (feedbackId: string, newStatus: FeedbackStatus) => {
    setStatusError(null);
    startTransition(async () => {
      const result = await updateFeedbackStatus(feedbackId, newStatus);
      if (result.success) {
        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === feedbackId ? { ...s, status: newStatus } : s,
          ),
        );
      } else {
        setStatusError(result.message);
      }
    });
  };

  if (loading) {
    return (
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            Feedbacks des utilisateurs
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Chargement…
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin || error) {
    return null;
  }

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">
          Feedbacks des utilisateurs
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Suggestions et bugs soumis par les utilisateurs ({suggestions.length}).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun feedback pour le moment.
          </p>
        ) : (
          <>
            {statusError ? (
              <p className="text-sm text-destructive" role="alert">
                {statusError}
              </p>
            ) : null}
            {suggestions.map((suggestion) => {
              const createdAtLabel = formatRelativeTimeFromNow(suggestion.createdAt);
              const badgeStyle = statusBadgeStyles[suggestion.status];
              const userLabel =
                suggestion.userDisplayName ||
                suggestion.username ||
                suggestion.userEmail;

              return (
                <div
                  key={suggestion.id}
                  className="space-y-3 rounded-lg border border-border/50 bg-background/60 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={badgeStyle.variant}
                        className={badgeStyle.className ? `text-xs ${badgeStyle.className}` : "text-xs"}
                      >
                        {statusLabels[suggestion.status]}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {typeLabels[suggestion.type]}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                      {createdAtLabel}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">
                      {suggestion.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {suggestion.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">Par :</span>
                    <span className="text-foreground">{userLabel}</span>
                    {suggestion.username && (
                      <Link
                        href={`/profiles/${suggestion.username}`}
                        className="text-accent-foreground hover:underline"
                        aria-label={`Voir le profil de ${suggestion.userDisplayName}`}
                      >
                        @{suggestion.username}
                      </Link>
                    )}
                  </div>

                  {suggestion.url && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">URL :</span>{" "}
                      <a
                        href={suggestion.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-accent-foreground hover:underline"
                      >
                        {suggestion.url}
                      </a>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Label htmlFor={`status-${suggestion.id}`} className="text-xs text-muted-foreground">
                      Modifier le statut :
                    </Label>
                    <select
                      id={`status-${suggestion.id}`}
                      value={suggestion.status}
                      onChange={(e) => {
                        const value = e.target.value as FeedbackStatus;
                        handleStatusChange(suggestion.id, value);
                      }}
                      disabled={isPending}
                      aria-label={`Changer le statut du feedback ${suggestion.title}`}
                      className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminSuggestionsSection;
