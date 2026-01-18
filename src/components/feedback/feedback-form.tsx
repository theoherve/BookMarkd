"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createFeedback } from "@/server/actions/feedback";
import { getBrowserInfo } from "@/lib/utils/browser-info";
import type { CreateFeedbackInput, FeedbackType } from "@/types/feedback";

const FeedbackForm = () => {
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [browserInfo, setBrowserInfo] = useState<ReturnType<typeof getBrowserInfo> | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setBrowserInfo(getBrowserInfo());
  }, []);

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setType(event.target.value as FeedbackType);
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const handleDescriptionChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setDescription(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const input: CreateFeedbackInput = {
          type,
          title,
          description,
          browserInfo: browserInfo ?? undefined,
          url: typeof window !== "undefined" ? window.location.href : undefined,
        };

        const result = await createFeedback(input);

        if (result.success) {
          setTitle("");
          setDescription("");
          setFeedback(
            "Merci pour votre feedback ! Nous l'avons bien reçu et allons l'examiner. ✅",
          );
        } else {
          setFeedback(result.message);
        }
      } catch (error) {
        console.error("Error submitting feedback:", error);
        setFeedback("Une erreur est survenue lors de l'envoi du feedback.");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-border/60 bg-card/60 p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="type" className="text-sm font-medium text-foreground">
          Type de feedback
        </Label>
        <select
          id="type"
          value={type}
          onChange={handleTypeChange}
          className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          <option value="suggestion">Suggestion de fonctionnalité</option>
          <option value="bug">Rapport de bug</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium text-foreground">
          Titre <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          type="text"
          placeholder={
            type === "bug"
              ? "Décrivez brièvement le problème"
              : "Décrivez votre suggestion"
          }
          value={title}
          onChange={handleTitleChange}
          required
          minLength={3}
          maxLength={200}
          className="min-h-[48px] sm:min-h-0"
        />
        <p className="text-xs text-muted-foreground">
          Entre 3 et 200 caractères
        </p>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="description"
          className="text-sm font-medium text-foreground"
        >
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder={
            type === "bug"
              ? "Décrivez le problème en détail, les étapes pour le reproduire, ce que vous attendiez, et ce qui s'est réellement passé..."
              : "Expliquez votre suggestion en détail, comment cela améliorerait votre expérience..."
          }
          value={description}
          onChange={handleDescriptionChange}
          rows={6}
          required
          minLength={10}
          maxLength={5000}
        />
        <p className="text-xs text-muted-foreground">
          Entre 10 et 5000 caractères
        </p>
      </div>

      {browserInfo && (
        <div className="space-y-2 rounded-lg border border-border/50 bg-muted/30 p-4">
          <Label className="text-sm font-medium text-foreground">
            Informations techniques (automatiques)
          </Label>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              <span className="font-medium">Navigateur:</span>{" "}
              {browserInfo.userAgent}
            </p>
            <p>
              <span className="font-medium">Plateforme:</span>{" "}
              {browserInfo.platform}
            </p>
            <p>
              <span className="font-medium">Langue:</span> {browserInfo.language}
            </p>
            {browserInfo.screenWidth && browserInfo.screenHeight && (
              <p>
                <span className="font-medium">Résolution:</span>{" "}
                {browserInfo.screenWidth} × {browserInfo.screenHeight}
              </p>
            )}
            {browserInfo.timezone && (
              <p>
                <span className="font-medium">Fuseau horaire:</span>{" "}
                {browserInfo.timezone}
              </p>
            )}
            {browserInfo.url && (
              <p>
                <span className="font-medium">URL:</span> {browserInfo.url}
              </p>
            )}
          </div>
        </div>
      )}

      {feedback && (
        <div
          role="alert"
          className={`rounded-lg border px-4 py-2 text-sm ${
            feedback.includes("✅")
              ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {feedback}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Envoi en cours..." : "Envoyer le feedback"}
      </Button>
    </form>
  );
};

export default FeedbackForm;
