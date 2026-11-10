/* wb-agent-deck-v2 · PPT 式分页交互（无依赖、无 API、可离线） */
(function () {
  var deck = document.querySelector('.deck');
  if (!deck) return;
  var slides = Array.prototype.slice.call(deck.querySelectorAll('.slide'));
  if (!slides.length) return;
  document.body.classList.add('deck-ready');

  var prev = document.getElementById('deckPrev');
  var next = document.getElementById('deckNext');
  var count = document.getElementById('deckCount');
  var fill = document.getElementById('deckFill');
  var sel = document.getElementById('deckSelect');
  var all = document.getElementById('deckAll');
  var stage = document.getElementById('deckStage');
  var tip = document.getElementById('deckTip');
  var n = slides.length, i = 0, allMode = false;

  slides.forEach(function (s, k) {
    var label = (k + 1) + '. ' + (s.getAttribute('data-title') || ('第 ' + (k + 1) + ' 页'));
    var o = document.createElement('option');
    o.value = String(k); o.textContent = label;
    if (sel) sel.appendChild(o);
  });

  function setHash(k) {
    try { history.replaceState(null, '', '#p' + (k + 1)); } catch (e) { /* file:// 下忽略 */ }
  }
  function show(k, hash) {
    if (allMode) return;
    i = Math.max(0, Math.min(n - 1, k));
    slides.forEach(function (s, j) {
      var on = j === i;
      s.classList.toggle('active', on);
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    if (prev) prev.disabled = (i === 0);
    if (next) next.disabled = (i === n - 1);
    if (count) count.textContent = (i + 1) + ' / ' + n;
    if (fill) fill.style.width = Math.round((i + 1) / n * 100) + '%';
    if (sel) sel.value = String(i);
    if (tip) tip.setAttribute('aria-label', slides[i].getAttribute('data-chapter') || '');
    if (stage) stage.scrollTop = 0;
    var active = slides[i].querySelector('.slide-kicker');
    if (active) deck.setAttribute('data-current', active.textContent);
    if (hash !== false) setHash(i);
    window.scrollTo({ top: Math.max(0, deck.getBoundingClientRect().top + window.pageYOffset - 12), behavior: 'smooth' });
  }
  function toggleAll() {
    allMode = !allMode;
    document.body.classList.toggle('deck-all', allMode);
    if (prev) prev.disabled = allMode;
    if (next) next.disabled = allMode;
    if (sel) sel.disabled = allMode;
    if (all) all.textContent = allMode ? '返回分页' : '全文模式';
    if (count) count.textContent = allMode ? ('共 ' + n + ' 页') : (i + 1) + ' / ' + n;
    if (fill) fill.style.width = allMode ? '100%' : Math.round((i + 1) / n * 100) + '%';
    if (!allMode) show(i, false);
  }

  if (prev) prev.addEventListener('click', function () { show(i - 1); });
  if (next) next.addEventListener('click', function () { show(i + 1); });
  if (sel) sel.addEventListener('change', function () { show(parseInt(sel.value, 10) || 0); });
  if (all) all.addEventListener('click', toggleAll);

  document.addEventListener('keydown', function (e) {
    if (allMode) return;
    var t = e.target || {};
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter') { e.preventDefault(); show(i + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); show(i - 1); }
    else if (k === 'Home') { e.preventDefault(); show(0); }
    else if (k === 'End') { e.preventDefault(); show(n - 1); }
  });

  var x0 = null;
  if (stage) {
    stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (x0 === null || allMode) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 60) show(i + (dx < 0 ? 1 : -1));
      x0 = null;
    }, { passive: true });
  }

  var m = /^#p(\d+)$/.exec(location.hash || '');
  show(m ? Math.min(n - 1, Math.max(0, parseInt(m[1], 10) - 1)) : 0, false);
  window.addEventListener('hashchange', function () {
    var h = /^#p(\d+)$/.exec(location.hash || '');
    if (h) show(parseInt(h[1], 10) - 1, false);
  });
  window.__deck = { show: show, count: n, all: toggleAll };
})();
