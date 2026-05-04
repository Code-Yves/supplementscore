---
name: push-live
description: How to deploy supplementscore.org changes to production. Use this skill any time the user says "push live", "ship it", "deploy", "make it live", or asks why a change isn't showing up on supplementscore.org. Covers the GitHub Desktop credential constraint, service-worker cache bump, CSS/JS cache busters, and verification.
---

# Push live — supplementscore.org deploy procedure

This repo deploys to **supplementscore.org via GitHub Pages** on every push to `origin/main`. Reads typically appear within ~60 seconds of a successful push.

## Critical constraint: git CLI cannot push

The bash sandbox has **no GitHub credentials**. `git push` from the CLI will fail or hang. **Push only happens via the GitHub Desktop app**, which has cached credentials for the user.

Pattern:
1. Stage and commit via git CLI (this works fine — local-only operations).
2. Bring **GitHub Desktop** to the foreground via `mcp__computer-use__open_application` with `app: "GitHub Desktop"`.
3. Press `cmd+P` via `mcp__computer-use__key`.
4. Wait ~5 seconds.
5. Verify with `git log origin/main --oneline -1`.

`cmd+P` is the keyboard shortcut for "Push origin" in GitHub Desktop. It works whether or not the toolbar shows a pending push, and it works even if the GitHub Desktop UI thinks there are uncommitted changes (it sometimes shows stale state because it didn't notice the CLI commit). The push goes through regardless.

## Standard push flow

```bash
# From the bash sandbox
cd "/sessions/keen-nice-bell/mnt/Supplement Score/supplementscore-repo"

# Optional sanity checks before committing
node -c app.js              # if you touched app.js
node -c index.js            # if you touched index.js
node -c supplement-modal.js # etc.
node -c sw.js

# Commit (no hooks; --no-verify isn't needed)
git add -A
git -c user.email='Yves@blueprintbuilds.com' -c user.name='Yves' commit -m "<short title>

<body — explain why, not what.>"
```

Then push via GitHub Desktop:

```
mcp__computer-use__open_application  app="GitHub Desktop"
mcp__computer-use__key               text="cmd+p"
mcp__computer-use__wait              duration=5
```

Verify:

```bash
cd "/sessions/keen-nice-bell/mnt/Supplement Score/supplementscore-repo"
git log origin/main --oneline -1     # should show your commit hash
git log --oneline origin/main..HEAD  # should be empty (nothing local-ahead)
```

## Cache-bumping rules

The site has **two layers of cache** that will hide your changes from real users:

### 1. Service-worker cache (`sw.js`)

`sw.js` runs a stale-while-revalidate cache. Every visitor gets one stale page load before the SW fetches and caches the new version.

**When to bump:** any change to `app.js`, `index.js`, `data.js`, `styles.css`, `index.css`, `supplement-modal.js`, or any HTML page.

**How:** edit the constant near the top of `sw.js`:

```js
const CACHE_VERSION = 'v2026-05-04-<short-suffix>';
```

Use the date + a short suffix that hints at the change (e.g. `v2026-05-04-footerAlign`, `v2026-05-04-discoverHero`). The exact value doesn't matter — only that it's *different* from the previous one. Bumping it triggers `caches.delete(...)` in the SW's `activate` handler, which flushes the old runtime cache.

### 2. CSS/JS query-string cache busters

Every HTML page references `styles.css?v=YYYYMMDDx` and `index.css?v=YYYYMMDDx`. Browsers cache by full URL (including query string), so changing the suffix forces a re-fetch.

**Auto-bumper:** a scheduled task usually bumps these when `styles.css` mtime changes. If you committed `styles.css` and the auto-bumper hasn't run yet, you'll see hundreds of pages still pointing at the old version. Bump them manually:

```bash
cd "/sessions/keen-nice-bell/mnt/Supplement Score/supplementscore-repo"

# Find the current version
grep -h 'styles.css?v=' index.html | head -1

# Bump it across every HTML page
find . -name '*.html' -not -path './_mockups/*' -exec \
  sed -i.bak 's|styles\.css?v=20260503a|styles.css?v=20260504a|g' {} \;
find . -name '*.html.bak' -delete
```

Same pattern for `index.css?v=...` and `index.js?v=...`. Keep all three in lockstep on the same date stamp.

### After push, instruct the user

Tell them: *"Hard reload (Cmd+Shift+R) to flush the service worker on next visit."* The first reload re-registers the new SW; subsequent reloads serve fresh assets.

## Common failure modes

### "fatal: Unable to create '.git/index.lock': File exists"

Another git process crashed and left a lock file. Safe to remove:

```bash
rm -f "/sessions/keen-nice-bell/mnt/Supplement Score/supplementscore-repo/.git/index.lock"
```

Then retry the commit.

### GitHub Desktop shows "1 changed file" after CLI commit

The UI didn't notice your CLI commit yet. **Press `cmd+P` anyway** — it pushes the actual repo state, not the stale UI state. After ~5 seconds the toolbar will refresh to "Fetch origin · Last fetched just now" and "0 changed files".

### `cmd+P` did nothing

Possibilities:
- GitHub Desktop wasn't the frontmost app. Re-call `open_application` first.
- Mac is locked (loginwindow). Take a screenshot to confirm — if you see the lock screen, ask the user to unlock.
- A modal dialog is intercepting the shortcut (e.g. "Resolve conflicts"). Take a screenshot.

### Push succeeded but the user still sees the old page

99% of the time this is the service worker. Verify:

```bash
# 1. Confirm the file on the server has your change
curl -s "https://supplementscore.org/styles.css?bust=$(date +%s)" | grep -o 'YOUR_NEW_RULE'

# 2. If the server has it but the browser doesn't, the SW is serving stale.
# Tell the user to hard-reload (Cmd+Shift+R).
```

If the SW issue persists across reloads, you forgot to bump `CACHE_VERSION` in `sw.js`. Bump it, commit, push.

If you want to verify in your own browser via the Claude-in-Chrome MCP:

```js
// Drop the SW + caches, then reload fresh
navigator.serviceWorker.getRegistrations()
  .then(rs => Promise.all(rs.map(r => r.unregister())))
  .then(() => caches.keys())
  .then(keys => Promise.all(keys.map(k => caches.delete(k))));
```

### Auto-formatter touched 200+ files unexpectedly

A scheduled task regularly rewrites the cache-buster query strings across every HTML page. When you `git status` you may see hundreds of files modified. **Read a sample diff** to confirm it's only `?v=YYYYMMDDa` bumps — if so, include them in your commit. If the diff shows substantive changes, investigate before committing (could be a regression).

```bash
git status --short | head -10
git diff <one-of-the-modified-files> | head -20   # confirm it's only cache-buster bumps
```

## Repo paths cheat sheet

| Tool                       | Path                                                                                |
|----------------------------|-------------------------------------------------------------------------------------|
| `Read` / `Edit` / `Write`  | `/Users/yves/Desktop/AI/Supplement Score/supplementscore-repo/...`                  |
| `mcp__workspace__bash`     | `/sessions/<session-id>/mnt/Supplement Score/supplementscore-repo/...`              |

Same files; different mounts. The bash sandbox cannot use the Read/Edit/Write paths and vice versa.

The current session's bash mount is shown in the system prompt (`Working directory: /sessions/<session-id>/mnt/outputs`). Replace `<session-id>` accordingly.

## What's on the live site

- Production URL: **https://supplementscore.org**
- Pages auto-deploy from `origin/main` via GitHub Pages
- A custom `CNAME` file at the repo root keeps the apex domain bound to GH Pages
- Plausible analytics is wired in; no impact on push flow

## TL;DR — minimal push

```bash
cd "/sessions/<session-id>/mnt/Supplement Score/supplementscore-repo"
git add -A
git -c user.email='Yves@blueprintbuilds.com' -c user.name='Yves' commit -m "<title>

<body>"
# (then via MCP — not bash)
mcp__computer-use__open_application  app="GitHub Desktop"
mcp__computer-use__key               text="cmd+p"
mcp__computer-use__wait              duration=5
git log origin/main --oneline -1     # verify
```

Bump `sw.js` `CACHE_VERSION` and the `?v=...` busters if you touched any CSS or JS.
