import { A, I, $, esc, L, win } from '../ui.js';
import { register, go } from '../router.js';
import { S, saveBank } from '../store.js';
import { D, rebuild, norm } from '../data.js';
import { H } from '../state.js';

let msg = '';
const html = () => {
  const Su = D.subjects;
  const out = `<header class="bar"><button class="btn sm" data-a="go" data-v="home">‹ Home</button><b class="ttl">Add questions</b></header><div class="add-grid">
  ${win('One question', `<input id="fs" list="sl" placeholder="Subject (pick one or type a new one)"><datalist id="sl">${Su.map(s => `<option value="${esc(s)}">`).join('')}</datalist>
  <textarea id="fq" rows="4" placeholder="Question"></textarea>${[0, 1, 2, 3].map(k => `<input id="fo${k}" placeholder="Option ${L(k)}">`).join('')}
  <select id="fa"><option value="">Correct option</option>${[0, 1, 2, 3].map(k => `<option value="${k}">${L(k)}</option>`).join('')}</select>
  <textarea id="fe" rows="3" placeholder="Explanation (optional)"></textarea><button class="btn pri big" data-a="addQ">Add question</button><p id="fm" class="mu"></p>`)}
  ${win('Many at once', `<p class="mu">Paste JSON like <code>[{"s":"Anatomy","q":"…","o":["…","…","…","…"],"a":"B","e":"…"}]</code></p><textarea id="fj" rows="6"></textarea><div class="g2"><button class="btn" data-a="imp">Import</button><button class="btn" data-a="exportJ">Show mine as JSON</button></div><p id="jm" class="mu"></p>`)}
  ${msg ? `<p class="okmsg">${esc(msg)}</p>` : ''}
  ${win(`Your questions (${S.custom.length})`, S.custom.length ? S.custom.map(d => `<div class="hrow"><span class="mu">${esc(d.s)} · ${esc(d.q.slice(0, 48))}</span><button class="lk" data-a="del" data-v="${d.id}">Delete</button></div>`).join('') : '<p class="mu">Nothing yet.</p>')}</div>`;
  msg = ''; return out;
};
const changed = () => { saveBank(); rebuild(); H.init = false; go('add') };
A.addQ = () => {
  const raw = [0, 1, 2, 3].map(k => $('#fo' + k).value.trim()), keep = raw.map((t, k) => t ? k : -1).filter(k => k >= 0), v = $('#fa').value;
  const d = norm({ s: $('#fs').value, q: $('#fq').value, o: keep.map(k => raw[k]), a: v === '' ? -1 : keep.indexOf(+v), e: $('#fe').value });
  if (!d) { $('#fm').textContent = 'Needs a question, at least two options and the correct option.'; return }
  S.custom.push(d); msg = `Added to ${d.s}.`; changed();
};
A.imp = () => {
  let j; try { j = JSON.parse($('#fj').value) } catch (e) { $('#jm').textContent = 'That is not valid JSON.'; return }
  j = [].concat(j); const ok = j.map(norm).filter(Boolean); if (!ok.length) { $('#jm').textContent = 'No valid questions found.'; return }
  S.custom.push(...ok); msg = `Imported ${ok.length} of ${j.length}.`; changed();
};
A.exportJ = () => { $('#fj').value = JSON.stringify(S.custom.map(({ s, q, o, a, e }) => ({ s, q, o, a: L(a), e })), null, 1) };
A.del = id => { S.custom = S.custom.filter(d => d.id != id); changed() };
register('add', { html });
