# COMPONENTS UI

Catalogue des composants React (client/server) organisés par besoins métiers. Tous utilisent TailwindCSS 4 et shadcn/ui pour cohérence visuelle et accessibilité.

## Base (shadcn/ui & Radix wrappers)

- `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `Dialog`, `Drawer`, `Tabs`, `Skeleton`, `Badge`, `DropdownMenu`, `Tooltip`.
- `RatingStars` (Radix Slider custom) pour notes sur 5.
- `Avatar` (Radix + fallback initiales).
- `EmptyState`, `ErrorState`, `LoadingSpinner`.

## Layout

- `AppShell` : header, sidebar (navigation Feed/Recherche/Listes/Profil), zone contenu.
- `TopNav`, `SideNav`, `MobileNav`, `Footer`.
- `FeedColumn` : wrapper à trois colonnes responsives.

## Modules Feed

- `ActivityCard` : affiche action (ami a noté, commenté).
- `BookFeedCard` : couverture, titre, meta, CTA (ajouter, noter, commenter).
- `RecommendationCard` : suggestion “Si vous avez aimé…”.
- `CommentPreview` : extrait commentaire + likes.

## Modules Livre

- `BookHeader` : visuel, titre, auteur, CTA.
- `BookMetaGrid` : genres, tags, année, moyenne.
- `ReadingStatusSelector` : options À lire / En cours / Lu.
- `RatingInput` : notation 0.5 à 5.
- `ReviewComposer` : éditeur commentaire (public / amis / privé).
- `ReviewList` : affiche commentaires filtrables.
- `ReaderList` : avatars des lecteurs.

## Modules Profil

- `ProfileHeader` : avatar, bio, stats (livres lus, listes).
- `ActivityTimeline` : journal d’activité.
- `ShelfPreview` : carrousel des lectures récentes.

## Modules Recherche

- `SearchBar` : input + suggestions.
- `FilterDrawer` : filtres genre, auteur, note, statut.
- `ResultList` & `ResultCard`.

## Modules Listes

- `ListCard` : résumé d’une liste + auteurs.
- `ListDetailHeader` : infos, partage, follow de liste.
- `ListEditor` : création/édition drag & drop.

## Feedback & Système

- `Toast` notifications (shadcn provider).
- `ConfirmDialog` (suppression, reset).
- `InfiniteScrollTrigger` : intersection observer pour feed.

## Hooks utilitaires

- `useDialogState`, `useRating`, `useReadingStatus`, `useListBuilder`.
- `useAuth`, `useFeatureFlags`, `useRecommendations`.

Tous les composants doivent être documentés avec Storybook et testés via Playwright/RTL selon criticité.


