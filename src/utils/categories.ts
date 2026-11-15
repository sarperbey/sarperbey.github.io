// Category slugs match the post tags written by scripts/import-raindrop.mjs
// (Raindrop tag "cat-music" becomes the post tag "music").
// Colors live in src/styles/theme.css as --cat-<slug>.
export const CATEGORIES = [
  { slug: "music", label: "Music" },
  { slug: "arts", label: "Arts & design" },
  { slug: "culture", label: "Film, TV & books" },
  { slug: "society", label: "Society, law & economy" },
  { slug: "politics", label: "Politics & policy" },
  { slug: "history", label: "History & geography" },
  { slug: "tech", label: "Technology & software" },
  { slug: "science", label: "Science & nature" },
  { slug: "life", label: "Life, food & travel" },
] as const;

export const categoryLabel = (slug: string) =>
  CATEGORIES.find(c => c.slug === slug)?.label ?? slug;

/** CSS color for a tag; unknown tags fall back to the muted text color. */
export const categoryColor = (slug: string) =>
  `var(--cat-${slug}, var(--muted-foreground))`;
