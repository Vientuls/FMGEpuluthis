import { A, I, $, esc, openModal, paintModal, closeModal, win, toast } from '../ui.js';
import { register, go, repaint } from '../router.js';
import { S, PR, me, MOCK, MINE, saveRun, saveBank, LS } from '../store.js';
import { D, pooled, total, stF, rebuild, byId, ensure } from '../data.js';
import { H, V, qn } from '../state.js';
import { TL, BD, lv } from '../game.js';
import { shuffle } from '../ui.js';
import { startTest } from './test.js';
import { openSettings } from './settings.js';
import { startCards, dueCount, cardCap } from './cards.js';
import { split, dayNo } from '../srs.js';

const MD = [['exam', 'Test', 'Answers after you finish', '📝'], ['practice', 'Qbank', 'Instant answers + explanations', '📚'], ['survival', 'Survival', '3 lives, game over at zero', '💀'], ['cards', 'Cards', 'Flip cards, spaced repetition', '🗂']];
const FL = [['all', 'All'], ['un', 'Unattempted'], ['bm', 'Bookmarked'], ['bad', 'Incorrect'], ['att', 'Attempted']];

function initSel() {
  if (H.init) return; H.init = true;
  D.subjects.forEach(s => { const z = [MOCK, MINE].filter(z => D.pc[s + '|' + z]); if (z.length) H.ss[s] = z });
}
const brand = () => `<div class="brand"><span class="logo">✚</span><div><b>FMGE Mock</b><small>${total().toLocaleString()} questions · ${D.sets.length} sets</small></div></div>`;
export function topbar(extra = '') {
  const u = me();
  return `<header class="bar">${brand()}<div class="grow"></div>${extra}${u ? `<button class="chip-btn" data-a="who" title="Switch user">${u.e} <span>${esc(u.n)}</span></button>` : ''}<button class="icon-btn" data-a="settings" aria-label="Settings">⚙︎</button></header>`;
}

function profile() {
  const due = dueCount(), l = lv(PR.xp), a = 40 * (l - 1) * (l - 1), b = 40 * l * l, pc = Math.round(100 * (PR.xp - a) / (b - a)), acc = PR.ans ? Math.round(100 * PR.ok / PR.ans) : 0;
  return win('Progress', `<div class="lvl"><div class="ring" style="--p:${pc}"><b>${l}</b></div><div class="grow"><b class="big-t">${TL[Math.min(7, (l - 1) >> 1)]}</b><p class="mu">${PR.xp} XP · ${b - PR.xp} to Lv ${l + 1}</p></div><div class="streak">🔥<b>${PR.streak || 0}</b><small>day streak</small></div></div>
  <div class="stats"><div><b>${PR.ans}</b><small>answered</small></div><div><b>${acc}%</b><small>correct</small></div><div><b>${PR.tests}</b><small>tests</small></div></div>
  <div class="chips">${BD.map(([k, e, n]) => `<span title="${n}" class="bd${PR.b.includes(k) ? ' on' : ''}">${e}</span>`).join('')}</div>
  <div class="g2"><button class="btn" data-a="quick" data-v="0">⚡ Quick 10</button><button class="btn" data-a="quick" data-v="1">💀 Survival</button></div>
  <button class="btn big" data-a="dueCards">🗂 Flashcards${due ? ` · ${due} due` : ''}</button>`, { cls: 'side-i' });
}

function history() {
  if (!S.hist.length) return '';
  return win('Past attempts', S.hist.slice(0, 6).map(x => { const p = Math.round(100 * x.c / x.n); return `<div class="hrow"><div><b>${esc(x.nm || 'Untitled module')}</b><small class="mu">${new Date(x.t).toLocaleDateString()} · ${x.c}/${x.n}</small></div><span class="pill ${p >= 50 ? 'ok' : 'bad'}">${p}%</span></div>` }).join(''), { cls: 'side-i' });
}

function html() {
  initSel();
  const pc = D.pc, S0 = D.subjects, Z = D.sets, pool = pooled(H), n = Math.min(+H.cnt || pool.length, pool.length), m = +H.mins || n, cd = H.mode == 'cards', cap = cardCap(pool.length), fi = cd ? split(pool.map(d => d.id), PR.fc, dayNo()) : null;
  const ms = {}; for (const k in H.ss) ms[k] = new Set(H.ss[k]);
  const base = D.recs.filter(d => ms[d.s] && ms[d.s].has(d.z)), qs = PR.qs || {}, bk = PR.bm || {};
  const cn = { all: base.length, un: 0, bm: 0, bad: 0, att: 0 };
  for (const d of base) { const q = qs[d.id]; if (!q) cn.un++; else { cn.att++; if (q == 2) cn.bad++ } if (bk[d.id]) cn.bm++ }
  const tot = {}; for (const k in pc) { const s = k.slice(0, k.indexOf('|')); tot[s] = (tot[s] || 0) + pc[k] }
  const full = S0.every(s => (H.ss[s] || []).length == Z.filter(z => pc[s + '|' + z]).length);
  const R = S.R;
  const resume = R ? win('Test in progress', `<p class="mu">${esc(R.name || 'Untitled module')} · ${Object.keys(R.ans).length} of ${R.ids.length} answered${R.paused ? ' · paused' : ''}</p><div class="g2"><button class="btn pri" data-a="resume">Resume</button><button class="btn" data-a="drop">Discard</button></div>`, { cls: 'side-i' }) : '';
  const create = win(cd ? 'New flashcard session' : 'New module', `
    ${cd ? '' : `<label class="field name"><span class="ic">✎</span><input id="mn" value="${esc(H.nm || 'Untitled module')}" maxlength="40" data-i="nm" onfocus="this.select()"></label>`}
    <div class="mdg">${MD.map(([k, t, d, e]) => `<button class="md${H.mode == k ? ' on' : ''}" data-a="setMode" data-v="${k}"><i>${e}</i><b>${t}</b><span>${d}</span></button>`).join('')}</div><p class="mu md-d">${(MD.find(m => m[0] == H.mode) || MD[0])[2]}</p>
    ${cd ? '' : `<div class="ln"><b>Time (minutes)</b><span class="stp"><button data-a="stp" data-v="m:-5">−</button><input id="mi" type="number" min="1" value="${m}" data-i="mins"><button data-a="stp" data-v="m:5">+</button></span></div>`}
    <div class="ln"><b>${cd ? 'Cards per session' : 'Questions'}</b><span class="stp"><button data-a="stp" data-v="n:-5">−</button><input id="ni" type="number" min="1" max="${pool.length}" value="${cd ? cap : n}" data-i="cnt" data-on="input"><button data-a="stp" data-v="n:5">+</button></span></div>${cd ? `<p class="mu fc-info">${fi.due.length} due · ${fi.fresh.length} new · ${fi.later.length} learned (in this selection)</p>` : ''}
    <div class="chips2">${FL.map(([k, t]) => `<button class="ch${H.f == k ? ' on' : ''}" data-a="setF" data-v="${k}">${t}<i>${cn[k]}</i></button>`).join('')}</div>
    <div class="ln"><b>Subjects</b><button class="lk" data-a="selAllS">${full ? 'Clear all' : 'Select all'}</button></div>
    <div class="sl">${S0.map((s, i) => { const sel = H.ss[s] || []; return `<button class="sr${sel.length ? ' on' : ''}" data-a="openSh" data-v="${i}"><span class="rd"></span><span class="sn">${esc(s)}</span><span class="sc">${sel.length ? sel.reduce((a, z) => a + (pc[s + '|' + z] || 0), 0) : (tot[s] || 0)} Qs</span></button>` }).join('')}</div>
    <label class="tog"><input type="checkbox" ${H.shuf ? 'checked' : ''} data-i="shuf" data-on="change"><i></i><span>Shuffle questions within each subject</span></label>
    <button id="startbtn" class="btn pri big" data-a="start" ${pool.length ? '' : 'disabled'}>${cd ? 'Start flashcards' : 'Create module'}${pool.length ? (cd ? ' · ' + cap + ' cards' : ' · ' + n + ' Qs') : ''}</button>
    ${S.last ? `<div class="g2"><button class="btn" data-a="adq">＋ Add questions</button><button class="btn" data-a="rvl">Review last</button></div>` : `<button class="btn big" data-a="adq">＋ Add questions</button>`}`, { cls: 'w-create' });
  return `${topbar()}<div class="home-grid">${resume}${profile()}${create}${history()}</div>`;
}

// ---- inputs ----
I.nm = el => { H.nm = el.value };
I.mins = el => { H.mins = el.value };
I.cnt = el => { H.cnt = el.value; qsync() };
I.shuf = el => { H.shuf = el.checked };
function qsync() {
  const p = pooled(H).length, n = qn(), b = $('#startbtn'), mi = $('#mi');
  if (H.mode == 'cards') { if (b) b.textContent = 'Start flashcards' + (p ? ' · ' + cardCap(p) + ' cards' : ''); return }
  if (b) b.textContent = 'Create module' + (p ? ' · ' + n + ' Qs' : '');
  if (n > 0) { H.mins = String(n); if (mi) mi.value = n }
}
document.addEventListener('focusout', e => { if (e.target.id === 'ni') { const n = H.mode == 'cards' ? cardCap(pooled(H).length) : qn(); if (n > 0) { e.target.value = n; H.cnt = String(n) } qsync() } });

// ---- actions ----
const reset = () => { H.cnt = H.mins = '' };
A.setMode = v => { H.mode = v; repaint() };
A.setF = v => { H.f = v; reset(); repaint() };
A.stp = v => {
  const [w, d] = v.split(':'), e = $(w == 'n' ? '#ni' : '#mi'), x = Math.max(1, (+e.value || 0) + +d);
  e.value = w == 'n' ? Math.min(x, +e.max || x) : x; H[w == 'n' ? 'cnt' : 'mins'] = e.value; if (w == 'n') qsync();
};
A.selAllS = () => {
  const pc = D.pc, Z = D.sets, full = D.subjects.every(s => (H.ss[s] || []).length == Z.filter(z => pc[s + '|' + z]).length);
  H.ss = {}; if (!full) D.subjects.forEach(s => { H.ss[s] = Z.filter(z => pc[s + '|' + z]) }); reset(); repaint();
};
A.start = () => (H.mode == 'cards' ? startCards() : startTest());
A.adq = () => go('add');
A.rvl = () => { V.sub = ''; V.bad = false; go('review') };
A.resume = () => go('test');
A.drop = () => { S.R = null; saveRun(); repaint() };
A.who = () => go('who');
A.settings = () => openSettings();
A.quick = async v => {
  const sv = v == '1';
  if (!pooled(H).length) { H.f = 'all'; D.subjects.forEach(s => { H.ss[s] = D.sets.filter(z => D.pc[s + '|' + z]) }) }
  const keep = { mode: H.mode, cnt: H.cnt, mins: H.mins, shuf: H.shuf };
  H.mode = sv ? 'survival' : 'practice'; H.cnt = sv ? '60' : '10'; H.mins = sv ? '60' : '10'; H.shuf = true;
  await startTest(); Object.assign(H, keep, { cnt: '', mins: '' });
};

// ---- per-subject set picker (modal) ----
let SHs = '', SHz = [], SHsel = new Set();
A.openSh = i => {
  const s = D.subjects[i]; SHs = s; SHz = D.sets.filter(z => D.pc[s + '|' + z]); SHsel = new Set(H.ss[s] || []);
  openModal(s, shRender);
};
const shRender = () => `<div class="ln"><b>Choose sets</b><button class="lk" data-a="shAll">${SHsel.size == SHz.length ? 'Clear' : 'Select all'}</button></div>${SHz.map((z, j) => `<button class="srow${SHsel.has(z) ? ' on' : ''}" data-a="shT" data-v="${j}"><span class="rd"></span><span class="sn">${esc(z)}</span><span class="sc">${D.pc[SHs + '|' + z] || 0}</span></button>`).join('')}<button class="btn pri big" data-a="shSave">Save</button>`;
A.shT = v => { const z = SHz[+v]; SHsel.has(z) ? SHsel.delete(z) : SHsel.add(z); paintModal() };
A.shAll = () => { SHsel = SHsel.size == SHz.length ? new Set() : new Set(SHz); paintModal() };
A.shSave = () => { if (SHsel.size) H.ss[SHs] = [...SHsel]; else delete H.ss[SHs]; closeModal(); reset(); repaint() };

register('home', { html, guard: () => (!me() ? 'who' : null) });
