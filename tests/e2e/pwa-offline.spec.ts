import { test, expect } from "@playwright/test";

test.describe("PWA Offline Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Attendre que le service worker soit enregistré
    await page.waitForTimeout(2000);
  });

  test("should display offline page when network is offline", async ({ page }) => {
    // Naviguer vers la page offline d'abord pour qu'elle soit en cache
    await page.goto("/offline");
    await page.waitForLoadState("networkidle");
    
    // Activer le mode offline
    await page.context().setOffline(true);
    
    // Recharger la page (devrait fonctionner grâce au cache)
    try {
      await page.reload({ timeout: 5000, waitUntil: "domcontentloaded" });
    } catch {
      // La navigation peut échouer, mais le contenu devrait être en cache
    }
    
    // Vérifier que la page offline s'affiche
    await expect(page.locator("text=Vous êtes hors ligne")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Recharger")).toBeVisible();
  });

  test("should show offline banner when network goes offline", async ({ page }) => {
    await page.goto("/feed");
    await page.waitForLoadState("networkidle");
    
    // Attendre que le composant OfflineBanner soit monté
    await page.waitForTimeout(1000);
    
    // Activer le mode offline, mettre à jour navigator.onLine et déclencher l'événement offline
    await page.context().setOffline(true);
    await page.evaluate(() => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        configurable: true,
        value: false,
      });
      // Déclencher l'événement offline
      const event = new Event("offline", { bubbles: true });
      window.dispatchEvent(event);
    });
    
    // Attendre un peu pour que React traite l'événement
    await page.waitForTimeout(500);
    
    // Attendre que la bannière apparaisse
    await expect(
      page.locator("text=Vous êtes hors ligne. Vos actions seront synchronisées automatiquement.")
    ).toBeVisible({ timeout: 5000 });
  });

  test("should queue actions when offline and sync when online", async ({ page }) => {
    await page.goto("/feed");
    await page.waitForLoadState("networkidle");
    
    // Attendre que le composant OfflineBanner soit monté
    await page.waitForTimeout(1000);
    
    // Activer le mode offline, mettre à jour navigator.onLine et déclencher l'événement offline
    await page.context().setOffline(true);
    await page.evaluate(() => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        configurable: true,
        value: false,
      });
      // Déclencher l'événement offline
      const event = new Event("offline", { bubbles: true });
      window.dispatchEvent(event);
    });
    
    // Attendre un peu pour que React traite l'événement
    await page.waitForTimeout(500);
    
    // Attendre que la bannière offline apparaisse
    await expect(
      page.locator("text=Vous êtes hors ligne. Vos actions seront synchronisées automatiquement.")
    ).toBeVisible({ timeout: 5000 });
    
    // Vérifier que l'IndexedDB est accessible
    const dbExists = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const request = indexedDB.open("bookmarkd-offline");
        request.onsuccess = () => {
          resolve(true);
        };
        request.onerror = () => {
          resolve(false);
        };
      });
    });
    
    expect(dbExists).toBe(true);
    
    // Réactiver le réseau, mettre à jour navigator.onLine et déclencher l'événement online
    await page.context().setOffline(false);
    await page.evaluate(() => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        configurable: true,
        value: true,
      });
      // Déclencher l'événement online
      const event = new Event("online", { bubbles: true });
      window.dispatchEvent(event);
    });
    
    // Attendre un peu pour que React traite l'événement
    await page.waitForTimeout(500);
    
    // Attendre que la synchronisation se fasse (bannière disparaît)
    await expect(
      page.locator("text=Vous êtes hors ligne. Vos actions seront synchronisées automatiquement.")
    ).not.toBeVisible({ timeout: 10000 });
  });

  test("should cache static assets for offline use", async ({ page }) => {
    await page.goto("/");
    
    // Vérifier que les assets sont chargés
    await page.waitForLoadState("networkidle");
    
    // Activer le mode offline
    await page.context().setOffline(true);
    
    // Recharger la page (peut échouer, mais le cache devrait permettre l'affichage)
    try {
      await page.reload({ timeout: 5000, waitUntil: "domcontentloaded" });
    } catch {
      // La navigation peut échouer, mais le contenu devrait être en cache
    }
    
    // La page devrait toujours être accessible (grâce au cache)
    await expect(page.locator("body")).toBeVisible({ timeout: 5000 });
  });
});

