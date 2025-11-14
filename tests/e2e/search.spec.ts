import { test, expect } from "@playwright/test";

const shouldRunE2E = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

test.skip(!shouldRunE2E, "Supabase environment variables are required for e2e.");

test("recherche supabase retourne des résultats", async ({ page }) => {
  await page.goto("/search");

  const input = page.getByLabel("Rechercher un livre");
  await input.fill("Pachinko");
  await page.getByRole("button", { name: "Rechercher" }).click();

  await expect(
    page.getByText("Résultats pour « Pachinko »"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Pachinko/i }).first(),
  ).toBeVisible();
});

