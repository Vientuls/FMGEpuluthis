// Spaced repetition for flashcards (simple Leitner boxes, no dependencies).
// A card's state is a compact array: [box, dueDay, lastReviewedMs]. Cards you have never rated have no entry.
export const BOXES = 6;
export const GAP = [0, 0, 1, 3, 7, 14, 30];            // days until the next review, indexed by box (box 1 = "again")
export const RATINGS = ['Again', 'Good', 'Easy'];

// whole local-calendar-day number, so "due today" flips at the user's midnight
export const dayNo = (t = Date.now()) => Math.floor((t - new Date(t).getTimezoneOffset() * 6e4) / 864e5);

// r: 0 = again, 1 = good, 2 = easy  ->  the card's new state
export function rate(card, r, today = dayNo(), now = Date.now()) {
  const b = card ? card[0] : 0;
  const nb = r === 0 ? 1 : Math.min(BOXES, Math.max(b, 1) + (r === 2 ? 2 : 1));
  return [nb, today + GAP[nb], now];
}
// short label for the rating buttons ("soon", "1d", "7d" ...)
export function nextLabel(card, r) {
  if (r === 0) return 'soon';
  const g = GAP[rate(card, r)[0]];
  return g + 'd';
}

// split a list of ids into due / new / learned-but-not-due
export function split(ids, fc, today = dayNo()) {
  fc = fc || {}; const due = [], fresh = [], later = [];
  for (const id of ids) { const c = fc[id]; if (!c) fresh.push(id); else if (c[1] <= today) due.push(id); else later.push(id) }
  due.sort((a, b) => fc[a][1] - fc[b][1]);          // most overdue first
  later.sort((a, b) => fc[a][1] - fc[b][1]);        // soonest first
  return { due, fresh, later };
}
// a session = everything due first, then new cards, up to cap
export const pick = ({ due, fresh }, cap) => [...due, ...fresh].slice(0, cap);

// merge card progress from two devices: for each card keep the most recently reviewed state
export function mergeFc(a, b) {
  const o = { ...(b || {}) };
  for (const id in (a || {})) { if (!o[id] || (a[id][2] || 0) >= (o[id][2] || 0)) o[id] = a[id] }
  return o;
}
