"""Shared utilities for source adapters.
Every adapter imports from here for HTTP, normalization, and error handling.
"""
from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any

USER_AGENT = "supplement-score-source-fetcher/1.0 (https://supplementscore.example)"
REQUEST_TIMEOUT = 20

_HTML_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def http_get(url: str, *, accept: str = "*/*", retries: int = 2) -> bytes:
    """GET a URL with a sensible User-Agent. Raises RuntimeError after exhausted retries."""
    last_err = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": USER_AGENT,
                "Accept": accept,
            })
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
                return resp.read()
        except (urllib.error.URLError, TimeoutError) as e:
            last_err = e
            if attempt < retries:
                time.sleep(1 + attempt)
    raise RuntimeError(f"failed to fetch {url}: {last_err}")


def http_get_json(url: str, *, retries: int = 2) -> Any:
    body = http_get(url, accept="application/json", retries=retries)
    return json.loads(body.decode("utf-8"))


def strip_html(s: str) -> str:
    """Remove HTML tags, collapse whitespace, decode common entities."""
    if not s:
        return ""
    s = _HTML_TAG_RE.sub(" ", s)
    s = (s.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
            .replace("&quot;", '"').replace("&#39;", "'").replace("&nbsp;", " "))
    return _WS_RE.sub(" ", s).strip()


def base_record(*, supplement: str, source_key: str, source_label: str, source_url: str,
                last_updated: str | None = None, evidence_summary: str = "",
                key_claims: list[dict] | None = None, cited_studies: list[dict] | None = None) -> dict:
    """Build a record matching the normalized schema. All fields enforced here."""
    return {
        "supplement": supplement,
        "source_key": source_key,
        "source_label": source_label,
        "source_url": source_url,
        "fetched_at": now_iso(),
        "last_updated": last_updated,
        "evidence_summary": evidence_summary,
        "key_claims": list(key_claims or []),
        "cited_studies": list(cited_studies or []),
    }


def claim(text: str, *, evidence_grade: str, context: str = "") -> dict:
    """Build a key_claim record."""
    return {"claim": text, "evidence_grade": evidence_grade, "context": context}


def study(*, title: str, doi: str = "", pmid: str = "", year: int | None = None,
          funder: str = "", funder_type: str | None = None, coi: bool | None = None) -> dict:
    """Build a cited_study record."""
    return {
        "title": title, "doi": doi, "pmid": pmid, "year": year,
        "funder": funder, "funder_type": funder_type, "coi": coi,
    }


def slugify_for_url(s: str) -> str:
    """For the sources that use URL-style slugs (NIH ODS uses CamelCase / no spaces)."""
    s = re.sub(r"\([^)]*\)", "", s)
    s = re.sub(r"[^A-Za-z0-9 ]", "", s)
    parts = s.strip().split()
    return "".join(p.capitalize() for p in parts)


def warn(msg: str) -> None:
    print(f"  [warn] {msg}", file=sys.stderr)
