# Migration Open Library → Google Books

Document de cadrage pour basculer (ou compléter) la recherche externe en utilisant l’API Google Books, tout en conservant un fallback Open Library.

## Objectifs

1. Pouvoir interroger Google Books en parallèle ou à la place d’Open Library.
2. Importer un livre Google Books dans le catalogue Supabase (cover, description, ISBN).
3. Permettre un “switch” configurable entre Open Library et Google Books.
4. Respecter les contraintes d’attribution et de quotas Google.

## Étapes techniques

### 1. Préparation
- Créer un projet Google Cloud + activer “Books API”.
- Générer une clé API (usage restreint) → `GOOGLE_BOOKS_API_KEY`.
- Mettre à jour `.env` (exemple dans README).
- Vérifier quotas (1k requêtes/jour gratuits) et besoin éventuel de facturation.

### 2. Client Google Books
- Nouveau module `src/lib/google-books.ts` :
  - `searchGoogleBooks(query: string, options)` → retourne une liste normalisée.
  - Mapper `volumeInfo` → `title`, `authors[0]`, `description`, `publishedDate`, `imageLinks.thumbnail`, `industryIdentifiers`.
  - Gérer fallback (pas d’auteur, aucun visuel) et normaliser les dates (année).
  - Respecter les champs obligatoires (lien canonical, attribution).

### 3. Point d’entrée API
- Modifier `/api/books/search` :
  - Ajouter paramètre `provider=google|openlibrary|both`.
  - Si `google`, appeler `searchGoogleBooks`; si `both`, fusionner et dédupliquer via ISBN/title.
  - Documenter nouvelle réponse (source `google_books`).
  - Conserver la logique actuelle (Supabase d’abord, fallback externe si besoin).

### 4. Import Supabase
- Étendre `importOpenLibraryBook` → `importExternalBook` :
  - Gérer Google Books (stockage `google_books_id`, ISBN).
  - Télécharger image (optionnel) vers Supabase Storage.
  - Pré-remplir tags (sujet / categories Google) si existants.

### 5. UI & Config
- Mettre à jour `SearchClient` :
  - Dropdown “Source externe” (`Open Library`, `Google Books`, `Les deux`).
  - Adapter `ImportOpenLibraryButton` → `ImportExternalBookButton`.
- Ajouter attribut visuel (logo Google?) si requis par CGU.
- Permettre de basculer via feature flag/env variable (ex. `NEXT_PUBLIC_SEARCH_PROVIDER=google`).

### 6. Tests
- Unitaires : mapping Google Books → `SearchBook`.
- API `/api/books/search` avec provider `google`.
- E2E : recherche + import Google Books sur `/search`.
- Vérifier quotas via mocks/stubs (ne pas taper l’API en CI).

### 7. Documentation
- Mettre à jour `README` (clé API, budget).
- `docs/API.md` pour le nouveau param `provider`.
- `docs/COMPONENTS.md` pour les nouveaux boutons.
- `docs/task-list/TASKS.md` : incrémenter la checklist.

### 8. Risques & contraintes
- **Quota** : limiter le nombre de requêtes (cache Supabase, throttle).
- **Attribution** : vérifier les obligations de Google (titre “Powered by Google Books” si exigé).
- **Coût** : API gratuite jusqu’à ~1k requêtes/jour. Prévoir facturation si usage intense.
- **Temps d’implémentation estimé** : 1 à 2 jours dev (client + backend + UI + tests) + QA.

> TODO bonus : proposer un mode “hybride” (Google par défaut, fallback Open Library si quota dépassé / aucun résultat).


