# PWA CI/CD - Guide d'intégration

## Scripts disponibles

### Lighthouse PWA Audit

```bash
# Audit PWA avec Lighthouse
pnpm lighthouse:pwa

# Avec URL personnalisée
LIGHTHOUSE_BASE_URL=https://staging.bookmarkd.app pnpm lighthouse:pwa
```

Le script :
- Teste les pages principales (`/`, `/feed`, `/offline`)
- Génère des rapports JSON dans `lighthouse-reports/`
- Vérifie que le score PWA >= 90
- Exit code 1 si le score est < 90

### Tests Playwright PWA

```bash
# Lancer tous les tests PWA
pnpm test:pwa

# Lancer un test spécifique
pnpm test:ui tests/e2e/pwa-offline.spec.ts
```

## Intégration GitHub Actions

```yaml
name: PWA Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm build
      - run: pnpm start &
      - run: sleep 10
      - run: pnpm lighthouse:pwa
        env:
          LIGHTHOUSE_BASE_URL: http://localhost:3000

  playwright:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm playwright:install
      - run: pnpm build
      - run: pnpm start &
      - run: sleep 10
      - run: pnpm test:pwa
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000
```

## Seuils de qualité

- **PWA Score** : >= 90 (obligatoire)
- **Performance** : >= 70 (recommandé)
- **Accessibility** : >= 80 (recommandé)

## Dépannage

### Lighthouse échoue en CI

- Vérifier que Chrome/Chromium est installé
- Augmenter les timeouts si nécessaire
- Vérifier que le serveur est bien démarré avant les tests

### Playwright échoue

- Vérifier que les navigateurs sont installés (`pnpm playwright:install`)
- Vérifier que le serveur répond avant les tests
- Augmenter les timeouts dans `playwright.config.ts`

## Rapports

Les rapports Lighthouse sont sauvegardés dans `lighthouse-reports/` :
- `pwa-{page}-mobile.json` : Rapport mobile
- `pwa-{page}-desktop.json` : Rapport desktop

Visualiser via [Lighthouse Viewer](https://googlechrome.github.io/lighthouse/viewer/) ou `lhci upload`.
