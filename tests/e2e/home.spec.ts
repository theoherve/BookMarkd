import { test, expect } from "@playwright/test";

const shouldRunE2E = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

test.skip(
  !shouldRunE2E,
  "Supabase environment variables are required for e2e."
);

test("home feed affiche les trois colonnes", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Votre bibliothèque sociale" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Activités récentes" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Lectures des amis" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recommandations pour vous" })
  ).toBeVisible();
});
