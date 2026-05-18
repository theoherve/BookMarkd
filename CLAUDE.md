# BookMarkd — instructions projet

## Design system (CRITIQUE)

**Avant tout travail UI**, lire `docs/design-system.md`. Charte stricte pour tout composant — manuel ou généré par un skill (`/ui-ux-pro-max`, `frontend-design`, `figma-implement-design`, etc.).

### Règle d'or polices

**100% Geist Sans.** Body, titres, hero, nav, boutons, formulaires — tout. Page `src/app/page.tsx` = référence visuelle absolue.

Deux polices uniquement, chargées dans `src/app/layout.tsx` :
- `font-sans` (Geist) — défaut hérité du `<body>`, **ne pas surcharger**
- `font-mono` (Geist Mono) — micro-labels uppercase tracking-wide, ISBN, codes

### Interdits absolus

- `font-display` — **token retiré**. Si trouvé dans le code → supprimer la classe + supprimer `italic` qui l'accompagne
- `font-serif` Tailwind (= Georgia système)
- `font-family` inline / `style={{ fontFamily }}`
- Toute Google Font tierce (Inter, Roboto, Poppins, Manrope, Lora, Playfair, Fraunces, etc.)
- `italic` sur les titres (résidu de l'ancien `font-display`)
- Couleurs hex en dur — utiliser tokens (`bg-background`, `text-foreground`, `bg-accent`, etc.)
- Composant sans variante dark traitée

### Référence visuelle

Page d'index `src/app/page.tsx` = source de vérité. Tout panel, menu ou nouveau composant doit avoir la même esthétique.

### Quand un skill génère du code

1. `grep` pour `font-display`, `font-serif`, `font-family`, Google Fonts tierces → corriger
2. Retirer tout `italic` sur les titres
3. Valider la checklist en fin de `docs/design-system.md`
4. Comparer visuellement avec `src/app/page.tsx`
