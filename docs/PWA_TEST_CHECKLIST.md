# Préparation Phase 4 · Check-list QA PWA

## 1. Mode offline & queue

| Cas                        | Étapes                                                       | Résultat attendu                                                                                                                        |
| -------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Like review hors ligne     | DevTools > Network Offline → liker un avis → repasser Online | Bannière offline visible, action ajoutée dans IndexedDB, synchronisation automatique (compteur likes mis à jour après retour en ligne). |
| Unlike review hors ligne   | Même procédure en retirant un like                           | Etat local mis à jour immédiatement, sync après reconnection.                                                                           |
| Mise à jour statut lecture | Offline → cliquer sur `Terminé` → Online                     | Bouton actif immédiatement, status conservé, sync server après retour.                                                                  |
| Notation livre             | Offline → valider une note → Online                          | Note affichée localement, request envoyée après retour en ligne.                                                                        |

## 2. Prompt d’installation

1. Effacer `localStorage` clé `pwa-install-dismissed`.
2. Charger l’app sur Chrome Android (ou simulateur).
3. Vérifier :
   - Apparition du CTA flottant `Installer BookMarkd`.
   - `beforeinstallprompt` intercepté (via DevTools > console).
   - Dismiss → CTA caché (localStorage=true).
   - Acceptation → App ajoutée à l’écran d’accueil.

## 3. Service worker & cache

- `pnpm build --webpack` puis `pnpm start`.
- `chrome://inspect/#service-workers` → vérifier `sw.js` actif.
- Application > Cache Storage → `images-cache`, `api-cache`, etc.
- Déconnecter le réseau → accéder à `/offline` (fallback).

## 4. Web Push (optionnel)

- Ajouter `NEXT_PUBLIC_ENABLE_PUSH=true` + VAPID key dummy.
- Inspecter `navigator.serviceWorker.ready.pushManager.subscribe`.
- Vérifier POST `/api/pwa/push/subscribe` (200 / 403 selon flag).

## 5. Scénarios à automatiser (Phase 4)

- Playwright device `iPhone SE` : install + offline.
- Playwright `page.context().setOffline(true)` : like/queue + sync.
- Lighthouse CI (mobile) : PWA score >= 90.

> Cette check-list doit être validée avant d’entamer la Phase 4 pour éviter les régressions lors de l’industrialisation (CI, tests automatiques, release progressive).
