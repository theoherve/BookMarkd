"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  upsertBookFeelings,
  createFeelingKeyword,
} from "@/server/actions/book";

type FeelingKeyword = {
  id: string;
  label: string;
  slug: string;
  source: "admin" | "user";
};

type BookFeeling = {
  id: string;
  keyword: FeelingKeyword;
  userId: string;
  userDisplayName: string;
  visibility: "public" | "friends" | "private";
  createdAt: string;
};

type BookFeelingsSectionProps = {
  bookId: string;
  availableKeywords: FeelingKeyword[];
  viewerFeelings: string[]; // IDs des keywords sélectionnés par le viewer
  viewerFeelingsVisibility: "public" | "friends" | "private"; // Visibilité des feelings du viewer
  allFeelings: BookFeeling[]; // Tous les feelings visibles selon la visibilité
  viewerId?: string | null;
};

const KeywordPicker = ({
  bookId,
  availableKeywords,
  initialSelectedIds,
  initialVisibility,
  onSuccess,
}: {
  bookId: string;
  availableKeywords: FeelingKeyword[];
  initialSelectedIds: string[];
  initialVisibility: "public" | "friends" | "private";
  onSuccess: (keywords: FeelingKeyword[]) => void;
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialSelectedIds),
  );
  const [visibility, setVisibility] = useState(initialVisibility);
  const [customKeyword, setCustomKeyword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [showAllKeywords, setShowAllKeywords] = useState(false);

  // Afficher les 15 premiers mots-clés par défaut
  const INITIAL_KEYWORDS_COUNT = 15;
  const displayedKeywords = showAllKeywords
    ? availableKeywords
    : availableKeywords.slice(0, INITIAL_KEYWORDS_COUNT);
  const hasMoreKeywords = availableKeywords.length > INITIAL_KEYWORDS_COUNT;

  const handleToggleKeyword = (keywordId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(keywordId)) {
        next.delete(keywordId);
      } else {
        next.add(keywordId);
      }
      return next;
    });
  };

  const handleKeyDown = (
    event: React.KeyboardEvent,
    keywordId: string,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggleKeyword(keywordId);
    }
  };

  const handleAddCustomKeyword = async () => {
    if (!customKeyword.trim()) {
      setFeedback("Veuillez saisir un mot-clé.");
      return;
    }

    setIsAddingCustom(true);
    startTransition(async () => {
      const result = await createFeelingKeyword(customKeyword.trim());
      if (result.success) {
        setSelectedIds((prev) => new Set([...prev, result.keyword.id]));
        setCustomKeyword("");
        setFeedback(null);
      } else {
        setFeedback(result.message);
      }
      setIsAddingCustom(false);
    });
  };

  const handleSubmit = () => {
    if (selectedIds.size === 0) {
      setFeedback("Sélectionnez au moins un mot-clé ou annulez.");
      return;
    }

    startTransition(async () => {
      const result = await upsertBookFeelings(
        bookId,
        Array.from(selectedIds),
        visibility,
      );
      if (result.success) {
        setFeedback("Mots-clés sauvegardés ✅");
        onSuccess(result.keywords);
      } else {
        setFeedback(result.message);
      }
    });
  };

  return (
    <div className="space-y-4 rounded-3xl border border-border/60 bg-card/60 p-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Sélectionnez les mots-clés qui décrivent votre ressenti
        </label>
        <div className="flex flex-wrap gap-2">
          {displayedKeywords.map((keyword) => {
            const isSelected = selectedIds.has(keyword.id);
            return (
              <Button
                key={keyword.id}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleKeyword(keyword.id)}
                onKeyDown={(e) => handleKeyDown(e, keyword.id)}
                aria-pressed={isSelected}
                role="checkbox"
                tabIndex={0}
                className="text-sm"
              >
                {keyword.label}
              </Button>
            );
          })}
        </div>
        {hasMoreKeywords ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAllKeywords(!showAllKeywords)}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {showAllKeywords
              ? "Masquer"
              : `Afficher tous (${availableKeywords.length - INITIAL_KEYWORDS_COUNT} de plus)`}
          </Button>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Ajouter un mot-clé personnalisé
        </label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={customKeyword}
            onChange={(e) => setCustomKeyword(e.target.value)}
            placeholder="Ex: Envoûtant, Bouleversant..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomKeyword();
              }
            }}
            disabled={isAddingCustom || isPending}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddCustomKeyword}
            disabled={isAddingCustom || isPending || !customKeyword.trim()}
          >
            {isAddingCustom ? "Ajout..." : "Ajouter"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <label className="flex items-center gap-2">
          Visibilité
          <select
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as typeof visibility)
            }
            className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            disabled={isPending}
          >
            <option value="public">Publique</option>
            <option value="friends">Amis</option>
            <option value="private">Privée</option>
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || selectedIds.size === 0}
        >
          {isPending ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
        {feedback ? (
          <p className="text-xs text-muted-foreground">{feedback}</p>
        ) : null}
      </div>
    </div>
  );
};

const KeywordCloud = ({
  feelings,
  viewerId,
}: {
  feelings: BookFeeling[];
  viewerId?: string | null;
}) => {
  // Agréger les feelings par keyword
  const aggregated = feelings.reduce(
    (acc, feeling) => {
      const keywordId = feeling.keyword.id;
      if (!acc[keywordId]) {
        acc[keywordId] = {
          keyword: feeling.keyword,
          count: 0,
          users: new Set<string>(),
          sampleUsers: [] as Array<{ id: string; displayName: string }>,
        };
      }
      acc[keywordId].count += 1;
      acc[keywordId].users.add(feeling.userId);
      // Garder max 3 utilisateurs pour l'affichage
      if (acc[keywordId].sampleUsers.length < 3) {
        acc[keywordId].sampleUsers.push({
          id: feeling.userId,
          displayName: feeling.userDisplayName,
        });
      }
      return acc;
    },
    {} as Record<
      string,
      {
        keyword: FeelingKeyword;
        count: number;
        users: Set<string>;
        sampleUsers: Array<{ id: string; displayName: string }>;
      }
    >,
  );

  const sortedKeywords = Object.values(aggregated).sort((a, b) => {
    // Trier par count décroissant, puis par label alphabétique
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.keyword.label.localeCompare(b.keyword.label);
  });

  if (sortedKeywords.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/60 bg-card/60 p-8 text-sm text-muted-foreground">
        Aucun mot-clé pour le moment. Soyez le premier à partager votre ressenti !
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sortedKeywords.map((item) => {
        const userList = item.sampleUsers
          .map((u) => u.displayName)
          .join(", ");
        const moreCount = item.users.size - item.sampleUsers.length;
        const tooltipText =
          moreCount > 0
            ? `${userList} et ${moreCount} autre${moreCount > 1 ? "s" : ""}`
            : userList;

        return (
          <Tooltip key={item.keyword.id}>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="cursor-default text-sm font-medium"
              >
                {item.keyword.label} · {item.count}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};

const BookFeelingsSection = ({
  bookId,
  availableKeywords,
  viewerFeelings,
  viewerFeelingsVisibility,
  allFeelings,
  viewerId,
}: BookFeelingsSectionProps) => {
  const [currentViewerFeelings, setCurrentViewerFeelings] =
    useState<string[]>(viewerFeelings);

  const handleFeelingsUpdate = (keywords: FeelingKeyword[]) => {
    setCurrentViewerFeelings(keywords.map((k) => k.id));
    // Recharger la page pour mettre à jour l'affichage
    window.location.reload();
  };

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">
          Mots-clés ressentis
        </h2>
        <p className="text-sm text-muted-foreground">
          Sélectionnez les adjectifs qui décrivent votre ressenti ou ajoutez-en
          de nouveaux.
        </p>
      </div>

      {viewerId ? (
        <KeywordPicker
          bookId={bookId}
          availableKeywords={availableKeywords}
          initialSelectedIds={currentViewerFeelings}
          initialVisibility={viewerFeelingsVisibility}
          onSuccess={handleFeelingsUpdate}
        />
      ) : (
        <div className="rounded-3xl border border-dashed border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
          Connectez-vous pour ajouter vos mots-clés de ressenti.
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">
          Mots-clés de la communauté
        </h3>
        <KeywordCloud feelings={allFeelings} viewerId={viewerId} />
      </div>
    </section>
  );
};

export default BookFeelingsSection;

