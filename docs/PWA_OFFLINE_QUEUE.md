# Queue Offline - Guide d'utilisation

## Vue d'ensemble

Le système de queue offline permet d'enregistrer les actions utilisateur (like, note, statut de lecture, etc.) lorsqu'il n'y a pas de connexion internet, puis de les synchroniser automatiquement lorsque la connexion est rétablie.

## Architecture

- **IndexedDB** : Stockage local des actions en attente (`idb` library)
- **Hooks React** : `useOfflineQueue` pour gérer la queue côté client
- **API Route** : `/api/pwa/offline-actions` pour exécuter les actions
- **Sync automatique** : Synchronisation lors du retour en ligne

## Utilisation dans les composants

### Exemple : Ajouter un like avec queue offline

```typescript
"use client";

import { useOfflineQueue } from "@/hooks/use-offline-queue";

const ReviewLikeButton = ({ reviewId }: { reviewId: string }) => {
  const { queueAction } = useOfflineQueue();

  const handleLike = async () => {
    const result = await queueAction({
      type: "likeReview",
      reviewId,
    });

    if (result.success) {
      if (result.queued) {
        // Action mise en queue (hors ligne)
        console.log("Action mise en queue, synchronisation automatique à la reconnexion");
      } else {
        // Action exécutée immédiatement (en ligne)
        console.log("Action exécutée avec succès");
      }
    }
  };

  return <button onClick={handleLike}>Like</button>;
};
```

## Types d'actions supportées

Toutes les actions sont définies dans `src/types/offline-actions.ts` :

- `likeReview` / `unlikeReview`
- `updateReadingStatus`
- `rateBook`
- `createReview`
- `requestFollow` / `unfollowUser`

## Composants UI

### OfflineBanner

Affiche automatiquement :
- Un message lorsque l'utilisateur est hors ligne
- Le nombre d'actions en attente de synchronisation
- Un bouton pour forcer la synchronisation

Déjà intégré dans `AppShell`.

### InstallPwaCta

Affiche un prompt d'installation PWA (floating button en bas de page) :
- Visible uniquement si l'app n'est pas déjà installée
- Peut être masqué par l'utilisateur (stockage localStorage)
- Détection automatique du mode standalone

## Configuration Web Push (optionnel)

Pour activer Web Push :

1. Générer des clés VAPID
2. Ajouter dans `.env.local` :
   ```
   NEXT_PUBLIC_ENABLE_PUSH=true
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=votre_clé_publique
   ```
3. Configurer le backend pour envoyer les notifications (Supabase Edge Function ou autre)

La structure de base est en place dans `src/lib/pwa/push.ts` et `src/app/api/pwa/push/subscribe/route.ts`.

## Tests

Pour tester la queue offline :

1. Ouvrir Chrome DevTools > Application > Service Workers
2. Cocher "Offline" dans Network
3. Effectuer une action (like, note, etc.)
4. Vérifier dans Application > IndexedDB > `bookmarkd-offline` > `actions`
5. Décocher "Offline" et vérifier la synchronisation automatique

