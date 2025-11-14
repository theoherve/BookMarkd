import { test, expect } from "@playwright/test";

test.describe.skip("Smoke", () => {
  test("homepage renders", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Votre bibliothèque sociale")).toBeVisible();
  });
});

