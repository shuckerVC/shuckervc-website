/* ============================================================
   shuckerVC — Interactive Website
   Vanilla JS recreation of the design prototype.
   ============================================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ACCENT = '#ffcd3c';

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    var n = parseInt(h.length === 3 ? h.split('').map(function (c) { return c + c; }).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
  }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  /* ============================================================
     NAV — scroll scrim + color crossfade + mobile hamburger
     ============================================================ */
  function initNav() {
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');

    function onScroll() {
      var scrolled = window.scrollY > window.innerHeight * 0.72;
      nav.classList.toggle('is-scrolled', scrolled);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    function setOpen(open) {
      links.setAttribute('data-open', open ? 'true' : 'false');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    toggle.addEventListener('click', function () {
      setOpen(links.getAttribute('data-open') !== 'true');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
  }

  /* ============================================================
     REVEAL-ON-SCROLL
     ============================================================ */
  function initReveal() {
    var els = [].slice.call(document.querySelectorAll('[data-reveal]'));
    if (prefersReduced) {
      els.forEach(function (el) { el.classList.add('is-shown'); });
      return;
    }
    function reveal(el) {
      var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
      el.style.transition = 'opacity .72s ease, transform .72s cubic-bezier(.22,1,.36,1)';
      el.style.transitionDelay = (delay / 1000) + 's';
      el.classList.add('is-shown');
      el.setAttribute('data-shown', '1');
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !e.target.getAttribute('data-shown')) {
          reveal(e.target);
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     COUNTERS
     ============================================================ */
  function initCounters() {
    var els = [].slice.call(document.querySelectorAll('[data-count]'));
    function run(el) {
      var to = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var pre = el.getAttribute('data-prefix') || '';
      var suf = el.getAttribute('data-suffix') || '';
      if (prefersReduced) { el.textContent = pre + to.toFixed(dec) + suf; return; }
      var dur = 1400, t0 = performance.now();
      function tick(now) {
        var p = Math.min(1, (now - t0) / dur);
        p = easeOutCubic(p);
        el.textContent = pre + (to * p).toFixed(dec) + suf;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !e.target.getAttribute('data-counted')) {
          e.target.setAttribute('data-counted', '1');
          run(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     CURSOR SPOTLIGHT + MAGNETIC BUTTONS  (desktop only)
     ============================================================ */
  function initSpotlightAndMagnets() {
    var spot = document.getElementById('spot');
    var isFine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (spot && isFine && !prefersReduced) {
      window.addEventListener('pointermove', function (e) {
        spot.style.opacity = '1';
        spot.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      });
    }

    if (!isFine) return;
    [].slice.call(document.querySelectorAll('[data-magnetic]')).forEach(function (el) {
      var strength = 0.32;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + dx * strength + 'px,' + dy * strength + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = 'translate(0,0)'; });
    });
  }

  /* ============================================================
     FOUNDER-FOCUS scroll-driven timeline
     ============================================================ */
  function initFocusScroll() {
    var c = document.getElementById('focusTimeline');
    if (!c) return;
    var steps = [].slice.call(c.querySelectorAll('[data-f-step]'));
    var fill = c.querySelector('[data-f-fill]');
    var cap = document.querySelector('[data-f-cap]');
    var titles = ['Time to market', 'A dedicated Support Partner', 'Integrated operations'];
    function update() {
      var r = c.getBoundingClientRect();
      var anchor = window.innerHeight * 0.45;
      var f = Math.min(1, Math.max(0, (anchor - r.top) / Math.max(1, r.height)));
      if (fill) fill.style.height = (f * 100) + '%';
      var pos = f * (steps.length - 1);
      var active = Math.round(pos);
      steps.forEach(function (s, i) {
        var on = i <= pos + 0.15;
        s.style.opacity = i === active ? '1' : '0.5';
        var num = s.querySelector('[data-num]');
        var dot = s.querySelector('[data-dot]');
        if (num) num.style.color = on ? '#d99e00' : '#c9c3b6';
        if (dot) { dot.style.background = on ? '#ffcd3c' : '#ffffff'; dot.style.borderColor = on ? '#ffcd3c' : '#e6e0d3'; }
      });
      if (cap) cap.textContent = titles[active];
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    setTimeout(update, 300);
  }

  /* ============================================================
     TEAM — rotate the two Managing Partners so either JP or
     Graham leads, swapping every few seconds with a crossfade.
     ============================================================ */
  function initGpRotation() {
    var grid = document.getElementById('teamGrid');
    if (!grid) return;
    var gps = [].slice.call(grid.querySelectorAll('[data-gp]'));
    if (gps.length < 2 || prefersReduced) return;

    var INTERVAL = 4000;   // swap order every 4s
    var FADE = 350;        // crossfade duration (ms)
    var onScreen = false;
    var io = new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
    }, { threshold: 0.25 });
    io.observe(grid);

    function swap() {
      if (!onScreen || document.hidden) return;
      var nodes = [].slice.call(grid.querySelectorAll('[data-gp]'));
      var first = nodes[0], second = nodes[1];
      first.style.transition = second.style.transition = 'opacity ' + FADE + 'ms ease';
      first.style.opacity = second.style.opacity = '0';
      setTimeout(function () {
        grid.insertBefore(second, first); // move the trailing GP ahead of the leading one
        first.style.opacity = second.style.opacity = '1';
      }, FADE + 10);
    }
    setInterval(swap, INTERVAL);
  }

  /* ============================================================
     PORTFOLIO
     ============================================================ */
  var PORT = [
    { id: 'lodg', name: 'Lodg', cat: 'Property Operations AI', tags: ['Applied AI', 'Support Partner'], tint: '#e0653a', site: 'https://www.lodg.ai', shot: 'assets/portfolio/lodg.jpg', desc: 'Lodg runs the full lead-to-lease workflow for property managers — qualification, scheduling, follow-up, and tenant operations.', founders: [{ name: 'Jake Drutchas', note: 'Co-founder & CEO', url: 'https://linkedin.com/in/drutchas' }, { name: 'Amitav Chakravartty', note: 'Co-founder & CTO', url: 'https://linkedin.com/in/amitavchakravartty' }] },
    { id: 'cascade', name: 'Cascade', cat: 'Construction AI', tags: ['Applied AI', 'Support Partner'], tint: '#1f9d6b', coInvestor: 'a16z Speedrun', site: 'https://usecascade.ai', shot: 'assets/portfolio/cascade.jpg', desc: 'Building the first AI-traversable graph of US construction — matching firms to the projects they can actually win.', founders: [{ name: 'Hannia Zia', note: 'CEO, ex–Google Pay', url: 'https://www.linkedin.com/in/hanniazia' }, { name: 'Joana Ferreira', note: 'CTO, ex–Google ML', url: 'https://www.linkedin.com/in/joanaferreira0011' }] },
    { id: 'brev', name: 'Brev.io', cat: 'Workflow AI', tags: ['Applied AI', 'Support Partner'], tint: '#2f7de0', site: 'https://brev.io', shot: 'assets/portfolio/brev.jpg', desc: 'Turns meetings, tools, and goals into an automatic system of record — capturing commitments and tracking whether they are met.', founders: [{ name: 'Chris Pitchford', note: 'CEO, ex-Microsoft / Ally.io', url: 'https://www.linkedin.com/in/chrispitchford' }, { name: 'Vic Hu', note: 'CTO, ex-Meta', url: 'https://www.linkedin.com/in/cvichu' }] },
    { id: 'sindarin', name: 'Sindarin', cat: 'Voice AI', tags: ['Voice', 'Infrastructure'], tint: '#7c5cff', site: 'https://www.sindarin.tech', shot: 'assets/portfolio/sindarin.jpg', desc: 'Enterprise voice-AI with ~95% call success and speaker isolation that cuts interruptions by 90%.', founders: [{ name: 'Brian Atwood', note: 'Technical founder & CEO', url: 'https://www.linkedin.com/in/batwood011' }] },
    { id: 'atlas', name: 'Atlas', cat: 'AI Monetization', tags: ['Applied AI'], tint: '#e0653a', coInvestor: '500 Global', site: 'https://runonatlas.com', shot: 'assets/portfolio/atlas.jpg', desc: 'The dynamic, outcome-based pricing and monetization layer for AI-native SaaS.', founders: [{ name: 'Michael Hoy', note: '3x founder & CEO', url: 'https://www.linkedin.com/in/michaelthoy' }] },
    { id: 'runreal', name: 'Runreal', cat: 'Dev Tools', tags: ['Dev Tools'], tint: '#6b7689', coInvestor: 'a16z', desc: 'AI agents and self-serve tooling for studios building on Unreal Engine.', founders: [{ name: 'Marwan Hilmi', note: 'Co-creator of the PS5 title Godfall', url: 'https://www.linkedin.com/in/marwanhilmi' }] },
    { id: 'algorized', name: 'Algorized', cat: 'Robotics Perception', tags: ['Infrastructure', 'Support Partner'], milestone: 'Raised Series A', tint: '#00b49b', coInvestor: 'Amazon', site: 'https://www.algorized.com', shot: 'assets/portfolio/algorized.jpg', desc: 'Edge-AI perception that lets robots sense and anticipate people on the factory floor.', founders: [{ name: 'Natalya Lopareva', note: 'Founder & CEO', url: 'https://www.linkedin.com/in/natalyalopareva' }] }
  ];
  var PORT_FILTERS = ['All', 'Support Partner', 'Infrastructure', 'Applied AI', 'Voice', 'Dev Tools'];

  var portState = { filter: 'All', expanded: null };

  function founderLine(p) {
    var ns = (p.founders || []).map(function (f) { return f.name; });
    if (!ns.length) return '';
    var joined = ns.length > 1 ? ns.slice(0, -1).join(', ') + ' & ' + ns[ns.length - 1] : ns[0];
    return 'Founded by ' + joined + '.';
  }

  function renderPortfolio() {
    var chipsEl = document.getElementById('portChips');
    var gridEl = document.getElementById('portGrid');
    var showcaseEl = document.getElementById('portShowcase');

    // chips
    chipsEl.innerHTML = '';
    PORT_FILTERS.forEach(function (f) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (f === portState.filter ? ' is-active' : '');
      b.textContent = f;
      b.addEventListener('click', function () {
        portState.filter = f; portState.expanded = null; renderPortfolio();
      });
      chipsEl.appendChild(b);
    });

    var filtered = PORT.filter(function (p) { return portState.filter === 'All' || p.tags.indexOf(portState.filter) !== -1; });
    var active = filtered.filter(function (p) { return p.id === portState.expanded; })[0] || null;

    if (active) {
      gridEl.hidden = true; gridEl.innerHTML = '';
      showcaseEl.hidden = false;
      renderShowcase(showcaseEl, active, filtered);
      return;
    }
    showcaseEl.hidden = true; showcaseEl.innerHTML = '';
    gridEl.hidden = false;
    gridEl.innerHTML = '';

    filtered.forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'port-card';
      card.style.cursor = 'pointer';

      var info = '';
      if (p.tags && p.tags.length) {
        info += '<div class="port-info">';
        info += '<div class="port-tags">' + p.tags.map(function (t) { return '<span class="port-tag">' + t + '</span>'; }).join('') + '</div>';
        if (p.coInvestor) {
          info += '<div class="port-coinv"><span class="port-coinv-label">Co-investing with</span><span class="port-coinv-pill">' + p.coInvestor + '</span></div>';
        }
        info += '<div class="port-hint" style="color:' + p.tint + '">Click to see the product ↗</div>';
        info += '</div>';
      }

      card.innerHTML =
        '<div class="port-name-row"><span class="port-name">' + p.name + '</span><span class="port-chev">+</span></div>' +
        '<div class="port-cat">' + p.cat + '</div>' +
        (p.milestone ? '<div class="port-milestone"><span class="port-milestone-dot"></span>' + p.milestone + ' ↗</div>' : '') +
        '<p class="port-desc">' + p.desc + '</p>' +
        '<p class="port-founder">' + founderLine(p) + '</p>' +
        info;

      card.addEventListener('mouseenter', function () {
        card.classList.add('is-hover');
        card.style.borderColor = p.tint;
        card.querySelector('.port-name').style.color = p.tint;
      });
      card.addEventListener('mouseleave', function () {
        card.classList.remove('is-hover');
        card.style.borderColor = '';
        card.querySelector('.port-name').style.color = '';
      });
      card.addEventListener('click', function () {
        portState.expanded = p.id; renderPortfolio();
        showcaseEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      gridEl.appendChild(card);
    });
  }

  function renderShowcase(root, p, filtered) {
    var foundersHtml = (p.founders || []).map(function (f) {
      var name = f.url
        ? '<a href="' + f.url + '" target="_blank" rel="noopener" style="color:' + p.tint + ';border-bottom-color:' + p.tint + '66">' + f.name + ' ↗</a>'
        : '<span class="fname">' + f.name + '</span>';
      return '<div>' + name + (f.note ? '<span class="fnote"> — ' + f.note + '</span>' : '') + '</div>';
    }).join('');

    var pillsHtml = filtered.map(function (q) {
      var on = q.id === p.id;
      return '<button type="button" class="showcase-pill" data-pill="' + q.id + '"' +
        (on ? ' style="border-color:' + q.tint + ';background:' + q.tint + ';color:#fff"' : '') +
        '>' + q.name + '</button>';
    }).join('');

    root.innerHTML =
      '<div class="showcase" style="border:1px solid ' + p.tint + '">' +
        '<div class="showcase-top">' +
          '<button type="button" class="showcase-back">← All companies</button>' +
          '<span class="showcase-catpill" style="background:' + p.tint + '1a;color:' + p.tint + '">' + p.cat + '</span>' +
        '</div>' +
        '<div class="showcase-body">' +
          (p.shot
            ? (p.site
                ? '<a class="showcase-shot" href="' + p.site + '" target="_blank" rel="noopener" title="Visit ' + p.name + '">'
                : '<div class="showcase-shot">') +
                '<img src="' + p.shot + '" alt="' + p.name + ' product screenshot" loading="lazy">' +
                '<div class="showcase-shot-bar" style="background:' + p.tint + '"></div>' +
              (p.site ? '</a>' : '</div>')
            : '<div class="showcase-shot">' +
                '<div class="showcase-shot-ph">Product preview coming soon</div>' +
                '<div class="showcase-shot-bar" style="background:' + p.tint + '"></div>' +
              '</div>') +
          '<div class="showcase-main">' +
            (p.milestone ? '<div class="port-milestone"><span class="port-milestone-dot"></span>' + p.milestone + ' ↗</div>' : '') +
            '<h3 class="showcase-name">' + p.name + '</h3>' +
            '<p class="showcase-desc">' + p.desc + '</p>' +
            (p.site ? '<a class="showcase-visit" href="' + p.site + '" target="_blank" rel="noopener" style="color:' + p.tint + ';border-color:' + p.tint + '">Visit ' + p.name + ' ↗</a>' : '') +
            '<div class="showcase-founders"><div class="showcase-founders-label">Founders</div><div class="showcase-founders-list">' + foundersHtml + '</div></div>' +
            '<div class="showcase-tags">' + (p.tags || []).map(function (t) { return '<span class="port-tag">' + t + '</span>'; }).join('') + '</div>' +
            (p.coInvestor ? '<div class="showcase-coinv"><span class="port-coinv-label">Co-investing with</span><span class="port-coinv-pill">' + p.coInvestor + '</span></div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="showcase-pills">' + pillsHtml + '</div>' +
      '</div>';

    root.querySelector('.showcase-back').addEventListener('click', function () {
      portState.expanded = null; renderPortfolio();
    });
    [].slice.call(root.querySelectorAll('[data-pill]')).forEach(function (b) {
      b.addEventListener('click', function () {
        portState.expanded = b.getAttribute('data-pill'); renderPortfolio();
      });
    });
  }

  /* ============================================================
     INSIGHTS
     ============================================================ */
  var INS_NOTION = 'https://shuckervc.notion.site/shuckervc-news';
  var INS_SP = 'https://shuckervc.notion.site/our-support-partner-model';
  var INS_TAGS = ['All', 'White paper', 'Perspective', 'News', 'Newsletter'];
  var INS_TC = {
    'White paper': { bg: '#fff6da', fg: '#8a6400', dot: '#ffc009', solidFg: '#111111' },
    'Perspective': { bg: '#e3f1ee', fg: '#1f6b5e', dot: '#33a08f', solidFg: '#ffffff' },
    'News': { bg: '#ece9e2', fg: '#4a463f', dot: '#111111', solidFg: '#ffffff' },
    'Newsletter': { bg: '#e8edf3', fg: '#35507a', dot: '#3f5b7c', solidFg: '#ffffff' }
  };
  // Fallback data — mirrors site/insights.json so the page renders even when
  // the JSON can't be fetched (e.g. opened over file://). At runtime this is
  // replaced by the live Notion-synced insights.json (see loadInsights).
  var INS_POSTS = [
    { id: 'lodg', tag: 'News', sort: 20260604, title: 'Welcome Lodg', excerpt: 'An AI workforce that automates property-management tasks — qualification, scheduling, follow-up, and tenant operations — boosting efficiency across the mid-market.', author: 'shuckerVC', initials: 'sV', date: 'Jun 2026', read: '6 min read', cover: 'assets/insights/lodg.jpg', url: 'https://shuckervc.notion.site/welcome-lodg' },
    { id: 'cascade', tag: 'News', sort: 20260520, title: 'Welcome Cascade', excerpt: 'Why we invested in the first AI-traversable graph of US construction — matching firms to the projects they can actually win, with outcome-aligned economics.', author: 'shuckerVC', initials: 'sV', date: 'May 2026', read: '7 min read', cover: 'assets/insights/cascade.jpg', url: 'https://shuckervc.notion.site/welcome-cascade' },
    { id: 'saas-pricing', tag: 'White paper', sort: 20260515, title: 'AI is Eating Software', excerpt: "Just as cloud and mobile once disrupted enterprise software, AI is now poised to be the next transformative force in the B2B SaaS landscape. With 60% of Y-Combinator's recent startups focused on AI, the potential for disruption is evident.", author: 'JP Persico', initials: 'JP', date: 'May 2026', read: '5 min read', url: 'https://shuckervc.notion.site/shuckervc-news' },
    { id: 'brev', tag: 'Perspective', sort: 20260423, title: 'Welcome Brev.io', excerpt: "The bottleneck for early founders isn't capital — it's operational drag. Brev's autonomous AI agents execute goals, replacing the traditional tracking dashboard.", author: 'shuckerVC', initials: 'sV', date: 'Apr 2026', read: '6 min read', cover: 'assets/insights/brev.jpg', url: 'https://shuckervc.notion.site/welcome-brev-io' }
  ];
  var insState = { filter: 'All' };

  // Pull the live Notion-synced feed; re-render on success.
  function loadInsights() {
    fetch('insights.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (data && Array.isArray(data.posts) && data.posts.length) {
          INS_POSTS = data.posts;
          renderInsights();
        }
      })
      .catch(function () { /* keep fallback */ });
  }

  function insSolidBadge(t) {
    var c = INS_TC[t];
    return '<span class="ins-solid" style="background:' + c.dot + ';color:' + c.solidFg + '">' + t + '</span>';
  }
  function insLightBadge(t) {
    var c = INS_TC[t];
    return '<span class="ins-badge" style="background:' + c.bg + ';color:' + c.fg + '"><span class="ins-badge-dot" style="background:' + c.dot + '"></span>' + t + '</span>';
  }

  function renderInsights() {
    var chipsEl = document.getElementById('insChips');
    var featEl = document.getElementById('insFeat');
    var listEl = document.getElementById('insList');

    chipsEl.innerHTML = '';
    INS_TAGS.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ins-chip' + (t === insState.filter ? ' is-active' : '');
      b.textContent = t;
      b.addEventListener('click', function () { insState.filter = t; renderInsights(); });
      chipsEl.appendChild(b);
    });

    var sorted = INS_POSTS
      .filter(function (p) { return insState.filter === 'All' || p.tag === insState.filter; })
      .sort(function (a, b) { return b.sort - a.sort; });

    var feat = sorted[0];
    featEl.innerHTML = feat ?
      '<a class="ins-feat" href="writing.html#' + encodeURIComponent(feat.id) + '">' +
        '<div class="ins-feat-cover">' +
          (feat.cover ? '<img src="' + feat.cover + '" alt="" loading="lazy">' : '') +
          '<span class="ins-feat-badge-wrap">' + insSolidBadge(feat.tag) + '</span>' +
          '<span class="ins-feat-read">' + feat.read + '</span>' +
        '</div>' +
        '<h3 class="ins-feat-title">' + feat.title + '</h3>' +
        '<p class="ins-feat-excerpt">' + feat.excerpt + '</p>' +
        '<div class="ins-feat-author"><span class="ins-initials">' + feat.initials + '</span>' +
          '<span class="ins-feat-meta"><b>' + feat.author + '</b> · ' + feat.date + '</span></div>' +
      '</a>' : '';

    // Homepage teaser: cap to a few recent; the full archive lives on writing.html.
    listEl.innerHTML = sorted.slice(1, 5).map(function (p) {
      return '<a class="ins-row" href="writing.html#' + encodeURIComponent(p.id) + '">' +
        '<div class="ins-row-body">' +
          insLightBadge(p.tag) +
          '<h4 class="ins-row-title">' + p.title + '</h4>' +
          '<p class="ins-row-excerpt">' + p.excerpt + '</p>' +
        '</div>' +
        '<span class="ins-arrow">↗</span>' +
      '</a>';
    }).join('');
  }

  /* ============================================================
     HERO CANVAS — oyster-mark line field that morphs to the
     logo as the cursor nears (ported from the prototype).
     ============================================================ */
  function startCanvas() {
    var cvs = document.getElementById('heroCanvas');
    if (!cvs) return;
    var ctx = cvs.getContext('2d');
    var rgb = hexToRgb(ACCENT);
    var ampMul = prefersReduced ? 0.5 : 1;

    var w = 0, h = 0, cx = 0, cy = 0, minb = 0;
    var RM = 120;
    var loops = [];
    var aspect = 1;
    var img = new Image();

    function buildLoops() {
      if (!img.complete || !img.naturalWidth) return;
      var W = 300, H = Math.max(2, Math.round(W * img.naturalHeight / img.naturalWidth));
      var oc = document.createElement('canvas'); oc.width = W; oc.height = H;
      var octx = oc.getContext('2d');
      octx.drawImage(img, 0, 0, W, H);
      var d; try { d = octx.getImageData(0, 0, W, H).data; } catch (e) { return; }
      var B = new Uint8Array(W * H);
      for (var i = 0; i < W * H; i++) B[i] = d[i * 4 + 3] > 110 ? 1 : 0;
      var ix = function (x, y) { return y * W + x; };
      var g = function (x, y) { return (x < 0 || y < 0 || x >= W || y >= H) ? 0 : B[ix(x, y)]; };

      // Zhang-Suen thinning
      var changed = true, guard = 0;
      while (changed && guard++ < 80) {
        changed = false;
        for (var s = 0; s < 2; s++) {
          var del = [];
          for (var y = 1; y < H - 1; y++) for (var x = 1; x < W - 1; x++) {
            if (!B[ix(x, y)]) continue;
            var p2 = g(x, y - 1), p3 = g(x + 1, y - 1), p4 = g(x + 1, y), p5 = g(x + 1, y + 1), p6 = g(x, y + 1), p7 = g(x - 1, y + 1), p8 = g(x - 1, y), p9 = g(x - 1, y - 1);
            var N = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
            if (N < 2 || N > 6) continue;
            var C = (p2 === 0 && p3 === 1) + (p3 === 0 && p4 === 1) + (p4 === 0 && p5 === 1) + (p5 === 0 && p6 === 1) + (p6 === 0 && p7 === 1) + (p7 === 0 && p8 === 1) + (p8 === 0 && p9 === 1) + (p9 === 0 && p2 === 1);
            if (C !== 1) continue;
            if (s === 0) { if (p2 * p4 * p6 !== 0) continue; if (p4 * p6 * p8 !== 0) continue; }
            else { if (p2 * p4 * p8 !== 0) continue; if (p2 * p6 * p8 !== 0) continue; }
            del.push(ix(x, y));
          }
          if (del.length) { changed = true; for (var q = 0; q < del.length; q++) B[del[q]] = 0; }
        }
      }

      var nb = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
      var cN = function (x, y) { var c = 0; for (var k = 0; k < nb.length; k++) c += g(x + nb[k][0], y + nb[k][1]); return c; };
      var vis = new Uint8Array(W * H);
      var starts = [];
      for (var yy = 0; yy < H; yy++) for (var xx = 0; xx < W; xx++) if (B[ix(xx, yy)] && cN(xx, yy) === 1) starts.push([xx, yy]);
      for (var yy2 = 0; yy2 < H; yy2++) for (var xx2 = 0; xx2 < W; xx2++) if (B[ix(xx2, yy2)]) starts.push([xx2, yy2]);
      var raw = [];
      for (var si = 0; si < starts.length; si++) {
        var st = starts[si];
        var x0 = st[0], y0 = st[1];
        if (vis[ix(x0, y0)] || !B[ix(x0, y0)]) continue;
        var chain = [[x0, y0]]; vis[ix(x0, y0)] = 1;
        var go = true;
        while (go) {
          go = false;
          for (var ni = 0; ni < nb.length; ni++) {
            var nx = x0 + nb[ni][0], ny = y0 + nb[ni][1];
            if (g(nx, ny) && !vis[ix(nx, ny)]) { vis[ix(nx, ny)] = 1; x0 = nx; y0 = ny; chain.push([x0, y0]); go = true; break; }
          }
        }
        if (chain.length > 14) raw.push(chain);
      }
      if (!raw.length) return;

      var mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
      raw.forEach(function (c) { c.forEach(function (p) { if (p[0] < mnx) mnx = p[0]; if (p[0] > mxx) mxx = p[0]; if (p[1] < mny) mny = p[1]; if (p[1] > mxy) mxy = p[1]; }); });
      var bw = (mxx - mnx) || 1, bh = (mxy - mny) || 1;
      aspect = bh / bw;

      var resample = function (chainArr) {
        var n = chainArr.length, cum = [0];
        for (var i = 1; i < n; i++) cum[i] = cum[i - 1] + Math.hypot(chainArr[i][0] - chainArr[i - 1][0], chainArr[i][1] - chainArr[i - 1][1]);
        var total = cum[n - 1] || 1, out = [];
        var seg = 1;
        for (var k = 0; k < RM; k++) {
          var target = total * k / (RM - 1);
          while (seg < n - 1 && cum[seg] < target) seg++;
          var t1 = (target - cum[seg - 1]) / ((cum[seg] - cum[seg - 1]) || 1);
          var px = chainArr[seg - 1][0] + (chainArr[seg][0] - chainArr[seg - 1][0]) * t1;
          var py = chainArr[seg - 1][1] + (chainArr[seg][1] - chainArr[seg - 1][1]) * t1;
          out.push([(px - mnx) / bw, (py - mny) / bh]);
        }
        return out;
      };
      var smooth = function (chainArr) {
        var c = chainArr;
        for (var pass = 0; pass < 5; pass++) {
          var out = [c[0]];
          for (var i = 1; i < c.length - 1; i++) out.push([(c[i - 1][0] + 2 * c[i][0] + c[i + 1][0]) / 4, (c[i - 1][1] + 2 * c[i][1] + c[i + 1][1]) / 4]);
          out.push(c[c.length - 1]);
          c = out;
        }
        return c;
      };
      var d2 = function (a, b) { var dx = a[0] - b[0], dy = a[1] - b[1]; return dx * dx + dy * dy; };
      var TH = 20;
      var merged = raw.map(function (c) { return c.slice(); });
      var again = true;
      while (again) {
        again = false;
        for (var i = 0; i < merged.length && !again; i++) {
          for (var j = i + 1; j < merged.length; j++) {
            var A = merged[i], Bc = merged[j];
            var a0 = A[0], a1 = A[A.length - 1], b0 = Bc[0], b1 = Bc[Bc.length - 1];
            var nc = null;
            if (d2(a1, b0) < TH) nc = A.concat(Bc);
            else if (d2(a1, b1) < TH) nc = A.concat(Bc.slice().reverse());
            else if (d2(a0, b1) < TH) nc = Bc.concat(A);
            else if (d2(a0, b0) < TH) nc = Bc.slice().reverse().concat(A);
            if (nc) { merged[i] = nc; merged.splice(j, 1); again = true; break; }
          }
        }
      }
      merged.sort(function (p, q) { return q.length - p.length; });
      loops = merged.filter(function (c) { return c.length > 26; }).slice(0, 12).map(function (ch) { return resample(smooth(ch)); });
      if (!loops.length) loops = merged.slice(0, 8).map(function (ch) { return resample(smooth(ch)); });
    }

    function resize() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var r = cvs.getBoundingClientRect();
      w = r.width; h = r.height;
      cvs.width = Math.max(1, w * dpr); cvs.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var small = w < 760;
      cx = w * (small ? 0.5 : 0.66);
      cy = h * (small ? 0.46 : 0.5);
      minb = Math.min(w * (small ? 0.6 : 0.44), h * 0.74);
    }
    resize();
    window.addEventListener('resize', resize);
    img.onload = function () { buildLoops(); };
    img.src = 'assets/logo/mark-white.png';

    var mx = -9999, my = -9999, tmx = -9999, tmy = -9999;
    window.addEventListener('pointermove', function (e) {
      var r = cvs.getBoundingClientRect();
      tmx = e.clientX - r.left;
      tmy = e.clientY - r.top;
    });

    var sig = 120, sig2 = 2 * sig * sig;
    var t = 0, t0 = performance.now(), m = 0;
    function loop() {
      t += 0.009;
      mx += (tmx - mx) * 0.12;
      my += (tmy - my) * 0.12;
      ctx.clearRect(0, 0, w, h);

      if (minb > 0) {
        var ready = loops.length > 0;
        var RN = ready ? loops.length : 14;
        var appear = Math.min(1, (performance.now() - t0) / 1300);
        var ein = 1 - Math.pow(1 - appear, 3);

        var mdx = mx - cx, mdy = my - cy;
        var dist = Math.sqrt(mdx * mdx + mdy * mdy);
        var near = ready ? Math.max(0, Math.min(1, (minb * 1.7 - dist) / (minb * 1.25))) : 0;
        m += (near - m) * 0.06;
        var em = m * m * (3 - 2 * m);

        var dw = minb * 1.28, dh = dw * aspect;
        var ox = cx - dw / 2, oy = cy - dh / 2;

        var gr = minb * 0.95;
        var glx = cx, gly = cy + (oy + dh * 0.24 - cy) * em;
        var gg = ctx.createRadialGradient(glx, gly, 0, glx, gly, gr);
        gg.addColorStop(0, 'rgba(' + rgb + ',' + (0.09 * ein).toFixed(3) + ')');
        gg.addColorStop(1, 'rgba(' + rgb + ',0)');
        ctx.fillStyle = gg;
        ctx.fillRect(glx - gr, gly - gr, gr * 2, gr * 2);

        ctx.globalCompositeOperation = 'lighter';
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        var rotA = -0.5 + Math.sin(t * 0.4) * 0.02;
        var cosA = Math.cos(rotA), sinA = Math.sin(rotA);
        var startA = minb * 0.08, stepA = minb * 0.032;

        for (var i = 0; i < RN; i++) {
          var sA = startA + i * stepA;
          var tloop = ready ? loops[i] : null;
          ctx.beginPath();
          for (var k = 0; k < RM; k++) {
            var a = k / RM * 6.2832;
            var br = Math.sin(a * 3 + t * 1.1 + i * 0.3) * (1.3 * ampMul) * (0.4 + i / RN);
            // resting contours — organic nested rings
            var wob = 0.11 * Math.sin(a * 2 + i * 0.7 + t * 0.5) + 0.06 * Math.sin(a * 3 - i * 0.5 + t * 0.3);
            var rA = sA * (1 + 0.13 * Math.cos(a) + wob) + br;
            var axl = Math.cos(a) * rA * 1.2, ayl = Math.sin(a) * rA * 0.82;
            var AX = cx + axl * cosA - ayl * sinA;
            var AY = cy + axl * sinA + ayl * cosA;
            var BX = AX, BY = AY;
            if (tloop) {
              var p = tloop[k];
              var ph = k * 0.16 + i * 0.6 + t * 1.1;
              BX = ox + p[0] * dw + Math.cos(ph) * (1.0 * ampMul);
              BY = oy + p[1] * dh + Math.sin(ph) * (1.0 * ampMul);
            }
            var X = AX + (BX - AX) * em;
            var Y = AY + (BY - AY) * em;
            var qx = X - mx, qy = Y - my, q2 = qx * qx + qy * qy;
            var ff = Math.exp(-q2 / sig2) * 16 * ampMul, qn = Math.sqrt(q2) || 1;
            X += qx / qn * ff; Y += qy / qn * ff;
            if (k === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
          }
          var alpha = ((1 - i / RN) * 0.34 + 0.12) * ein;
          ctx.strokeStyle = 'rgba(' + rgb + ',' + alpha.toFixed(3) + ')';
          ctx.shadowColor = 'rgba(' + rgb + ',' + (alpha * 0.9).toFixed(3) + ')';
          ctx.shadowBlur = 6 + 10 * em;
          ctx.lineWidth = 1.2 + 6.8 * em;
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        var pxp = cx + (ox + dw * 0.6 - cx) * em, pyp = cy + (oy + dh * 0.22 - cy) * em;
        var pr = (7 + Math.sin(t * 1.6) * 2) * ampMul + 5;
        var pa = ein * (0.25 + 0.65 * em);
        var pg = ctx.createRadialGradient(pxp, pyp, 0, pxp, pyp, pr * 2.4);
        pg.addColorStop(0, 'rgba(255,255,255,' + (0.9 * pa).toFixed(3) + ')');
        pg.addColorStop(0.3, 'rgba(' + rgb + ',' + (0.8 * pa).toFixed(3) + ')');
        pg.addColorStop(1, 'rgba(' + rgb + ',0)');
        ctx.fillStyle = pg;
        ctx.beginPath(); ctx.arc(pxp, pyp, pr * 2.4, 0, 6.2832); ctx.fill();

        ctx.globalCompositeOperation = 'source-over';
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    initNav();
    initReveal();
    initCounters();
    initSpotlightAndMagnets();
    initFocusScroll();
    initGpRotation();
    renderPortfolio();
    renderInsights();
    loadInsights();
    startCanvas();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
