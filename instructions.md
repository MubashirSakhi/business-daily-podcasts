# Podcast Daily: adding editions & automation

## How the site works

Each day is one file, `site/src/content/editions/YYYY-MM-DD.json`. Pushing to `main` makes GitHub build and deploy the site, so you never run a build yourself.

- **Edition file:** episodes with show, title, URL, recap, fun facts, discussion questions and tagged highlights.
- **Checks:** the build rejects unknown shows, categories or topics. A failed build never deploys, so the live site stays on its last good version.
- **Artifacts are separate:** the Podcast Daily Timeline and Ask My Podcasts artifacts keep running on their own. The site copies from them; it never writes to them.

## Add a new edition by hand

Paste the day's HTML into Claude Code in this repo, check the summary, then say "ship".

1. Open Claude Code in `daily-podcasts/`.
2. Copy the day's cards from the Podcast Daily Timeline artifact: every `.card` under that day's `day-header`.
    - Several days at once is fine; you get one file per date.
    - A whole timeline page is too big to paste. Save it as a file and give Claude the path instead; it picks only the days newer than the latest edition.
3. Optional: also paste that day's `HIGHLIGHTS` lines from Ask My Podcasts. Claude then copies their text and category as they are. Without them, Claude writes 5 to 10 highlights from each recap.
4. Send it with one line, for example: `New edition:` followed by the HTML.
5. Claude writes the JSON, picks 1 to 3 topics per highlight from `site/src/data/topics.json`, and runs a quick local check.
6. Read the summary: episodes added, and any **new topics** Claude had to create. Rename or reject topics here.
7. Say **"ship"**. Claude commits and pushes to `main`, and GitHub deploys in a couple of minutes.

Don't rename an episode title after it ships. URLs are built from titles, so a rename breaks shared links.

## Run it automatically from this repo

Recommended: keep the existing `podcast-daily-digest` task as it is, and add a daily job on your Mac that runs Claude Code headless (`claude -p`). The job reads the live timeline artifact and ships any new editions. Don't run the digest skill a second time here. A second run would add duplicate entries to the artifacts and to the Airtable log.

| Option | What runs | Needs | Catch |
| --- | --- | --- | --- |
| **A. Local job, convert only (recommended)** | `claude -p` on your Mac, daily, about an hour after the digest task | Mac on or waking; `claude` logged in; repo pushed to GitHub | Topics are picked with no review; new ones are listed in the commit message |
| B. Local job, full skill | `claude -p` runs `podcast-digest` and then writes the edition | Same as A, plus the old scheduled task turned off | You maintain transcripts and the Airtable state from here |
| C. Cloud routine (`/schedule`) | Same prompt as A, on Anthropic's cloud on a cron | Repo on GitHub | Not tested yet: check that a cloud run can read your artifacts before relying on it |

### Set up option A

1. Test the command once by hand, from `daily-podcasts/`:

```bash
claude -p "Read the live Podcast Daily Timeline artifact (Artifact tool, action read; find it with action list). For every day newer than the latest file in site/src/content/editions/, write the edition JSON exactly as CLAUDE.md describes. Run npm run build in site/. If it passes, commit and push to main, and list any topics you added to topics.json in the commit message. If there are no new days, do nothing." \
  --permission-mode acceptEdits \
  --allowedTools "Artifact" "Bash(npm run build:*)" "Bash(git add:*)" "Bash(git commit:*)" "Bash(git push:*)"
```

2. Save that command as `~/bin/podcast-editions.sh`, starting with `cd ~/Documents/code/daily-podcasts`, and run `chmod +x` on it.
3. Schedule it with launchd. Unlike cron, launchd runs a job the Mac slept through as soon as it wakes. Save this as `~/Library/LaunchAgents/com.podcastdaily.editions.plist` and adjust the hour:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.podcastdaily.editions</string>
  <key>ProgramArguments</key><array><string>/bin/zsh</string><string>-lc</string><string>~/bin/podcast-editions.sh</string></array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>9</integer><key>Minute</key><integer>0</integer></dict>
  <key>StandardOutPath</key><string>/tmp/podcast-editions.log</string>
  <key>StandardErrorPath</key><string>/tmp/podcast-editions.log</string>
</dict></plist>
```

4. Turn it on with `launchctl load ~/Library/LaunchAgents/com.podcastdaily.editions.plist`. Check `/tmp/podcast-editions.log` after the first run.

To go back to manual, run `launchctl unload` on the same file. The paste flow above keeps working either way.

## One-time setup still needed

The site has never been deployed: the repo has no commits and no GitHub remote yet.

- [ ] Create the GitHub repo `MubashirSakhi/business-daily-podcasts` (public; its name must match `base` in `site/astro.config.mjs`), make the first commit and push.
- [ ] On GitHub, go to Settings → Pages → Source and choose **GitHub Actions**.
- [ ] Check that the first deploy goes live at `https://mubashirsakhi.github.io/business-daily-podcasts/`.
- [ ] Decide whether the manual flow pushes only after you say "ship" (suggested) or pushes straight away.
- [ ] Optional: set up option A from the section above.
