import { test, expect } from "@playwright/test";

// Skip par défaut : nécessite que les Awards 2026 aient été publiés en DB
// via `runAwardsAggregation(2026)` puis `publishAwards(2026)`.
// Retirer le `.skip` localement pour tester après seed.
test.describe.skip("BookMarkd Awards", () => {
  test("page publique /awards/2026 affiche le podium et le CTA cérémonie", async ({
    page,
  }) => {
    await page.goto("/awards/2026");
    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(/Livre de l’année/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Vivre la cérémonie/i }),
    ).toBeVisible();
  });

  test("mode stories navigue avec arrow + Escape", async ({ page }) => {
    await page.goto("/awards/2026/stories");
    const counter = page.locator("text=/^\\d+ \\/ \\d+$/");
    await expect(counter).toBeVisible();
    const initial = (await counter.textContent()) ?? "";
    await page.keyboard.press("ArrowRight");
    await expect(counter).not.toHaveText(initial);
    await page.keyboard.press("Escape");
    await page.waitForURL(/\/awards\/2026\b/);
  });

  test("/awards/2999 renvoie 404 (année non publiée)", async ({ page }) => {
    const response = await page.goto("/awards/2999");
    expect(response?.status()).toBe(404);
  });
});
