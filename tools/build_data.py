"""One-off converter: monolithic index.html -> data/*.json + img/*.webp
Usage: python3 tools/build_data.py old_index.html atlas_dir out_dir"""
import re, json, gzip, base64, sys, os, hashlib
from collections import OrderedDict
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
src, atlas, out = sys.argv[1:4]
lines = open(src, encoding='utf8').read().split('\n')
SEED = json.loads(lines[45][len('const SEED='):].rstrip(';'))
b = re.search(r'"([^"]+)"', lines[46]).group(1)
XD = json.loads(gzip.decompress(base64.b64decode(b)))
XI = json.loads(re.search(r';const XI=(\[.*?\]);', lines[46]).group(1))
pics = re.findall(r'"data:image/jpeg;base64,([^"]+)"', lines[47])

# ---- questions, same ids as the old app (s<n>, x<k>) so saved progress still matches
Q = []
for d in SEED:
    Q.append(dict(id=d.get('id') or 's%d' % d['n'], s=d['s'], z=d['z'], q=d['q'], o=d['o'], a=d['a'], e=d.get('e', ''), i=d.get('i', []), x=d.get('x', [])))
for k, r in enumerate(XD):
    Q.append(dict(id='x%d' % k, s=r['s'], z=r['z'], q=r['q'], o=r['o'], a=r['a'], e=r.get('e', ''),
                  i=[XI[j] for j in r.get('i', [])], x=[XI[j] for j in r.get('x', [])]))

# ---- crops -> individual webp files
crops = OrderedDict()
for d in Q:
    for u in d['i'] + d['x']:
        if u.startswith('@'): crops.setdefault(u, None)
print('questions', len(Q), 'unique crops', len(crops))
by_atlas = {}
for u in crops:
    k, x, y, w, h = map(int, u[1:].split(':'))
    by_atlas.setdefault(k, []).append((u, x, y, w, h))
os.makedirs(f'{out}/img/q', exist_ok=True)
total = 0
for k, items in sorted(by_atlas.items()):
    im = Image.open(f'{atlas}/a{k:02d}.jpg').convert('RGB')
    for u, x, y, w, h in items:
        name = hashlib.md5(u.encode()).hexdigest()[:10] + '.webp'
        p = f'{out}/img/q/{name}'
        im.crop((x, y, x + w, y + h)).save(p, 'WEBP', quality=86, method=6)
        total += os.path.getsize(p); crops[u] = 'img/q/' + name
print('crop total MB', round(total / 1e6, 2))
for d in Q:
    d['i'] = [crops.get(u, u) for u in d['i']]; d['x'] = [crops.get(u, u) for u in d['x']]

# ---- hero images (result screen)
os.makedirs(f'{out}/img/hero', exist_ok=True)
import io
for n, p in enumerate(pics):
    Image.open(io.BytesIO(base64.b64decode(p))).convert('RGB').save(f'{out}/img/hero/{n}.webp', 'WEBP', quality=84)

# ---- manifest + per-set files
subjects = list(OrderedDict.fromkeys(d['s'] for d in Q))
sets = list(OrderedDict.fromkeys(d['z'] for d in Q))
os.makedirs(f'{out}/data/sets', exist_ok=True)
meta = dict(v=1, subjects=subjects, sets=[], idx=[])
for si, z in enumerate(sets):
    items = [d for d in Q if d['z'] == z]
    fn = 'sets/%02d.json' % si
    json.dump([{k: v for k, v in d.items() if k != 'z' and v not in ('', [])} for d in items],
              open(f'{out}/data/{fn}', 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
    meta['sets'].append(dict(name=z, file=fn, n=len(items)))
    meta['idx'] += [[d['id'], subjects.index(d['s']), si] for d in items]
json.dump(meta, open(f'{out}/data/meta.json', 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print('sets', len(sets), 'subjects', len(subjects))
