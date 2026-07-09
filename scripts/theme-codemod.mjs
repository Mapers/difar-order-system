#!/usr/bin/env node
// Migración mecánica de clases de color hardcodeadas a las clases
// basadas en variables de tema (bg-background, text-foreground, etc.).
// Uso: node scripts/theme-codemod.mjs <dir-o-archivo> [<dir-o-archivo> ...]

import fs from "node:fs";
import path from "node:path";

const REPLACEMENTS = [
  [/bg-white\b/g, "bg-background"],
  [/text-black\b/g, "text-foreground"],
  [/bg-gray-50\b/g, "bg-muted"],
  [/bg-gray-100\b/g, "bg-muted"],
  [/text-gray-500\b/g, "text-muted-foreground"],
  [/text-gray-600\b/g, "text-muted-foreground"],
  [/border-gray-200\b/g, "border-border"],
  [/border-gray-300\b/g, "border-border"],
  [/bg-slate-50\b/g, "bg-muted"],
  [/bg-slate-100\b/g, "bg-muted"],
  [/text-slate-500\b/g, "text-muted-foreground"],
  [/text-slate-600\b/g, "text-muted-foreground"],
  [/border-slate-200\b/g, "border-border"],
  [/border-slate-300\b/g, "border-border"],
];

const DARK_VARIANT_PATTERN = /\bdark:(?:[\w-]+:)*(bg|text|border)-\S+/;

function isExcluded(filePath) {
  const segments = path.resolve(filePath).split(path.sep);
  for (let i = 0; i < segments.length - 1; i++) {
    if (segments[i] === "components" && segments[i + 1] === "ui") return true;
  }
  return false;
}

function collectFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    return isExcluded(target) ? [] : [target];
  }

  const out = [];
  const entries = fs.readdirSync(target, {
    withFileTypes: true,
    recursive: true,
  });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!/\.(tsx|ts)$/.test(entry.name)) continue;
    const dir = entry.parentPath ?? entry.path;
    const full = path.join(dir, entry.name);
    if (isExcluded(full)) continue;
    out.push(full);
  }
  return out;
}

function run(targets) {
  const files = targets.flatMap(collectFiles);
  let changedCount = 0;
  const flagged = [];

  for (const file of files) {
    const original = fs.readFileSync(file, "utf8");
    let updated = original;
    for (const [pattern, replacement] of REPLACEMENTS) {
      updated = updated.replace(pattern, replacement);
    }
    if (updated !== original) {
      fs.writeFileSync(file, updated, "utf8");
      changedCount++;
      console.log(`updated  ${file}`);
    }
    if (DARK_VARIANT_PATTERN.test(updated)) {
      flagged.push(file);
    }
  }

  console.log(`\n${changedCount} archivo(s) actualizado(s).`);
  if (flagged.length > 0) {
    console.log(
      `\n${flagged.length} archivo(s) con variantes dark: manuales — revisar a mano:`,
    );
    for (const file of flagged) console.log(`  ${file}`);
  }
}

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error(
    "Uso: node scripts/theme-codemod.mjs <dir-o-archivo> [<dir-o-archivo> ...]",
  );
  process.exit(1);
}
run(targets);
