import { A, I, $, esc, openModal, paintModal, toast } from '../ui.js';
import { ui, setUI, THEMES, KEYS, resolve } from '../themes.js';
import { PR, savePR, exportAll, importAll } from '../store.js';
import { rerender } from '../router.js';
import * as sync from '../sync.js';

let tab = 'look', busy = false, err = '';
const seg = (key, opts) => `<div class="seg">${opts.map(([v, t]) => `<button class="${ui[key] == v ? 'on' : ''}" data-a="ui" data-v="${key}:${v}">${t}</button>`).join('')}</div>`;
const swatch = k => {
  const t = THEMES[k]; return `<button class="sw${ui.theme == k ? ' on' : ''}" data-a="ui" data-v="theme:${k}" aria-label="${t.n}"><span class="sw-p" style="background:linear-gradient(150deg,${t.bg[0]},${t.bg[1]})"><i style="background:${t.bl[0]}"></i><i style="background:${t.bl[1]}"></i><i style="background:linear-gradient(135deg,${t.acc},${t.acc2})"></i></span><b>${t.n}</b></button>`;
};
const look = () => `
  <h3 class="sec">Theme</h3>
  <div class="swg"><button class="sw${ui.theme == 'auto' ? ' on' : ''}" data-a="ui" data-v="theme:auto"><span class="sw-p auto"><i></i></span><b>Auto</b></button>${KEYS.map(swatch).join('')}</div>
  <h3 class="sec">Surface</h3>
  <div class="opt-row"><span>Glass effect<small>Solid is fastest on older phones</small></span>${seg('glass', [[0, 'Solid'], [1, 'Soft'], [2, 'Rich']])}</div>
  <div class="opt-row"><span>Corners</span>${seg('round', [[0, 'Sharp'], [1, 'Round'], [2, 'Soft']])}</div>
  <h3 class="sec">Reading</h3>
  <div class="opt-row"><span>Text size</span>${seg('size', [[0, 'S'], [1, 'M'], [2, 'L'], [3, 'XL']])}</div>
  <div class="opt-row"><span>Question font</span>${seg('qfont', [['serif', 'Serif'], ['sans', 'Sans']])}</div>
  <div class="opt-row"><span>Animations</span>${seg('motion', [[1, 'On'], [0, 'Reduced']])}</div>
  <h3 class="sec">Feedback</h3>
  <div class="opt-row"><span>Sound</span><label class="tog sm"><input type="checkbox" ${PR.snd ? 'checked' : ''} data-i="snd" data-on="change"><i></i></label></div>
  <div class="opt-row"><span>Vibration</span><label class="tog sm"><input type="checkbox" ${PR.vib ? 'checked' : ''} data-i="vib" data-on="change"><i></i></label></div>`;

const cloud = () => {
  if (!sync.enabled()) return `<div class="note"><b>Cloud sync is not set up yet.</b><p class="mu">Your progress is saved in this browser only. To sync phone ↔ laptop, follow “Sync across devices” in the README (about 5 minutes, free), then paste your Supabase URL and key into <code>config.js</code>.</p></div>`;
  const a = sync.account();
  if (a) return `<div class="note ok"><b>Signed in</b><p class="mu">${esc(a.email)}</p><p class="mu">${esc(sync.status.msg || 'Ready')}${sync.status.t ? ' · ' + new Date(sync.status.t).toLocaleTimeString() : ''}</p></div>
    <p class="mu">Progress, bookmarks, history and your own questions sync under your local user name. Use the same name on another device to get the same data.</p>
    <div class="g2"><button class="btn pri" data-a="syncNow" ${busy ? 'disabled' : ''}>${busy ? 'Syncing…' : '⟳ Sync now'}</button><button class="btn" data-a="signOut">Sign out</button></div>`;
  return `<p class="mu">Sign in to keep progress on all your devices.</p>
    <label class="field"><span>Email</span><input id="se" type="email" autocomplete="email"></label>
    <label class="field"><span>Password</span><input id="sp" type="password" autocomplete="current-password" minlength="6"></label>
    ${err ? `<p class="errmsg">${esc(err)}</p>` : ''}
    <div class="g2"><button class="btn pri" data-a="signIn" ${busy ? 'disabled' : ''}>Sign in</button><button class="btn" data-a="signUp" ${busy ? 'disabled' : ''}>Create account</button></div>`;
};
const data = () => `<p class="mu">A backup file lets you move your progress between browsers without an account.</p>
  <div class="g2"><button class="btn" data-a="bkExport">Show backup</button><button class="btn" data-a="bkImport">Restore from box</button></div>
  <textarea id="bk" rows="6" placeholder="Backup text appears here. Paste a backup here to restore."></textarea><p id="bkm" class="mu"></p>`;

const render = () => `<div class="tabs">${[['look', 'Appearance'], ['cloud', 'Sync'], ['data', 'Backup']].map(([k, t]) => `<button class="${tab == k ? 'on' : ''}" data-a="tab" data-v="${k}">${t}</button>`).join('')}</div>${tab == 'look' ? look() : tab == 'cloud' ? cloud() : data()}`;
export function openSettings(t) { tab = t || tab; openModal('Settings', render, { wide: true }) }
A.tab = v => { tab = v; err = ''; paintModal() };
A.ui = v => { const [k, val] = v.split(':'); setUI(k, k == 'theme' || k == 'qfont' ? val : +val); paintModal() };
I.snd = el => { PR.snd = el.checked; savePR() };
I.vib = el => { PR.vib = el.checked; savePR(); if (el.checked && navigator.vibrate) navigator.vibrate(20) };
const run = async fn => { busy = true; err = ''; paintModal(); try { await fn() } catch (e) { err = e.message || 'Something went wrong' } busy = false; paintModal(); rerender() };
A.signIn = () => run(() => sync.signIn($('#se').value.trim(), $('#sp').value));
A.signUp = () => run(async () => { const r = await sync.signUp($('#se').value.trim(), $('#sp').value); if (r == 'confirm') { err = 'Check your email to confirm, then sign in.' } });
A.syncNow = () => run(() => sync.syncNow());
A.signOut = () => { sync.signOut(); paintModal() };
A.bkExport = () => { $('#bk').value = exportAll(); $('#bk').select() };
A.bkImport = () => { try { importAll($('#bk').value); $('#bkm').textContent = 'Restored.'; rerender() } catch (e) { $('#bkm').textContent = 'That does not look like a valid backup.' } };
document.addEventListener('synced', () => { if ($('#modal') && tab == 'cloud') paintModal() });
