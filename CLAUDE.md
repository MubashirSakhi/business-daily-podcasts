# daily-podcasts

Two things live here:

1. **`site/`**: the public Astro site "Podcast Daily" (git-tracked, deployed to GitHub Pages).
   See "Public site" below.
2. **Artifact folders**: local working copies of three Claude Artifacts (gitignored). Each
   directory is one published artifact: `index.html` is the live page, `versions/` holds past
   publishes, `debug.jsonl` is a page-load log, `thumbnail.png` is the gallery card.

## The three artifacts

| Directory | Artifact | Role |
|---|---|---|
| `podcast-daily-timeline/` | Podcast Daily Timeline | Reverse-chronological day sections of episode recaps, filterable by category |
| `podcast-knowledge-chat/` | Ask My Podcasts | Search over every tagged highlight |
| `podcast-digest-state/` | Podcast Digest State | **Deprecated stub.** State moved to the Airtable base "Podcast Digest Log". Leave it alone |

Data is written by the `podcast-daily-digest` scheduled task (skills: `podcast-digest`,
`podcast-carousel`, `podcast-summary-and-design`). Tracked shows: My First Million,
Planet Money, Stuff You Should Know, What's Your Problem, Masters of Scale.

## Editing rules

Both live pages are single-file, vanilla, no dependencies, hand-written HTML + one inline
`<script>`. Match that — don't introduce a framework or a build step.

**Timeline** (`podcast-daily-timeline/index.html`): newest day first. A new day is a
`.day-section` with a `.day-header` ("September 29, 2026") containing `.card` divs. Each card
needs `data-cats="Cat|Cat|Cat"` (pipe-separated) for the filter buttons to work, plus a
`<span class="badge XX">` — `mfm`, `pm`, `sysk`, `wyp`, `mos`. New show ⇒ add a badge class
and, for a new category, a `.filter-btn` with matching `data-cat`.

**Chat** (`podcast-knowledge-chat/index.html`): append objects to the `HIGHLIGHTS` array
between the `// DATA_START` / `// DATA_END` comments — one JSON object per line, fields
`date, show, category, text, episode_title, episode_url`. Sorted oldest→newest; the page
shows the *first* 20, so appending is correct. `CATEGORY_COLORS` must have a key for every
category or dots fall back to grey.

Categories in use: Startup Idea, Business Model, Trivia, Technical Wisdom, Investing,
Marketing/Growth, Life/Career Advice.

## Publishing

Changes here only go live via the Artifact tool. These are existing artifacts from earlier
sessions: `action: "read"` with the artifact's `url` first (find it with `action: "list"`),
then publish to that same `url`. Publishing without `url` creates a duplicate artifact.
Never touch `versions/`, `debug.jsonl` or `thumbnail.png` by hand — the platform owns them.

## Public site (`site/`)

Astro 7 static site + Pagefind search. `npm run dev` to preview (search only works after
`npm run build && npm run preview`). Pushing to `main` deploys via `.github/workflows/deploy.yml`.
The artifacts keep running unchanged; the site is updated separately, by hand.

**Daily paste flow.** The user pastes a day's raw digest output (card HTML, recap text,
whatever the skill produced). Turn it into `site/src/content/editions/YYYY-MM-DD.json`:

```json
{ "date": "2026-09-29", "episodes": [{
  "show": "Planet Money", "title": "...", "url": "https://...",
  "recap": ["**Bold lead.** Paragraph text", "..."],
  "fun_facts": ["..."], "discussion_questions": ["..."],
  "highlights": [{ "text": "...", "category": "Investing", "topics": ["Taxes", "Wealth"] }]
}]}
```

- `recap` paragraphs support `**bold**` only; everything else is escaped.
- Optional `lead_headline` / `lead_dek` (top-level, beside `date`) fill the homepage "Today's read"
  card. Without them it shows the first episode's title and no dek. Write them only if the user asks.
- `category` is exactly one of the 7 categories above (these are the site's **tags**).
- `topics`: 1–3 per highlight from `site/src/data/topics.json`. Reuse an existing topic (check
  names and `aliases`) before adding a new one. Add new ones to the registry (keep it sorted
  A–Z) and **tell the user which topics you added**.
- If the paste has no separate highlights, write 5–10 from the recap, like the existing ones.
- Then run `npm run build` in `site/`. The zod schema in `src/content.config.ts` rejects unknown
  shows, categories or topics. Commit and push only when the user asks.

New show ⇒ add it to `SHOWS` in `content.config.ts`, `SHOW_BADGE` in `src/lib.ts`, and a
`--xxx` colour + `.badge.xxx` rule in `src/layouts/Base.astro`.

URLs: `/YYYY/MM/DD/` (edition), `/YYYY/MM/DD/<title-slug>/` (episode), `/tags/<slug>/`,
`/topics/<slug>/`, `/search/`, `/rss.xml`, all under the `/business-daily-podcasts` base. Slugs come from
titles, so don't rename a published episode's title; that breaks shared links.
