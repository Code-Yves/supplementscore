#!/usr/bin/env bash
# SupplementScore commit gate — run before every commit/push, and after any
# generator or content task. Fail-closed: exits non-zero if any HARD check fails.
#
#   bash scripts/validate_build.sh
#
# Bundles the checks that used to be run by the (now wound-down) scheduled
# validators, plus the article-formatting guardrail. Run from the repo root.
set -uo pipefail
cd "$(dirname "$0")/.."

fail=0
hr() { printf '\n\033[1m== %s ==\033[0m\n' "$1"; }

# 0. Footer canonicalization (fixer — keeps the 1 partial in sync; not a gate).
hr "sync footers (fixer)"
python3 scripts/sync_footers.py || true

# 1. Article formatting guardrail — double-numbered lists, and Bottom Lines that
#    duplicate paragraph 1 / run under 3 sentences / end truncated. HARD GATE.
hr "article formatting guardrail"
if ! python3 scripts/check_article_formatting.py; then
  echo ">> FAIL: article formatting guardrail"; fail=1
fi

# 2. Internal links — every ?slug= and ../s/ link resolves via the runtime resolver.
#    Gate on the checker's own exit code AND on the reported count (belt-and-suspenders:
#    catches both a non-zero exit and any future output reword).
hr "internal links"
links_out="$(node scripts/check_internal_links.mjs 2>&1)"; links_rc=$?; echo "$links_out"
if [ "$links_rc" -ne 0 ] \
   || ! echo "$links_out" | grep -q "GENUINE BREAKS: 0" \
   || echo "$links_out" | grep -qE "GENUINE BREAKS: [1-9]"; then
  echo ">> FAIL: internal links"; fail=1
fi

# 3. Article smoke test — chrome present, no truncation/structural breakage.
hr "article smoke test"
smoke_out="$(python3 scripts/smoke_test_articles.py 2>&1)"; smoke_rc=$?; echo "$smoke_out"
if [ "$smoke_rc" -ne 0 ] \
   || ! echo "$smoke_out" | grep -qE "Failures: 0" \
   || echo "$smoke_out" | grep -qE "Failures: [1-9]"; then
  echo ">> FAIL: smoke test"; fail=1
fi

# 4. Sitemap integrity — no dead/blocked/noindex URLs in the sitemaps.
hr "sitemap integrity"
if ! python3 scripts/check_sitemap_integrity.py; then
  echo ">> FAIL: sitemap integrity"; fail=1
fi

hr "result"
if [ "$fail" -ne 0 ]; then
  echo -e "\033[31mBUILD VALIDATION FAILED — fix the items above before committing.\033[0m"
  exit 1
fi
echo -e "\033[32mAll checks passed.\033[0m"
