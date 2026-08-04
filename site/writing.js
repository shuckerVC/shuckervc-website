/* ============================================================
   shuckerVC — Writing page (archive + in-site reader)
   Reads the same Notion-synced feed as the homepage (insights.json).
   ============================================================ */
(function () {
  'use strict';

  var TAGS = ['All', 'White paper', 'Perspective', 'News', 'Newsletter'];
  var TC = {
    'White paper': { solidBg: '#ffc009', solidFg: '#111111' },
    'Perspective': { solidBg: '#33a08f', solidFg: '#ffffff' },
    'News': { solidBg: '#111111', solidFg: '#ffffff' },
    'Newsletter': { solidBg: '#3f5b7c', solidFg: '#ffffff' }
  };

  var POSTS = [];
  var PRESS = {};
  // A light brand tint per outlet — used for the thumbnail accent + badge so each
  // mention nods to the source's brand. Falls back to shuckerVC gold.
  var BRAND = {
    'TechCrunch': '#00A550', 'VentureBeat': '#C8102E', 'Forbes': '#141414',
    'Crunchbase': '#146AFF', 'Business Wire': '#0B5CAB', 'GlobeNewswire': '#0A66C2',
    'Yahoo Finance': '#5F01D1', 'Dealroom': '#E6005C', 'Qorvo': '#0091DA',
    'GGBA Switzerland': '#D8232A', 'New York Business Journal': '#10508C',
    'citybiz': '#111111', 'Algorized': '#00b49b', 'The Next Web': '#ff5c35',
    'Liftoff with Keith Newman': '#c8102e', '1Mby1M': '#0b5cab'
  };
  var CO_NAME = { shuckervc: 'shuckerVC', cascade: 'Cascade', brev: 'Brev.io', algorized: 'Algorized', lodg: 'Lodg' };
  var state = { filter: 'All', sortDir: 'desc', openId: null, press: false };

  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function badge(tag, size) {
    var c = TC[tag] || TC.News;
    var h = size === 'mini' ? 24 : 28, fs = size === 'mini' ? 10 : 11, pad = size === 'mini' ? 11 : 13;
    return '<span style="display:inline-flex;align-items:center;height:' + h + 'px;padding:0 ' + pad + 'px;border-radius:999px;background:' + c.solidBg + ';color:' + c.solidFg + ';font-size:' + fs + 'px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">' + esc(tag) + '</span>';
  }
  function cover(p, posClass) {
    if (p.cover) return '<div class="wr-cover"><img src="' + esc(p.cover) + '" alt="" loading="lazy"></div>';
    return '<div class="wr-cover wr-cover--empty" data-mark="sV"></div>';
  }

  function sorted() {
    var list = POSTS.filter(function (p) { return state.filter === 'All' || p.tag === state.filter; });
    return list.sort(function (a, b) { return state.sortDir === 'desc' ? b.sort - a.sort : a.sort - b.sort; });
  }

  /* ---------- ARCHIVE ---------- */
  function renderArchive() {
    $('archiveView').hidden = false;
    $('readerView').hidden = true;

    // chips
    var chips = $('wrChips');
    chips.innerHTML = '';
    TAGS.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (t === state.filter ? ' is-active' : '');
      b.textContent = t;
      b.addEventListener('click', function () { state.filter = t; state.press = false; renderArchive(); });
      chips.appendChild(b);
    });

    // "In the news" mode: show portfolio press mentions instead of the archive.
    var pt = $('wrPressToggle');
    if (pt) { pt.classList.toggle('is-active', state.press); pt.setAttribute('aria-pressed', state.press ? 'true' : 'false'); }
    if (state.press) {
      $('wrFeat').innerHTML = '';
      $('wrGrid').innerHTML = '';
      $('wrEmpty').hidden = true;
      $('wrPress').hidden = false;
      renderPress();
      var tot = pressTotal();
      $('wrCount').textContent = tot + (tot === 1 ? ' mention' : ' mentions');
      $('wrSort').style.display = 'none';
      return;
    }
    $('wrPress').hidden = true;
    $('wrSort').style.display = '';

    var list = sorted();
    var n = list.length;
    $('wrCount').textContent = n + (n === 1 ? ' piece' : ' pieces');

    var sortBtn = $('wrSort');
    sortBtn.innerHTML = '<span class="wr-sort-arrow">' + (state.sortDir === 'desc' ? '↓' : '↑') + '</span>' + (state.sortDir === 'desc' ? 'Newest first' : 'Oldest first');
    sortBtn.onclick = function () { state.sortDir = state.sortDir === 'desc' ? 'asc' : 'desc'; renderArchive(); };

    // featured
    var featWrap = $('wrFeat');
    var feat = list[0];
    if (feat) {
      featWrap.innerHTML =
        '<div class="wr-feat" data-open="' + esc(feat.id) + '">' +
          '<div class="wr-feat-inner">' +
            '<div class="wr-feat-media">' + cover(feat) + '<span class="wr-badge-pos">' + badge(feat.tag) + '</span></div>' +
            '<div class="wr-feat-body">' +
              '<span class="wr-feat-kicker">Latest · ' + esc(feat.read) + '</span>' +
              '<h2 class="wr-feattitle">' + esc(feat.title) + '</h2>' +
              '<p class="wr-feat-excerpt">' + esc(feat.excerpt) + '</p>' +
              '<div class="wr-feat-author"><span class="ins-initials">' + esc(feat.initials) + '</span>' +
                '<span style="font-size:13px;color:#6f6a61;"><b style="color:#2a2a2a;">' + esc(feat.author) + '</b> · ' + esc(feat.date) + '</span></div>' +
              '<span class="wr-feat-read">Read article <span>→</span></span>' +
            '</div>' +
          '</div>' +
        '</div>';
    } else { featWrap.innerHTML = ''; }

    // grid
    var grid = $('wrGrid');
    grid.innerHTML = list.slice(1).map(function (p) {
      return '<div class="wr-card" data-open="' + esc(p.id) + '">' +
          '<div class="wr-card-media">' + cover(p) + '<span class="wr-badge-pos">' + badge(p.tag) + '</span></div>' +
          '<div class="wr-card-body">' +
            '<div class="wr-card-top"><h3 class="wr-cardtitle">' + esc(p.title) + '</h3><span class="wr-arrow">→</span></div>' +
            '<p class="wr-card-excerpt">' + esc(p.excerpt) + '</p>' +
            '<div class="wr-card-meta"><span><b>' + esc(p.author) + '</b> · ' + esc(p.date) + '</span><span class="wr-card-read">' + esc(p.read) + '</span></div>' +
          '</div>' +
        '</div>';
    }).join('');

    $('wrEmpty').hidden = n !== 0;

    [featWrap, grid].forEach(function (root) {
      [].slice.call(root.querySelectorAll('[data-open]')).forEach(function (el) {
        el.addEventListener('click', function () { open(el.getAttribute('data-open')); });
      });
    });
  }

  /* ---------- READER ---------- */
  function bodyHTML(blocks) {
    return (blocks || []).map(function (b) {
      if (b.t === 'h') return '<h2>' + esc(b.text) + '</h2>';
      if (b.t === 'q') return '<blockquote>' + esc(b.text) + '</blockquote>';
      return '<p class="body">' + esc(b.text) + '</p>';
    }).join('');
  }

  function renderReader(post) {
    $('archiveView').hidden = true;
    $('readerView').hidden = false;
    $('wrBarRead').textContent = post.read || '';

    var authorMeta = '<b>' + esc(post.author) + '</b> · ' + esc(post.date);
    $('wrArticle').innerHTML =
      badge(post.tag) +
      '<h1 class="wr-article-title">' + esc(post.title) + '</h1>' +
      '<div class="wr-article-author"><span class="ins-initials">' + esc(post.initials) + '</span><span class="meta">' + authorMeta + '</span></div>' +
      '<div class="wr-article-cover">' + cover(post) + '</div>' +
      '<p class="wr-lead">' + esc(post.excerpt) + '</p>' +
      bodyHTML(post.body) +
      '<div class="wr-article-foot"><span class="ins-initials">' + esc(post.initials) + '</span><span class="meta">' + authorMeta + ' · ' + esc(post.read) + '</span></div>';

    // "In the news" preview carousel for this company (if any press exists)
    renderNews(post);

    // carousel of other posts
    var others = POSTS.filter(function (p) { return p.id !== post.id; });
    var rail = $('wrRail');
    rail.innerHTML = others.map(function (p) {
      return '<div class="wr-mini" data-open="' + esc(p.id) + '">' +
          '<div class="wr-mini-media">' + cover(p) + '<span class="wr-badge-pos">' + badge(p.tag, 'mini') + '</span></div>' +
          '<div class="wr-mini-body"><h4 class="wr-minititle">' + esc(p.title) + '</h4>' +
            '<div class="wr-mini-meta"><span><b>' + esc(p.author) + '</b> · ' + esc(p.date) + '</span><span class="wr-mini-read">' + esc(p.read) + '</span></div>' +
          '</div></div>';
    }).join('');
    [].slice.call(rail.querySelectorAll('[data-open]')).forEach(function (el) {
      el.addEventListener('click', function () { open(el.getAttribute('data-open')); });
    });
  }

  function pressCardHTML(m) {
    var host = (m.url.split('/')[2] || '').replace(/^www\./, '');
    var rest = m.url.replace(/^https?:\/\/[^/]+/, '');
    var disp = host + rest; if (disp.length > 46) disp = disp.slice(0, 46) + '…';
    var brand = BRAND[m.outlet] || 'var(--gold-500)';
    var thumb = m.image
      ? '<div class="wr-news-thumb" style="background-image:url(\'' + esc(m.image) + '\')">' +
          '<span class="wr-news-badge" style="background:' + brand + '">' + esc(m.outlet) + '</span>' +
          (m.credit ? '<span class="wr-news-credit">© ' + esc(m.credit) + '</span>' : '') +
        '</div>'
      : '<div class="wr-news-thumb wr-news-thumb--ph" style="border-right-color:' + brand + '">' +
          '<span class="wr-news-thumb-eyebrow">In the news</span>' +
          '<span class="wr-news-thumb-outlet">' + esc(m.outlet) + '</span>' +
          '<span class="wr-news-thumb-foot">shuckerVC</span>' +
        '</div>';
    return '<a class="wr-news-card" href="' + esc(m.url) + '" target="_blank" rel="noopener">' +
        thumb +
        '<div class="wr-news-info">' +
          '<span class="wr-news-outlet">' + esc(m.outlet) + '</span>' +
          '<h4 class="wr-news-title">' + esc(m.title) + '</h4>' +
          (m.desc ? '<p class="wr-news-desc">' + esc(m.desc) + '</p>' : '') +
          '<span class="wr-news-url">' + esc(disp) + (m.credit ? ' · Photo: ' + esc(m.credit) : '') + '</span>' +
        '</div>' +
      '</a>';
  }

  function renderNews(post) {
    var sec = $('wrNews'), rail = $('wrNewsRail');
    if (!sec || !rail) return;
    var items = PRESS[post.id] || [];
    if (!items.length) { sec.hidden = true; rail.innerHTML = ''; return; }
    sec.hidden = false;
    rail.innerHTML = items.map(pressCardHTML).join('');
  }

  function pressTotal() {
    return Object.keys(PRESS).reduce(function (n, k) { return n + (PRESS[k] ? PRESS[k].length : 0); }, 0);
  }

  // "In the news" list view — all portfolio press mentions, grouped by company.
  function renderPress() {
    var host = $('wrPress');
    // shuckerVC's own mentions pin to the top; portfolio groups follow newest-first.
    function grpSort(id) {
      if (id === 'shuckervc') return Infinity;
      var p = POSTS.filter(function (x) { return x.id === id; })[0];
      return p ? p.sort : 0;
    }
    var order = Object.keys(PRESS).sort(function (a, b) { return grpSort(b) - grpSort(a); });
    host.innerHTML = order.map(function (cid) {
      var items = PRESS[cid] || [];
      if (!items.length) return '';
      var label = CO_NAME[cid] || (cid.charAt(0).toUpperCase() + cid.slice(1));
      return '<div class="wr-press-group">' +
          '<div class="wr-press-head"><h3 class="wr-press-co">' + esc(label) + '</h3>' +
            '<span class="wr-press-n">' + items.length + ' ' + (items.length === 1 ? 'mention' : 'mentions') + '</span></div>' +
          '<div class="wr-press-grid">' + items.map(pressCardHTML).join('') + '</div>' +
        '</div>';
    }).join('');
  }

  /* ---------- view control + deep-linking ---------- */
  function scrollToContent() {
    var sec = $('wrSec');
    if (sec) window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY - 8, behavior: 'smooth' });
  }
  function open(id) {
    var post = POSTS.filter(function (p) { return p.id === id; })[0];
    if (!post) { close(); return; }
    state.openId = id;
    if (location.hash.slice(1) !== id) history.pushState(null, '', '#' + id);
    renderReader(post);
    scrollToContent();
  }
  function close() {
    state.openId = null;
    if (location.hash) history.pushState(null, '', location.pathname + location.search);
    renderArchive();
    scrollToContent();
  }

  function syncFromHash() {
    var id = location.hash.slice(1);
    if (id && POSTS.some(function (p) { return p.id === id; })) { state.openId = id; renderReader(POSTS.filter(function (p) { return p.id === id; })[0]); }
    else { state.openId = null; renderArchive(); }
  }

  function init() {
    $('wrPrev').addEventListener('click', function () { var r = $('wrRail'); if (r) r.scrollBy({ left: -320, behavior: 'smooth' }); });
    $('wrNext').addEventListener('click', function () { var r = $('wrRail'); if (r) r.scrollBy({ left: 320, behavior: 'smooth' }); });
    $('wrNewsPrev').addEventListener('click', function () { var r = $('wrNewsRail'); if (r) r.scrollBy({ left: -360, behavior: 'smooth' }); });
    $('wrNewsNext').addEventListener('click', function () { var r = $('wrNewsRail'); if (r) r.scrollBy({ left: 360, behavior: 'smooth' }); });
    [].slice.call(document.querySelectorAll('[data-close]')).forEach(function (b) { b.addEventListener('click', close); });
    var pt = $('wrPressToggle');
    if (pt) pt.addEventListener('click', function () { state.press = !state.press; renderArchive(); });
    window.addEventListener('hashchange', syncFromHash);

    // Press mentions (reader "In the news" carousel + the "In the news" list view).
    fetch('press.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d) { Object.keys(d).forEach(function (k) { if (k.charAt(0) !== '_') PRESS[k] = d[k]; }); }
        if (pt && pressTotal() > 0) pt.hidden = false;
        if (state.openId) { var p = POSTS.filter(function (x) { return x.id === state.openId; })[0]; if (p) renderNews(p); }
        else if (state.press) renderArchive();
      })
      .catch(function () { /* no press */ });

    fetch('insights.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        POSTS = (data && Array.isArray(data.posts)) ? data.posts : [];
        syncFromHash();
      })
      .catch(function () { POSTS = []; renderArchive(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
