// Tiny screen router. Views register themselves: register('home', {html, after, ids})
import { $ } from './ui.js';
import { ensure } from './data.js';
const V = {};
export const register = (name, v) => { V[name] = v };
export let screen = '';
export async function go(s, opt) {
  const v = V[s]; if (!v) return;
  const tok = go.tok = (go.tok || 0) + 1;
  const ids = v.ids && v.ids(); if (ids && ids.length) { try { await ensure(ids) } catch (e) { console.warn(e) } }
  if (tok !== go.tok) return;           // a newer navigation won
  if (v.guard) { const g = v.guard(); if (g) return go(g) }
  screen = s; const app = $('#app'); app.dataset.s = s;
  app.innerHTML = v.html(opt);
  scrollTo(0, 0);
  v.after && v.after(opt);
  document.dispatchEvent(new CustomEvent('screen', { detail: s }));
}
export const rerender = () => go(screen);
// repaint without scrolling to top (used for small in-place updates)
export function repaint() {
  const v = V[screen]; if (!v) return; const y = scrollY;
  $('#app').innerHTML = v.html(); v.after && v.after(); scrollTo(0, y);
}
