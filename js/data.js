// Question data: a tiny index up front, full question text loaded per set only when needed
import { S, PR, MINE } from './store.js';
export const D = { meta: null, recs: [], subjects: [], sets: [], pc: {}, q: new Map(), zOf: new Map(), files: new Map(), byIdRec: new Map() };

export async function loadMeta() {
  const r = await fetch('data/meta.json'); if (!r.ok) throw new Error('meta ' + r.status);
  D.meta = await r.json(); D.zOf = new Map(D.meta.idx.map(x => [x[0], x[2]])); rebuild();
}
// call again whenever custom questions change
export function rebuild() {
  const m = D.meta, subjects = [...m.subjects], sets = m.sets.map(s => s.name);
  const recs = m.idx.map(([id, si, zi]) => ({ id, s: m.subjects[si], z: sets[zi] }));
  for (const d of S.custom) {
    if (!subjects.includes(d.s)) subjects.push(d.s); if (!sets.includes(MINE)) sets.push(MINE);
    recs.push({ id: d.id, s: d.s, z: MINE });
  }
  const pc = {}; for (const r of recs) { const k = r.s + '|' + r.z; pc[k] = (pc[k] || 0) + 1 }
  Object.assign(D, { recs, subjects, sets, pc });
}
export const total = () => D.recs.length;

const loadSet = zi => {
  if (!D.files.has(zi)) {
    D.files.set(zi, fetch('data/' + D.meta.sets[zi].file).then(r => { if (!r.ok) throw new Error('set ' + zi); return r.json() }).then(arr => {
      const z = D.meta.sets[zi].name; for (const q of arr) { q.z = z; q.e = q.e || ''; q.i = q.i || []; q.x = q.x || []; D.q.set(q.id, q) }
    }).catch(e => { D.files.delete(zi); throw e }));
  }
  return D.files.get(zi);
};
export async function ensure(ids) {
  const need = new Set(); for (const id of ids) { if (!D.q.has(id) && D.zOf.has(id)) need.add(D.zOf.get(id)) }
  await Promise.all([...need].map(loadSet));
}
export const byId = id => D.q.get(id) || S.custom.find(d => d.id == id);

// ---- filtering ----
export const stF = (d, f) => { f = f || 'all'; const q = (PR.qs || {})[d.id]; return f == 'all' || (f == 'un' && !q) || (f == 'att' && !!q) || (f == 'bad' && q == 2) || (f == 'bm' && !!(PR.bm || {})[d.id]) };
export function pooled(H) {
  const m = {}; for (const k in (H.ss || {})) m[k] = new Set(H.ss[k]);
  return D.recs.filter(d => m[d.s] && m[d.s].has(d.z) && stF(d, H.f));
}
export function score(r) {
  const subs = {}; let c = 0, att = 0;
  r.ids.forEach(id => {
    const d = byId(id); if (!d) return;
    const s = subs[d.s] = subs[d.s] || [0, 0, 0]; s[2]++;
    if (r.ans[id] != null) { att++; s[1]++; if (r.ans[id] == d.a) { s[0]++; c++ } }
  });
  return { c, att, subs, n: r.ids.length };
}
// normalise a user-supplied question (form or JSON import)
export function norm(d) {
  let o = d.o || d.options, a = d.a ?? d.answer; if (!Array.isArray(o)) return null;
  o = o.map(x => String(x).trim()).filter(Boolean);
  if (typeof a == 'string') a = /^[A-Ea-e]$/.test(a.trim()) ? a.trim().toUpperCase().charCodeAt(0) - 65 : o.indexOf(a.trim());
  const q = String(d.q || d.question || '').trim(); if (!q || o.length < 2 || !(a >= 0 && a < o.length)) return null;
  return { id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), s: String(d.s || d.subject || '').trim() || 'General', q, o, a, e: String(d.e || d.explanation || '').trim(), z: MINE, i: [], x: [] };
}
