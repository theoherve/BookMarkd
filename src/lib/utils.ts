import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const formatRating = (rating: number): string => {
  if (rating === 0) {
    return "0";
  }
  return rating.toFixed(1);
};
