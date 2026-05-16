/**
 * Helpers purs pour les formulaires de la feature discover.
 * Extraits pour permettre des tests unitaires sans rendu DOM.
 */

export type DirtyFormState = {
  rating: number;
  reviewContent: string;
  recommendIds: string[];
};

/**
 * Indique si l'utilisateur a saisi quelque chose dans le form actions-sheet.
 * Sert à demander confirmation avant fermeture.
 */
export const isDiscoverActionsFormDirty = (state: DirtyFormState): boolean => {
  if (state.rating > 0) return true;
  if (state.reviewContent.trim().length > 0) return true;
  if (state.recommendIds.length > 0) return true;
  return false;
};

/**
 * Toggle l'appartenance d'un id dans une liste (immutable).
 * Utilisé pour les sélections multi-utilisateurs (recommendations).
 */
export const toggleArrayMember = <T>(list: T[], value: T): T[] =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
