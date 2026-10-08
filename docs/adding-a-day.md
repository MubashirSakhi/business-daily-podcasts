# How a Day Gets Added to Podcast Daily

Shared copy: https://claude.ai/code/artifact/52bcc25a-70ee-4a65-a043-1b1b794a9c3a

## Overview

The daily digest runs on its own, but the public site changes only when you paste a day into Claude Code. The rest of the chain is one edition file, one build and one push.

```
 AUTOMATIC, EVERY DAY
 ┌──────────────────────────┐      ┌──────────────────────────────┐
 │ podcast-daily-digest     │ ───▶ │ Two Claude Artifacts         │
 │ scheduled task, 3 skills │      │ Timeline and Ask My Podcasts │
 └──────────────────────────┘      └──────────────────────────────┘
                                                  │
                      you paste the day into Claude Code
                                                  │
 BY HAND, WHEN YOU PASTE                          ▼
 ┌──────────────────────────┐      ┌──────────────────────────────┐
 │ Edition file             │ ───▶ │ Build and validate           │
 │ editions/YYYY-MM-DD.json │      │ astro build, zod schema check│
 └──────────────────────────┘      └──────────────────────────────┘
                                                  │ stops here on a bad paste
                                                  ▼
 ┌──────────────────────────┐      ┌──────────────────────────────┐
 │ Commit and push to main  │ ◀─── │ Search index                 │
 │ only when you ask        │      │ Pagefind, episode pages only │
 └──────────────────────────┘      └──────────────────────────────┘
              │ deploy.yml rebuilds in GitHub Actions
              ▼
 ┌──────────────────────────┐
 │ Live on GitHub Pages     │
 │ /business-daily-podcasts │
 └──────────────────────────┘
```

The top band runs without you. Everything in the lower band happens in this repo, and each step below has its own section.

## Step 1: the digest runs (automatic, outside the site)

Every day a scheduled task writes the recaps. It does not touch the site: the site only changes when you paste.

- **Scheduled task:** `podcast-daily-digest`, which runs the skills `podcast-digest`, `podcast-carousel` and `podcast-summary-and-design`.
- **Shows tracked:** My First Million, Planet Money, Stuff You Should Know, What's Your Problem, Masters of Scale.
- **What it writes:** two Claude Artifacts. *Podcast Daily Timeline* gets a new day section of episode cards. *Ask My Podcasts* gets new rows in its searchable highlights list.
- **Run state:** kept in the Airtable base "Podcast Digest Log". The old *Podcast Digest State* artifact is a deprecated stub.

The artifacts keep running on their own. Nothing in this step builds or deploys the public site.

## Step 2: you paste, Claude writes the edition file

You paste the day's raw digest output into Claude Code: card HTML, recap text, or whatever the skill produced. Claude turns it into one file, `site/src/content/editions/YYYY-MM-DD.json`. That file is the only thing a day adds.

| Field | Level | Rule |
| --- | --- | --- |
| `date` | edition | `YYYY-MM-DD`, matches the file name |
| `lead_headline`, `lead_dek` | edition | Optional. Fill the homepage "Today's read" card. Written only when you ask; otherwise the card shows the first episode's title and no dek |
| `show` | episode | Exactly one of the 5 tracked shows |
| `title` | episode | Becomes the URL slug. Never rename it after publishing, or shared links break |
| `url` | episode | Link to the episode |
| `recap` | episode | List of paragraphs. Only `**bold**` is rendered; everything else is escaped |
| `fun_facts`, `discussion_questions` | episode | Lists of strings, may be empty |
| `highlights` | episode | At least 1. If the paste has none, Claude writes 5 to 10 from the recap |
| `highlights[].category` | highlight | Exactly one of the 7 categories. These are the site's **tags** |
| `highlights[].topics` | highlight | 1 to 3 names from the topic registry |

**Categories (tags):** Startup Idea, Business Model, Trivia, Technical Wisdom, Investing, Marketing/Growth, Life/Career Advice.

**Topics** live in `site/src/data/topics.json` (75 today, sorted A to Z, each with optional `aliases`). Claude reuses an existing topic or alias first. A genuinely new topic is added to the registry in alphabetical order, and Claude tells you which ones it added.

**A new show** needs three extra edits before its episodes will build: `SHOWS` in `src/content.config.ts`, `SHOW_BADGE` in `src/lib.ts`, and a `--xxx` colour plus `.badge.xxx` rule in `src/layouts/Base.astro`.

## Step 3: build and validate

Claude runs `npm run build` in `site/`. A bad paste fails here, on your machine, instead of shipping. The build command is `astro build && pagefind --site dist`, so it validates, renders and indexes in one go.

**Validation.** The zod schema in `src/content.config.ts` checks every edition file. The build stops with an error if any of these are wrong:

- a `show` that isn't one of the 5 shows
- a `category` that isn't one of the 7 categories
- a topic that isn't in `topics.json`, or fewer than 1 or more than 3 topics on a highlight
- a missing or empty required field, a bad `date` format, or a `url` that isn't a URL

**Pages generated.** Astro rebuilds the whole site from all edition files, newest first. One new day changes these pages (all under `/business-daily-podcasts`):

| Page | URL | What changes |
| --- | --- | --- |
| Homepage | `/` | New day becomes "Today's read"; the previous 6 move to Past editions |
| Older pages | `/2/`, `/3/`… | Everything shifts back; 12 editions per page |
| Edition | `/YYYY/MM/DD/` | New page for the day |
| Episode | `/YYYY/MM/DD/<title-slug>/` | One new page per episode |
| Tags | `/tags/<slug>/` | New highlights appear under their category |
| Topics | `/topics/<slug>/` | New highlights appear; a new topic gets its own page |
| RSS | `/rss.xml` | New item with each episode's highlights |

## Step 4: search index

Right after Astro finishes, Pagefind reads the built HTML in `dist/` and writes a static search index to `dist/pagefind/`. No server is involved: the browser downloads index chunks as you type.

- **What gets indexed:** only episode pages. They are the only pages wrapped in `data-pagefind-body`, so Pagefind ignores everything else. As of 2026-10-05 that is 44 pages and about 5,300 words.
- **Filters:** each episode page marks its `show`, its tags (`category`) and its `topics` with `data-pagefind-filter`. These become the filter panels on `/search/`.
- **Where you search from:** the Search link in the nav, or the homepage search box, which sends `?q=` to `/search/` and runs the query on load.
- **Dev mode has no index.** `npm run dev` skips Pagefind, so `/search/` only shows a hint. To try search locally, run `npm run build && npm run preview`.

Nothing about search needs a manual step: every build rebuilds the full index, including the new day.

## Step 5: publish

The new day goes live only when it is pushed to `main`. Claude commits and pushes only when you ask.

1. **Commit** the new edition file, plus `topics.json` if topics were added.
2. **Push to `main`.** This triggers `.github/workflows/deploy.yml`.
3. **Build job** (GitHub Actions, Node 24): `npm ci`, then the same `npm run build` as Step 3, with `SITE_URL` set to the GitHub Pages address. The search index is rebuilt here too.
4. **Deploy job:** uploads `site/dist` and publishes it to GitHub Pages under `/business-daily-podcasts`.

Deploys queue rather than cancel each other, so two quick pushes both ship in order. You can also rerun a deploy by hand from the Actions tab (`workflow_dispatch`).

## Checklist and failure points

Use this for each day you add.

- [ ] Paste the day's digest output into Claude Code
- [ ] Check the new `editions/YYYY-MM-DD.json` (episodes, titles, highlights)
- [ ] Note any topics Claude added to `topics.json`
- [ ] `npm run build` passes
- [ ] Optional: `npm run preview` and try the new day in search
- [ ] Ask Claude to commit and push
- [ ] Deploy run is green in GitHub Actions

| What goes wrong | Where it shows | Fix |
| --- | --- | --- |
| Topic not in the registry | Build fails with a zod error naming the topic | Use an existing topic or alias, or add it to `topics.json` |
| Unknown show | Build fails on `show` | Add the show in the 3 places listed in Step 2 |
| Category spelled differently | Build fails on `category` | Use one of the 7 exact names |
| Episode title edited after publishing | No error; old links 404 | Keep the original title |
| Search empty locally | `/search/` shows the build hint | Use `npm run build && npm run preview`, not `npm run dev` |
| Site not updated after push | Deploy run failed or still queued | Check the Actions tab, then rerun |
