#!/usr/bin/env node
/**
 * Caraguá Pixel — AST-safe CSS & JS Minification & Verification Pipeline
 *
 * Uses esbuild's parser/AST minifier (never naive regex stripping) so URLs
 * (`https://`), regex literals, template literals, and ASI semicolons are
 * preserved intact. Source `.css` and `.js` files are never modified; only
 * `.min.css` and `.min.js` outputs are written.
 *
 * Usage:
 *   node minify-assets.mjs
 *   node minify-assets.mjs css/empresas.css js/empresas.js
 *   node minify-assets.mjs --exclude=main.js,sugestoes.js
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

function loadEsbuild() {
  const candidates = [
    process.env.ESBUILD_PATH,
    "esbuild",
    "C:\\Users\\Elton\\dashboard\\node_modules\\esbuild",
    "C:\\Users\\Elton\\AppData\\Roaming\\npm\\node_modules\\tsx\\node_modules\\esbuild"
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      // try next candidate
    }
  }
  throw new Error(
    "esbuild not found. Install esbuild or set ESBUILD_PATH to its module path."
  );
}

const esbuild = loadEsbuild();

function countCssBraces(css) {
  // Strip single/double quoted strings so braces inside content:"{}" or url("...") don't skew counts
  const stripped = css
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "''");
  const open = (stripped.match(/\{/g) || []).length;
  const close = (stripped.match(/\}/g) || []).length;
  return { open, close, balanced: open === close };
}

function collectCriticalTokens(src, fileName) {
  const tokens = new Set();
  const windowExports = src.match(/\bwindow\.(CARAGUA_[A-Z0-9_]+|JOGO_[A-Z0-9_]+|VEREADORES_OFICIAIS|CONFIG|Personagem|testarModalApoio|__shop)\b/g) || [];
  for (const tok of windowExports) tokens.add(tok);

  if (/\bTHREE\b/.test(src)) tokens.add("THREE");

  const apiRefs = src.match(/api\/[a-z0-9_.-]+\.php/gi) || [];
  for (const ref of apiRefs) tokens.add(ref);

  const httpsUrls = src.match(/https:\/\/[a-z0-9.-]+(?:\/[a-z0-9_./?=&%-]*)?/gi) || [];
  for (const u of httpsUrls) {
    // Strip trailing punctuation if matched inside prose/templates
    tokens.add(u.replace(/[.,;:'")\]}>`]+$/, ""));
  }

  // Ensure personagem.js property names that become globals stay present
  if (fileName === "personagem.js") {
    for (const k of ["desenharMorador", "aparenciaAleatoria", "PALETA", "ESTILOS_CABELO", "OPCOES", "OFICIOS", "TRAJES"]) {
      tokens.add(k);
    }
  }
  return [...tokens];
}

function minifyCssFile(srcPath) {
  const relSrc = path.relative(__dirname, srcPath).replace(/\\/g, "/");
  const outPath = srcPath.replace(/\.css$/i, ".min.css");
  const relOut = path.relative(__dirname, outPath).replace(/\\/g, "/");

  const src = fs.readFileSync(srcPath, "utf8");
  const res = esbuild.transformSync(src, {
    loader: "css",
    minify: true,
    charset: "utf8",
    legalComments: "none"
  });

  if (res.warnings.length > 0) {
    throw new Error(`CSS warnings in ${relSrc}: ${JSON.stringify(res.warnings)}`);
  }

  const reparse = esbuild.transformSync(res.code, {
    loader: "css",
    minify: false,
    charset: "utf8"
  });
  if (reparse.warnings.length > 0) {
    throw new Error(`CSS reparse warnings in ${relOut}: ${JSON.stringify(reparse.warnings)}`);
  }

  const braces = countCssBraces(res.code);
  if (!braces.balanced) {
    throw new Error(`Unbalanced CSS braces in ${relOut}: {=${braces.open} }=${braces.close}`);
  }

  fs.writeFileSync(outPath, res.code, "utf8");

  const srcBytes = Buffer.byteLength(src, "utf8");
  const outBytes = Buffer.byteLength(res.code, "utf8");
  const savedBytes = srcBytes - outBytes;
  const savedPct = srcBytes > 0 ? ((savedBytes / srcBytes) * 100).toFixed(1) : "0.0";

  return {
    type: "css",
    source: relSrc,
    output: relOut,
    srcBytes,
    outBytes,
    savedBytes,
    savedPct: `${savedPct}%`,
    check: `reparse ok; braces ${braces.open}/${braces.close}`,
    exportsOk: true
  };
}

function minifyJsFile(srcPath) {
  const relSrc = path.relative(__dirname, srcPath).replace(/\\/g, "/");
  const outPath = srcPath.replace(/\.js$/i, ".min.js");
  const relOut = path.relative(__dirname, outPath).replace(/\\/g, "/");
  const baseName = path.basename(srcPath);

  const src = fs.readFileSync(srcPath, "utf8");
  const res = esbuild.transformSync(src, {
    loader: "js",
    minify: true,
    charset: "utf8",
    target: ["es2020"],
    legalComments: "none"
  });

  if (res.warnings.length > 0) {
    throw new Error(`JS warnings in ${relSrc}: ${JSON.stringify(res.warnings)}`);
  }

  fs.writeFileSync(outPath, res.code, "utf8");

  // Syntax check generated .min.js with Node
  execFileSync(process.execPath, ["--check", outPath], { stdio: "pipe" });

  // Verify critical globals, URLs, and endpoints survived intact
  const critical = collectCriticalTokens(src, baseName);
  const missing = critical.filter((tok) => !res.code.includes(tok));
  if (missing.length > 0) {
    throw new Error(`Critical tokens missing in ${relOut}: ${missing.join(", ")}`);
  }

  const srcBytes = Buffer.byteLength(src, "utf8");
  const outBytes = Buffer.byteLength(res.code, "utf8");
  const savedBytes = srcBytes - outBytes;
  const savedPct = srcBytes > 0 ? ((savedBytes / srcBytes) * 100).toFixed(1) : "0.0";

  const exportList = critical.filter(
    (t) => t.startsWith("window.") || t === "THREE" || ["desenharMorador", "PALETA"].includes(t)
  );

  return {
    type: "js",
    source: relSrc,
    output: relOut,
    srcBytes,
    outBytes,
    savedBytes,
    savedPct: `${savedPct}%`,
    check: "node --check PASS",
    exportsOk: true,
    verifiedExports: exportList
  };
}

function discoverTargets(args) {
  const exclude = new Set();
  const explicit = [];
  let jsonMode = false;

  for (const arg of args) {
    if (arg === "--json") {
      jsonMode = true;
    } else if (arg.startsWith("--exclude=")) {
      for (const item of arg.slice("--exclude=".length).split(",")) {
        if (item.trim()) exclude.add(item.trim().replace(/\\/g, "/"));
      }
    } else if (!arg.startsWith("-")) {
      explicit.push(path.resolve(__dirname, arg));
    }
  }

  let files = [];
  if (explicit.length > 0) {
    files = explicit;
  } else {
    for (const [dir, ext, minExt] of [
      ["css", ".css", ".min.css"],
      ["js", ".js", ".min.js"]
    ]) {
      const fullDir = path.join(__dirname, dir);
      if (!fs.existsSync(fullDir)) continue;
      const entries = fs
        .readdirSync(fullDir)
        .filter((f) => f.endsWith(ext) && !f.endsWith(minExt))
        .sort();
      for (const f of entries) {
        const rel = `${dir}/${f}`;
        if (!exclude.has(f) && !exclude.has(rel)) {
          files.push(path.join(fullDir, f));
        }
      }
    }
  }

  return { files, jsonMode };
}

function main() {
  const { files, jsonMode } = discoverTargets(process.argv.slice(2));
  if (files.length === 0) {
    console.error("No target CSS/JS files found.");
    process.exit(1);
  }

  const results = [];
  for (const f of files) {
    if (!fs.existsSync(f)) {
      throw new Error(`File not found: ${f}`);
    }
    if (/\.css$/i.test(f) && !/\.min\.css$/i.test(f)) {
      results.push(minifyCssFile(f));
    } else if (/\.js$/i.test(f) && !/\.min\.js$/i.test(f)) {
      results.push(minifyJsFile(f));
    } else {
      throw new Error(`Unsupported target (must be non-minified .css or .js): ${f}`);
    }
  }

  const totalSrc = results.reduce((s, r) => s + r.srcBytes, 0);
  const totalOut = results.reduce((s, r) => s + r.outBytes, 0);
  const totalSaved = totalSrc - totalOut;
  const totalPct = totalSrc > 0 ? ((totalSaved / totalSrc) * 100).toFixed(1) : "0.0";

  if (jsonMode) {
    console.log(JSON.stringify({ results, totalSrc, totalOut, totalSaved, totalPct: `${totalPct}%` }, null, 2));
    return;
  }

  console.log("Output | Source Bytes | Min Bytes | Saved | % | Verification | Preserved Exports");
  console.log("--- | ---: | ---: | ---: | ---: | --- | ---");
  for (const r of results) {
    const exp = r.verifiedExports && r.verifiedExports.length ? r.verifiedExports.join(", ") : "-";
    console.log(`${r.output} | ${r.srcBytes} | ${r.outBytes} | ${r.savedBytes} | ${r.savedPct} | ${r.check} | ${exp}`);
  }
  console.log(`TOTAL (${results.length} files) | ${totalSrc} | ${totalOut} | ${totalSaved} | ${totalPct}% | ALL PASS | -`);
}

main();
