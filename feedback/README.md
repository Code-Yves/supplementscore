# Feedback Triage Queue

**Phase:** 0 / Item #10 of `IMPLEMENTATION_ROADMAP.md`
**Status:** Live since 2026-04-28.

---

## How submissions arrive

Reader-flagged inaccuracies come in via the in-app "Flag inaccuracy" button on:

- Each article modal (next to the "Last reviewed" badge)
- Each supplement modal (footer row)

The form requires three fields:

1. **Claim** — what the reader thinks is wrong
2. **Correction** — what they think it should say
3. **Citation URL** — required, must start with `http://` or `https://`. PubMed,
   DOI, regulator dossier, or peer-reviewed paper.

Optional fourth field: email (only if they want a reply).

Submissions POST to `https://formspree.io/f/mnjoylkz` with `source: 'feedback-inaccuracy'`,
which routes to **yves@blueprintbuilds.com** (same endpoint used for contributor
and early-access signups).

The Formspree free tier allows 50 submissions/month. If we hit that, upgrade or
swap to a self-hosted Netlify Forms / FormSubmit endpoint.

---

## Triage workflow

For each inbound feedback email:

1. **Drop it as a file** in this directory using the naming convention
   `feedback/YYYY-MM-DD-<context-kind>-<short-slug>.md`. Examples:
   - `feedback/2026-05-02-article-creatine-dose.md`
   - `feedback/2026-05-04-supplement-magnesium-glycinate-bioavailability.md`

2. **Use the template** below for the file content.

3. **Verify the citation**. Click through to the PubMed / DOI / regulator URL.
   If the citation does not exist or does not support the claim, mark
   `verdict: invalid` and close.

4. **Compare to the current site content**. If the reader is right, the citation
   needs to update an existing claim or add a new one.

5. **Cross-check against the most recent review doc** for the affected supplement
   or article (`reviews/*.md`). If the issue was already addressed in a recent
   review, mark `verdict: stale` (the user saw outdated content; the next deploy
   will fix it).

6. **For valid corrections**: queue an out-of-cycle review for the affected
   article or supplement. Override the normal cadence in SKILL.md by adding the
   ID to the priority list.

7. **Reply** to the reader's email if provided. Even if invalid — explain why.

---

## Submission template

```markdown
# Feedback — {{date}} — {{short slug}}

**Source:** Formspree feedback-inaccuracy submission
**Context:** {{article #N | supplement <name>}}
**Page URL:** {{page_url from payload}}
**Submitted at:** {{ISO timestamp}}
**Reader email:** {{email or "(not provided)"}}

## Claim
{{verbatim from form}}

## Suggested correction
{{verbatim from form}}

## Citation
{{citation_url}}

---

## Triage

- **Verdict:** ☐ valid · ☐ stale · ☐ invalid · ☐ partial
- **Citation verified:** ☐ yes · ☐ no — {{reason}}
- **Affects:** {{file path / supplement name / article ID}}
- **Action:** ☐ schedule out-of-cycle review · ☐ direct edit · ☐ no action
- **Reply sent:** ☐ {{date}}

### Notes
{{any reasoning, references checked, open questions}}
```

---

## Metrics to track (monthly)

- **Submissions received** — count
- **Valid corrections found** — count + rate (valid / total)
- **Time-to-triage** — submission timestamp → first triage entry timestamp,
  median in hours
- **Time-to-fix** — for `valid` verdicts, days from triage to deployed fix

A *rising* count of valid corrections found by readers is a bad signal — it
means the source diversification work in Phase 1 isn't catching errors before
they reach users. A flat or falling rate is a good signal.

---

## When to escalate

If a submission flags a **safety claim on a Tier 4 supplement** (Risky/Avoid
category), treat it as priority within 24 hours. Wrong safety information is
the highest-liability content on the site.

If a submission flags a **drug-interaction claim**, also priority. These get
acted on as soon as Phase 2's drug-interaction system is in place; until then,
escalate to a manual same-day review.
