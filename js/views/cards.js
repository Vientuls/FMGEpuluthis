// Flashcards: every question in the bank becomes a card (question on the front, answer + explanation on the back).
// You rate each card Again / Good / Easy and it comes back on a spaced schedule (see ../srs.js).
import { A, esc, L, shuffle, win, toast } from '../ui.js';
import { register, go, repaint, screen } from '../router.js';
import { PR, savePR } from '../store.js';
import { D, byId, pooled } from '../data.js';
import { H } from '../state.js';
import { boom, cardXP } from '../game.js';
import { imgs } from './test.js';
import { dayNo, split, pick, rate, nextLabel, RATINGS } from '../srs.js';

let C = null;                                       // the session in progress (lives only while the app is open)
const XP = [1, 3, 4], KEY = ['again', 'good', 'easy'], AGAIN_GAP = 3;

// how many cards in one session (the "Cards per session" box on the home screen)
export const cardCap = p => Math.max(0, Math.min(p, Math.max(1, Math.floor(+H.cnt) || 20)));
export function dueCount() {
  const fc = PR.fc; if (!fc) return 0; const t = dayNo(); let n = 0;
  for (const r of D.recs) { const c = fc[r.id]; if (c && c[1] <= t) n++ }
  return n;
}

export function startCards(o = {}) {
  const fc = PR.fc = PR.fc || {}, pool = o.ids || pooled(H).map(d => d.id), sp = split(pool, fc), cap = o.cap || cardCap(pool.length);
  const q = o.cram ? shuffle(pool).slice(0, cap) : pick({ due: sp.due, fresh: H.shuf ? shuffle(sp.fresh) : sp.fresh }, cap);
  C = { pool, cap, q, i: 0, flip: false, peek: false, n: [0, 0, 0], u: null, paid: 0, fin: !q.length, empty: !q.length };
  return go('cards');
}

function payXP() {                                  // XP is paid once per session (and again only for extra cards), so Undo can't farm it
  const x = C.n.reduce((s, k, r) => s + k * XP[r], 0), d = x - C.paid;
  if (d > 0) { C.paid = x; try { cardXP(d) } catch (e) { } }
}

const opts = (d, hl) => d.o.map((o, k) => `<div class="opt${hl && k == d.a ? ' ok' : ''}"><b>${L(k)}</b><span>${esc(o)}</span></div>`).join('');

function html() {
  if (C.fin) return fin();
  const id = C.q[C.i], d = byId(id); if (!d) return fin();
  const c = (PR.fc || {})[id], n = C.q.length;
  const front = `<div class="fc-flip" data-a="fcFlip"><div class="st">${esc(d.q)}</div></div>${imgs(d.i)}
    ${C.peek ? `<div class="opts">${opts(d, false)}</div>` : `<button class="lk" data-a="fcPeek">Show options</button>`}`;
  const back = `<div class="st fc-q">${esc(d.q)}</div>${imgs(d.i)}
    <div class="fc-ans"><small>Answer</small><div class="fc-a"><b>${L(d.a)}</b><span>${esc(d.o[d.a])}</span></div></div>
    ${d.e ? `<div class="ex">${esc(d.e)}</div>` : `<p class="mu">No explanation added for this question.</p>`}${imgs(d.x)}
    <details><summary>All options</summary><div class="opts">${opts(d, true)}</div></details>`;
  const card = win(`${esc(d.s)} · ${c ? 'Box ' + c[0] : 'New'}`, C.flip ? back : front,
    { cls: 'fc' + (C.flip ? ' back' : ''), act: `<button class="lk" data-a="fcBm">${PR.bm && PR.bm[id] ? '🔖 Saved' : '🔖 Save'}</button>` });
  const nav = C.flip
    ? `<footer class="q-nav">${RATINGS.map((t, r) => `<button class="btn fc-r ${KEY[r]}" data-a="fcRate" data-v="${r}">${t}<small>${nextLabel(c, r)}</small></button>`).join('')}</footer>`
    : `<footer class="q-nav"><button class="btn pri" data-a="fcFlip">Show answer</button></footer>`;
  return `<header class="bar test-bar"><button class="btn sm" data-a="fcHome">‹ Home</button><span class="cnt">${C.i + 1}<small>/${n}</small></span><div class="grow"></div><button class="btn sm" data-a="fcUndo" ${C.u ? '' : 'disabled'}>↶ Undo</button></header>
  <div class="prog"><i style="width:${Math.round(100 * C.i / n)}%"></i></div>
  <div class="fc-col">${card}<p class="hint">Space = flip · 1 Again · 2 Good · 3 Easy · O options · Z undo</p></div>${nav}`;
}

function fin() {
  const fc = PR.fc || {}, t = dayNo(), sp = split(C.pool, fc, t), [a, g, e] = C.n;
  const nx = sp.later.length ? fc[sp.later[0]][1] - t : 0, nxN = nx ? sp.later.filter(id => fc[id][1] == t + nx).length : 0;
  const next = nx ? `Next review ${nx <= 1 ? 'tomorrow' : 'in ' + nx + ' days'} · ${nxN} card${nxN == 1 ? '' : 's'}` : '';
  if (C.empty) return `<div class="center-col">${win('All caught up', `<p class="mu">Nothing is due in this selection${next ? '. ' + next : ''}.</p>
    <button class="btn pri big" data-a="fcCram">Practise anyway · ${Math.min(C.cap, C.pool.length)} cards</button><button class="btn big" data-a="fcHome">Home</button>`)}</div>`;
  const left = sp.due.length + sp.fresh.length;
  return `<div class="center-col">${win('Session complete', `<div class="stats"><div><b>${a}</b><small>again</small></div><div><b>${g}</b><small>good</small></div><div><b>${e}</b><small>easy</small></div></div>
    <p class="gain">+${C.paid} XP</p>${next ? `<p class="mu">${next}</p>` : ''}
    ${left ? `<button class="btn pri big" data-a="fcMore">Study more · ${Math.min(C.cap, left)} cards</button>` : ''}<button class="btn${left ? '' : ' pri'} big" data-a="fcHome">Home</button>`)}</div>`;
}

function end() { C.fin = true; payXP(); try { boom(C.n[1] + C.n[2] >= 5 ? 60 : 25) } catch (e) { } repaint(); scrollTo(0, 0) }

A.fcFlip = () => { if (!C || C.fin || C.flip) return; C.flip = true; repaint() };
A.fcPeek = () => { if (!C) return; C.peek = !C.peek; repaint() };
A.fcBm = () => { if (!C || C.fin) return; const id = C.q[C.i]; PR.bm = PR.bm || {}; if (PR.bm[id]) delete PR.bm[id]; else PR.bm[id] = 1; savePR(); repaint() };
A.fcRate = v => {
  if (!C || C.fin || !C.flip) return; const r = +v, id = C.q[C.i], fc = PR.fc = PR.fc || {};
  C.u = { id, prev: fc[id] ? fc[id].slice() : null, q: C.q.slice(), i: C.i, r };
  fc[id] = rate(fc[id], r); C.n[r]++;
  if (r === 0) C.q.splice(Math.min(C.q.length, C.i + 1 + AGAIN_GAP), 0, id);     // see it again in a few cards
  C.i++; C.flip = false; C.peek = false; savePR();
  if (C.i >= C.q.length) return end();
  repaint(); scrollTo(0, 0);
};
A.fcUndo = () => {
  const u = C && C.u; if (!u || C.fin) return; const fc = PR.fc;
  if (u.prev) fc[u.id] = u.prev; else delete fc[u.id];
  C.q = u.q; C.i = u.i; C.n[u.r]--; C.u = null; C.flip = true; savePR(); repaint();
};
A.fcHome = () => { if (C) payXP(); C = null; go('home') };
A.fcMore = () => { if (C) { payXP(); startCards({ ids: C.pool, cap: C.cap }) } };
A.fcCram = () => { if (C) startCards({ ids: C.pool, cap: C.cap, cram: true }) };
// home screen "Flashcards" button: review everything that is due, across all sets
A.dueCards = () => {
  const fc = PR.fc || {}, t = dayNo(), ids = D.recs.map(r => r.id).filter(id => fc[id] && fc[id][1] <= t);
  if (!ids.length) { H.mode = 'cards'; repaint(); toast('No cards due yet. Choose what to study below.'); document.querySelector('.w-create')?.scrollIntoView({ behavior: 'smooth' }); return }
  startCards({ ids: split(ids, fc, t).due, cap: 50 });
};

document.addEventListener('keydown', e => {
  if (screen != 'cards' || !C || C.fin || document.querySelector('#modal') || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.closest && e.target.closest('input,textarea,select,button,summary')) return;
  const k = e.key.toLowerCase();
  if (k == ' ' || k == 'enter') { e.preventDefault(); C.flip ? A.fcRate('1') : A.fcFlip() }
  else if (C.flip && /^[1-3]$/.test(k)) A.fcRate(String(+k - 1));
  else if (k == 'b') A.fcBm(); else if (k == 'o' && !C.flip) A.fcPeek(); else if (k == 'z') A.fcUndo();
});

register('cards', { html, ids: () => C && C.q, guard: () => (C ? null : 'home') });
