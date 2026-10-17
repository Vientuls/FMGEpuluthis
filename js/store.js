// Local storage layer. Per-user keys are namespaced exactly like the old app: u<id>_fmge_<key>
export const MOCK = 'Pan India Mock 1 (300Q)', MINE = 'Added by me';
export const S = { custom: [], hist: [], R: null, last: null };
export const PR = {};
export const hooks = { w: null };            // sync listens here
const SYNCED = new Set(['bank', 'hist', 'prof', 'last']);
const prDefault = () => ({ xp: 0, ans: 0, ok: 0, best: 0, tests: 0, streak: 0, day: '', b: [], f: {}, snd: true, vib: true });
const raw = k => { try { return localStorage.getItem(k) } catch (e) { return null } };
const rawSet = (k, v) => { try { localStorage.setItem(k, v) } catch (e) { } };
const rawDel = k => { try { localStorage.removeItem(k) } catch (e) { } };

let UID = raw('fmge_active') || '';
export const uid = () => UID;
const PX = k => `u${UID}_fmge_${k}`;
export const LS = k => { try { return JSON.parse(localStorage.getItem(PX(k))) } catch (e) { return null } };
export const LW = (k, v) => { rawSet(PX(k), JSON.stringify(v)); if (hooks.w && SYNCED.has(k)) hooks.w(k) };

// ---- users on this device ----
export const AV = ['🧑‍⚕️', '👩‍⚕️', '🦊', '🐼', '🦉', '🐯', '🚀', '🌟', '🎧', '🍀', '🦄', '🐙'];
export const UL = () => { try { return (JSON.parse(raw('fmge_users')) || []).map(u => (u.n = (u.n || '').replace(/[^A-Za-z0-9]/g, '') || 'User', u)) } catch (e) { return [] } };
export const saveUL = l => rawSet('fmge_users', JSON.stringify(l));
export const me = () => UL().find(u => u.id == UID);

export function loadProfile() {
  S.custom = LS('bank') || []; S.custom.forEach(d => { d.z = MINE });
  S.hist = LS('hist') || []; S.R = LS('run'); S.last = LS('last');
  Object.keys(PR).forEach(k => delete PR[k]); Object.assign(PR, prDefault(), LS('prof') || {});
}
export function enter(id) {
  UID = id; rawSet('fmge_active', id);
  try { sessionStorage.setItem('fmge_in', '1') } catch (e) { }
  loadProfile();
}
export const signedInThisSession = () => { try { return sessionStorage.getItem('fmge_in') == '1' } catch (e) { return false } };
export function createUser(name, emoji) {
  const n = (name || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 20);
  if (n.length < 3) return { err: 'Use 3-20 letters or numbers only (no spaces or symbols)' };
  const L = UL(); if (L.some(u => u.n.toLowerCase() == n.toLowerCase())) return { err: 'That username is already taken here, try another' };
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5); L.push({ id, n, e: emoji }); saveUL(L);
  return { id };
}
export function deleteUser(i) {
  const L = UL(), u = L[i]; if (!u) return;
  ['bank', 'hist', 'run', 'last', 'prof'].forEach(k => rawDel(`u${u.id}_fmge_${k}`));
  L.splice(i, 1); saveUL(L); if (u.id == UID) { UID = ''; rawDel('fmge_active') }
}
export const userXP = id => { try { return (JSON.parse(raw(`u${id}_fmge_prof`)) || {}).xp || 0 } catch (e) { return 0 } };

export const saveRun = () => LW('run', S.R);
export const savePR = () => LW('prof', PR);
export const saveBank = () => LW('bank', S.custom);
export const saveHist = () => LW('hist', S.hist);
export const saveLast = () => LW('last', S.last);

// ---- backup / restore (for moving data between browsers without an account) ----
export const exportAll = () => JSON.stringify({ v: 1, bank: S.custom, hist: S.hist, prof: PR, last: S.last });
export function importAll(txt) {
  const j = JSON.parse(txt); if (!j || typeof j != 'object') throw 0;
  if (Array.isArray(j.bank)) LW('bank', j.bank); if (Array.isArray(j.hist)) LW('hist', j.hist);
  if (j.prof && typeof j.prof == 'object') LW('prof', j.prof); if (j.last) LW('last', j.last);
  loadProfile();
}
