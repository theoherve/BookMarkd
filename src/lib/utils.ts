import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

/** Affiche la note sans .0 si entière (ex: 5), avec une décimale sinon (ex: 3.5). */
export const formatRating = (rating: number): string => {
  if (rating === 0) {
    return "0";
  }
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
};

export const getInitials = (name: string | null | undefined): string => {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};
