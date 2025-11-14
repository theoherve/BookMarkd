# ARCHITECTURE

## Vision

BookMarkd s’articule autour d’un socle Next.js 14 (App Router) avec rendu hybride (SSR/ISR) pour offrir un feed social réactif, des pages livres indexables et une expérience fluide. Les données persistent dans PostgreSQL (Supabase) avec un ORM type Drizzle. Les interactions temps réel (activités, recommandations) pourront évoluer vers des subscriptions Supabase ou Pusher.

## Couches applicatives

- **UI / Présentation** : composants React server et client, stylés avec TailwindCSS 4, shadcn/ui (Radix).
- **State client** : Zustand pour la UI locale, TanStack Query pour la donnée asynchrone (cache, mutations).
- **Logique métier** : Server Actions + tRPC/Route Handlers Next.js (selon choix final, voir API).
- **Persistance** : PostgreSQL (Supabase) + storage (covers / avatars). SQLite utilisable en local.
- **Intégrations externes** : Open Library (search, metadata), NextAuth (auth), Stripe (abonnement futur).

## Structure des dossiers Next.js (App Router)

```
src/
  app/
    (marketing)/
    (app)/
      feed/
      books/
        [bookId]/
      profiles/
        [username]/
      search/
      lists/
        [listId]/
      settings/
    api/
      auth/[...nextauth]/
      books/
      lists/
      recommendations/
  components/
    ui/        <- shadcn générés
    modules/   <- composants métiers
    layout/
  lib/
    auth/
    db/
    validation/
    api/
  server/
    actions/
    services/
    mappers/
  stores/      <- Zustand
  hooks/
  types/
  styles/
```

## Gestion de l’état

- **TanStack Query** pour les listes (feed, recherche, livres, listes) avec clés dérivées.
- **Zustand** pour états UI : filtres en cours, modals, toasts, wizard de création de listes.
- **Server Actions / Mutations** : actions `handleRateBook`, `handleToggleFollow`, etc., qui invalident les caches Query.

## Flux de données

1. L’utilisateur charge la page `feed`. SSR récupère activités récentes (Server Component).
2. Le client hydrate TanStack Query pour rafraîchir en temps réel (refetch / websockets).
3. Les interactions (notation, commentaire) appellent une Server Action → service → repo DB.
4. Notifications (futur) dispatchées via table `notifications` + websocket.

## Configuration environnement

- `BOOK_MARKD_POSTGRES_URL_NON_POOLING` (PostgreSQL)
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `OPEN_LIBRARY_API_URL`
- `SUPABASE_*` si usage Supabase client
- `STRIPE_*` (optionnel futur)

## Qualité & DX

- ESLint / Prettier / TypeScript strict.
- Vitest + React Testing Library.
- Storybook pour composants UI.
- CI (GitHub Actions) : lint, test, build, preview deploy.
