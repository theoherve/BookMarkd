# Guide de test PWA - BookMarkd

Ce guide détaille comment tester toutes les fonctionnalités PWA de BookMarkd avant la Phase 4 (QA automatisée).

## Prérequis

- Chrome/Edge (recommandé) ou Firefox
- Chrome DevTools
- Build de production (`pnpm build && pnpm start`)

## 1. Tests Service Worker & Cache

### Vérifier l'enregistrement du SW

1. Ouvrir Chrome DevTools > Application > Service Workers
2. Vérifier que `sw.js` est enregistré avec status "activated and is running"
3. Scope doit être `/`

### Vérifier le cache

1. DevTools > Application > Cache Storage
2. Vérifier les caches suivants :
   - `nextjs-static` (assets Next.js + polices)
   - `images-cache` (images externes)
   - `api-cache` (réponses API GET)
   - `pages-cache` (pages HTML)

### Test offline basique

1. DevTools > Network > Cocher "Offline"
2. Recharger la page
3. Vérifier que la page `/offline` s'affiche
4. Décocher "Offline" et recharger → la page normale doit revenir

## 2. Tests Queue Offline

### Test Like/Unlike Review

1. Ouvrir une page livre avec des reviews
2. DevTools > Network > Cocher "Offline"
3. Liker un avis
4. Vérifier :
   - Le bouton like change d'état immédiatement (optimistic update)
   - DevTools > Application > IndexedDB > `bookmarkd-offline` > `actions` → une entrée avec `type: "likeReview"`
   - La bannière offline affiche "1 action en attente"
5. Décocher "Offline"
6. Vérifier :
   - Synchronisation automatique (bannière disparaît)
   - Le compteur de likes est mis à jour côté serveur

### Test Update Reading Status

1. Ouvrir une page livre
2. Mode Offline
3. Cliquer sur "Terminé" (ou autre statut)
4. Vérifier :
   - Le bouton change d'état immédiatement
   - Action ajoutée dans IndexedDB
5. Mode Online → vérifier la synchronisation

### Test Rate Book

1. Mode Offline
2. Sélectionner une note (ex: 4 étoiles) et valider
3. Vérifier :
   - La note s'affiche localement
   - Action en queue
4. Mode Online → vérifier la synchronisation

### Test Create Review

1. Mode Offline
2. Remplir le formulaire de review et soumettre
3. Vérifier :
   - Message "Avis enregistré, sera publié à la reconnexion ✅"
   - Action en queue
4. Mode Online → vérifier la publication effective

### Test Follow/Unfollow

1. Mode Offline
2. Cliquer sur "Demander à suivre" ou "Se désabonner"
3. Vérifier :
   - État local mis à jour
   - Action en queue
4. Mode Online → vérifier la synchronisation

## 3. Tests Install Prompt

### Vérifier le prompt d'installation

1. Ouvrir l'app dans Chrome/Edge (pas déjà installée)
2. Attendre quelques secondes
3. Vérifier :
   - Un floating button "Installer BookMarkd" apparaît en bas
   - Le bouton est cliquable

### Tester l'installation

1. Cliquer sur "Installer"
2. Vérifier :
   - Le prompt natif du navigateur s'affiche
   - Après acceptation, l'app s'ouvre en mode standalone
   - Le floating button disparaît

### Vérifier la détection standalone

1. Après installation, ouvrir l'app
2. Vérifier :
   - Le floating button n'apparaît plus
   - L'UI s'adapte (pas de barre d'adresse, etc.)

### Test masquage du prompt

1. Cliquer sur "X" pour masquer le prompt
2. Recharger la page
3. Vérifier que le prompt ne réapparaît pas (stockage localStorage)

## 4. Tests Offline Banner

### Vérifier l'affichage offline

1. Mode Offline
2. Vérifier :
   - Bannière en haut avec icône WifiOff
   - Message "Vous êtes hors ligne..."
   - Bouton "X" pour masquer

### Vérifier l'affichage avec actions en queue

1. Mode Offline
2. Effectuer une action (like, note, etc.)
3. Vérifier :
   - Bannière affiche "X action(s) en attente"
   - Bouton "Synchroniser" visible
4. Mode Online
5. Vérifier :
   - Synchronisation automatique
   - Bannière disparaît après sync

### Test synchronisation manuelle

1. Mode Offline
2. Effectuer plusieurs actions
3. Mode Online
4. Cliquer sur "Synchroniser"
5. Vérifier :
   - Toutes les actions sont synchronisées
   - Bannière disparaît

## 5. Tests Manifest & Icons

### Vérifier le manifest

1. DevTools > Application > Manifest
2. Vérifier :
   - Name: "BookMarkd"
   - Start URL: "/feed?source=pwa"
   - Display: "standalone"
   - Icons présents (192, 512, maskable)

### Vérifier les icônes

1. DevTools > Application > Manifest > Icons
2. Vérifier que toutes les tailles sont présentes
3. Tester l'icône maskable (512x512 avec purpose: "maskable")

## 6. Tests Lighthouse (pré-Phase 4)

### Audit PWA

1. DevTools > Lighthouse
2. Sélectionner "Progressive Web App" + "Mobile"
3. Lancer l'audit
4. Vérifier :
   - Score PWA >= 90
   - Tous les critères passent (installable, offline, etc.)

### Points d'attention

- ✅ Manifest valide
- ✅ Service Worker actif
- ✅ HTTPS (ou localhost)
- ✅ Icônes présentes
- ✅ Page offline disponible
- ✅ Cache stratégies configurées

## 7. Checklist rapide

Avant de passer à la Phase 4, vérifier :

- [ ] Service Worker enregistré et actif
- [ ] Cache fonctionnel (assets, images, API)
- [ ] Page offline accessible
- [ ] Queue offline fonctionne pour toutes les actions
- [ ] Synchronisation automatique au retour en ligne
- [ ] Prompt d'installation visible et fonctionnel
- [ ] Bannière offline s'affiche correctement
- [ ] Manifest valide avec toutes les icônes
- [ ] Lighthouse PWA score >= 90
- [ ] Pas d'erreurs console en production

## Dépannage

### Service Worker ne s'enregistre pas

- Vérifier que `NODE_ENV=production`
- Vérifier que le build a généré `public/sw.js`
- Vérifier la console pour erreurs

### Actions ne se synchronisent pas

- Vérifier IndexedDB > `bookmarkd-offline` > `actions`
- Vérifier la console pour erreurs réseau
- Vérifier que `/api/pwa/offline-actions` répond correctement

### Prompt d'installation n'apparaît pas

- Vérifier que l'app n'est pas déjà installée
- Vérifier localStorage > `pwa-install-dismissed`
- Vérifier que le manifest est valide
