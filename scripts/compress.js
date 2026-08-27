import sharp from "sharp";
import fs from "fs";
import path from "path";

const publicDir = path.resolve("public");

async function run() {
  console.log("Compressing images in public/...");

  // 1. virtu-iq-symbol.png (Currently 961 KB) -> resize to 256x256 png + webp
  const symbolPath = path.join(publicDir, "virtu-iq-symbol.png");
  if (fs.existsSync(symbolPath)) {
    const symbolBuf = fs.readFileSync(symbolPath);
    await sharp(symbolBuf)
      .resize(256, 256, { fit: "inside" })
      .png({ compressionLevel: 9, quality: 85 })
      .toFile(path.join(publicDir, "virtu-iq-symbol.png.tmp"));
    
    await sharp(symbolBuf)
      .resize(256, 256, { fit: "inside" })
      .webp({ quality: 85 })
      .toFile(path.join(publicDir, "virtu-iq-symbol.webp"));
    
    fs.renameSync(path.join(publicDir, "virtu-iq-symbol.png.tmp"), symbolPath);
    console.log("Compressed virtu-iq-symbol.png & .webp");
  }

  // 2. virtu-iq-full.png (Currently 120 KB) -> optimize png + webp
  const fullPath = path.join(publicDir, "virtu-iq-full.png");
  if (fs.existsSync(fullPath)) {
    const fullBuf = fs.readFileSync(fullPath);
    await sharp(fullBuf)
      .resize(500, null, { fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 9, quality: 85 })
      .toFile(path.join(publicDir, "virtu-iq-full.png.tmp"));

    await sharp(fullBuf)
      .resize(500, null, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(publicDir, "virtu-iq-full.webp"));
    
    fs.renameSync(path.join(publicDir, "virtu-iq-full.png.tmp"), fullPath);
    console.log("Compressed virtu-iq-full.png & .webp");
  }

  // 3. favicon-32x32.png (Currently 2.15 MB!) -> resize to 32x32
  await sharp(symbolPath)
    .resize(32, 32)
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, "favicon-32x32.png.tmp"));
  fs.renameSync(path.join(publicDir, "favicon-32x32.png.tmp"), path.join(publicDir, "favicon-32x32.png"));
  console.log("Compressed favicon-32x32.png");

  // 4. favicon.png (Currently 2.15 MB!) -> resize to 64x64
  await sharp(symbolPath)
    .resize(64, 64)
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, "favicon.png.tmp"));
  fs.renameSync(path.join(publicDir, "favicon.png.tmp"), path.join(publicDir, "favicon.png"));
  console.log("Compressed favicon.png");

  // 5. icon-192.png (Currently 2.15 MB!) -> resize to 192x192
  await sharp(symbolPath)
    .resize(192, 192)
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, "icon-192.png.tmp"));
  fs.renameSync(path.join(publicDir, "icon-192.png.tmp"), path.join(publicDir, "icon-192.png"));
  console.log("Compressed icon-192.png");

  // 6. icon-512.png (Currently 2.15 MB!) -> resize to 512x512
  await sharp(symbolPath)
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, "icon-512.png.tmp"));
  fs.renameSync(path.join(publicDir, "icon-512.png.tmp"), path.join(publicDir, "icon-512.png"));
  console.log("Compressed icon-512.png");

  console.log("All images compressed successfully!");
}

run().catch(console.error);
