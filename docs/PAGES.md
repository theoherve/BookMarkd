# PAGES (Next.js App Router)

Aperçu des routes principales, stratégie de rendu et données nécessaires.

## `/` – Feed principal

- **Segments** : `(app)/feed`.
- **Rendu** : Server Component (SSR) + revalidation 60s, hydration Query pour updates.
- **Sections** : Activités, Lectures amis, Recos globales (3 colonnes).
- **Données** : activités (suivis), lectures récentes, recommandations personnalisées.
- **Actions** : suivre/unfollow, changer statut, noter, commenter.

## `/books/[bookId]`

- **Rendu** : Server Component (ISR 5 min) + segments clients pour notation/commentaire.
- **Données** : fiche livre (Open Library + DB), moyenne, commentaires, lecteurs.
- **Actions** : `handleRateBook`, `handleUpdateStatus`, `handleCreateReview`.

## `/profiles/[username]`

- **Rendu** : SSR (profil public), avec fallback pour profils privés.
- **Données** : bio, stats, timeline, listes publiques, lectures récentes.
- **Actions** : `handleToggleFollow`, `handleRequestFriend` (futur).

## `/search`

- **Rendu** : AppShell (server) + client SearchClient (TanStack Query).
- **Données** : API `/api/books/search` (Supabase + fallback Open Library), `/api/tags`.
- **Filtres** : texte, genre (tags), inclusion Open Library.
- **Actions** : ajouter à la readlist, noter, commenter (CTA placeholder).

## `/lists`

- **Rendu** : Server Component (listes publiques + personnelles).
- **Sous-routes** :
  - `/lists/create`
  - `/lists/[listId]` (SSR + revalidation 120s)
  - `/lists/[listId]/edit` (client).
- **Données** : métadonnées liste, livres, permissions.
- **Actions** : `handleCreateList`, `handleUpdateList`, `handleShareList`.

## `/settings`

- **Sections** : profil, préférences, notifications (futur), sécurité.
- **Rendu** : Server Action forms pour updates.

## `(marketing)` routes

- Landing publique, FAQ, pricing (pour future offre premium).
- Static generation (build time).

## API Routes

- Déclarées dans `app/api/...` (voir `API.md`).

## Internationalisation

- i18next + `next-intl` (futur). Structure pour `fr`, `en`.
- Détection via header + préférences utilisateur.

## Accessibilité & Responsive

- Layout 3 colonnes → stack mobile/tablette.
- Navigation clavier complète, aria-labels sur CTA.
- High contrast mode via `data-theme` & Tailwind tokens.


