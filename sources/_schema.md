# Sources framework — normalized schema

**Phase:** 1 / Item #1 of `IMPLEMENTATION_ROADMAP.md`
**Status:** Framework + 3 working adapters (NIH ODS, openFDA FAERS, Cochrane CRSO)
landed 2026-04-28. Stubs for the remaining 5 sources, with URLs and approach
documented in each stub file.

---

## Goal

Move the citation database from "PubMed only" to a multi-source corpus drawn from 8
free authoritative sources. Every adapter normalizes its output to a common schema so
the daily review pipeline can ingest them uniformly.

## Source registry

Authoritative list lives in `sources/registry.json`. Each entry describes:

- `key` — short identifier (`ods`, `efsa`, `ema`, `cochrane`, `openfda`, `health_canada`, `who`, `medlineplus`)
- `label` — human-readable name
- `tier` — 1 / 2 / 3 (corresponds to the tier table in `IMPLEMENTATION_ROADMAP.md`)
- `homepage` — canonical URL for the source
- `query_form` — describes how the adapter queries the source (URL pattern, REST API, or static dossier list)
- `adapter` — relative path to the Python module that implements the adapter
- `status` — `live` (working) or `stub` (URL + approach documented, implementation pending)
- `notes` — anything noteworthy

## Normalized output schema

Every adapter returns a list of records matching this shape:

```json
{
  "supplement": "Vitamin D3",
  "source_key": "ods",
  "source_label": "NIH Office of Dietary Supplements",
  "source_url": "https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/",
  "fetched_at": "2026-04-28T12:34:56Z",
  "last_updated": "2024-09-18",
  "evidence_summary": "Brief plain-prose summary of what the source says about this supplement. ~3-6 sentences.",
  "key_claims": [
    {
      "claim": "Adults aged 19-70 require 600 IU/day of vitamin D from all sources.",
      "evidence_grade": "regulator",
      "context": "RDA established by the Food and Nutrition Board of the National Academies."
    }
  ],
  "cited_studies": [
    {
      "title": "...",
      "doi": "10.1000/xyz",
      "pmid": "12345678",
      "year": 2023,
      "funder": "NIH",
      "funder_type": "public",
      "coi": false
    }
  ]
}
```

### Field rules

- `supplement` — must match a name in `data.js` `S` array OR a known synonym. Matching is
  the consumer's job (the daily review pipeline maps source records back to data.js entries).
- `source_key` — from the registry.
- `source_url` — the URL the human reviewer can click to verify the claim. Must be stable.
- `last_updated` — when *the source* was last updated, not when we fetched it. Best-effort.
- `evidence_summary` — plain-language summary suitable for inclusion in a review note.
  No raw HTML.
- `key_claims[].evidence_grade` — one of: `meta_analysis` | `cochrane` | `rct` | `cohort` |
  `mechanistic` | `regulator` | `consumer_summary`. The adapter assigns this; the daily
  review uses it to weight the claim against existing tier calls.
- `cited_studies[].funder_type` — same enum as in `docs/citation-schema.md`. Adapters that
  can determine this (PubMed, Cochrane) populate it; adapters that can't leave it null
  and the citation backfill (Phase 3) will fill it later.

## Cache

`sources/cache/sources_cache.json` — keyed by `${source_key}/${supplement}`, written by
`fetch_all.py`. The daily review pipeline reads from this cache rather than hitting the
internet on every run.

The cache is regenerated weekly (or on demand) by running:

```
python3 sources/fetch_all.py
python3 sources/fetch_all.py --source ods --supplement "Vitamin D3"   # spot-check
python3 sources/fetch_all.py --source openfda --since 2026-04-01      # adverse events
```

The cache file is deliberately not committed to git (it's large and changes often) but
the registry, adapters, and a tiny sample of cache output are.

## Adapter contract

Each adapter in `sources/adapters/<key>.py` exposes:

```python
def fetch(supplement_name: str, *, since: str | None = None) -> list[dict]:
    """Return one or more records in the normalized schema.
    Empty list if the source has nothing on this supplement.
    Raises RuntimeError on transient failures (orchestrator catches and skips)."""

SUPPORTED_QUERY = "search" | "lookup" | "global"
# search = adapter searches the source for supplement_name
# lookup = adapter requires the supplement to map to a known dossier id (Health Canada NHP, WHO monograph)
# global = adapter pulls a global feed and matches against the data.js name list (openFDA FAERS)
```

## Implementation status

| Source              | Adapter               | Status |
|---------------------|-----------------------|--------|
| NIH ODS             | `adapters/ods.py`         | live |
| openFDA FAERS       | `adapters/openfda.py`     | live |
| Cochrane CRSO       | `adapters/cochrane.py`    | live |
| EFSA                | `adapters/efsa.py`        | stub |
| EMA                 | `adapters/ema.py`         | stub |
| Health Canada NNHPD | `adapters/health_canada.py` | stub |
| WHO                 | `adapters/who.py`         | stub |
| MedlinePlus / NCCIH | `adapters/medlineplus.py` | stub |

Stubs document the URL pattern, the query form, and what's needed to make them live.

## SKILL.md update needed

After this lands, the daily review prompt should:

1. Run `python3 sources/fetch_all.py --recent` at start of run to refresh the cache.
2. For each supplement under review, read the cache for `ods`, `efsa`, `ema`, `cochrane`,
   `openfda` records first, **then** fall through to PubMed for primary studies.
3. Write the chosen `source_url` values into the article's Sources `<ol>` with the
   matching `data-source-key` attribute (so the source-logo rendering in `app.js`
   surfaces the right logo — see `IMPLEMENTATION_ROADMAP.md` Phase 1 / Item #1).
4. The funder/COI fields on `cited_studies[]` should populate the `data-funder` /
   `data-funder-type` / `data-coi` attributes per `docs/citation-schema.md`.
