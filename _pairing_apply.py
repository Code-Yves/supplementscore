#!/usr/bin/env python3
"""Apply auto-apply entries to data/pairings.json and regenerate pairings-data.js."""
import json, datetime, os, sys

TODAY = datetime.date.today().isoformat()  # 2026-05-25

with open('data/pairings.json') as f:
    pj = json.load(f)
with open('/tmp/auto_apply.json') as f:
    auto = json.load(f)
with open('/tmp/low_conf.json') as f:
    low_conf = json.load(f)
with open('/tmp/tier1_esc.json') as f:
    tier1_esc = json.load(f)

ids = [int(p['id'][1:]) for p in pj['pairings'] if p['id'].startswith('p')]
next_id = max(ids) + 1
print('Starting next_id:', next_id)

appended_ids = []
for p in auto:
    entry = {
        'id': f'p{next_id}',
        'members': [p['target'], p['partner']],
        'kind': p.get('kind') or p['direction'],
        'strength': p.get('strength', 3),
        'goal': p.get('goal') or f"{p['direction'].title()} flag",
        'rationale': p['mechanism'],
        'direction': p['direction'],
        'confidence': p['confidence'],
    }
    if p.get('pmids'):
        entry['evidence_pmids'] = p['pmids']
    if p.get('dose'):
        entry['dose'] = p['dose']
    pj['pairings'].append(entry)
    appended_ids.append(f'p{next_id}')
    next_id += 1

pj['_meta']['last_reviewed'] = (
    f"{TODAY} (weekly pairing-coverage refresh — appended {len(auto)} entries; "
    f"auto-apply mode; {len(tier1_esc)} escalations; {len(low_conf)} low-conf queued)"
)

# Write JSON
with open('data/pairings.json', 'w') as f:
    json.dump(pj, f, indent=2, ensure_ascii=False)
print(f'Appended {len(auto)} entries: {appended_ids[0]}..{appended_ids[-1]}')

# Regenerate pairings-data.js — preserve original format (single window var with the pairings array)
js_out = '/* Auto-generated from data/pairings.json. Do not edit by hand. */\n'
js_out += 'window.SUPP_PAIRINGS = ' + json.dumps(pj['pairings'], ensure_ascii=False) + ';\n'
with open('pairings-data.js', 'w') as f:
    f.write(js_out)
print('Wrote pairings-data.js:', os.path.getsize('pairings-data.js'), 'bytes')
print('Wrote pairings.json:', os.path.getsize('data/pairings.json'), 'bytes')
