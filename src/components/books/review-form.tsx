"use client";

import { FormEvent, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createReview } from "@/server/actions/book";

type ReviewFormProps = {
  bookId: string;
};

const ReviewForm = ({ bookId }: ReviewFormProps) => {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<
    "public" | "friends" | "private"
  >("public");
  const [title, setTitle] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await createReview({
        bookId,
        visibility,
        title,
        content,
        spoiler,
      });
      if (result.success) {
        setContent("");
        setTitle("");
        setFeedback("Avis publié ✅");
      } else {
        setFeedback(result.message);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-3xl border border-border/60 bg-card/60 p-6"
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Titre
        </label>
        <Textarea
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Titre de votre avis (facultatif)"
          rows={1}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Votre commentaire
        </label>
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Partagez votre ressenti..."
          rows={4}
          required
        />
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={spoiler}
            onChange={(event) => setSpoiler(event.target.checked)}
          />
          Contient des spoilers
        </label>
        <label className="flex items-center gap-2">
          Visibilité
          <select
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as typeof visibility)
            }
            className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="public">Publique</option>
            <option value="friends">Amis</option>
            <option value="private">Privée</option>
          </select>
        </label>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Publication..." : "Publier l'avis"}
      </Button>
      {feedback ? (
        <p className="text-xs text-muted-foreground">{feedback}</p>
      ) : null}
    </form>
  );
};

export default ReviewForm;

