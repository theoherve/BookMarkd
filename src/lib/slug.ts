/**
 * Génère un slug à partir d'un titre et d'un auteur
 * Format: titre-livre-par-auteur
 */
export const generateBookSlug = (title: string, author: string): string => {
  const normalize = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
      .replace(/[^a-z0-9]+/g, "-") // Remplace les caractères non alphanumériques par des tirets
      .replace(/^-+|-+$/g, ""); // Supprime les tirets en début et fin
  };

  const normalizedTitle = normalize(title);
  const normalizedAuthor = normalize(author);

  return `${normalizedTitle}-par-${normalizedAuthor}`;
};

/**
 * Extrait l'ID d'un slug si c'est un UUID, sinon retourne le slug tel quel
 * Permet la rétrocompatibilité avec les anciennes URLs
 */
export const extractBookIdFromSlug = (slug: string): string | null => {
  // Vérifier si c'est un UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(slug)) {
    return slug;
  }
  return null;
};

