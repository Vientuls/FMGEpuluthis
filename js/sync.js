// Cloud sync via Supabase REST (no SDK). Data lives in one table: user_data(user_id, profile, key, value, updated_at)
import cfg from '../config.js';
import { LS, LW, S, PR, me, hooks, loadProfile } from './store.js';
import { mergeFc } from './srs.js';

export const enabled = () => !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
const K = 'fmge_auth';
const getAuth = () => { try { return JSON.parse(localStorage.getItem(K)) } catch (e) { return null } };
const setAuth = a => { try { a ? localStorage.setItem(K, JSON.stringify(a)) : localStorage.removeItem(K) } catch (e) { } };
export const account = () => { const a = getAuth(); return a ? { email: a.email } : null };
export const status = { t: '', msg: '' };

// ---------- pure merge helpers (unit-tested) ----------
export function mergeHist(a, b) {
  const m = new Map(); [...(a || []), ...(b || [])].forEach(x => x && m.set(x.t, x));
  return [...m.values()].sort((p, q) => q.t - p.t).slice(0, 30);
}
export function mergeProf(a, b) {
  a = a || {}; b = b || {}; const o = { ...a };
  for (const k of ['xp', 'ans', 'ok', 'best', 'tests', 'streak']) o[k] = Math.max(a[k] || 0, b[k] || 0);
  o.day = [a.day || '', b.day || ''].sort().pop();
  o.b = [...new Set([...(a.b || []), ...(b.b || [])])];
  o.f = { ...(b.f || {}), ...(a.f || {}) };
  o.bm = { ...(b.bm || {}), ...(a.bm || {}) };
  o.qs = { ...(b.qs || {}), ...(a.qs || {}) };
  if (a.fc || b.fc) o.fc = mergeFc(a.fc, b.fc);          // flashcard schedule: newest review wins per card
  return o;
}

// ---------- REST ----------
async function req(path, opt = {}, auth) {
  const h = { apikey: cfg.SUPABASE_ANON_KEY, 'Content-Type': 'application/json', ...(opt.headers || {}) };
  if (auth) h.Authorization = 'Bearer ' + auth;
  const r = await fetch(cfg.SUPABASE_URL + path, { ...opt, headers: h });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null } catch (e) { }
  if (!r.ok) { const e = new Error((j && (j.msg || j.error_description || j.message || j.error)) || ('HTTP ' + r.status)); e.status = r.status; throw e }
  return j;
}
const keep = (j, email) => setAuth({ access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000 - 60000, email: email || (j.user && j.user.email), uid: j.user && j.user.id });

export async function signIn(email, pw) {
  const j = await req('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password: pw }) });
  keep(j, email); return syncNow();
}
export async function signUp(email, pw) {
  const j = await req('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password: pw }) });
  if (j && j.access_token) { keep(j, email); await syncNow(); return 'ok' }
  return 'confirm';                       // project requires email confirmation
}
export function signOut() { setAuth(null); status.msg = '' }
async function token() {
  let a = getAuth(); if (!a) throw new Error('Not signed in');
  if (Date.now() > a.exp) {
    const j = await req('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: a.refresh }) });
    keep(j, a.email); a = getAuth();
  }
  return a;
}

// ---------- sync ----------
const KEYS = ['bank', 'hist', 'prof', 'last'];
const metaK = () => 'fmge_sm_' + (me() ? me().id : '');
const getMeta = () => { try { return JSON.parse(localStorage.getItem(metaK())) || {} } catch (e) { return {} } };
const setMeta = m => { try { localStorage.setItem(metaK(), JSON.stringify(m)) } catch (e) { } };
let timer = 0, busy = false, again = false;

hooks.w = key => {                                  // local change -> schedule upload
  if (busy || !enabled() || !getAuth() || !me()) return;
  const m = getMeta(); m[key] = Date.now(); setMeta(m); clearTimeout(timer); timer = setTimeout(() => syncNow().catch(() => { }), 1800);
};

export async function syncNow() {
  if (!enabled() || !getAuth() || !me()) return;
  if (busy) { again = true; return } busy = true;
  try {
    const a = await token(), prof = me().n, meta = getMeta();
    const rows = await req(`/rest/v1/user_data?select=key,value,updated_at&profile=eq.${encodeURIComponent(prof)}`, {}, a.access);
    const remote = Object.fromEntries((rows || []).map(r => [r.key, r]));
    const up = [], now = new Date().toISOString();
    const local = { bank: S.custom, hist: S.hist, prof: PR, last: S.last };
    for (const k of KEYS) {
      const r = remote[k], lv = local[k], lt = meta[k] || 0, rt = r ? Date.parse(r.updated_at) : 0;
      let val = lv;
      if (!r) { if (lv == null || (Array.isArray(lv) && !lv.length)) continue; up.push(k) }
      else if (k == 'hist') { val = mergeHist(lv, r.value); if (JSON.stringify(val) != JSON.stringify(lv)) LW(k, val); if (JSON.stringify(val) != JSON.stringify(r.value)) up.push(k) }
      else if (k == 'prof') { val = mergeProf(lv, r.value); if (JSON.stringify(val) != JSON.stringify(lv)) LW(k, val); if (JSON.stringify(val) != JSON.stringify(r.value)) up.push(k) }
      else if (rt > lt) { LW(k, r.value) }               // bank / last: newest wins
      else if (lt > rt) up.push(k);
      local[k] = val;
    }
    if (up.length) {
      const body = up.map(k => ({ user_id: a.uid, profile: prof, key: k, value: (k == 'hist' ? local.hist : k == 'prof' ? local.prof : k == 'bank' ? S.custom : S.last) ?? null, updated_at: now }));
      await req('/rest/v1/user_data?on_conflict=user_id,profile,key', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(body) }, a.access);
    }
    const m2 = {}; KEYS.forEach(k => m2[k] = Date.now()); setMeta(m2);
    loadProfile(); status.t = Date.now(); status.msg = 'Synced';
    document.dispatchEvent(new CustomEvent('synced'));
  } catch (e) { status.msg = 'Sync failed: ' + e.message; throw e }
  finally { busy = false; if (again) { again = false; setTimeout(() => syncNow().catch(() => { }), 500) } }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && enabled() && getAuth()) syncNow().catch(() => { }) });
