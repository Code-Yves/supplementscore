# Homepage slim-down — scope & plan (2026-05-31)

## The problem (measured)

`index.html` is **3.27 MB raw / 699 KB gzipped / 29,080 lines** — the heaviest thing on the site, and the dominant mobile-performance cost (more than `data.js` at 331 KB gzip).

| Zone | Lines | Raw size | What it is |
|------|-------|----------|------------|
| 1 | 1–2,082 | 169 KB | head, hero carousel, profile wizard, search box |
| 2 | 2,083–13,240 | 933 KB | **845 article summary cards** (`#research-list-view`) |
| 3 | 13,241–end | **2,164 KB** | **592 full article bodies** (`article-full`, `display:none`), shown in-page on click |

**Zone 3 is the elephant.** 592 complete articles — prose, evidence-bar charts, sources — are inlined and hidden (`display:none`), downloaded and parsed on *every* homepage visit but only revealed when a user clicks a card. They duplicate the `/a/` pages (574 of which are already sitemapped and individually crawlable), and because they're `display:none` they add ~zero SEO value while costing 2.16 MB.

## The target

Removing Zone 3 alone takes the homepage from **699 KB → ~152 KB gzip (−78%)** and ~2.16 MB less to download/parse. Single highest-impact change available.

## Phased plan

### Phase 1 — stop inlining the 592 full bodies *(biggest win, ~78% gzip cut)*
Replace the hidden `#article-N` divs with on-demand loading. Two approaches:
- **1a — navigate to the `/a/` page** on card click. Simplest, most robust, best for SEO (each article already has its own URL). Drops the in-page "reader" overlay.
- **1b — fetch the `/a/` body on click** and inject it into the existing reader overlay. Keeps the current no-reload feel; more code.

Work: rewire `_research-modal.js` / `_research-chrome.js`, which currently assume the divs are present in the DOM. **Risk: medium** — it's a core homepage interaction, so it needs a tested branch + QA (open a few articles, check evidence charts, share/close buttons, deep links).

### Phase 2 — render the 845 summary cards from a compact index *(further ~900 KB raw)*
Generate `articles-index.json` (slug, title, category, meta, side-stats) and render cards client-side with pagination / lazy-load (show ~20–30 initially, rest on scroll). Server-render the first page of cards so crawlers still see links. **Risk: medium** (card-link discoverability — mitigated by the sitemap + the SSR'd first page).

### Phase 3 — polish
Lazy-load the PDF export libs (`jspdf`, `pdf-export.js`) only when the user exports; optionally move the whole research browser to a `/research` route so the homepage stays lean (hero + search + browse-by + a few featured picks).

## Recommendation

The site works fine at 699 KB — this is a Core-Web-Vitals optimization, **not a launch blocker**. Phase 1 is high-value but touches the core homepage reader, so it deserves a tested branch rather than a rushed pre-launch edit.

**Suggested: launch on schedule (June 6) as-is; make Phase 1 the first post-launch task.** Or, if we have time to QA it, do Phase 1 now in a branch. Phases 2–3 are follow-ups.

*(Note: the `preload` hints for `data.js`/`app.js` added 2026-05-31 are an interim win and are independent of this plan.)*
