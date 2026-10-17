import { A, I, $, esc, win } from '../ui.js';
import { register, go } from '../router.js';
import { UL, AV, createUser, deleteUser, enter, userXP } from '../store.js';
import { lv } from '../game.js';
import { rebuild } from '../data.js';
import { H } from '../state.js';
import { syncNow } from '../sync.js';

let avSel = 0, mk = false;
const html = () => {
  const L = UL(), make = mk || !L.length; const first = !L.length;
  const brand = `<div class="center-brand"><span class="logo lg">✚</span><h1>${first ? 'Welcome' : make ? 'New user' : 'Who’s studying?'}</h1><p class="mu">${make ? 'Pick a name and an avatar. XP, streaks, badges and history are saved under it on this device (and synced if you sign in).' : 'Everyone gets their own XP, streak, badges, history and added questions.'}</p></div>`;
  if (!make) return `<div class="center-col">${brand}${L.map((u, i) => `<div class="win urow"><button class="urow-b" data-a="pickU" data-v="${i}"><span class="av">${u.e}</span><span class="grow"><b>${esc(u.n)}</b><small class="mu">Lv ${lv(userXP(u.id))} · ${userXP(u.id)} XP</small></span></button><button class="btn sm" data-a="delU" data-v="${i}">✕</button></div>`).join('')}<button class="btn pri big" data-a="newU">＋ New user</button></div>`;
  return `<div class="center-col">${brand}${win('Profile', `<label class="field"><span>Your name</span><input id="un" maxlength="20" placeholder="Letters and numbers only" autocomplete="off" autocapitalize="off" spellcheck="false" data-i="un"></label>
  <div class="avs">${AV.map((e, i) => `<button class="th${i == avSel ? ' on' : ''}" data-a="pickAv" data-v="${i}">${e}</button>`).join('')}</div><p id="um" class="mu"></p>
  <button class="btn pri big" data-a="mkUser">Let’s go 🚀</button>`)}${L.length ? `<button class="btn big" data-a="whoBack">‹ Back</button>` : ''}</div>`;
};
I.un = el => { el.value = el.value.replace(/[^A-Za-z0-9]/g, '') };
document.addEventListener('keydown', e => { if (e.key == 'Enter' && e.target.id == 'un') A.mkUser() });
async function pick(id) { enter(id); H.init = false; H.cnt = H.mins = ''; rebuild(); await go('home'); syncNow().then(() => go('home')).catch(() => { }) }
A.pickU = i => pick(UL()[+i].id);
A.newU = () => { mk = true; go('who') };
A.whoBack = () => { mk = false; go('who') };
A.pickAv = i => { avSel = +i; const v = $('#un') ? $('#un').value : ''; go('who').then(() => { $('#un').value = v }) };
A.delU = (i, el) => { if (!el.dataset.c) { el.dataset.c = 1; el.textContent = 'Sure?'; return } deleteUser(+i); go('who') };
A.mkUser = () => { const r = createUser($('#un').value, AV[avSel]); if (r.err) { $('#um').textContent = r.err; return } mk = false; pick(r.id) };
register('who', { html });
