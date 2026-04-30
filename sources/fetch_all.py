#!/usr/bin/env python3
"""
Orchestrator that runs every adapter in sources/adapters/ across the supplement list
and writes the result cache to sources/cache/sources_cache.json.

Phase 1 / Item #1 of IMPLEMENTATION_ROADMAP.md.

Usage:
    # Refresh all sources for all supplements (slow — full run)
    python3 sources/fetch_all.py

    # Refresh just one source for one supplement (spot check)
    python3 sources/fetch_all.py --source ods --supplement "Vitamin D3"

    # Refresh just one source for everything
    python3 sources/fetch_all.py --source ods

    # Limit to N supplements (for testing)
    python3 sources/fetch_all.py --limit 5

    # Dry-run (don't write the cache)
    python3 sources/fetch_all.py --dry-run

The cache file is keyed by `${source_key}/${supplement}`. Empty results are kept so the
daily review can distinguish "we tried and the source has nothing" from "we never tried".

Live adapters: ods, openfda, cochrane.
Stub adapters: efsa, ema, health_canada, who, medlineplus — return placeholder records
that point to the source URL for manual lookup.
"""
from __future__ import annotations

import argparse
import importlib
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES_DIR = Path(__file__).resolve().parent
CACHE_DIR = SOURCES_DIR / "cache"
CACHE_FILE = CACHE_DIR / "sources_cache.json"
REGISTRY_FILE = SOURCES_DIR / "registry.json"
DATA_JS = ROOT / "data.js"


def extract_supplement_names(data_js_path: Path) -> list[str]:
    src = data_js_path.read_text(encoding="utf-8")
    pat = re.compile(r"\bn:\s*(?:'([^'\\]*(?:\\.[^'\\]*)*)'|\"([^\"\\]*(?:\\.[^\"\\]*)*)\")")
    names = set()
    for m in pat.finditer(src):
        n = m.group(1) or m.group(2)
        if n:
            names.add(n.replace("\\'", "'").replace('\\"', '"'))
    return sorted(names)


def load_registry() -> list[dict]:
    return json.loads(REGISTRY_FILE.read_text(encoding="utf-8"))["sources"]


def load_cache() -> dict:
    if CACHE_FILE.exists():
        try:
            return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}
    return {}


def save_cache(cache: dict, dry_run: bool) -> None:
    if dry_run:
        print(f"  [dry-run] would write {len(cache)} entries to {CACHE_FILE}")
        return
    CACHE_DIR.mkdir(exist_ok=True)
    CACHE_FILE.write_text(json.dumps(cache, indent=2), encoding="utf-8")


def import_adapter(adapter_path: str):
    # adapter_path like "adapters/ods.py" -> module "sources.adapters.ods"
    module_name = adapter_path.replace("/", ".").removesuffix(".py")
    return importlib.import_module(f"sources.{module_name}")


def main() -> int:
    p = argparse.ArgumentParser(description="Fetch from all source adapters into the cache.")
    p.add_argument("--source", help="Run only this source key (e.g. ods, openfda).")
    p.add_argument("--supplement", help="Run only for this supplement name.")
    p.add_argument("--limit", type=int, help="Limit to N supplements (for testing).")
    p.add_argument("--since", help="Pass through to adapters that support filtering by date.")
    p.add_argument("--include-stubs", action="store_true",
                   help="Include stub adapters (default: skip them — they return placeholders).")
    p.add_argument("--dry-run", action="store_true", help="Don't write the cache file.")
    p.add_argument("--quiet", action="store_true", help="Suppress per-supplement progress.")
    args = p.parse_args()

    sys.path.insert(0, str(ROOT))  # so "sources.adapters.foo" resolves

    registry = load_registry()
    if args.source:
        registry = [s for s in registry if s["key"] == args.source]
        if not registry:
            print(f"ERROR: no source with key '{args.source}'", file=sys.stderr)
            return 2
    if not args.include_stubs:
        live_only = [s for s in registry if s.get("status") == "live"]
        skipped = [s["key"] for s in registry if s.get("status") != "live"]
        registry = live_only
        if skipped:
            print(f"Skipping stub sources: {', '.join(skipped)} (use --include-stubs to include)", file=sys.stderr)

    if args.supplement:
        names = [args.supplement]
    else:
        names = extract_supplement_names(DATA_JS)
        if args.limit:
            names = names[:args.limit]
    print(f"Fetching {len(registry)} sources × {len(names)} supplements = {len(registry)*len(names)} cells", file=sys.stderr)

    cache = load_cache()
    total_records = 0
    for s in registry:
        try:
            mod = import_adapter(s["adapter"])
        except Exception as e:
            print(f"  [error] could not import {s['adapter']}: {e}", file=sys.stderr)
            continue
        for i, name in enumerate(names, 1):
            key = f"{s['key']}/{name}"
            try:
                records = mod.fetch(name, since=args.since)
            except Exception as e:
                print(f"  [error] {s['key']} fetch({name!r}): {e}", file=sys.stderr)
                records = []
            cache[key] = {
                "source_key": s["key"],
                "supplement": name,
                "records": records,
            }
            total_records += len(records)
            if not args.quiet:
                print(f"  [{s['key']:14s}] {i:4d}/{len(names)}  {name[:60]:60s}  -> {len(records)} record(s)", file=sys.stderr)
            time.sleep(0.2)  # be polite to the source servers

    save_cache(cache, args.dry_run)
    print(f"\nDone. {total_records} total records across {len(cache)} cells.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
