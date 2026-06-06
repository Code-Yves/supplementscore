#!/usr/bin/env node
/**
 * check_recommendations.mjs — validate the homepage personalization maps.
 *
 * The Goal (GOALS) and Age&Sex (POPULATIONS) dropdowns recommend supplements by
 * exact NAME. Each name must match a real data.js supplement `n`, or the
 * recommendation silently renders nothing (the filter does `wanted.has(s.n)` /
 * keyword set membership). Four GOALS names had drifted (e.g. 'Saw palmetto' vs
 * 'Saw palmetto (Serenoa repens)'), so Hair/Libido/Hormonal quietly dropped
 * supplements — found 2026-06-06.
 *
 * This loads data.js (the 780 names) and the GOALS + POPULATIONS objects out of
 * app.js, and asserts every recommended name resolves. Exit 1 on any mismatch.
 *
 * (The Symptom filter is keyword-driven over tag/desc, not a name list, so it
 * has no exact-name dependency and isn't checked here.)
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// --- load data.js names ---
const dataSrc = fs.readFileSync(path.join(REPO, 'data.js'), 'utf8');
const ctx = { window: {}, document: { addEventListener(){}, getElementById(){return null}, querySelector(){return null}, querySelectorAll(){return []} } };
vm.createContext(ctx);
vm.runInContext(dataSrc.replace(/^\s*const\s+/gm, 'var ') + '\n;globalThis.__S = (typeof S!=="undefined")?S:[];', ctx);
const names = new Set((ctx.__S || []).map(s => s.n));

// --- pull GOALS + POPULATIONS objects out of app.js ---
const app = fs.readFileSync(path.join(REPO, 'app.js'), 'utf8');
function grab(name) {
  const i = app.indexOf('const ' + name + '={');
  if (i < 0) throw new Error('could not find ' + name + ' in app.js');
  const j = app.indexOf('\n};', i);
  return app.slice(i, j + 3);
}
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(grab('GOALS').replace('const GOALS=', 'globalThis.GOALS=') , sandbox);
vm.runInContext(grab('POPULATIONS').replace('const POPULATIONS=', 'globalThis.POPULATIONS='), sandbox);

const bad = [];
function check(obj, kind) {
  for (const [k, v] of Object.entries(obj)) {
    (v.supps || []).forEach(n => { if (!names.has(n)) bad.push(`${kind} "${k}" -> "${n}"`); });
  }
}
check(sandbox.GOALS, 'GOAL');
check(sandbox.POPULATIONS, 'AGE&SEX');

console.log('== recommendation name check ==');
console.log(`data.js supplements: ${names.size}; GOALS: ${Object.keys(sandbox.GOALS).length}; POPULATIONS: ${Object.keys(sandbox.POPULATIONS).length}`);
if (bad.length) {
  console.log(`BROKEN recommendation names: ${bad.length}`);
  bad.forEach(b => console.log('  ' + b));
  console.log('Fix the name to match a data.js supplement exactly, or the recommendation shows nothing.');
  process.exit(1);
}
console.log('PASS — every Goal + Age&Sex recommended supplement resolves to a real data.js entry.');
