# sarperbey.github.io

A personal link blog: curated articles and links in English, Italian and Turkish, plus occasional short notes. Built with [Astro](https://astro.build) and the [AstroPaper](https://github.com/satnaing/astro-paper) theme, edited through [Tina CMS](https://tina.io) and hosted on GitHub Pages.

- Site: https://sarperbey.github.io
- Editor (Tina): https://sarperbey.github.io/admin/index.html

## How it works

```
Raindrop (inbox)  ->  import script  ->  Markdown posts in this repo  ->  GitHub Actions  ->  GitHub Pages
                                              ^
                                     Tina CMS (notes, edits)
```

- Links are saved to **Raindrop.io** from Firefox or the Android share sheet.
- A local script turns tagged bookmarks into Markdown files in `src/content/posts/`.
- Longer posts, short notes and edits are written in Tina, which edits the same files.
- Every push to `main` is built and deployed by GitHub Actions.

Everything in this repository is public. Drafts and private material stay in Raindrop or elsewhere, never here.

## Tag scheme (Raindrop)

| Tag | Meaning |
|---|---|
| `publish` | selected for the site (the script replaces it with `published` after import) |
| `lang-en` / `lang-it` / `lang-tr` | language of the article (exactly one) |
| `cat-…` | category (one or two) |

Categories:

| Tag | Topic |
|---|---|
| `cat-music` | Music |
| `cat-arts` | Arts & design |
| `cat-culture` | Film, TV & books |
| `cat-society` | Society, law & economy |
| `cat-politics` | Politics & policy |
| `cat-history` | History & geography |
| `cat-tech` | Technology & software |
| `cat-science` | Science & nature |
| `cat-life` | Life, food & travel |

The bookmark's **note** field becomes the post description. It is required, so write one short sentence per link.

## Importing links

Run from the repo root. The token is read from an environment variable and must never be committed.

```bash
export RAINDROP_TOKEN=your-token

node scripts/import-raindrop.mjs --check        # validate tags and test links, write nothing
node scripts/import-raindrop.mjs --dry          # show which files would be written
node scripts/import-raindrop.mjs --limit 60     # write the 60 oldest valid links, original dates
node scripts/import-raindrop.mjs --drip 3       # future dates, 3 posts per week from tomorrow
```

Extra option: `--no-linkcheck` skips the dead-link test. Links already in the repo are skipped. After each file is written, the bookmark's tag changes from `publish` to `published`.

Posts dated in the future stay hidden until a build runs after that date, so a scheduled daily rebuild in the deploy workflow makes `--drip` work on its own.

## Post format

```yaml
---
title: "Article title"
pubDatetime: 2026-11-14T08:00:00.000Z
description: "One-sentence note."
link: "https://example.com/article"
lang: en            # en | it | tr
tags:
  - tech
draft: false
---
```

Posts without a `link` field are regular notes.

## Development

```bash
pnpm install
pnpm dev        # local site and Tina editor
pnpm build      # tinacms build, astro check, astro build, pagefind
```

After changing the Tina schema (`tina/config.ts`), commit the regenerated `tina/tina-lock.json` too, otherwise the CI build fails with a schema mismatch against TinaCloud.

## Project layout

| Path | Purpose |
|---|---|
| `src/content/posts/` | all posts (Markdown) |
| `src/content.config.ts` | content schema |
| `tina/config.ts` | Tina CMS collections and fields |
| `scripts/import-raindrop.mjs` | Raindrop import script |
| `src/config.ts`, `src/constants.ts` | site title, description and social links |
| `.github/workflows/` | build and deploy |

## Credits

Theme: [AstroPaper](https://github.com/satnaing/astro-paper) by Sat Naing, MIT licensed.
