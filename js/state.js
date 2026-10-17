// UI selection state that lives only while the app is open
export const H = { ss: {}, f: 'all', mode: 'exam', cnt: '', mins: '', shuf: false, nm: '', init: false };
export const V = { sub: '', bad: false };
import { pooled } from './data.js';
export function qn() { const p = pooled(H).length, c = Math.floor(+H.cnt); return c >= 1 ? Math.min(c, p) : p }
