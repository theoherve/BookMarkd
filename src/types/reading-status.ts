export type ReadingStatus = "to_read" | "reading" | "finished" | "dnf";

export const READING_STATUSES: readonly ReadingStatus[] = [
  "to_read",
  "reading",
  "finished",
  "dnf",
] as const;
