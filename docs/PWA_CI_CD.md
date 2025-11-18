# PWA CI/CD - Guide d'intégration

Ce guide explique comment intégrer les tests PWA dans votre pipeline CI/CD.

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

## Intégration CI/CD

### GitHub Actions

Exemple de workflow :

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
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
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
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
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

### GitLab CI

```yaml
pwa-tests:
  image: node:20
  before_script:
    - npm install -g pnpm
    - pnpm install
    - pnpm playwright:install
  script:
    - pnpm build
    - pnpm start &
    - sleep 10
    - pnpm lighthouse:pwa
    - pnpm test:pwa
  artifacts:
    paths:
      - lighthouse-reports/
    expire_in: 1 week
```

### Vercel / Netlify

Pour les déploiements sur Vercel/Netlify, ajoutez un script de vérification post-deploy :

```json
{
  "scripts": {
    "postdeploy": "pnpm lighthouse:pwa"
  }
}
```

## Configuration Lighthouse CI

Le fichier `.lighthouserc.js` est configuré pour :
- Tester 3 pages principales
- Exiger un score PWA >= 90
- Générer des rapports dans `lighthouse-reports/`

Pour utiliser Lighthouse CI complet :

```bash
# Installer Lighthouse CI
pnpm add -D @lhci/cli

# Lancer avec config
lhci autorun
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

Pour visualiser les rapports :
1. Ouvrir `lighthouse-reports/pwa-{page}-mobile.json`
2. Utiliser [Lighthouse Viewer](https://googlechrome.github.io/lighthouse/viewer/) ou
3. Utiliser `lhci upload` pour les envoyer à un service externe

