# Roadmap UI Mobile adaptée PWA

Ce document détaille le plan d'action pour adapter l'interface utilisateur de BookMarkd aux écrans mobiles avec une expérience PWA optimale.

## Objectifs

- Navigation intuitive et accessible sur mobile (< 768px)
- Expérience tactile optimisée (touch targets ≥ 48px)
- Performance et fluidité sur devices bas de gamme
- Cohérence avec les patterns PWA (standalone mode, gestures)

## 1. Audit & Design tokens

### 1.1 Inventaire des pages critiques

**Pages à auditer en priorité :**
- [ ] `/feed` - Feed principal (3 colonnes → stack mobile)
- [ ] `/search` - Recherche (filtres, résultats)
- [ ] `/lists` - Liste des listes + détail liste
- [ ] `/books/[slug]` - Fiche livre (actions, reviews)
- [ ] `/profiles/[username]` - Profil utilisateur
- [ ] `/profiles/me` - Mon profil (édition)

**Points d'attention :**
- Largeur minimale testée : 360px (iPhone SE)
- Touch targets : minimum 48x48px
- Espacement entre éléments : minimum 8px
- Textes lisibles : minimum 14px (16px recommandé)

### 1.2 Design tokens responsive

**Breakpoints :**
```css
sm: 640px   /* Mobile large */
md: 768px   /* Tablette */
lg: 1024px  /* Desktop */
xl: 1280px  /* Desktop large */
```

**Tokens à définir :**
- [ ] Tailles de police responsive (scale mobile)
- [ ] Espacements (padding, margin) adaptés mobile
- [ ] Hauteur header mobile (compacte)
- [ ] Hauteur barre navigation basse (60-80px)
- [ ] Touch target size (48px minimum)

**Fichier à créer :** `src/styles/mobile-tokens.css` ou extension `globals.css`

## 2. Navigation mobile

### 2.1 Barre de navigation basse

**Composant :** `src/components/layout/mobile-bottom-nav.tsx`

**Fonctionnalités :**
- [ ] 4 onglets principaux : Feed, Search, Lists, Profil
- [ ] Indicateur d'onglet actif (badge, couleur)
- [ ] Badge notifications sur onglet Profil
- [ ] Animation de transition entre onglets
- [ ] Support `prefers-reduced-motion`

**Design :**
- Position : `fixed bottom-0 left-0 right-0`
- Hauteur : 64px (safe area iOS)
- Background : `bg-card/95 backdrop-blur`
- Border top : `border-t border-border`
- Z-index : 50 (au-dessus du contenu, sous modals)

**Accessibilité :**
- [ ] `aria-label` sur chaque onglet
- [ ] `aria-current="page"` sur l'onglet actif
- [ ] Navigation clavier (Tab, Arrow keys)
- [ ] Focus visible

### 2.2 Bouton flottant central "Ajouter"

**Composant :** `src/components/layout/mobile-fab.tsx`

**Fonctionnalités :**
- [ ] Bouton circulaire flottant au centre de la barre
- [ ] Menu déroulant au clic : "Ajouter un livre", "Créer une liste"
- [ ] Animation d'ouverture/fermeture
- [ ] Overlay sombre au clic (fermeture)

**Design :**
- Taille : 56x56px (Material Design FAB)
- Position : centre de la barre, légèrement au-dessus
- Icône : `Plus` (Lucide)
- Couleur : `bg-accent text-accent-foreground`
- Shadow : `shadow-lg`

### 2.3 Support gestures (optionnel)

**Fonctionnalités :**
- [ ] Swipe horizontal pour changer d'onglet (optionnel)
- [ ] Pull-to-refresh sur feed (optionnel)
- [ ] Swipe to dismiss sur notifications (optionnel)

**Bibliothèque suggérée :** `@use-gesture/react` ou `react-swipeable`

## 3. Layout & composants

### 3.1 Header mobile compact

**Modifications `AppShell` :**
- [ ] Réduire padding vertical sur mobile (`py-3` au lieu de `py-5`)
- [ ] Masquer navigation desktop sur mobile (`hidden md:block`)
- [ ] Logo plus compact (texte uniquement, pas d'icône)
- [ ] Menu burger toujours visible (pas de Sheet sur desktop)

**Hauteur cible :** 56px (mobile) vs 72px (desktop)

### 3.2 Conteneurs responsive

**Modifications globales :**
- [ ] `max-w-6xl` → `max-w-full` sur mobile
- [ ] Padding horizontal : `px-4` mobile, `px-6` desktop
- [ ] Padding vertical sections : `py-6` mobile, `py-10` desktop

**Fichier :** `src/components/layout/app-shell.tsx`

### 3.3 Cards adaptées mobile

**Composants à adapter :**
- [ ] `BookFeedCard` - Touch target plus grand, padding augmenté
- [ ] `ActivityCard` - Stack vertical sur mobile
- [ ] `ListSummaryCard` - Actions en bas, pas en hover
- [ ] `ReviewCard` - Espacement augmenté, boutons plus grands

**Règles :**
- Touch targets : minimum 48x48px
- Padding interne : minimum 16px
- Espacement entre cards : 12px mobile, 16px desktop
- Border radius : `rounded-xl` (cohérent)

### 3.4 Formulaires mobile

**Composants :**
- [ ] `LoginForm`, `SignupForm` - Full width, inputs plus grands
- [ ] `ReviewForm` - Textarea adaptée, boutons en stack
- [ ] `BookCreateForm` - Champs empilés, validation visible

**Règles :**
- Input height : minimum 48px
- Label au-dessus de l'input (pas à côté)
- Boutons full-width sur mobile
- Messages d'erreur visibles immédiatement

### 3.5 États offline mobile

**Composants existants à améliorer :**
- [ ] `OfflineBanner` - Position sticky top sur mobile
- [ ] Badges "sync en attente" sur actions
- [ ] Skeleton loaders pour contenu en cache

## 4. Accessibilité & interactions

### 4.1 Focus states

- [ ] Focus ring visible sur tous les éléments interactifs
- [ ] Contraste suffisant (WCAG AA minimum)
- [ ] Skip links pour navigation clavier

### 4.2 Aria-labels

- [ ] Tous les boutons icon-only ont `aria-label`
- [ ] Navigation annoncée par screen readers
- [ ] États dynamiques annoncés (offline, sync, etc.)

### 4.3 Prefers-reduced-motion

- [ ] Désactiver animations si `prefers-reduced-motion: reduce`
- [ ] Transitions réduites (< 150ms)
- [ ] Pas d'animations auto-play

### 4.4 Interactions tactiles

- [ ] Feedback visuel au touch (ripple effect optionnel)
- [ ] Pas de hover states sur mobile (utiliser active)
- [ ] Long press pour actions secondaires (optionnel)

## 5. Performance mobile

### 5.1 Optimisations

- [ ] Lazy loading images (déjà fait avec Next.js Image)
- [ ] Code splitting par route
- [ ] Réduire bundle size (tree-shaking)
- [ ] Optimiser fonts (subset, preload)

### 5.2 Métriques cibles

- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Time to Interactive (TTI) < 3.8s
- [ ] Cumulative Layout Shift (CLS) < 0.1

## 6. Tests & itérations

### 6.1 Tests Playwright mobile

**Devices à tester :**
- [ ] iPhone SE (375x667)
- [ ] iPhone 12/13 (390x844)
- [ ] Pixel 5 (393x851)
- [ ] iPad Mini (768x1024)

**Scénarios :**
- [ ] Navigation entre onglets
- [ ] Ouverture menu FAB
- [ ] Scroll long pages
- [ ] Mode offline
- [ ] Installation PWA

### 6.2 Tests utilisateurs

**Protocole :**
- [ ] 5 utilisateurs testent l'app installée
- [ ] Tâches : naviguer, ajouter livre, créer liste, consulter profil
- [ ] Feedback sur UX, performance, bugs
- [ ] Itérations basées sur retours

## 7. Plan d'implémentation

### Phase 1 - Fondations (1-2 sprints)

1. **Design tokens**
   - [ ] Créer `mobile-tokens.css`
   - [ ] Définir breakpoints et espacements
   - [ ] Appliquer tokens dans `globals.css`

2. **Header mobile**
   - [ ] Adapter `AppShell` header
   - [ ] Tester sur devices réels

### Phase 2 - Navigation (1 sprint)

1. **Barre navigation basse**
   - [ ] Créer `MobileBottomNav`
   - [ ] Intégrer dans `AppShell`
   - [ ] Gérer état actif avec `usePathname`

2. **FAB "Ajouter"**
   - [ ] Créer `MobileFab`
   - [ ] Menu déroulant avec actions
   - [ ] Animations

### Phase 3 - Composants (2 sprints)

1. **Cards & Layouts**
   - [ ] Adapter toutes les cards
   - [ ] Responsive containers
   - [ ] Formulaires mobile

2. **États offline**
   - [ ] Améliorer `OfflineBanner`
   - [ ] Badges sync
   - [ ] Skeletons

### Phase 4 - Polish & Tests (1 sprint)

1. **Accessibilité**
   - [ ] Focus states
   - [ ] Aria-labels
   - [ ] Reduced motion

2. **Tests**
   - [ ] Playwright mobile
   - [ ] Tests utilisateurs
   - [ ] Corrections

## 8. Composants à créer

### Nouveaux composants

1. `src/components/layout/mobile-bottom-nav.tsx`
2. `src/components/layout/mobile-fab.tsx`
3. `src/components/layout/mobile-fab-menu.tsx` (optionnel)
4. `src/components/ui/mobile-card.tsx` (wrapper responsive)

### Composants à modifier

1. `src/components/layout/app-shell.tsx` - Intégration nav mobile
2. Tous les composants `*Card` - Touch targets, spacing
3. Tous les formulaires - Layout mobile

## 9. Checklist de suivi

- [ ] Design tokens définis et appliqués
- [ ] Header mobile compact implémenté
- [ ] Barre navigation basse fonctionnelle
- [ ] FAB "Ajouter" avec menu
- [ ] Toutes les cards adaptées mobile
- [ ] Formulaires optimisés mobile
- [ ] États offline améliorés
- [ ] Accessibilité validée
- [ ] Tests Playwright mobiles passés
- [ ] Tests utilisateurs effectués
- [ ] Performance validée (Lighthouse mobile)

## 10. Références

- [Material Design - Navigation](https://material.io/design/navigation/)
- [Apple HIG - Navigation](https://developer.apple.com/design/human-interface-guidelines/navigation)
- [Web.dev - Mobile UX](https://web.dev/mobile-ux/)
- [WCAG 2.1 - Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

