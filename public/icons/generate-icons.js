#!/usr/bin/env node
/**
 * BarberBook PWA Icon Generator
 *
 * Generates all required Android icon sizes from the existing logo.png.
 *
 * Usage:
 *   cd barberbook
 *   npm install sharp --save-dev
 *   node public/icons/generate-icons.js
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const SOURCE = path.join(__dirname, "..", "logo.png");
const OUTPUT_DIR = __dirname;

// Android PWA required sizes
const SIZES = [
  { size: 72, name: "icon-72x72.png" },
  { size: 96, name: "icon-96x96.png" },
  { size: 128, name: "icon-128x128.png" },
  { size: 144, name: "icon-144x144.png" },
  { size: 192, name: "icon-192x192.png" },
  { size: 256, name: "icon-256x256.png" },
  { size: 384, name: "icon-384x384.png" },
  { size: 512, name: "icon-512x512.png" },
];

async function generate() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`❌ Source image not found: ${SOURCE}`);
    process.exit(1);
  }

  console.log("🎨 Generating PWA icons from logo.png...\n");

  for (const { size, name } of SIZES) {
    const outPath = path.join(OUTPUT_DIR, name);
    await sharp(SOURCE)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outPath);
    console.log(`  ✅ ${name} (${size}x${size})`);
  }

  console.log(`\n🎉 All ${SIZES.length} icons generated in public/icons/`);
}

generate().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
