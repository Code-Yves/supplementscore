# Article Registration Watchdog — 2026-05-26

## Trigger

`register-articles.mjs --scan` returned `orphanCount: 4` (exit 1). Threshold for major-incident flagging is >80, so this is **not** a major incident — but it is the first non-clean watchdog run since the inline-registration change shipped 2026-05-22, so it gets a full report.

## Summary

**No registrations performed. No deletions performed.**

All 4 "orphans" are **intentional consolidation/redirect tombstones**, not real articles. The scan script (`findOrphans` in `scripts/register-articles.mjs`, line 124-135) does pure filename diffing — it has no content inspection and therefore can't distinguish a real article from a 558-byte `<meta refresh>` stub. Registering these as articles would be destructive (they'd land in `data.js` / `index.html` / `sitemap-articles.xml` as if they were content pages, which they explicitly are not — they're all `<meta name="robots" content="noindex,follow">`).

This is a **scanner defect**, not a generator failure. Flagged below.

## The 4 orphans

| Slug | Size | Mtime | Redirect target | Target exists? |
|------|------|-------|-----------------|----------------|
| `index` | 558 B | 2026-05-25 17:23 | `/article.html` (Articles hub) | OK |
| `anthocyanin-concentrate` | 903 B | 2026-05-25 17:30 | `/a/bilberry-extract-what-the-eye-health-evidence-actually-shows.html` | OK |
| `nicotinic-acid-vs-niacinamide-flushing-hepatotoxicity-and-dose-differences` | 708 B | 2026-05-25 17:30 | `/s/niacin.html` (+ `/s/niacinamide.html`) | OK |
| `st-johns-wort-drug-interactions-the-cyp3a4-inducer-problem` | 917 B | 2026-05-25 17:30 | `/a/10-supplements-that-interact-with-the-most-prescription-drugs.html` | OK |

Every file is structurally identical: `<meta name="robots" content="noindex,follow">` + `<meta http-equiv="refresh" content="0;url=…">` + `<script>location.replace(…)</script>` + a one-line `<body>` paragraph with a manual `<a>` fallback. All redirect targets exist on disk. None of these slugs appear in `data.js`, `index.html`, or `sitemap-articles.xml` — confirmed unregistered, which is correct for noindex redirects.

Size context: the smallest real `/a/` article on disk is 11,922 B. These 4 stubs are 558–917 B. There's a clean ~11 KB gap that a size heuristic could exploit, but content inspection is more reliable.

## Origin

No `nightly-article-generation` run on 2026-05-25 (that task is Sunday-only and last ran 2026-05-24). The mtimes (17:23–17:30 UTC) and the consolidation-redirect content pattern line up with the manual cleanup work logged in memory for 2026-05-25:

- `project_top100_audit_2026_05_25` — Top-100 evidence audit (566 article-supplement edges added, 85 over-tag removals).
- `project_s_legacy_tombstone_2026_05_25` — 547 legacy `/s/` static cards redirected to `/supplement.html?slug=…`.

These 4 are almost certainly hand-created during that audit (e.g. anthocyanin-concentrate consolidating into bilberry, nicotinic-acid splitting between two `/s/` pages) and were not added to the scanner's ignore list because no such ignore list exists.

## Recommended fix (scanner-side, single source of truth)

Patch `scripts/register-articles.mjs::findOrphans` to skip stubs:

```js
function findOrphans(slugSet) {
  const files = fs.readdirSync(A_DIR).filter(f => f.endsWith('.html') && !f.includes('.bak-'));
  const orphans = [];
  for (const f of files) {
    const slug = f.replace(/\.html$/, '');
    if (slugSet.has(slug)) continue;
    // Skip noindex/meta-refresh redirect stubs — they are not articles.
    const fp = path.join(A_DIR, f);
    const stat = fs.statSync(fp);
    if (stat.size < 2000) {
      const head = fs.readFileSync(fp, 'utf8').slice(0, 2000);
      if (/<meta\s+name=["']robots["']\s+content=["']noindex/i.test(head) ||
          /<meta\s+http-equiv=["']refresh["']/i.test(head)) {
        continue;
      }
    }
    orphans.push({ slug, file: f, mtime: stat.mtime.getTime() });
  }
  orphans.sort((a, b) => b.mtime - a.mtime);
  return orphans;
}
```

Two-condition guard (small + noindex/refresh) so we don't accidentally silence a real but malformed article. Not applied in this run — that's a code change Yves should sign off on; the watchdog should not silently rewrite its own scanner.

## What this run did NOT do

- Did not call `--orphans` (would have written 4 redirect stubs into data.js / index.html / sitemap as if they were articles).
- Did not delete the .html files (they are valid intentional redirects; users may follow them from old links/SEO).
- Did not modify data.js / index.html / sitemap-articles.xml.
- Did not modify the scanner script.

## Files modified

- `reviews/article-registration-log.md` — appended one `WATCHDOG-NOACTION` row.
- `reviews/article-registration-2026-05-26.md` — this report.

## Spot-check

N/A — no registrations performed.

## Next watchdog run

Will re-flag these same 4 unless either (a) the scanner is patched per the fix above, or (b) the stubs are removed. Recommend option (a). Until then expect a `WATCHDOG-NOACTION` line every day.
