// Themes + appearance preferences (per device, saved in localStorage 'fmge_ui')
const dark = { ink: '#eef2ff', mu: 'rgba(226,232,255,.62)', line: 'rgba(255,255,255,.09)', edge: 'rgba(255,255,255,.14)', hi: 'rgba(255,255,255,.22)', gloss: 'rgba(255,255,255,.07)', sh: 'rgba(0,0,0,.55)', fld: 'rgba(0,0,0,.24)', ok: '#4ade80', bad: '#fb7185', mk: '#fbbf24', a1: .085, a2: .035 };
const light = { ink: '#172036', mu: 'rgba(23,32,54,.62)', line: 'rgba(23,32,54,.1)', edge: 'rgba(255,255,255,.9)', hi: '#fff', gloss: 'rgba(255,255,255,.55)', sh: 'rgba(50,70,120,.30)', fld: 'rgba(255,255,255,.65)', ok: '#15803d', bad: '#be123c', mk: '#b45309', a1: .74, a2: .44 };
export const THEMES = {
  aurora: { n: 'Aurora', d: 1, bg: ['#080d1c', '#101a36'], bl: ['#5b6cff', '#22d3ee', '#a855f7'], acc: '#7c9cff', acc2: '#22d3ee', onacc: '#07101f' },
  frost: { n: 'Frost', d: 0, bg: ['#e9f0fb', '#f6f1ff'], bl: ['#8ab8ff', '#c4b5fd', '#99f6e4'], acc: '#2563eb', acc2: '#06b6d4', onacc: '#fff' },
  ocean: { n: 'Ocean', d: 1, bg: ['#04141a', '#082a33'], bl: ['#0ea5a4', '#2563eb', '#22d3ee'], acc: '#2dd4bf', acc2: '#38bdf8', onacc: '#032226' },
  neon: { n: 'Neon', d: 1, bg: ['#06060d', '#12081f'], bl: ['#00f5d4', '#ff2e63', '#7c3aed'], acc: '#00f5d4', acc2: '#a78bfa', onacc: '#02110e', ok: '#39ff14', bad: '#ff2e63' },
  forest: { n: 'Forest', d: 1, bg: ['#07120c', '#0e2216'], bl: ['#22c55e', '#14b8a6', '#a3e635'], acc: '#4ade80', acc2: '#a3e635', onacc: '#04140a' },
  sakura: { n: 'Sakura', d: 0, bg: ['#fff0f5', '#fff6ee'], bl: ['#ffa6c1', '#ffd0a6', '#dcbcff'], acc: '#e0457b', acc2: '#fb7185', onacc: '#fff' },
  sunset: { n: 'Sunset', d: 0, bg: ['#fff1e4', '#ffe8ef'], bl: ['#ffad70', '#ff7aa8', '#ffd37a'], acc: '#ea580c', acc2: '#f43f5e', onacc: '#fff' },
  graphite: { n: 'Graphite', d: 1, bg: ['#0e0f12', '#17191e'], bl: ['#475569', '#334155', '#64748b'], acc: '#e5e7eb', acc2: '#94a3b8', onacc: '#0e0f12', blob: .3 },
  paper: { n: 'Paper', d: 0, bg: ['#f5f3ec', '#efece2'], bl: ['#e7dcc2', '#d9e4d6', '#e8d6d0'], acc: '#1f2937', acc2: '#475569', onacc: '#fff', blob: .5 }
};
export const KEYS = Object.keys(THEMES);
export const DEF = { theme: 'auto', glass: 2, size: 1, qfont: 'serif', round: 1, motion: 1 };
export const ui = { ...DEF };
const SIZES = ['15px', '16px', '17.5px', '19px'], RADII = ['8px', '16px', '24px'];

export function loadUI() {
  let u = null; try { u = JSON.parse(localStorage.getItem('fmge_ui')) } catch (e) { }
  Object.assign(ui, DEF, u || {});
  if (!THEMES[ui.theme] && ui.theme !== 'auto') ui.theme = 'auto';
}
export function saveUI() { try { localStorage.setItem('fmge_ui', JSON.stringify(ui)) } catch (e) { } }

export const resolve = () => ui.theme === 'auto'
  ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'aurora' : 'frost') : ui.theme;

export function applyUI() {
  const k = resolve(), t = THEMES[k], base = t.d ? dark : light, r = document.documentElement.style;
  const P = { ...base, ...t }, g = ui.glass;      // 0 solid, 1 soft, 2 rich
  const m = g === 1 ? 1.45 : 1, al = x => Math.min(.96, x * m).toFixed(3);
  const tint = t.d ? '255,255,255' : '255,255,255';
  const set = (n, v) => r.setProperty('--' + n, v);
  set('bg0', t.bg[0]); set('bg1', t.bg[1]);
  set('b1', t.bl[0]); set('b2', t.bl[1]); set('b3', t.bl[2]); set('blob', t.blob ?? (t.d ? .55 : .8));
  ['ink', 'mu', 'line', 'edge', 'hi', 'sh', 'fld', 'ok', 'bad', 'mk'].forEach(n => set(n, P[n]));
  set('acc', t.acc); set('acc2', t.acc2); set('onacc', t.onacc);
  if (g === 0) {
    const solid = t.d ? `color-mix(in srgb,${t.bg[1]} 84%,#fff)` : '#ffffff';
    set('g1', solid); set('g2', solid); set('gloss', 'transparent'); set('blur', '0px');
  } else {
    set('g1', `rgba(${tint},${al(P.a1)})`); set('g2', `rgba(${tint},${al(P.a2)})`); set('gloss', P.gloss);
    set('blur', g === 1 ? '10px' : '22px');
  }
  set('fs', SIZES[ui.size]); set('r', RADII[ui.round]);
  set('qf', ui.qfont === 'serif' ? "Georgia,'Iowan Old Style','Source Serif 4',Cambria,serif" : "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif");
  const h = document.documentElement; h.style.colorScheme = t.d ? 'dark' : 'light';
  h.dataset.motion = ui.motion ? 'on' : 'off'; h.dataset.dark = t.d ? '1' : '0';
  const mt = document.querySelector('meta[name=theme-color]'); if (mt) mt.content = t.bg[0];
}
export function setUI(k, v) { ui[k] = v; saveUI(); applyUI() }
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => ui.theme === 'auto' && applyUI());
