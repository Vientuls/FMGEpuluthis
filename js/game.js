// XP, levels, badges, streaks, sound, confetti
import { PR, S, savePR } from './store.js';
import { byId, score } from './data.js';
import { toast, $ } from './ui.js';
export const TL = ['Intern', 'Resident', 'Registrar', 'Sr Resident', 'Consultant', 'Professor', 'Dean', 'Legend'];
export const BD = [['f1', '🩺', 'First test'], ['s10', '🔥', '10 in a row'], ['a100', '💯', '100 answered'], ['a1k', '🏅', '1000 answered'], ['ace', '🎯', '90%+ score'], ['sv', '🛡', '20 survived'], ['d3', '📅', '3-day streak'], ['d7', '🏆', '7-day streak']];
export const lv = x => Math.floor(Math.sqrt(Math.max(0, x || 0) / 40)) + 1;
export const rank = p => p >= 80 ? '🏆 Topper-level' : p >= 65 ? '🥇 Comfortable pass' : p >= 50 ? '🎯 In the pass zone' : p >= 35 ? '📈 Almost there' : '🌱 Warm-up round';
export const heroIdx = p => p <= 25 ? 0 : p <= 50 ? 1 : p <= 75 ? 2 : p <= 90 ? 3 : 4;

export function beep(ok) {
  try { if (PR.vib && navigator.vibrate) navigator.vibrate(ok ? 30 : [60, 40, 60]) } catch (e) { }
  if (!PR.snd) return;
  try {
    const c = beep.c = beep.c || new (window.AudioContext || window.webkitAudioContext)(), t = c.currentTime;
    (ok ? [660, 880] : [220, 160]).forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = ok ? 'sine' : 'sawtooth'; o.frequency.value = f;
      g.gain.setValueAtTime(.08, t + i * .1); g.gain.exponentialRampToValueAtTime(.001, t + i * .1 + .18);
      o.connect(g); g.connect(c.destination); o.start(t + i * .1); o.stop(t + i * .1 + .2);
    });
  } catch (e) { }
}
export function boom(n) {
  if (document.documentElement.dataset.motion === 'off') return;
  n = n || 50; let c = $('#cv'); if (!c) { c = document.createElement('canvas'); c.id = 'cv'; document.body.appendChild(c) }
  c.width = innerWidth; c.height = innerHeight; const x = c.getContext('2d'), st = getComputedStyle(document.documentElement);
  const cs = ['--acc', '--acc2', '--ok', '--mk'].map(v => st.getPropertyValue(v).trim());
  const ps = Array.from({ length: n }, () => ({ x: c.width / 2, y: c.height * .6, vx: (Math.random() - .5) * 12, vy: -Math.random() * 13 - 4, r: Math.random() * 6 + 3, c: cs[Math.random() * 4 | 0], a: 1 }));
  (function f() {
    x.clearRect(0, 0, c.width, c.height); let live = 0;
    ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .4; p.a -= .012; if (p.a > 0) { live++; x.globalAlpha = p.a; x.fillStyle = p.c; x.fillRect(p.x, p.y, p.r, p.r * 1.6) } });
    live ? requestAnimationFrame(f) : x.clearRect(0, 0, c.width, c.height);
  })();
}
function touch() {
  const t = new Date().toLocaleDateString('en-CA'), y = new Date(Date.now() - 864e5).toLocaleDateString('en-CA');
  if (PR.day != t) { PR.streak = PR.day == y ? PR.streak + 1 : 1; PR.day = t }
}
function chk() {
  const c = { f1: PR.tests >= 1, s10: PR.best >= 10, a100: PR.ans >= 100, a1k: PR.ans >= 1000, ace: PR.f.ace, sv: PR.f.sv, d3: PR.streak >= 3, d7: PR.streak >= 7 }, nb = [];
  BD.forEach(([k, e, n]) => { if (c[k] && !PR.b.includes(k)) { PR.b.push(k); nb.push(e); toast(e + ' Badge: ' + n) } });
  return nb;
}
function gain(g) { const a = lv(PR.xp); PR.xp += g; if (lv(PR.xp) > a) { toast('⬆️ Level ' + lv(PR.xp) + '!'); boom(80) } }

// called when an answer is picked in practice/survival mode
export function fx(R, id, k) {
  if (R.mode != 'practice') return; const d = byId(id), c = k == d.a; touch();
  (PR.qs = PR.qs || {})[id] = c ? 1 : 2;
  if (c) { R.combo = (R.combo || 0) + 1; const g = 10 * Math.min(5, 1 + (R.combo / 3 | 0)); R.gx = (R.gx || 0) + g; gain(g); R.ev = 1; PR.ok++ }
  else { R.combo = 0; R.ev = 2; if (R.sv) R.lives = Math.max(0, R.lives - 1) }
  PR.ans++; PR.best = Math.max(PR.best, R.combo || 0); chk(); savePR();
}
// after the screen repainted: sound / confetti / game over
export function post(R, onDead) {
  const e = R && R.ev; if (!e) return; R.ev = 0;
  if (e == 1) { beep(1); boom(R.combo >= 5 ? 90 : 35); if (R.combo > 1 && R.combo % 3 == 0) toast('🔥 ' + R.combo + ' in a row!') }
  else { beep(0); if (R.sv && !R.lives) { toast('💀 Out of lives'); setTimeout(onDead, 1600) } }
}
export function award(r) {
  PR.qs = PR.qs || {};
  r.ids.forEach(id => { const d = byId(id); if (r.ans[id] != null && d) PR.qs[id] = r.ans[id] == d.a ? 1 : 2 });
  const x = score(r), p = x.n ? x.c / x.n : 0, l1 = lv(r.x0 != null ? r.x0 : PR.xp);
  touch(); PR.tests++; if (p >= .9 && x.n >= 5) PR.f.ace = 1; if (r.sv && x.c >= 20) PR.f.sv = 1;
  const g = x.c * 5 + 20 + (p >= .8 && x.n >= 5 ? 50 : 0); gain(g); const nb = chk();
  r.gain = { xp: g + (r.gx || 0), l1, l2: lv(PR.xp), nb }; savePR();
}
