import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

// Vérifier si les variables Supabase sont définies
const hasSupabaseEnv = Boolean(
  process.env.SUPABASE_URL || process.env.BOOK_MARKD_SUPABASE_URL
);

export default defineConfig({
  testDir: "./tests/e2e",
  retries: 0,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  // Ne démarrer le serveur que si les variables Supabase sont définies
  // Sinon, on suppose que le serveur est déjà en cours d'exécution (CI)
  webServer: hasSupabaseEnv
    ? {
        command: "pnpm dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});
