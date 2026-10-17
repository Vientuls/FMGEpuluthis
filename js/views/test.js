import { A, $, esc, L, fmtT, shuffle, openModal, closeModal, win, toast } from '../ui.js';
import { register, go, repaint, screen } from '../router.js';
import { S, PR, saveRun, savePR, saveHist, saveLast } from '../store.js';
import { D, byId, pooled, score } from '../data.js';
import { H, qn } from '../state.js';
import { fx, post, award } from '../game.js';
import { topbar } from './home.js';

let tmr = 0, dir = 0;

export async function startTest() {
  let p = pooled(H); if (!p.length) return;
  const n = qn(), m = +H.mins || n, o = D.subjects;
  if (H.shuf || n < p.length) p = shuffle(p);
  p = p.slice(0, n).sort((a, b) => o.indexOf(a.s) - o.indexOf(b.s));
  const sv = H.mode == 'survival';
  S.R = { ids: p.map(d => d.id), ans: {}, mark: {}, i: 0, mode: sv ? 'practice' : H.mode, sv: sv ? 1 : 0, lives: sv ? 3 : 0, f5: 2, combo: 0, gx: 0, x0: PR.xp, name: (H.nm || '').trim() || 'Untitled module', mins: m, t0: Date.now(), end: Date.now() + m * 60000 };
  saveRun(); await go('test');
}

export const imgs = a => (a || []).map(u => `<img class="zoom" data-a="zoom" src="${esc(u)}" loading="lazy" decoding="async" alt="Question image">`).join('');
export const explain = (d, open) => `<details${open ? ' open' : ''}><summary>Explanation</summary><div class="ex">${esc(d.e || 'No explanation added.')}</div>${imgs(d.x)}</details>`;

function hud(R) {
  if (R.mode != 'practice') return '';
  const id = R.ids[R.i], d = byId(id), can = R.f5 > 0 && R.ans[id] == null && !(R.el && R.el[id]) && d.o.length > 2;
  return `<div class="hud">${R.sv ? `<span class="lives">${'❤️'.repeat(R.lives)}${'🖤'.repeat(3 - R.lives)}</span>` : ''}<span class="cmb">${R.combo > 1 ? '🔥 x' + R.combo : '⚡ combo'}</span><span>⭐ ${R.gx || 0}</span>${can ? `<button class="btn sm" data-a="f5">✂ 50:50 · ${R.f5}</button>` : ''}</div>`;
}

function palHtml(R, inTest) {
  const n = R.ids.length, an = Object.keys(R.ans).length, g = [];
  R.ids.forEach((id, i) => { const s = byId(id).s; (g.length && g[g.length - 1].s == s ? g[g.length - 1] : g[g.push({ s, x: [] }) - 1]).x.push(i) });
  return `<div class="pal-sum"><span><b>${an}</b> answered</span><span><b>${Object.keys(R.mark).length}</b> marked</span><span><b>${n - an}</b> left</span></div>
  ${g.map(o => `<h3 class="pal-h">${esc(o.s)} <small>${o.x.filter(i => R.ans[R.ids[i]] != null).length}/${o.x.length}</small></h3><div class="pal">${o.x.map(i => { const id = R.ids[i]; return `<button class="pn${R.ans[id] != null ? ' a' : ''}${R.mark[id] ? ' m' : ''}${i == R.i ? ' c' : ''}" data-a="jump" data-v="${i}">${i + 1}</button>` }).join('')}</div>`).join('')}
  <button class="btn pri big" data-a="submit">Submit test</button>`;
}

function html() {
  const R = S.R; if (R.paused) return pausedHtml(R);
  const d = byId(R.ids[R.i]), a = R.ans[d.id], pr = R.mode == 'practice' && a != null, n = R.ids.length;
  const cls = dir ? (dir > 0 ? 'in-r' : 'in-l') : ''; dir = 0;
  const el = (R.el && R.el[d.id]) || [];
  const q = `<section class="win q-win ${cls}"><header class="win-h"><span class="dots"><i></i><i></i><i></i></span><h2>${esc(d.s)} · Q${R.i + 1}</h2><span class="win-act">${R.mark[d.id] ? '<span class="flag">⚑ marked</span>' : ''}<button class="lk" data-a="bm">${PR.bm && PR.bm[d.id] ? '🔖 Saved' : '🔖 Save'}</button></span></header>
  <div class="win-b">${hud(R)}<div class="st">${esc(d.q)}</div>${imgs(d.i)}
  <div class="opts">${d.o.map((o, k) => `<button class="opt${a === k ? ' sel' : ''}${el.includes(k) ? ' gone' : ''}${pr ? (k == d.a ? ' ok' : a === k ? ' bad' : '') : ''}" data-a="pick" data-v="${k}"><b>${L(k)}</b><span>${esc(o)}</span></button>`).join('')}</div>
  ${pr ? `<div class="fb ${a == d.a ? 'ok' : 'bad'}"><b>${a == d.a ? '✓ Correct' : 'Correct answer: ' + L(d.a)}</b>${explain(d, 1)}</div>` : ''}
  <p class="hint">Swipe or use ← → keys · 1–4 to answer · M to mark</p></div>
</section>`;
  const pct = Math.round(100 * (R.i + 1) / n), nav = `<footer class="q-nav"><button class="btn" data-a="mv" data-v="-1" ${R.i ? '' : 'disabled'}>‹ Prev</button><button class="btn${R.mark[d.id] ? ' mkd' : ''}" data-a="mk">⚑ Mark</button>${R.i < n - 1 ? `<button class="btn pri" data-a="mv" data-v="1">Next ›</button>` : `<button class="btn pri" data-a="submit">Finish ✓</button>`}</footer>`;
  return `<header class="bar test-bar"><span class="tm" id="tm"></span><span class="cnt">${R.i + 1}<small>/${n}</small></span><div class="grow"></div><button class="btn sm" data-a="pause">Pause</button><button class="btn sm m-only" data-a="go" data-v="pal">Palette</button></header>
  <div class="prog"><i style="width:${pct}%"></i></div>
  <div class="test-grid"><div class="qcol">${q}${nav}</div><aside class="win pal-win d-only"><header class="win-h"><span class="dots"><i></i><i></i><i></i></span><h2>Palette</h2></header><div class="win-b">${palHtml(R)}</div></aside></div>`;
}
function after() {
  tick(); try { post(S.R, finish) } catch (e) { }
  const R = S.R; if (R && !R.paused) for (let j = R.i + 1; j < Math.min(R.ids.length, R.i + 3); j++) { const d = byId(R.ids[j]); d && [...d.i, ...d.x].forEach(u => { new Image().src = u }) }
}

function pausedHtml(R) {
  clearInterval(tmr); const s = Math.max(0, Math.round((R.end - R.paused) / 1000));
  return `<div class="center-col">${win('Paused', `<p class="mu">Timer stopped and questions hidden. ${Object.keys(R.ans).length} of ${R.ids.length} answered.</p><div class="bigtime">${fmtT(s)}</div><p class="mu">time left</p><button class="btn pri big" data-a="unpause">Resume test</button><button class="btn big" data-a="go" data-v="home">Back to home</button>`)}</div>`;
}
function palScreen() {
  const R = S.R;
  return `<header class="bar test-bar"><span class="tm" id="tm"></span><div class="grow"></div><button class="btn sm" data-a="pause">Pause</button><button class="btn sm" data-a="go" data-v="test">Back to test</button></header>
  <div class="center-col">${win('Palette', palHtml(R))}</div>`;
}

// ---- timer ----
function tick() {
  clearInterval(tmr);
  const f = () => { const R = S.R; if (!R) return; const s = Math.max(0, Math.round((R.end - Date.now()) / 1000)), e = $('#tm'); if (e) { e.textContent = fmtT(s); e.className = 'tm' + (s < 300 ? ' low' : '') } if (!s) finish() };
  f(); tmr = setInterval(f, 500);
}
document.addEventListener('screen', e => { if (e.detail != 'test' && e.detail != 'pal') clearInterval(tmr) });

// ---- actions ----
function pick(k) {
  const R = S.R, id = R.ids[R.i]; if (R.mode == 'practice' && R.ans[id] != null) return;
  const el = (R.el && R.el[id]) || []; if (el.includes(k)) return;
  if (R.mode == 'exam' && R.ans[id] === k) delete R.ans[id]; else R.ans[id] = k;
  try { fx(R, id, k) } catch (e) { } saveRun(); repaint();
}
A.pick = v => pick(+v);
A.mk = () => { const R = S.R, id = R.ids[R.i]; if (R.mark[id]) delete R.mark[id]; else R.mark[id] = 1; saveRun(); repaint() };
export function mv(x) { const R = S.R; const k = R.i + x; if (k < 0 || k >= R.ids.length) return; dir = x; R.i = k; saveRun(); repaint(); scrollTo(0, 0) }
A.mv = v => mv(+v);
A.jump = v => { const R = S.R; dir = +v > R.i ? 1 : -1; R.i = +v; saveRun(); if (screen == 'pal') go('test'); else { repaint(); scrollTo(0, 0) } };
A.go = v => go(v);
A.pause = () => { S.R.paused = Date.now(); saveRun(); repaint() };
A.unpause = () => { const R = S.R; R.end += Date.now() - R.paused; R.paused = 0; saveRun(); go('test') };
A.bm = (v) => { const R = S.R, id = R.ids[R.i]; PR.bm = PR.bm || {}; if (PR.bm[id]) delete PR.bm[id]; else PR.bm[id] = 1; savePR(); repaint() };
A.f5 = () => {
  const R = S.R, id = R.ids[R.i], d = byId(id); if (!(R.f5 > 0) || R.ans[id] != null || d.o.length < 3) return;
  R.el = R.el || {}; if (R.el[id]) return;
  R.el[id] = shuffle(d.o.map((_, k) => k).filter(k => k != d.a)).slice(0, 2); R.f5--; saveRun(); repaint();
};
A.submit = () => {
  const R = S.R, n = R.ids.length, an = Object.keys(R.ans).length, mk = Object.keys(R.mark).length;
  openModal('Submit test?', () => `<p>${an === n ? 'You have answered every question.' : `<b>${n - an}</b> unanswered`}${mk ? ` · <b>${mk}</b> marked for review` : ''}.</p><p class="mu">There is no negative marking, so unanswered questions simply score zero.</p>
  <div class="g2"><button class="btn" data-a="closeModal">Keep going</button><button class="btn pri" data-a="finish">Submit</button></div>`);
};
A.finish = () => finish();

export function finish() {
  const R = S.R; if (!R) return; clearInterval(tmr); closeModal();
  R.secs = Math.min(R.mins * 60, Math.max(0, Math.round(R.mins * 60 - (R.end - Date.now()) / 1000)));
  S.last = R; S.R = null;
  try { const x = score(S.last); if (!Array.isArray(S.hist)) S.hist = []; S.hist.unshift({ t: Date.now(), c: x.c, n: x.n, secs: S.last.secs, subs: x.subs, nm: S.last.name || '' }); S.hist = S.hist.slice(0, 30); saveHist() } catch (e) { }
  try { award(S.last) } catch (e) { }
  try { saveLast(); saveRun() } catch (e) { }
  go('result');
}

// ---- swipe + keyboard ----
let tx = 0, ty = 0, tn = 1;
document.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; tn = e.touches.length }, { passive: true });
document.addEventListener('touchend', e => {
  if (tn > 1 || screen != 'test' || !S.R || S.R.paused || $('#modal')) return;
  const t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
  if (Math.abs(dx) > 70 && Math.abs(dx) > 1.6 * Math.abs(dy)) mv(dx < 0 ? 1 : -1);
}, { passive: true });
document.addEventListener('keydown', e => {
  if (screen != 'test' || !S.R || S.R.paused || $('#modal') || e.target.closest('input,textarea,select') || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase(), d = byId(S.R.ids[S.R.i]);
  if (k == 'arrowright') mv(1); else if (k == 'arrowleft') mv(-1); else if (k == 'm') A.mk(); else if (k == 'b') A.bm();
  else { const i = /^[1-5]$/.test(k) ? +k - 1 : /^[a-e]$/.test(k) ? k.charCodeAt(0) - 97 : -1; if (i >= 0 && i < d.o.length) pick(i) }
});

register('test', { html, after, ids: () => S.R && S.R.ids, guard: () => (S.R ? null : 'home') });
register('pal', { html: palScreen, after: tick, ids: () => S.R && S.R.ids, guard: () => (S.R ? null : 'home') });
