import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const PROJECT_ROOT = process.cwd();
const SOURCE_ICON = path.join(PROJECT_ROOT, "public", "logo.png");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "public", "pwa");

const ICON_SPECS = [
  { size: 64 },
  { size: 120 },
  { size: 152 },
  { size: 167 },
  { size: 180 },
  { size: 192 },
  { size: 256 },
  { size: 384 },
  { size: 512 },
  { size: 1024 },
  { size: 512, suffix: "-maskable", fit: "contain" as const, background: "#fdfaf5" },
  { size: 192, suffix: "-monochrome", grayscale: true },
];

const ensureSourceExists = async () => {
  await stat(SOURCE_ICON);
};

const ensureOutputDir = async () => {
  await mkdir(OUTPUT_DIR, { recursive: true });
};

const generateIcon = async (spec: (typeof ICON_SPECS)[number]) => {
  const { size, suffix = "", background, fit, grayscale } = spec;
  const pipeline = sharp(SOURCE_ICON).resize(size, size, {
    fit: fit ?? "cover",
    background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
  });

  if (grayscale) {
    pipeline.grayscale();
  }

  await pipeline
    .png({
      compressionLevel: 9,
      effort: 8,
    })
    .toFile(path.join(OUTPUT_DIR, `icon-${size}${suffix}.png`));
};

const run = async () => {
  await ensureSourceExists();
  await ensureOutputDir();
  await Promise.all(ICON_SPECS.map((spec) => generateIcon(spec)));
  console.log(`✔ PWA icons generated in ${OUTPUT_DIR}`);
};

void run().catch((error) => {
  if ((error as NodeJS.ErrnoException).code === "ENOENT") {
    console.error(
      "Source logo not found. Ensure public/logo.png exists before generating icons.",
    );
    process.exit(1);
  }
  console.error(error);
  process.exit(1);
});

