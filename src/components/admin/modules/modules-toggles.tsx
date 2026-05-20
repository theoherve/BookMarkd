"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { setModuleEnabled } from "@/server/actions/admin/modules";
import type { SiteModule } from "@/features/modules/types";

type Props = {
  modules: SiteModule[];
};

type Feedback = { kind: "success" | "error"; message: string } | null;

export const ModulesToggles = ({ modules }: Props) => {
  const [items, setItems] = useState(modules);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [, startTransition] = useTransition();

  const handleToggle = (key: string, next: boolean) => {
    const previous = items;
    setItems((prev) =>
      prev.map((m) => (m.key === key ? { ...m, enabled: next } : m)),
    );
    setPendingKey(key);
    setFeedback(null);

    startTransition(async () => {
      const result = await setModuleEnabled(key, next);
      setPendingKey(null);
      if (!result.success) {
        setItems(previous);
        setFeedback({ kind: "error", message: result.message });
        return;
      }
      setFeedback({
        kind: "success",
        message: `Module « ${items.find((m) => m.key === key)?.label ?? key} » ${next ? "activé" : "désactivé"}.`,
      });
    });
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
            feedback.kind === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.kind === "success" ? (
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          ) : (
            <AlertCircle className="size-4 shrink-0" aria-hidden />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <ul className="space-y-3">
        {items.map((m) => (
          <li key={m.key}>
            <Card className="border-border/60 bg-card/80">
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {m.label}
                    </p>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      {m.key}
                    </code>
                  </div>
                  {m.description && (
                    <p className="text-sm text-muted-foreground">
                      {m.description}
                    </p>
                  )}
                </div>
                <Switch
                  checked={m.enabled}
                  onCheckedChange={(v) => handleToggle(m.key, v)}
                  disabled={pendingKey === m.key}
                  aria-label={`${m.enabled ? "Désactiver" : "Activer"} le module ${m.label}`}
                />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
};
