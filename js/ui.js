// Small UI helpers + tiny event delegation (no framework needed)
export const $ = (s, r = document) => r.querySelector(s);
export const L = k => String.fromCharCode(65 + k);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmtT = s => `${s / 3600 | 0}:${String(s / 60 % 60 | 0).padStart(2, 0)}:${String(s % 60).padStart(2, 0)}`;
export const shuffle = a => { a = a.slice(); for (let i = a.length; i > 1;) { const j = Math.random() * i-- | 0;[a[i], a[j]] = [a[j], a[i]] } return a };

// click actions: <button data-a="name" data-v="arg">  ->  A.name(arg, el, event)
// input actions: <input data-i="name">                ->  I.name(el, event)
export const A = {}, I = {};
export function bindEvents() {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-a]');
    if (el && A[el.dataset.a]) { A[el.dataset.a](el.dataset.v, el, e) }
  });
  for (const t of ['input', 'change']) document.addEventListener(t, e => {
    const el = e.target.closest('[data-i]');
    if (!el || !I[el.dataset.i]) return;
    const w = el.dataset.on || 'input';
    if (w === t || (w === 'input' && t === 'input')) I[el.dataset.i](el, e);
  });
}

export function toast(m) {
  const e = document.createElement('div'); e.className = 'toast'; e.textContent = m;
  document.body.appendChild(e); setTimeout(() => e.remove(), 2300);
}

// ---- modal window (centered on desktop, bottom sheet on phones) ----
let MR = null;
export function openModal(title, render, opts = {}) {
  closeModal();
  const sc = document.createElement('div'); sc.id = 'modal'; sc.className = 'scrim';
  sc.addEventListener('click', e => { if (e.target === sc) closeModal() });
  document.body.appendChild(sc); document.body.classList.add('noscroll');
  MR = { title, render, opts }; paintModal();
}
export function paintModal() {
  const sc = $('#modal'); if (!sc || !MR) return;
  const keep = sc.querySelector('.win-b')?.scrollTop || 0;
  sc.innerHTML = `<section class="win modal ${MR.opts.wide ? 'wide' : ''}" role="dialog" aria-label="${esc(MR.title)}">
    <header class="win-h"><span class="dots"><i data-a="closeModal" title="Close"></i><i></i><i></i></span><h2>${esc(MR.title)}</h2><button class="x" data-a="closeModal" aria-label="Close">✕</button></header>
    <div class="win-b">${MR.render()}</div></section>`;
  const b = sc.querySelector('.win-b'); if (b) b.scrollTop = keep;
}
export function closeModal() { const m = $('#modal'); if (m) m.remove(); MR = null; document.body.classList.remove('noscroll') }
A.closeModal = closeModal;

// Window helper
export const win = (title, body, { act = '', cls = '', id = '' } = {}) =>
  `<section class="win ${cls}" ${id ? `id="${id}"` : ''}><header class="win-h"><span class="dots"><i></i><i></i><i></i></span><h2>${title}</h2><span class="win-act">${act}</span></header><div class="win-b">${body}</div></section>`;

// Click an image to enlarge it
A.zoom = (v, el) => {
  openModal('Image', () => `<img class="big" src="${esc(el.getAttribute('src'))}" alt="">`, { wide: true });
};
