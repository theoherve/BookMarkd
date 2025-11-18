#!/usr/bin/env tsx

import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import fs from "fs/promises";
import path from "path";

const BASE_URL = process.env.LIGHTHOUSE_BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), "lighthouse-reports");

const runLighthouse = async (
  url: string,
  options: { mobile?: boolean } = {}
) => {
  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
  const port = chrome.port;

  try {
    const result = await lighthouse(
      url,
      {
        port,
        output: "json",
        onlyCategories: ["pwa"],
      },
      {
        settings: {
          formFactor: options.mobile ? "mobile" : "desktop",
          throttling: {
            rttMs: 40,
            throughputKbps: 10 * 1024,
            cpuSlowdownMultiplier: 1,
          },
        },
      }
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
    const mobileScore = mobileResult?.lhr?.categories?.pwa?.score
      ? Math.round(mobileResult.lhr.categories.pwa.score * 100)
      : 0;

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
    const desktopScore = desktopResult?.lhr?.categories?.pwa?.score
      ? Math.round(desktopResult.lhr.categories.pwa.score * 100)
      : 0;

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
