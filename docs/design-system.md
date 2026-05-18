# Charte graphique BookMarkd

Référence visuelle pour tout composant créé manuellement ou généré (skill `/ui-ux-pro-max`, `frontend-design`, `figma-implement-design`, etc.).

**Source de vérité visuelle = `src/app/page.tsx` (page d'index).** Tout panel, menu ou nouveau composant doit s'aligner sur ce rendu.

Sources techniques :
- `src/app/layout.tsx` — chargement des polices
- `src/app/globals.css` — tokens couleurs, radius, utilities
- `src/app/page.tsx` — patterns de référence (hero, sections, cards)

## Typographie

Deux polices uniquement, chargées via `next/font/google` dans `src/app/layout.tsx`. **Ne jamais en importer d'autres.**

| Token Tailwind | CSS var               | Police         | Usage                                                       |
|----------------|-----------------------|----------------|-------------------------------------------------------------|
| `font-sans`    | `--font-geist-sans`   | **Geist Sans** | **Tout : body, titres, hero, nav, boutons, formulaires**    |
| `font-mono`    | `--font-geist-mono`   | **Geist Mono** | Code, ISBN, micro-labels uppercase tracking-wide            |

### Règle d'or

> **100% Geist Sans.** Aucun titre, hero ou citation ne doit utiliser une autre police. Geist Mono est réservé aux micro-labels style "fiche bibliothèque" et au code.

### Règles strictes

1. **Body et titres = Geist Sans** (hérité du `<body>`). Aucun `font-*` nécessaire dans la majorité des cas.
2. **`font-mono` (Geist Mono)** : micro-labels uppercase `tracking-[0.2em]` à `tracking-[0.3em]`, ISBN, codes, métadonnées style fiche (cf. `/discover`).
3. **`font-display`** : **n'existe plus**. Token retiré de `globals.css`. Si on en trouve dans le code → le remplacer par du Geist (retirer la classe + retirer `italic` qui l'accompagne souvent).
4. **Interdits absolus** :
   - `font-display` (token retiré)
   - `font-serif` Tailwind (= Georgia système)
   - `font-family: ...` inline ou via `style={{}}`
   - Toute Google Font autre que Geist / Geist Mono (pas d'Inter, Roboto, Poppins, Manrope, Lora, Playfair, Fraunces, etc.)
   - Polices système (`system-ui`, `Arial`, etc.) sauf fallback navigateur natif
   - `italic` sur les titres (était associé à `font-display`, n'a plus de sens en Geist)

### Pattern hero (référence index)

```tsx
<h1 className="text-4xl font-semibold text-foreground">
  Titre principal en Geist
</h1>
<p className="max-w-2xl text-base text-muted-foreground">
  Paragraphe en Geist (hérité, aucun `font-*` nécessaire).
</p>
```

### Pattern section header

```tsx
<header className="flex flex-col gap-1">
  <h2 className="text-2xl font-semibold text-foreground">Titre section</h2>
  <p className="text-sm text-muted-foreground">Sous-titre descriptif.</p>
</header>
```

### Pattern micro-label "fiche" (`font-mono` justifié)

```tsx
<span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
  ISBN · 978-...
</span>
```

## Couleurs

Système token-based dans `globals.css`. Light + dark via `prefers-color-scheme` ET classe `.dark`. **Toujours utiliser les tokens, jamais de hex en dur.**

### Palette base

| Token              | Light     | Dark      | Usage                              |
|--------------------|-----------|-----------|------------------------------------|
| `bg-background`    | `#fdfaf5` | `#0f0c0a` | Fond page                          |
| `text-foreground`  | `#1f140d` | `#f7f1ea` | Texte principal                    |
| `bg-card`          | `#ffffff` | `#1a1410` | Cards, panels, sheets              |
| `bg-primary`       | `#2f1c11` | `#c89a6f` | CTA principal                      |
| `bg-secondary`     | `#efe6dc` | `#221b15` | CTA secondaire, badges neutres     |
| `bg-muted`         | `#efe6dc` | `#221b15` | Fond doux, skeletons               |
| `text-muted-foreground` | `#6b5747` | `#bda68f` | Texte secondaire             |
| `bg-accent`        | `#d6b087` | `#c89a6f` | Accent doré, hover, focus ring     |
| `bg-destructive`   | `#b64b45` | `#f0726c` | Erreurs, suppressions              |
| `border-border`    | `#e4d7c6` | `#2f241c` | Bordures par défaut                |

### Sidebar / menu / sheet

Tokens dédiés : `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-accent`, `border-sidebar-border`. Utiliser pour tout panel de navigation latéral ou Sheet de menu.

### Charts

`--chart-1` à `--chart-5` (terre cuite, vert sauge, bleu acier, sable, rose grenat). Utiliser dans cet ordre pour les séries.

## Radius

| Token            | Valeur     | Usage                          |
|------------------|------------|--------------------------------|
| `rounded-sm`     | `0.5rem`   | Pills, badges                  |
| `rounded-md`     | `0.75rem`  | Inputs, boutons standards      |
| `rounded-lg`     | `1.5rem`   | Cards larges, sheets           |
| `rounded-xl`     | `~1rem`    | Cards, panels                  |
| `rounded-2xl`    | `1rem`     | Profile cards, blocs accent    |
| `rounded-full`   | —          | Avatars, ring focus, CTA pill  |

## Spacing & layout

- Container principal : `mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-10`
- Sections homepage : `space-y-12`
- Sous-sections : `space-y-4` à `space-y-6`
- Mobile bottom nav offset : utilitaire `safe-area-bottom-offset` (déjà défini dans `globals.css`)

## Iconographie

- **Library** : `lucide-react` exclusivement (cf. `components.json`)
- **Tailles standards** : `size-4` (16px) inline, `size-5` (20px) header, `size-[18px]` icônes dans pills, `size-9` background icône menu mobile
- Toujours `aria-hidden` quand l'icône est purement décorative

## États interactifs

- **Hover** : `hover:bg-accent/15` pour rangées de menu, `hover:bg-accent/90` pour CTA accent
- **Focus visible** : `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent` (ou `ring-ring` pour neutralité)
- **Active** : `active:scale-[0.98]` pour rangées tactiles mobile
- **Min touch target mobile** : 48×48 (déjà appliqué globalement via `globals.css` @media)

## Animations

- Réutiliser `motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 motion-safe:duration-300` pour entrée d'éléments (cf. `MobileNavRow`)
- Respect `prefers-reduced-motion` géré globalement dans `globals.css`
- Loaders livre : classes `book-loader-wrapper`, `book-page-animation` dans `globals.css`

## Mode sombre

- Activation : classe `.dark` sur `<html>` OU media `prefers-color-scheme: dark`
- Toujours penser les deux variantes — ne pas hardcoder de couleur claire
- Pour les composants existants utilisant des hex inline (`/discover`), conserver les paires `#1f140d` / `dark:#f7f1ea` qui matchent les tokens

## Checklist composant généré (skill ou manuel)

Avant de valider un composant :

- [ ] Police = Geist (aucun `font-*` nécessaire dans 99% des cas)
- [ ] Aucun `font-display`, `font-serif`, `font-family` inline, Google Font tiers
- [ ] Aucun `italic` sur les titres (résidu de l'ancien `font-display`)
- [ ] `font-mono` seulement pour micro-labels uppercase tracking-wide / ISBN / code
- [ ] Couleurs via tokens (`bg-*`, `text-*`, `border-*`), pas de hex sauf cas justifié
- [ ] Variant dark traitée
- [ ] Icônes lucide, taille standard, `aria-hidden` si décoratives
- [ ] Min height 48px sur les boutons mobile
- [ ] Focus ring visible
- [ ] Respect `motion-safe:*` pour animations
- [ ] Comparer visuellement avec `src/app/page.tsx` — même esthétique ?
