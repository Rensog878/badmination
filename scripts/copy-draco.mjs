// Copies the Draco decoder from three into /public/draco so it is self-hosted (no CDN).
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "three", "examples", "jsm", "libs", "draco");
const dest = join(root, "public", "draco");

if (!existsSync(src)) {
  console.warn("[copy-draco] three not installed yet, skipping");
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("[copy-draco] copied decoder to public/draco");
