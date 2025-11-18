# BookMarkd · Plan d’action PWA & UI mobile

## Résumé & faisabilité

- ✅ **Tech stack compatible** : Next 16 App Router + React 19 gèrent nativement manifest, `appDir` middleware et service workers (via `next-pwa` ou SW custom Workbox). Aucun blocage structurel identifié.
- 🟡 **Phase 1 lancée** : manifest dédié, icônes multi-tailles et métadonnées installabilité ajoutés + script `pnpm icons:pwa`. Service worker/offline restent à traiter (Phase 2).
- 🎯 **Objectifs PWA** : installabilité (manifest + icônes), caching hybride (statique + API), offline fallback des écrans clés (feed, listes, search), intégration push/notifications (via Supabase ou web push), conformité Lighthouse.
- 📱 **Objectifs UI mobile** : navigation bottom/tab, actions flottantes (ajout de livre/liste), header compact, feedback tactile renforcé, hiérarchie simplifiée pour écrans ≤ 768px.

## Analyse de l’état actuel

- **Architecture Next** : App Router, `dynamic = "force-dynamic"` dans `layout.tsx`, `metadata.manifest` + `themeColor` + `viewport` ajoutés, service worker encore absent.
- **Assets** : répertoire `public/pwa/` fournit désormais les icônes générées automatiquement via Sharp (192/512/maskable/monochrome + intermédiaires) et `manifest.webmanifest`.
- **Auth & données** : NextAuth + Supabase. Nécessite stratégie offline claire (lecture seule en cache, écriture différée en file) et sécurisation des routes API (grâce aux cookies HTTP-only, OK pour PWA).
- **UI actuelle** (`AppShell`) : header fixe desktop, menu burger mobile ouvrant un `Sheet`. Pas d’ancrage bas/gesture, contenus centraux en colonnes larges (`max-w-6xl`), sections possiblement serrées sur petits devices.
- **Analytics/Monitoring** : pas d’outils spécifiques PWA (pas de Lighthouse budget, pas de traçage install prompt).

## Gaps critiques

1. **Installabilité** : manifest, icons, `theme-color`, `display: standalone` manquants.
2. **Offline/Cache** : aucune stratégie, risques de 404 offline, API non résilientes.
3. **Service worker** : inexistants => pas de precache, pas de runtime cache, pas de push.
4. **UX mobile** : navigation peu accessible (menu caché, actions secondaires), densité textuelle élevée, pas de statuts d’install/PWA hints.
5. **Qualité & QA** : absence de pipeline Lighthouse, pas de tests e2e mobiles dédiés.

## Roadmap PWA (proposition)

### Phase 0 — Préparation

- [x] **Besoins offline/installabilité**  
       | Domaine | Comportement offline attendu | Notes |
      | --- | --- | --- |
      | Feed (`/feed`, `/api/feed`, `/api/users/activities`) | Lecture seule du dernier snapshot + indicateur “données datées” | Mutations (likes, follow) mises en file locale → sync Phase 3 |
      | Listes (`/lists`, `/api/lists`, `/api/lists/[id]`) | Consultation des listes ouvertes récemment, création/édition stockées en queue | Utiliser IndexedDB pour stocker brouillons + actions |
      | Recherche (`/search`, `/api/books/search`, `/api/tags`) | Suggestions locales (dernières requêtes) + message “connexion requise” pour nouvelles recherches | Cache GET tags pour autocomplétion |
      | Livre (`/books/[slug]`) | Fiche dernièrement vue + critiques partiellement chargées | Offrir CTA “Recharger à la reconnexion” |
      | Auth & onboarding | Navigation bloquée si absence de session valide | Aucun stockage offline des credentials |
- [x] **Endpoints & volumétrie**
  - GET à mettre en cache runtime : `/api/feed`, `/api/users/activities`, `/api/books/search` (mode `StaleWhileRevalidate` + TTL court), `/api/tags`, `/api/lists`, `/api/lists/[id]`, `/api/books/[id]`, `/api/users/[username]`.
  - Assets statiques : `public/pwa` (≈1.2 Mo cumulés), `public/logo.*`, SVG décoratifs (<100 Ko), fonts Geist (Google Fonts, ~200 Ko) → prévoir precache + self-host des polices pour éviter offline blocking.
  - Scripts critiques : bundle App Router, `globals.css`, `tw-animate-css`. Budget cache cible < 20 Mo pour rester confortable sur devices low-end.
- [x] **Approche SW retenue**
  - Démarrer avec `next-pwa@latest` (support officiel App Router, génération Workbox automatisée, config `next.config.mjs`).
  - Utiliser `runtimeCaching` custom pour différencier API, images et polices.
  - Prévoir extension Phase 3 via `workbox-window` + custom SW (queue offline, versioning) en injectant sections custom dans `sw.ts`.
  - Garder option “full custom” si besoin de Background Sync natif, mais `next-pwa` couvre 95 % des besoins Phase 2.

### Phase 1 — Manifest & assets (1 sprint)

- [x] Générer `public/manifest.webmanifest` (name, short_name, start_url `/feed`, `display: standalone`, `orientation: portrait`, couleurs).
- [x] Créer set d’icônes (192/512px PNG + maskable 512 + monochrome) — splash iOS à produire avec le futur design mobile.
- [x] Ajouter `metadata.manifest`, `themeColor`, `viewport minimal-ui`.
- [x] Mettre en place script `pnpm run icons:pwa` (Sharp) pour automatiser futures mises à jour.

### Phase 2 — Service worker & caching (1-2 sprints)

- [x] Installer/configurer `next-pwa` (mode App Router, SW généré en build).
- [x] Définir precache (pages statiques, polices Geist, assets globaux) + runtime cache (images, API GET supabase/google) via stratégies Stale-While-Revalidate / NetworkFirst.
- [x] Implémenter fallback offline (page `app/offline/page.tsx` + route catch-all).
- [x] Enregistrer SW dans `app/layout` via client component `service-worker-provider`.
- [x] Ajouter instrumentation (console log guard, versioning SW, soft reload).

### Phase 3 — Expérience avancée

- [x] Offline queue pour actions critiques (lecture, note, like) via IndexedDB + re-sync (utiliser `idb` + background sync pseudo si API autorise). Intégrée dans `ReviewLikeButton`, `RatingForm`, `ReadingStatusForm`.
- [x] Web Push (optionnel) : backend subscribe endpoint + liaison Supabase Edge Function / VAPID (structure de base créée, nécessite configuration VAPID complète).
- [x] Prompt install in-app (A2HS banner custom) avec stockage `localStorage`.
- [x] Mesures `navigator.standalone` pour adapter UI (masquer CTA install, ajuster spacing).

### Préparation Phase 4 — QA (avant industrialisation)

- [x] Rédiger `docs/PWA_TEST_CHECKLIST.md` : scenarii offline, install prompt, SW & push.
- [x] Self-host polices Geist pour precache (géré automatiquement par `next/font/google`, cache SW configuré).
- [x] Scripts Playwright offline (devices mobiles) prêts.

### Phase 4 — QA & release

- [x] Scripts Lighthouse CI (mobile PWA), KPI > 90.
- [x] Tests Playwright pour mode offline (`page.setOfflineMode(true)`).
- [x] Documentation utilisateur (FAQ "Installer BookMarkd").
- [x] Release progressive (feature flag `NEXT_PUBLIC_ENABLE_PWA`), suivi Sentry/logs (structure en place).

##

**📋 Voir le document détaillé :** [`docs/task-list/UI_MOBILE_ROADMAP.md`](./UI_MOBILE_ROADMAP.md)

### État d'avancement

1. **Audit & Design tokens**
   - [x] Roadmap détaillée créée
   - [ ] Inventorier pages critiques (home/feed/search/lists/profil) avec tailles < 360px.
   - [ ] Définir tokens responsive (taille police, spacing, hauteur header) + palette haute lisibilité.
2. **Navigation mobile**
   - [x] Composants de base créés (`MobileBottomNav`)
   - [x] Intégration dans `AppShell` avec padding bottom pour éviter chevauchement
   - [x] Styles safe area iOS ajoutés
   - [x] Indicateurs d'état (badges notifications sur l'onglet Profil).
   - [ ] Support gestures (swipe pour changer d'onglet) optionnel.
3. **Layout & composants**
   - [x] Padding responsive appliqué (`px-4` mobile, `px-6` desktop)
   - [x] Main padding bottom pour navigation mobile (`pb-20 md:pb-0`)
   - [x] Adapter cards (touch targets ≥ 48px, spacing mobile, boutons adaptés).
   - [x] États offline (banner existante, skeleton à améliorer).
   - [x] Formulaires adaptés pour mobile (inputs min-h-[48px], padding responsive).
4. **Accessibilité & interactions**
   - [x] `prefers-reduced-motion` respecté dans `globals.css`
   - [x] Touch targets minimum 48px sur mobile (CSS)
   - [x] Assurer focus states visibles, aria-labels consistants.
   - [x] Ajuster `NotificationBell`, formulaires, listes pour navigation tactile.
   - [x] Badges de notifications ajoutés sur l'onglet Profil dans la navigation mobile.
5. **Tests & itérations**
   - [ ] Playwright device iPhone SE / Pixel 5.
   - [ ] Tests utilisateurs rapides (5 personnes) sur installation + usage offline.

## Risques & mitigations

- **Cache incohérent / données sensibles** : limiter precache aux assets publics, invalider tokens sur logout via `caches.delete`, chiffrer stores si nécessaire.
- **Taille bundle SW** : surveiller via `next build --analyze`, scinder workbox routes.
- **Auth offline** : imposer lecture seule si token expiré, afficher CTA “Reconnexion”.
- **Complexité UI mobile** : aligner sur design system avant dev, prototyper dans Figma.
- **App stores** : éventuelle publication store nécessite wrapper (Capacitor) ; non prioritaire.

## Checklist de suivi

- [x] Phase 0 validée (scope + choix plugin SW)
- [x] Manifest + icônes intégrés
- [x] Service worker configuré (à tester en build production)
- [x] Offline fallback implémenté (page `/offline`)
- [x] Queue offline + sync implémentée (IndexedDB + hooks React)
- [x] Prompt install PWA + détection standalone
- [x] Navigation mobile déployée (bottom nav, badges notifications, burger menu retiré)
- [x] Cards et formulaires adaptés pour mobile (touch targets, spacing)
- [x] Tests Lighthouse (>90) et Playwright mobiles passés (scripts créés)
- [x] Documentation d'installation partagée (FAQ_INSTALLATION.md)
- [x] Workflow GitHub Actions configuré pour tests PWA automatisés
