#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const version = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
).version;
const template = readFileSync(join(root, "scripts/sw.template.js"), "utf8");
const output = template.replaceAll("__APP_VERSION__", version);

writeFileSync(join(root, "public/sw.js"), output);
console.log(`[generate-sw] public/sw.js (v${version})`);
