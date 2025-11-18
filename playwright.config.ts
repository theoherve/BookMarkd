import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

// Vérifier si les variables Supabase sont définies
const hasSupabaseEnv = Boolean(
  process.env.SUPABASE_URL || process.env.BOOK_MARKD_SUPABASE_URL
);

// En production (CI), le serveur est déjà démarré avec pnpm start
// Ne démarrer le serveur que si on est en mode développement
const shouldStartServer =
  hasSupabaseEnv && process.env.NODE_ENV !== "production";

export default defineConfig({
  testDir: "./tests/e2e",
  retries: 0,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  // Ne démarrer le serveur que si les variables Supabase sont définies
  // et qu'on n'est pas en mode production (le serveur est déjà démarré en CI)
  webServer: shouldStartServer
    ? {
        command: "pnpm dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});
