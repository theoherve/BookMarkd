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
