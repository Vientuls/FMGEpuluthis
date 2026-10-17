import { bindEvents, $ } from './ui.js';
import { loadUI, applyUI } from './themes.js';
import { loadProfile, UL, me, signedInThisSession } from './store.js';
import { loadMeta } from './data.js';
import { go } from './router.js';
import { syncNow } from './sync.js';
import './views/home.js'; import './views/test.js'; import './views/result.js'; import './views/add.js'; import './views/who.js'; import './views/settings.js';

loadUI(); applyUI(); bindEvents();
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));

async function boot() {
  try { loadProfile(); await loadMeta() }
  catch (e) { $('#app').innerHTML = `<div class="center-col"><section class="win"><div class="win-b"><h2>Couldn’t load questions</h2><p class="mu">Check your connection and try again.</p><button class="btn pri big" onclick="location.reload()">Retry</button></div></section></div>`; return }
  const L = UL();
  if (!L.length || !me() || (L.length > 1 && !signedInThisSession())) await go('who');
  else { await go('home'); syncNow().then(() => go('home')).catch(() => { }) }
}
boot();
