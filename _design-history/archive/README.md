# Archive

Holding folder for files that are not part of the live site but worth keeping around.

## Subfolders

- **`backups/`** — `.bak-*` snapshots of `index.html` and `data.js` taken before each batch of edits. The scheduled review task currently writes new backups to the project root; move them here once the run is complete.
- **`code-reviews/`** — `CODE_REVIEW_*.md` audit reports of `app.js` / `data.js` cleanups. Historical records; the fixes themselves are already in the live code.
- **`audits/`** — older one-off audit notes (e.g. `em-citation-*.md`) that don't belong in the active `/reviews/` log.

## What stays out of here

- **`/reviews/`** at the project root — that's the active per-batch review log the scheduled article-review task reads on each run. Don't move it under `archive/`.
- All working files (`index.html`, `app.js`, `data.js`, `styles.css`, `global.css`, `supplement-pairings.*`, `robots.txt`, `sitemap.xml`, the `source-logos/`, `Visuals/`, `SS Editorial/`, and `Original/` folders).

## Suggested housekeeping

After every scheduled batch run that creates a new `.bak-*` file in the root:

```
mv index.html.bak-batch* data.js.bak-batch* archive/backups/
```

Keep only the most recent 1–2 backups in the root if you want a one-step rollback handy.
