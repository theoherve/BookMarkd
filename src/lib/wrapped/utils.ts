/**
 * Retourne l'année courante pour le wrapped
 */
export const getCurrentWrappedYear = (): number => {
  return new Date().getFullYear();
};

/**
 * Vérifie si l'année est valide (pas dans le futur)
 */
export const isValidYear = (year: number): boolean => {
  const currentYear = getCurrentWrappedYear();
  return year <= currentYear;
};

import db from "@/lib/supabase/db";

/**
 * Retourne les années disponibles pour un utilisateur
 * Basé sur les années où il a terminé au moins un livre
 */
export const getAvailableYears = async (userId: string): Promise<number[]> => {
  try {
    const { data, error } = await db.client
      .from("user_books")
      .select("updated_at")
      .eq("user_id", userId)
      .eq("status", "finished")
      .not("updated_at", "is", null);

    if (error) {
      console.error("[wrapped] Error fetching available years:", error);
      return [getCurrentWrappedYear()];
    }

    const years = new Set<number>();
    const currentYear = getCurrentWrappedYear();

    // Toujours inclure l'année courante
    years.add(currentYear);

    (data ?? []).forEach((row) => {
      const date = new Date(row.updated_at as string);
      const year = date.getFullYear();
      if (year <= currentYear) {
        years.add(year);
      }
    });

    return Array.from(years).sort((a, b) => b - a); // Tri décroissant
  } catch (error) {
    console.error("[wrapped] Unexpected error fetching available years:", error);
    return [getCurrentWrappedYear()];
  }
};
