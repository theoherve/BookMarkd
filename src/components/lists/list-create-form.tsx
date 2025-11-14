"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createList } from "@/server/actions/lists";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ListCreateFormProps = {
  ownerName: string;
};

const ListCreateForm = ({ ownerName }: ListCreateFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      setErrorMessage(null);
      const result = await createList(formData);

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      router.push(`/lists/${result.listId}`);
    });
  };

  return (
    <Card className="border-border bg-card/90">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-foreground">Créer une nouvelle liste</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {ownerName}, composez et partagez vos sélections personnalisées.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          aria-label="Formulaire de création de liste"
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la liste</Label>
            <Input
              id="title"
              name="title"
              type="text"
              minLength={3}
              required
              placeholder="Ex. Palmarès 2025"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Contextualisez votre sélection..."
              disabled={isPending}
            />
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">Visibilité</legend>
            <p className="text-xs text-muted-foreground">
              Choisissez qui peut découvrir cette liste.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex cursor-pointer flex-col gap-1 rounded-lg border border-border/60 p-4 text-sm hover:border-accent focus-within:border-accent focus-within:ring-2 focus-within:ring-accent">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    defaultChecked
                    disabled={isPending}
                  />
                  <span className="font-semibold text-foreground">Publique</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Accessible à toute la communauté BookMarkd.
                </span>
              </label>
              <label className="flex cursor-pointer flex-col gap-1 rounded-lg border border-border/60 p-4 text-sm hover:border-accent focus-within:border-accent focus-within:ring-2 focus-within:ring-accent">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="unlisted"
                    disabled={isPending}
                  />
                  <span className="font-semibold text-foreground">Non répertoriée</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Partagez-la via un lien direct uniquement.
                </span>
              </label>
              <label className="flex cursor-pointer flex-col gap-1 rounded-lg border border-border/60 p-4 text-sm hover:border-accent focus-within:border-accent focus-within:ring-2 focus-within:ring-accent">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    disabled={isPending}
                  />
                  <span className="font-semibold text-foreground">Privée</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Visible seulement par vous et vos collaborateurs.
                </span>
              </label>
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="isCollaborative" disabled={isPending} />
            Autoriser des collaborateurs à modifier la liste
          </label>
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
            {isPending ? "Création en cours..." : "Créer la liste"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ListCreateForm;

