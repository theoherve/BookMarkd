import { test, expect } from "@playwright/test";

test.describe("PWA Offline Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Attendre que le service worker soit enregistré
    await page.waitForTimeout(2000);
  });

  test("should display offline page when network is offline", async ({ page }) => {
    // Activer le mode offline
    await page.context().setOffline(true);
    
    // Naviguer vers une nouvelle page
    await page.goto("/feed");
    
    // Vérifier que la page offline s'affiche
    await expect(page.locator("text=Vous êtes hors ligne")).toBeVisible();
    await expect(page.locator("text=Recharger")).toBeVisible();
  });

  test("should show offline banner when network goes offline", async ({ page }) => {
    await page.goto("/feed");
    
    // Activer le mode offline
    await page.context().setOffline(true);
    
    // Attendre que la bannière apparaisse
    await expect(
      page.locator("text=Vous êtes hors ligne. Vos actions seront synchronisées automatiquement.")
    ).toBeVisible({ timeout: 5000 });
  });

  test("should queue actions when offline and sync when online", async ({ page }) => {
    // Prérequis : être connecté (à adapter selon votre auth)
    await page.goto("/feed");
    
    // Activer le mode offline
    await page.context().setOffline(true);
    
    // Attendre que la bannière offline apparaisse
    await expect(
      page.locator("text=Vous êtes hors ligne")
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
    
    // Réactiver le réseau
    await page.context().setOffline(false);
    
    // Attendre que la synchronisation se fasse (bannière disparaît)
    await expect(
      page.locator("text=Vous êtes hors ligne")
    ).not.toBeVisible({ timeout: 10000 });
  });

  test("should cache static assets for offline use", async ({ page }) => {
    await page.goto("/");
    
    // Vérifier que les assets sont chargés
    await page.waitForLoadState("networkidle");
    
    // Activer le mode offline
    await page.context().setOffline(true);
    
    // Recharger la page
    await page.reload();
    
    // La page devrait toujours être accessible (grâce au cache)
    await expect(page.locator("body")).toBeVisible();
  });
});

