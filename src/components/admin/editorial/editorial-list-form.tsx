"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEditorialList, updateEditorialList } from "@/server/actions/admin/editorial";
import type { EditorialListType } from "@/types/editorial";

type Props = {
  // For edit mode
  listId?: string;
  defaultValues?: {
    title?: string;
    description?: string | null;
    type?: EditorialListType;
    badgeLabel?: string | null;
    expiresAt?: string | null;
    displayOrder?: number;
  };
};

export const EditorialListForm = ({ listId, defaultValues }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [type, setType] = useState<EditorialListType>(defaultValues?.type ?? "selection");
  const [badgeLabel, setBadgeLabel] = useState(defaultValues?.badgeLabel ?? "");
  const [expiresAt, setExpiresAt] = useState(
    defaultValues?.expiresAt ? defaultValues.expiresAt.split("T")[0] : ""
  );
  const [displayOrder, setDisplayOrder] = useState(
    String(defaultValues?.displayOrder ?? 0)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const payload = {
        title,
        description: description || null,
        type,
        badgeLabel: badgeLabel || null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        displayOrder: parseInt(displayOrder, 10) || 0,
      };

      if (listId) {
        const result = await updateEditorialList(listId, payload);
        if (!result.success) {
          setError(result.message);
          return;
        }
        router.refresh();
      } else {
        const result = await createEditorialList({ ...payload, source: "manual" });
        if (!result.success) {
          setError(result.message);
          return;
        }
        router.push(`/admin/tendances/${result.listId}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Prix Goncourt 2025 — Sélection finale"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brève description affichée sous le titre..."
            rows={3}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as EditorialListType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bestseller">Best-seller</SelectItem>
                <SelectItem value="award">Prix littéraire</SelectItem>
                <SelectItem value="selection">Sélection éditoriale</SelectItem>
                <SelectItem value="new_releases">Nouveautés</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="badge-label">Badge personnalisé</Label>
            <Input
              id="badge-label"
              value={badgeLabel}
              onChange={(e) => setBadgeLabel(e.target.value)}
              placeholder="Ex : Goncourt, Rentrée 2025..."
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="expires-at">Expire le (optionnel)</Label>
            <Input
              id="expires-at"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              La liste sera masquée de la home après cette date.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-order">Ordre d&apos;affichage</Label>
            <Input
              id="display-order"
              type="number"
              min={0}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Plus petit = affiché en premier.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending || !title.trim()}>
          {isPending ? "Enregistrement..." : listId ? "Enregistrer" : "Créer la liste"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
};
