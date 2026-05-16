# Gestion des couvertures de livres

Système automatique de récupération + upload des couvertures manquantes vers Supabase Storage, avec fallback manuel pour les livres introuvables.

---

## Vue d'ensemble

Chaque livre dans BookMarkd doit avoir une couverture. Il existe **3 façons** de remplir le champ `cover_url` :

1. **À l'import** (auto) — déclenché quand un livre est importé sans cover via Google Books ou Open Library
2. **Script batch** (manuel) — pour rattraper les livres existants sans cover
3. **Upload manuel** (UI) — bouton "Ajouter une couverture" sur la page du livre, pour les cas où aucune source publique n'a la cover

Toutes les covers sont uploadées dans le bucket Supabase Storage `covers` sous `{bookId}.{ext}`. Le champ `books.cover_url` pointe vers l'URL publique Supabase.

---

## Sources tentées (dans l'ordre)

| # | Source | Quand |
|---|--------|-------|
| 1 | Open Library by ISBN | Si `isbn` connu, endpoint direct `/b/isbn/{isbn}-L.jpg` |
| 2 | Open Library search (title + author) | Fallback chain : `cover_i` → `cover_edition_key` → `isbn` → `edition_key` |
| 3 | Google Books hi-res (zoom=3) | Si `google_books_id` connu |
| 4 | Google Books search (title + author) | Consomme quota Google (1000 req/jour), retry 1× après 503 |

Si toutes les sources échouent, le système :
- Supprime le fichier placeholder existant dans Supabase Storage
- Met `books.cover_url = NULL` en DB
- L'UI affiche le fallback BookMarkd ("Pas de couverture / Ajouter une couverture")

---

## Détection placeholder

Une cover est considérée "manquante" si :

- `cover_url` est `NULL` ou vide
- URL contient `image not available`
- URL Google Books sans `id=` param
- URL Supabase Storage qui pointe vers un fichier `< 12 KB` (probable placeholder précédemment uploadé)
- Buffer téléchargé `< 4 KB` OU taille `~9103 bytes ± 200` (signature exacte du placeholder Google "image not available" 575×750 grayscale)

---

## Auto-trigger à l'import

Les server actions suivantes lancent automatiquement la recherche de cover après insertion d'un livre :

- [src/server/actions/import-google-books.ts](../src/server/actions/import-google-books.ts) — import depuis Google Books
- [src/server/actions/import-open-library.ts](../src/server/actions/import-open-library.ts) — import depuis Open Library

Le timeout est de **3.5 s**. Si toutes les sources sont lentes ou échouent, l'import retourne sans bloquer ; le livre est créé sans cover et peut être rattrapé via le script batch.

---

## Script batch : rattraper les livres existants

### Lancer le script

```bash
pnpm covers:find-missing
```

Le script parcourt **toute la table `books`** et applique la même logique de détection + recherche que l'import auto.

### Options disponibles

| Flag | Défaut | Description |
|------|--------|-------------|
| `--dry-run` | off | Log uniquement, n'upload rien et ne modifie pas la DB |
| `--batch-size=N` | `50` | Taille de chaque page Supabase |
| `--limit=N` | aucun | Cap le total de livres traités (utile pour tester) |
| `--delay-ms=N` | `800` | Pause entre chaque livre (rate-limit doux) |

### Exemples

```bash
# Aperçu sec sur les 20 premiers livres
pnpm covers:find-missing -- --dry-run --limit=20

# Run avec rate-limit lent (1 livre / sec)
pnpm covers:find-missing -- --delay-ms=1000

# Debug verbeux (montre chaque source tentée, taille DL, raison d'échec)
DEBUG_COVERS=1 pnpm covers:find-missing
```

### Sortie

À la fin du script :

```
[covers-backfill] summary
  total seen   : 174       # livres scannés
  missing      : 14        # livres détectés sans cover valide
  fixed        : 8         # covers trouvées + uploadées avec succès
  failed       : 6         # toutes sources ont échoué
  per source   : { 'google-books-search': 5, 'open-library-isbn': 2, 'open-library-search': 1 }
```

---

## Upload manuel (livres introuvables)

Pour les livres niches non indexés (petits éditeurs, tirages limités, livres anciens), aucune source publique n'a la cover. Dans ce cas :

1. Ouvrir la page du livre `/books/{slug}`
2. Cliquer sur **"Ajouter une couverture"** dans le bloc cover
3. Sélectionner une image locale (JPG, PNG, WebP)
4. Le fichier est uploadé directement dans Supabase Storage, `books.cover_url` est mis à jour

Composant : [src/components/books/add-book-cover-button.tsx](../src/components/books/add-book-cover-button.tsx)

---

## Configuration requise

### Variables d'environnement

```bash
# Supabase (obligatoire)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Google Books (recommandé — quota gratuit 1000/jour)
GOOGLE_BOOKS_API_KEY=
```

Voir [GOOGLE_BOOKS_SETUP.md](./GOOGLE_BOOKS_SETUP.md) pour activer l'API Google Books.

### Bucket Supabase Storage

Le bucket `covers` doit exister et être **public en lecture**. Voir [src/lib/storage/storage.ts](../src/lib/storage/storage.ts) pour les helpers d'upload.

---

## Architecture du code

```
src/lib/covers/
├── placeholder-detect.ts          # détection cover manquante / placeholder (sync + async HEAD)
├── find-missing-cover.ts          # orchestrator : try sources → download → upload Supabase → update DB
└── sources/
    ├── open-library.ts            # ISBN + title/author search avec fallback chain
    ├── google-books-hires.ts      # construit URL zoom=3 depuis google_books_id
    └── google-books-search.ts     # search API + retry 1× après 503

scripts/
└── backfill-missing-covers.ts     # script CLI pour rattraper les livres existants
```

---

## Debug

Si une cover n'est pas trouvée et que vous suspectez un bug :

```bash
DEBUG_COVERS=1 pnpm covers:find-missing -- --limit=5
```

Logs verbeux par source :
- `[covers/open-library]` — HEAD status, fields renvoyés, fallback utilisé
- `[covers/google-books-search]` — quota status, query, résultats
- `[covers/debug]` — pipeline orchestrator (URL trouvée, taille DL, raison d'exclusion)

Erreurs typiques :
- `download too small 9103B` — Google a retourné son placeholder grayscale au lieu de la vraie cover
- `download !ok 404` — la source n'a pas la cover pour cet ISBN/edition
- `quota exhausted` — limite Google Books atteinte pour la journée, retentez demain ou attendez le retry auto

---

## Limites connues

- **Long tail FR** (petits éditeurs, niches) — non indexés par Open Library ni Google Books → upload manuel requis
- **Babelio** — JS-rendered, non scrapable sans browser headless ; non utilisé
- **Amazon / Fnac** — bloquent les requêtes server-side via TOS et headers anti-bot ; non utilisés
- **Quota Google Books** — 1000 req/jour partagés avec la recherche/import. Si saturé, le script échoue silencieusement sur cette source
