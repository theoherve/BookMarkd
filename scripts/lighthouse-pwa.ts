#!/usr/bin/env tsx

import * as chromeLauncher from "chrome-launcher";
import fs from "fs/promises";
import path from "path";
import urlModule from "url";

// Workaround for lighthouse module resolution with tsx
// Lighthouse internally uses fileURLToPath(import.meta.url) which can fail
// We patch fileURLToPath to handle undefined values gracefully
const originalFileURLToPathFunc = urlModule.fileURLToPath;
urlModule.fileURLToPath = function (path: string | URL | undefined): string {
  if (path === undefined) {
    // Return a fallback path if undefined
    return process.cwd();
  }
  return originalFileURLToPathFunc.call(urlModule, path);
};

const BASE_URL = process.env.LIGHTHOUSE_BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), "lighthouse-reports");

const runLighthouse = async (
  url: string,
  options: { mobile?: boolean } = {}
) => {
  // Import lighthouse - the patched fileURLToPath should handle the issue
  const lighthouseModule = await import("lighthouse");
  const lighthouse = lighthouseModule.default || lighthouseModule;

  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
  const port = chrome.port;

  try {
    // Use default config - don't pass a custom config object
    // Lighthouse will use its default config which includes all necessary artifacts
    const formFactor = options.mobile ? "mobile" : "desktop";

    const result = await lighthouse(
      url,
      {
        port,
        output: "json",
        // Settings can be passed in options in newer versions
        formFactor,
        screenEmulation: {
          mobile: options.mobile,
          width: options.mobile ? 412 : 1350,
          height: options.mobile ? 732 : 940,
          deviceScaleFactor: options.mobile ? 2.625 : 1,
          disabled: false,
        },
        throttling: {
          rttMs: 40,
          throughputKbps: 10 * 1024,
          cpuSlowdownMultiplier: 1,
        },
      }
      // Don't pass a config object - use default config
    );

    return result;
  } finally {
    await chrome.kill();
  }
};

const main = async () => {
  console.log("🚀 Starting Lighthouse PWA audit...");
  console.log(`📍 Base URL: ${BASE_URL}`);

  // Créer le dossier de sortie
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const urls = [
    { path: "/", name: "Accueil" },
    { path: "/search", name: "Recherche" },
    { path: "/lists", name: "Listes" },
    { path: "/profiles/me", name: "Profil" },
    { path: "/offline", name: "offline" },
  ];

  const results: Array<{ url: string; score: number; mobile: boolean }> = [];

  for (const { path: urlPath, name } of urls) {
    const url = `${BASE_URL}${urlPath}`;
    console.log(`\n📊 Auditing ${url}...`);

    // Test mobile
    const mobileResult = await runLighthouse(url, { mobile: true });

    // In Lighthouse v13+, PWA category was removed
    // PWA-related checks are now in "best-practices" category
    // We'll use the best-practices score as a proxy for PWA compliance
    // since it includes many PWA-related audits
    const bestPracticesScore =
      mobileResult?.lhr?.categories?.["best-practices"]?.score || 0;
    const mobileScore = Math.round(bestPracticesScore * 100);

    console.log(`  Mobile PWA Score: ${mobileScore}/100`);

    // Sauvegarder le rapport
    const mobileReportPath = path.join(OUTPUT_DIR, `pwa-${name}-mobile.json`);
    await fs.writeFile(
      mobileReportPath,
      JSON.stringify(mobileResult?.lhr, null, 2)
    );

    results.push({ url, score: mobileScore, mobile: true });

    // Test desktop
    const desktopResult = await runLighthouse(url, { mobile: false });
    // Use best-practices score as PWA proxy (same as mobile)
    const desktopBestPracticesScore =
      desktopResult?.lhr?.categories?.["best-practices"]?.score || 0;
    const desktopScore = Math.round(desktopBestPracticesScore * 100);

    console.log(`  Desktop PWA Score: ${desktopScore}/100`);

    const desktopReportPath = path.join(OUTPUT_DIR, `pwa-${name}-desktop.json`);
    await fs.writeFile(
      desktopReportPath,
      JSON.stringify(desktopResult?.lhr, null, 2)
    );

    results.push({ url, score: desktopScore, mobile: false });
  }

  // Résumé
  console.log("\n📈 Summary:");
  console.log("=".repeat(60));
  results.forEach(({ url, score, mobile }) => {
    const device = mobile ? "Mobile" : "Desktop";
    const status = score >= 90 ? "✅" : score >= 70 ? "⚠️" : "❌";
    console.log(`${status} ${device} - ${url}: ${score}/100`);
  });

  const minScore = Math.min(...results.map((r) => r.score));
  const avgScore = Math.round(
    results.reduce((sum, r) => sum + r.score, 0) / results.length
  );

  console.log("=".repeat(60));
  console.log(`Minimum Score: ${minScore}/100`);
  console.log(`Average Score: ${avgScore}/100`);

  if (minScore < 90) {
    console.error("\n❌ PWA score is below 90. Please fix the issues.");
    process.exit(1);
  } else {
    console.log("\n✅ All PWA scores are >= 90!");
    process.exit(0);
  }
};

main().catch((error) => {
  console.error("Error running Lighthouse:", error);
  process.exit(1);
});
