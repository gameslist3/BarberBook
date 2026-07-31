const sharp = require("sharp");

// Brand violet (violet-600 #7C3AED)
const P = [124, 58, 237];

async function tint(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const px = data;
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    if (a === 0) {
      px[i] = 0;
      px[i + 1] = 0;
      px[i + 2] = 0;
      continue;
    }
    const lum = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
    const t = 0.35 + 0.65 * lum; // keep dark shading, tint toward purple
    px[i] = Math.round(P[0] * t);
    px[i + 1] = Math.round(P[1] * t);
    px[i + 2] = Math.round(P[2] * t);
  }
  await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(file + ".tmp");
  const fs = require("fs");
  fs.renameSync(file + ".tmp", file);
  console.log("tinted", file, info.width + "x" + info.height);
}

(async () => {
  await tint("public/logo.png");
  await tint("public/fav.png");
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
