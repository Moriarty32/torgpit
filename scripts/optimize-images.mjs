import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(
  await readFile(resolve(root, "source-images/prompts.json"), "utf8"),
);
await mkdir(resolve(root, "assets/images"), { recursive: true });
const output = [];
for (const asset of manifest.assets) {
  const input = resolve(root, "source-images", asset.file);
  const metadata = await sharp(input).metadata();
  const product = asset.key.startsWith("product-");
  const sizes = product
    ? [
        [400, 400],
        [800, 800],
      ]
    : asset.key === "hero-kitchen"
      ? [
          [640, 360],
          [1024, 576],
          [1600, 900],
        ]
      : [
          [640, 400],
          [1200, 750],
        ];
  for (const [width, height] of sizes) {
    const file = `${asset.key}-${width}.webp`;
    const info = await sharp(input)
      .resize(width, height, {
        fit: "cover",
        position: "attention",
        withoutEnlargement: true,
      })
      .webp({ quality: product ? 88 : 86, effort: 5 })
      .toFile(resolve(root, "assets/images", file));
    await writeFile(
      resolve(root, "assets/images", `${file}.json`),
      JSON.stringify(
        {
          prompt: asset.prompt,
          origin: `source-images/${asset.file}`,
          generator: manifest.generator,
          illustrative: true,
          width: info.width,
          height: info.height,
          bytes: info.size,
        },
        null,
        2,
      ) + "\n",
    );
    output.push({
      file,
      width: info.width,
      height: info.height,
      bytes: info.size,
    });
  }
  console.log(`${asset.key}: source ${metadata.width}×${metadata.height}`);
}
await writeFile(
  resolve(root, "assets/images/manifest.json"),
  JSON.stringify(output, null, 2) + "\n",
);
console.log(
  `Optimized ${output.length} assets; ${(output.reduce((n, a) => n + a.bytes, 0) / 1024 / 1024).toFixed(2)} MB total`,
);
