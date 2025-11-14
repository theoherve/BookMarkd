"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createBook } from "@/server/actions/book";
import { generateBookSlug } from "@/lib/slug";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const BookCreateForm = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      setErrorMessage(null);
      const result = await createBook(formData);

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      // Générer le slug à partir des données du formulaire
      const title = formData.get("title")?.toString().trim() || "";
      const author = formData.get("author")?.toString().trim() || "";
      
      if (title && author) {
        const slug = generateBookSlug(title, author);
        router.push(`/books/${slug}`);
      } else {
        // Fallback vers l'ID si les données ne sont pas disponibles
        router.push(`/books/${result.bookId}`);
      }
    });
  };

  return (
    <Card className="border-border bg-card/90">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-foreground">Nouveau livre</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Renseignez les informations du livre pour l&apos;ajouter au catalogue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          aria-label="Formulaire de création de livre"
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="title">
              Titre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              type="text"
              minLength={1}
              required
              placeholder="Ex. Le Nom du vent"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">
              Auteur·rice <span className="text-destructive">*</span>
            </Label>
            <Input
              id="author"
              name="author"
              type="text"
              minLength={1}
              required
              placeholder="Ex. Patrick Rothfuss"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publicationYear">Année de publication</Label>
            <Input
              id="publicationYear"
              name="publicationYear"
              type="number"
              min="0"
              max={new Date().getFullYear() + 10}
              placeholder="Ex. 2007"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverUrl">URL de la couverture</Label>
            <Input
              id="coverUrl"
              name="coverUrl"
              type="url"
              placeholder="https://example.com/cover.jpg"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Résumé</Label>
            <Textarea
              id="summary"
              name="summary"
              rows={6}
              placeholder="Décrivez brièvement le livre..."
              disabled={isPending}
            />
          </div>

          {errorMessage ? (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            aria-live="polite"
            className="w-full"
          >
            {isPending ? "Création en cours..." : "Créer le livre"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookCreateForm;

