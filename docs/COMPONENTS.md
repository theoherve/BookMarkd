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

- `ReadingStatusForm` : boutons À lire / En cours / Terminé (Server Action).
- `RatingForm` : notation étoilée + demi-point.
- `ReviewForm` : rédaction d’un avis (spoiler, visibilité).
- `ReviewsList` : affiche avis + commentaires imbriqués.
- `AddToReadlistButton` : CTA rapide (présent aussi dans la recherche).

## Modules Profil

- `ProfileHeader` : avatar, bio, stats (livres lus, listes).
- `ActivityTimeline` : journal d’activité.
- `ShelfPreview` : carrousel des lectures récentes.

## Modules Recherche

- `SearchClient` : formulaire + filtres (genre, external).
- `SearchResultCard` : carte mixte Supabase / Open Library.
- `ImportOpenLibraryButton` : import direct d’un ouvrage externe.
- `AddToReadlistButton` : réutilisé pour les résultats BookMarkd.

## Auth

- `LoginForm` : connexion credentials.
- `SignUpForm` : création compte credentials (validation client + feedback).

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


