/* Drop alias catalog rows that resolve to another supplement, and keep
   browse / hub / symptom lists from showing the same page twice.
   node scripts/alias_catalog.mjs --write
   node scripts/alias_catalog.mjs --check
*/
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadRuntime() {
  const sandbox = { console };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.document = {
    documentElement: { setAttribute() {}, classList: { add() {} } },
    addEventListener() {},
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
  sandbox.location = { search: '', href: '', origin: '', replace() {}, assign() {} };
  vm.createContext(sandbox);
  const dataSrc = fs.readFileSync(path.join(REPO, 'data.js'), 'utf8').replace(/^\s*const\s+/gm, 'var ');
  vm.runInContext(dataSrc, sandbox, { filename: 'data.js' });
  vm.runInContext(fs.readFileSync(path.join(REPO, 'search-index.js'), 'utf8'), sandbox, { filename: 'search-index.js' });
  return { S: sandbox.S, SS: sandbox.SS };
}

function calcScore(s) {
  const rd = s.r || 1, so = s.o || 1, sco = s.c || 1, sd = s.d || 1;
  return Math.round(s.e * 7 + s.s * 4 + rd * 3 + so * 2 + sco * 2 + sd * 2);
}

function band(sc) {
  if (sc >= 72) return 'hi';
  if (sc >= 60) return 'mid';
  if (sc >= 40) return 'low';
  return 'bad';
}

function decodeName(raw) {
  return raw
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function escText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const { S, SS } = loadRuntime();
const byName = new Map(S.map((s) => [s.n, s]));

function canonicalOf(name) {
  const rec = SS.getSupplement(SS.slugify(name));
  return rec ? rec.n : null;
}

function isAliasName(name) {
  const canon = canonicalOf(name);
  return !!canon && canon !== name && !byName.has(name);
}

function pageFor(name) {
  const rec = byName.get(name) || SS.getSupplement(SS.slugify(name));
  if (!rec) return '';
  return SS.supplementPath(SS.slugify(rec.n));
}

function aliasNamesInCatalog() {
  const json = JSON.parse(fs.readFileSync(path.join(REPO, 'data/supplements.json'), 'utf8'));
  const aliases = [];
  const unknown = [];
  for (const row of json) {
    if (byName.has(row.name)) continue;
    const canon = canonicalOf(row.name);
    if (canon && canon !== row.name) aliases.push({ name: row.name, canon });
    else unknown.push(row.name);
  }
  return { json, aliases, unknown };
}

function topBrowse(limit = 200) {
  return S
    .map((s) => ({ name: s.n, score: calcScore(s), href: pageFor(s.n) }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function writeBrowse(items) {
  const file = path.join(REPO, 'browse.html');
  let html = fs.readFileSync(file, 'utf8');
  const list = items.map((item) => `    <li><a href="${item.href}">${escText(item.name)}</a></li>`).join('\n');
  if (!/<ul class="bro-list" id="bro-list">[\s\S]*?<\/ul>/.test(html)) throw new Error('browse list was not found');
  html = html.replace(/<ul class="bro-list" id="bro-list">[\s\S]*?<\/ul>/, `<ul class="bro-list" id="bro-list">\n${list}\n  </ul>`);
  const elements = items.map((item, i) => `    {
      "@type": "ListItem",
      "position": ${i + 1},
      "name": ${JSON.stringify(item.name)},
      "url": ${JSON.stringify('https://supplementscore.org' + item.href)}
    }`).join(',\n');
  const itemListRe = /<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema.org",\s*"@type": "ItemList",[\s\S]*?<\/script>/;
  if (!itemListRe.test(html)) throw new Error('browse ItemList was not found');
  const itemList = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Browse all supplements",
  "numberOfItems": ${items.length},
  "itemListElement": [
${elements}
  ]
}
</script>`;
  html = html.replace(itemListRe, itemList);
  fs.writeFileSync(file, html);
}

function rewriteCards(html) {
  const patterns = [
    /<a class="hub-sup-card" href="[^"]+">[\s\S]*?<\/a>/g,
    /<a href="[^"]+" class="sx-row">[\s\S]*?<\/a>/g,
  ];
  for (const re of patterns) {
    const cards = [...html.matchAll(re)].map((m) => m[0]);
    const names = cards.map((card) => {
      const hit = card.match(/class="(?:hub-sup-name|sx-name)">([^<]+)</);
      return hit ? decodeName(hit[1]) : '';
    });
    const canonPresent = new Set(names.filter((n) => byName.has(n)));
    for (let i = 0; i < cards.length; i++) {
      const name = names[i];
      if (!isAliasName(name)) continue;
      const canon = canonicalOf(name);
      if (canonPresent.has(canon) || names.some((n, j) => j !== i && n === canon)) {
        html = html.replace(cards[i], '');
      } else {
        const rec = byName.get(canon);
        const sc = calcScore(rec);
        const href = pageFor(canon);
        let card = cards[i]
          .replace(/href="[^"]+"/, `href="${href}"`)
          .replace(/(class="(?:hub-sup-name|sx-name)">)[^<]+/, `$1${escText(canon)}`);
        card = card.replace(/(hub-sup-score-num">)\d+/, `$1${sc}`);
        card = card.replace(/(<div class="sx-score )s-[a-z]+">\d+/, `$1s-${band(sc)}">${sc}`);
        card = card.replace(/hub-sup-score s-[a-z]+/, `hub-sup-score s-${band(sc)}`);
        html = html.replace(cards[i], card);
        canonPresent.add(canon);
      }
    }
    const refreshed = [...html.matchAll(re)].map((m) => m[0]);
    for (const card of refreshed) {
      const hit = card.match(/class="(?:hub-sup-name|sx-name)">([^<]+)/);
      if (!hit) continue;
      const name = decodeName(hit[1]);
      if (!byName.has(name)) continue;
      const href = pageFor(name);
      const current = (card.match(/href="([^"]+)"/) || [])[1];
      if (current && href && current !== href) html = html.replace(card, card.replace(/href="[^"]+"/, `href="${href}"`));
    }
  }
  html = html.replace(/(Supplements in hub<\/div><div class="hub-stat-val">)\d+/, (full, prefix) => {
    const count = (html.match(/class="hub-sup-card"/g) || []).length;
    return prefix + count;
  });
  return html;
}

function scrubJsonLd(html) {
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (full, body) => {
    let data;
    try { data = JSON.parse(body); } catch { return full; }
    let changed = false;
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        for (let i = node.length - 1; i >= 0; i--) {
          const item = node[i];
          if (item && typeof item === 'object' && typeof item.name === 'string' && isAliasName(item.name)) {
            const canon = canonicalOf(item.name);
            const dup = node.some((other) => other && other.name === canon);
            if (dup) node.splice(i, 1);
            else {
              item.name = canon;
              if (typeof item.url === 'string' && item.url.includes('/supplement')) {
                item.url = 'https://supplementscore.org' + pageFor(canon);
              }
            }
            changed = true;
          } else visit(item);
        }
        return;
      }
      for (const value of Object.values(node)) visit(value);
    };
    visit(data);
    if (!changed) return full;
    return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
  });
}

function listFiles() {
  const out = [];
  for (const dir of ['hub', 'sx', 'stack']) {
    const root = path.join(REPO, dir);
    if (!fs.existsSync(root)) continue;
    for (const name of fs.readdirSync(root)) {
      if (name.endsWith('.html')) out.push(path.join(root, name));
    }
  }
  return out;
}

function writeLists() {
  for (const file of listFiles()) {
    const html = fs.readFileSync(file, 'utf8');
    const next = scrubJsonLd(rewriteCards(html));
    if (next !== html) fs.writeFileSync(file, next);
  }
}

function writeCatalog(json, aliases) {
  const drop = new Set(aliases.map((a) => a.name));
  const kept = json.filter((row) => !drop.has(row.name));
  fs.writeFileSync(path.join(REPO, 'data/supplements.json'), JSON.stringify(kept, null, 2) + '\n');
  const py = `
import csv, io, json, pathlib
kept = {row['name'] for row in json.loads(pathlib.Path(${JSON.stringify(path.join(REPO, 'data/supplements.json'))}).read_text())}
src = pathlib.Path(${JSON.stringify(path.join(REPO, 'data/supplements.csv'))})
rows = list(csv.DictReader(src.open(newline='')))
buf = io.StringIO(newline='')
writer = csv.DictWriter(buf, fieldnames=list(rows[0].keys()), lineterminator='\\r\\n', quoting=csv.QUOTE_MINIMAL)
writer.writeheader()
writer.writerows([row for row in rows if row['name'] in kept])
src.write_text(buf.getvalue())
print(len(kept))
`;
  const run = spawnSync('python3', ['-c', py], { encoding: 'utf8' });
  if (run.status !== 0) throw new Error(run.stderr || 'csv rewrite failed');
}

function cardProblems(html, rel) {
  const problems = [];
  const cards = [
    ...html.matchAll(/<a class="hub-sup-card" href="([^"]+)"[\s\S]*?class="hub-sup-name">([^<]+)/g),
    ...html.matchAll(/<a href="([^"]+)" class="sx-row"[\s\S]*?class="sx-name">([^<]+)/g),
  ];
  const seen = new Map();
  for (const m of cards) {
    const name = decodeName(m[2]);
    const canon = canonicalOf(name);
    if (!canon) {
      problems.push(`${rel} lists an unknown supplement: ${name}`);
      continue;
    }
    if (canon !== name) problems.push(`${rel} lists alias "${name}" instead of "${canon}"`);
    const href = m[1];
    const expect = pageFor(canon);
    if (href !== expect) problems.push(`${rel} ${name} points at ${href}, page is ${expect}`);
    if (seen.has(canon)) problems.push(`${rel} lists ${canon} twice`);
    seen.set(canon, href);
  }
  return problems;
}

function check() {
  const { json, aliases, unknown } = aliasNamesInCatalog();
  const errors = [];
  if (unknown.length) errors.push(`supplements.json has ${unknown.length} names that are not supplements: ${unknown.slice(0, 8).join('; ')}`);
  if (aliases.length) errors.push(`supplements.json still has ${aliases.length} alias rows, starting with ${aliases[0].name}`);
  if (json.length !== S.length) errors.push(`supplements.json has ${json.length} rows; data.js has ${S.length}`);
  const csv = fs.readFileSync(path.join(REPO, 'data/supplements.csv'), 'utf8');
  const csvNames = csv.split(/\r?\n/).slice(1).filter(Boolean).map((line) => {
    if (!line.startsWith('"')) return line.split(',')[0];
    let out = '';
    for (let i = 1; i < line.length; i++) {
      if (line[i] === '"') {
        if (line[i + 1] === '"') { out += '"'; i++; continue; }
        return out;
      }
      out += line[i];
    }
    return out;
  });
  const jsonNames = new Set(json.map((row) => row.name));
  if (csvNames.length !== json.length) errors.push(`supplements.csv has ${csvNames.length} rows; json has ${json.length}`);
  for (const name of csvNames) {
    if (!jsonNames.has(name)) errors.push(`supplements.csv name is not in json: ${name}`);
  }

  const browse = fs.readFileSync(path.join(REPO, 'browse.html'), 'utf8');
  const items = [...browse.matchAll(/<li><a href="([^"]+)">([^<]+)<\/a><\/li>/g)].map((m) => ({ href: m[1], name: decodeName(m[2]) }));
  if (items.length !== 200) errors.push(`browse lists ${items.length} supplements, expected 200`);
  const hrefs = new Set();
  const ranked = topBrowse(200);
  items.forEach((item, i) => {
    if (hrefs.has(item.href)) errors.push(`browse lists ${item.href} more than once`);
    hrefs.add(item.href);
    const canon = canonicalOf(item.name);
    if (canon !== item.name) errors.push(`browse lists alias ${item.name}`);
    if (item.href !== pageFor(item.name)) errors.push(`browse ${item.name} points at ${item.href}`);
    if (ranked[i] && (ranked[i].name !== item.name || ranked[i].href !== item.href)) {
      errors.push(`browse position ${i + 1} is ${item.name}, ranked list has ${ranked[i].name}`);
    }
  });
  const stub = [...hrefs].filter((href) => {
    const file = path.join(REPO, href);
    return fs.existsSync(file) && fs.readFileSync(file, 'utf8').slice(0, 800).includes('http-equiv="refresh"');
  });
  if (stub.length) errors.push(`browse links to redirect stubs: ${stub.join(', ')}`);

  for (const file of listFiles()) {
    const rel = path.relative(REPO, file);
    errors.push(...cardProblems(fs.readFileSync(file, 'utf8'), rel));
  }
  return errors;
}

function main() {
  const write = process.argv.includes('--write');
  if (write) {
    const { json, aliases, unknown } = aliasNamesInCatalog();
    if (unknown.length) {
      console.error(unknown.join('\n'));
      throw new Error('refusing to drop names that do not resolve to a supplement');
    }
    if (aliases.length !== 0 && aliases.length !== 46) {
      throw new Error(`expected 46 alias catalog rows, found ${aliases.length}`);
    }
    if (aliases.length) writeCatalog(json, aliases);
    writeBrowse(topBrowse(200));
    writeLists();
    console.log(`Removed ${aliases.length} alias catalog rows and rebuilt the browse list.`);
  }
  const errors = check();
  if (errors.length) {
    console.error(errors.slice(0, 40).join('\n'));
    process.exit(1);
  }
  console.log(`PASS catalog=${S.length} browse=200`);
}

main();
