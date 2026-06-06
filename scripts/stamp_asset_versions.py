#!/usr/bin/env python3
"""
Stamp content-hash cache-buster versions onto local CSS/JS assets across all HTML.

WHY THIS EXISTS
---------------
Local assets are referenced as `<asset>?v=<version>` (e.g. styles.css?v=...). The
version was hard-coded per page and had drifted to several different strings, so
some pages served STALE css/js. Consequence: an edit to styles.css (or any js) is
INVISIBLE on the live site until its `?v=` changes AND the page is redeployed,
because browsers + the CDN cache by the full URL. This script makes that automatic.

WHAT IT DOES
------------
For every local `.css`/`.js` asset referenced with `?v=` anywhere in the HTML, it
computes a short hash of the asset's CURRENT bytes and rewrites every reference to
`?v=<hash>`. Result:
  * an asset's version changes IFF its content changes (correct cache-busting), and
  * every page uses the SAME version for a given asset (no more drift), and
  * unchanged assets keep their hash, so returning users aren't forced to re-download.

USAGE
-----
Run as the LAST build step before deploy:
    python3 scripts/stamp_asset_versions.py
Idempotent — re-running with unchanged assets rewrites nothing.
External assets (CDN urls) and non-versioned files are ignored automatically.
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
# capture a local-looking asset path ending in .css/.js immediately followed by ?v=<ver>
ASSET_RE = re.compile(r'([\w./\-]+?\.(?:css|js))\?v=[\w.\-]+')


def repo_file_for(ref_path: str):
    """Resolve a referenced path (/styles.css, ../app.js, a/manifest.js) to a repo file.

    Tries the path as-given (relative to repo root, with any leading / or ../
    stripped) FIRST, so subdirectory assets like a/manifest.js and
    data/comparisons.js are versioned too (they were silently skipped before
    2026-06-06, which let a stale manifest.js?v= ride the CDN cache).
    Falls back to basename-at-root for ../-prefixed root assets.
    """
    rel = str(pathlib.PurePosixPath(ref_path)).lstrip('/')
    while rel.startswith('../'):
        rel = rel[3:]
    cand = ROOT / rel
    if cand.is_file():
        return cand
    name = pathlib.PurePosixPath(ref_path).name
    cand = ROOT / name
    return cand if cand.is_file() else None


def short_hash(path: pathlib.Path) -> str:
    return hashlib.md5(path.read_bytes()).hexdigest()[:8]


def main() -> None:
    html_files = list(ROOT.rglob('*.html'))

    # 1) discover tracked assets (basename -> content hash) from current references
    hashes: dict[str, str] = {}
    for f in html_files:
        text = f.read_text(encoding='utf-8', errors='ignore')
        for ref in ASSET_RE.findall(text):
            name = pathlib.PurePosixPath(ref).name
            if name in hashes:
                continue
            asset = repo_file_for(ref)
            if asset is not None:           # only version assets that exist locally
                hashes[name] = short_hash(asset)

    if not hashes:
        print('No versioned local assets found.')
        return

    # 2) rewrite every reference to a tracked asset -> its content hash (keep the path prefix)
    counts = {n: 0 for n in hashes}
    files_changed = 0
    for f in html_files:
        text = f.read_text(encoding='utf-8', errors='ignore')

        def repl(m: re.Match) -> str:
            ref = m.group(1)
            name = pathlib.PurePosixPath(ref).name
            if name in hashes:
                counts[name] += 1
                return f'{ref}?v={hashes[name]}'
            return m.group(0)

        new = ASSET_RE.sub(repl, text)
        if new != text:
            f.write_text(new, encoding='utf-8')
            files_changed += 1

    print(f'Stamped {len(hashes)} assets across {files_changed} files:')
    for name in sorted(hashes):
        print(f'  {name:30} v={hashes[name]}  ({counts[name]} refs)')


if __name__ == '__main__':
    main()
