import { A, $, esc, L, fmtT, win } from '../ui.js';
import { register, go, repaint } from '../router.js';
import { S, PR, savePR } from '../store.js';
import { byId, score } from '../data.js';
import { V } from '../state.js';
import { rank, heroIdx, boom } from '../game.js';
import { imgs, explain } from './test.js';
import { topbar } from './home.js';

function result() {
  const r = S.last, x = score(r), p = x.n ? Math.round(100 * x.c / x.n) : 0, g = r.gain || {};
  return `${topbar()}<div class="result-grid">
  ${win('Result', `<div class="score-wrap"><div class="score-ring" style="--p:${p}"><div><b id="sc">${x.c}</b><span>/ ${x.n}</span></div></div>
    <div class="grow"><h1 class="rank">${rank(p)}</h1><p class="mu">${p}% · ${x.att} attempted · ${x.n - x.att} skipped</p><p class="mu">${fmtT(r.secs || 0)} of ${r.mins} min · +1 per correct, no negative marking</p>
    <p class="gain">+${g.xp || 0} XP${g.l1 ? ` · Level ${g.l1}${g.l2 > g.l1 ? ' → ' + g.l2 + ' 🎉' : ''}` : ''}${(g.nb || []).length ? ' · New badge ' + g.nb.join(' ') : ''}</p></div></div>
    <img class="hero" src="img/hero/${heroIdx(p)}.webp" alt="">
    <div class="g2"><button class="btn pri" data-a="rv" data-v="0">Review answers</button><button class="btn" data-a="rv" data-v="1">Mistakes & skipped</button></div>
    <button class="btn big" data-a="go" data-v="home">Home</button>`, { cls: 'w-res' })}
  ${win('By subject', Object.entries(x.subs).map(([s, [c, a, n]]) => `<div class="subres"><div class="row"><b>${esc(s)}</b><span>${c} / ${n}</span></div><div class="bar-t"><i style="width:${100 * c / n}%"></i></div><small class="mu">${Math.round(100 * c / n)}% · ${a} attempted</small></div>`).join(''))}</div>`;
}
function resultAfter() {
  const r = S.last, x = score(r), p = x.n ? Math.round(100 * x.c / x.n) : 0, el = $('#sc'), t0 = performance.now();
  (function f(t) { const v = Math.min(x.c, Math.round(x.c * (t - t0) / 900)); if (el) el.textContent = v; if (v < x.c) requestAnimationFrame(f) })(t0);
  if (p >= 50) boom(p >= 80 ? 120 : 60);
}
A.rv = v => { V.sub = ''; V.bad = v == '1'; go('review') };
register('result', { html: result, after: resultAfter, ids: () => S.last && S.last.ids, guard: () => (S.last ? null : 'home') });

// ---------- review ----------
function review() {
  const r = S.last, Su = [...new Set(r.ids.map(id => byId(id) && byId(id).s))].filter(Boolean);
  const items = r.ids.map((id, i) => [byId(id), i + 1]).filter(([d]) => d && (!V.sub || d.s == V.sub) && (!V.bad || r.ans[d.id] != d.a));
  return `<header class="bar"><button class="btn sm" data-a="go" data-v="result">‹ Result</button><span class="mu">${items.length} shown</span><div class="grow"></div><button class="btn sm" data-a="go" data-v="home">Home</button></header>
  <div class="review-col">${win('Filter', `<select data-i="rvSub" data-on="change"><option value="">All subjects</option>${Su.map(s => `<option ${V.sub == s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
  <label class="tog"><input type="checkbox" ${V.bad ? 'checked' : ''} data-i="rvBad" data-on="change"><i></i><span>Mistakes and skipped only</span></label>`)}
  ${items.map(([d, i]) => {
    const a = r.ans[d.id], t = a == null ? ['sk', 'Skipped'] : a == d.a ? ['ok', 'Correct'] : ['bad', 'Wrong'];
    return `<section class="win rv"><header class="win-h"><span class="dots"><i></i><i></i><i></i></span><h2>Q${i} · ${esc(d.s)}</h2><span class="win-act"><span class="tag ${t[0]}">${t[1]}</span><button class="lk" data-a="rvbm" data-v="${d.id}">${PR.bm && PR.bm[d.id] ? '🔖 Saved' : '🔖 Save'}</button></span></header>
    <div class="win-b"><div class="st">${esc(d.q)}</div>${imgs(d.i)}<div class="opts">${d.o.map((o, k) => `<div class="opt${k == d.a ? ' ok' : a === k ? ' bad' : ''}"><b>${L(k)}</b><span>${esc(o)}</span></div>`).join('')}</div>${explain(d, a != d.a)}</div></section>`;
  }).join('')}</div>`;
}
import { I } from '../ui.js';
I.rvSub = el => { V.sub = el.value; repaint() };
I.rvBad = el => { V.bad = el.checked; repaint() };
A.rvbm = id => { PR.bm = PR.bm || {}; if (PR.bm[id]) delete PR.bm[id]; else PR.bm[id] = 1; savePR(); repaint() };
register('review', { html: review, ids: () => S.last && S.last.ids, guard: () => (S.last ? null : 'home') });
