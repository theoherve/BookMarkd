import type { FeedActivity } from "@/features/feed/types";
import { formatRating } from "@/lib/utils";

const getBookKey = (a: FeedActivity): string | null => {
  if (a.bookId) return a.bookId;
  if (a.bookTitle && a.bookAuthor) return `${a.bookTitle}|${a.bookAuthor}`;
  return null;
};

const getActivityPhrase = (a: FeedActivity): string | null => {
  switch (a.type) {
    case "status_change":
      return a.note ?? null;
    case "rating":
      return typeof a.rating === "number"
        ? `a mis ${formatRating(a.rating)}/5`
        : null;
    case "review":
      return "a mis un commentaire";
    case "list_update":
      return "a mis à jour une liste";
    case "follow":
      return null;
    default:
      return null;
  }
};

/**
 * Condense activities from the same user about the same book into a single card.
 * E.g. "Delphine a terminé et a mis 5/5" or "Delphine a ajouté à sa liste et a mis un commentaire"
 */
export const condenseActivities = (activities: FeedActivity[]): FeedActivity[] => {
  const bookableActivities = activities.filter((a) => getBookKey(a) !== null);
  const nonBookableActivities = activities.filter((a) => getBookKey(a) === null);

  const groups = new Map<string, FeedActivity[]>();

  for (const activity of bookableActivities) {
    const bookKey = getBookKey(activity)!;
    const groupKey = `${activity.userName}|${bookKey}`;
    const existing = groups.get(groupKey) ?? [];
    existing.push(activity);
    groups.set(groupKey, existing);
  }

  const condensed: FeedActivity[] = [];

  for (const [, groupActivities] of groups) {
    const sorted = [...groupActivities].sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );

    const primary = sorted[0]!;
    const statusPhrase = sorted.find((a) => a.type === "status_change")
      ? getActivityPhrase(sorted.find((a) => a.type === "status_change")!)
      : null;
    const ratingPhrase = sorted.find((a) => a.type === "rating")
      ? getActivityPhrase(sorted.find((a) => a.type === "rating")!)
      : null;
    const reviewPhrase = sorted.find((a) => a.type === "review")
      ? getActivityPhrase(sorted.find((a) => a.type === "review")!)
      : null;
    const listPhrase = sorted.find((a) => a.type === "list_update")
      ? getActivityPhrase(sorted.find((a) => a.type === "list_update")!)
      : null;

    const combinedPhrases = [statusPhrase, ratingPhrase, reviewPhrase, listPhrase].filter(
      (p): p is string => Boolean(p),
    );
    const combinedAction =
      combinedPhrases.length > 0 ? combinedPhrases.join(" et ") : null;

    const ratingActivity = sorted.find((a) => a.type === "rating");
    const reviewActivity = sorted.find((a) => a.type === "review");

    condensed.push({
      ...primary,
      id: `condensed-${primary.id}-${sorted.map((a) => a.id).join("-")}`,
      rating: ratingActivity?.rating ?? primary.rating ?? null,
      note: reviewActivity?.note ?? null,
      occurredAt: primary.occurredAt,
      combinedAction,
    });
  }

  const allCondensed = [...condensed, ...nonBookableActivities].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  return allCondensed;
};
