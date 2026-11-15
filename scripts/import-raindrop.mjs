#!/usr/bin/env node
/* eslint-disable no-console */
// Imports Raindrop bookmarks tagged "publish" into src/content/posts/*.md
//
// Usage (from the repo root):
//   export RAINDROP_TOKEN=xxxx
//   node scripts/import-raindrop.mjs --check              # validate tags + test links, write nothing
//   node scripts/import-raindrop.mjs --dry                # show what would be written
//   node scripts/import-raindrop.mjs --limit 60           # launch batch: first 60 (oldest first), original dates
//   node scripts/import-raindrop.mjs --drip 3             # future dates, 3 posts per week, from tomorrow
//   Extra: --no-linkcheck  (skip the dead-link test)
//
// Required tags on every bookmark: "publish", one lang-xx tag, and 1-2 cat-xx tags.
// The bookmark's NOTE field becomes the post description (falls back to the excerpt).

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const TOKEN = process.env.RAINDROP_TOKEN;
const OUT_DIR = "src/content/posts";
const API = "https://api.raindrop.io/rest/v1";
const CATS = new Set(["music", "arts", "culture", "society", "politics", "history", "tech", "science", "life"]);
const LANGS = new Set(["en", "it", "tr"]);

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};
const CHECK_ONLY = has("--check");
const DRY = has("--dry");
const SKIP_LINKCHECK = has("--no-linkcheck");
const LIMIT = val("--limit") ? Number(val("--limit")) : Infinity;
const DRIP = val("--drip") ? Number(val("--drip")) : 0;

if (!TOKEN) {
  console.error("Set RAINDROP_TOKEN first (export RAINDROP_TOKEN=...).");
  process.exit(1);
}

async function api(p, opts = {}) {
  const r = await fetch(API + p, {
    ...opts,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  });
  if (!r.ok) throw new Error(`Raindrop API ${r.status} on ${p}`);
  return r.json();
}

async function fetchTagged() {
  const items = [];
  for (let page = 0; ; page++) {
    const q = new URLSearchParams({ search: "#publish", perpage: "50", page: String(page) });
    const { items: batch } = await api(`/raindrops/0?${q}`);
    if (!batch || !batch.length) break;
    items.push(...batch);
  }
  return items.filter((i) => (i.tags || []).includes("publish"));
}

async function isAlive(url) {
  for (const method of ["HEAD", "GET"]) {
    try {
      const r = await fetch(url, {
        method,
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "Mozilla/5.0 (link-check)" },
      });
      // 401/403/429 usually mean "bot blocked", not "dead"
      if (r.ok || [401, 403, 429].includes(r.status)) return { ok: true };
      if (method === "GET") return { ok: false, why: String(r.status) };
    } catch (e) {
      if (method === "GET") return { ok: false, why: e.cause?.code || e.name };
    }
  }
  return { ok: false, why: "unknown" };
}

async function mapPool(list, size, fn) {
  const out = new Array(list.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < list.length) {
        const i = next++;
        out[i] = await fn(list[i]);
      }
    })
  );
  return out;
}

const slug = (t) =>
  t
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "post";

async function existingLinks() {
  const set = new Set();
  let files = [];
  try {
    files = await readdir(OUT_DIR);
  } catch {
    console.error(`Folder ${OUT_DIR} not found: run this from the repo root.`);
    process.exit(1);
  }
  for (const f of files.filter((f) => f.endsWith(".md"))) {
    const txt = await readFile(path.join(OUT_DIR, f), "utf8");
    const m = txt.match(/^link:\s*"?(.+?)"?\s*$/m);
    if (m) set.add(m[1]);
  }
  return set;
}

function validate(item) {
  const tags = item.tags || [];
  const cats = tags.filter((t) => t.startsWith("cat-")).map((t) => t.slice(4));
  const langs = tags.filter((t) => t.startsWith("lang-")).map((t) => t.slice(5));
  const problems = [];
  if (cats.length < 1 || cats.length > 2) problems.push(`needs 1-2 cat- tags (has ${cats.length})`);
  const badCats = cats.filter((c) => !CATS.has(c));
  if (badCats.length) problems.push(`unknown category: ${badCats.join(", ")}`);
  if (langs.length !== 1 || !LANGS.has(langs[0])) problems.push("needs exactly one lang-en / lang-it / lang-tr tag");
  const desc = (item.note || item.excerpt || "").trim();
  if (!desc) problems.push("no note or excerpt (description is required)");
  return { problems, cats, lang: langs[0], desc };
}

async function main() {
  console.log("Fetching bookmarks tagged 'publish'...");
  const all = (await fetchTagged()).sort((a, b) => new Date(a.created) - new Date(b.created));
  const known = await existingLinks();
  console.log(`${all.length} tagged, ${known.size} posts already in the repo.`);

  const ready = [];
  for (const item of all) {
    if (known.has(item.link)) {
      console.log(`SKIP (already in repo): ${item.title}`);
      continue;
    }
    const v = validate(item);
    if (v.problems.length) {
      console.log(`FIX TAGS: ${item.title}\n   ${item.link}\n   -> ${v.problems.join("; ")}`);
      continue;
    }
    ready.push({ item, ...v });
  }

  let candidates = ready;
  if (!SKIP_LINKCHECK) {
    console.log(`Checking ${ready.length} links...`);
    const results = await mapPool(ready, 5, (r) => isAlive(r.item.link));
    candidates = [];
    ready.forEach((r, i) => {
      if (results[i].ok) candidates.push(r);
      else console.log(`DEAD (${results[i].why}): ${r.item.title}\n   ${r.item.link}`);
    });
  }

  const batch = candidates.slice(0, LIMIT);
  console.log(`\n${batch.length} posts ready to import (${candidates.length} valid, ${ready.length - candidates.length} dead).`);
  if (CHECK_ONLY) return;

  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 1);
  start.setUTCHours(8, 0, 0, 0);

  let n = 0;
  for (const [i, { item, cats, lang, desc }] of batch.entries()) {
    let date;
    if (DRIP > 0) {
      date = new Date(start);
      date.setUTCDate(start.getUTCDate() + Math.floor((i * 7) / DRIP));
    } else {
      date = new Date(item.created);
    }
    const title = (item.title || item.link).trim();
    const file = path.join(OUT_DIR, `${slug(title)}-${String(item._id).slice(-5)}.md`);
    const content = [
      "---",
      `title: ${JSON.stringify(title)}`,
      `pubDatetime: ${date.toISOString()}`,
      `description: ${JSON.stringify(desc.slice(0, 280))}`,
      `link: ${JSON.stringify(item.link)}`,
      `lang: ${lang}`,
      "tags:",
      ...cats.map((c) => `  - ${c}`),
      "draft: false",
      "---",
      "",
      "",
    ].join("\n");

    if (DRY) {
      console.log(`WOULD WRITE ${file}  [${date.toISOString().slice(0, 10)}]`);
      continue;
    }
    await writeFile(file, content, "utf8");
    const newTags = [...new Set((item.tags || []).filter((t) => t !== "publish").concat("published"))];
    await api(`/raindrop/${item._id}`, { method: "PUT", body: JSON.stringify({ tags: newTags }) });
    n++;
  }
  if (!DRY) console.log(`Done: ${n} files written, tags updated in Raindrop. Review with git diff, then commit.`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
