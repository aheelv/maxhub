/* =====================================================================
   课程门户 · 公共脚本
   导航注入 / 登录态 / 扫码登录 / 返回顶部 / 面包屑 / 交互增强
   ===================================================================== */
(function () {
  'use strict';

  var NAV = [
    { href: 'index.html', label: '首页' },
    { href: 'about.html', label: '课程介绍' },
    { href: 'syllabus.html', label: '课程大纲' },
    { href: 'courseware.html', label: '课件中心' },
    { href: 'exercises.html', label: '练习下载' },
    { href: 'hot/index.html', label: '最热AI实践课' },
    { href: 'modules.html', label: '知识模块' },
    { href: 'cases.html', label: '案例展示' },
    { href: 'glossary.html', label: '术语词典' },
    { href: 'trends.html', label: '技术趋势' },
    { href: 'resources.html', label: '拓展资源' },
    { href: 'portal.html', label: '个人中心' }
  ];

  var state = { user: null };

  function currentPage() {
    var p = location.pathname.split('/').pop();
    return p && p.indexOf('.') > -1 ? p : 'index.html';
  }

  function qs(name) {
    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function api(path, options) {
    options = options || {};
    var init = {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin'
    };
    if (options.body != null) init.body = JSON.stringify(options.body);
    return fetch(path, init).then(function (r) {
      return r.json().catch(function () { return { ok: false, message: '服务响应异常' }; })
        .then(function (data) { return { status: r.status, data: data }; });
    });
  }

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return '';
    function p(n) { return n < 10 ? '0' + n : '' + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* ---------------- 头部 / 底部 ---------------- */
  function renderHeader() {
    var host = document.getElementById('site-header');
    if (!host) return;
    var cur = currentPage();
    var links = NAV.map(function (n) {
      var act = n.href === cur ? ' class="active"' : '';
      return '<a href="' + n.href + '"' + act + '>' + n.label + '</a>';
    }).join('');
    host.innerHTML =
      '<header class="site-header"><div class="container">' +
      '<nav class="nav">' +
      '<a class="brand" href="index.html"><span class="brand-mark">AI</span>' +
      '<span>人工智能工具应用实践<small>大连财经学院 · 管理学院</small></span></a>' +
      '<button class="nav-toggle" id="navToggle" aria-label="菜单" aria-expanded="false">☰</button>' +
      '<div class="nav-links" id="navLinks">' + links +
      '<span class="nav-user" id="navUser"></span>' +
      '</div></nav></div></header>';

    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('navLinks');
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') menu.classList.remove('open');
    });
  }

  function renderUserArea() {
    var box = document.getElementById('navUser');
    if (!box) return;
    if (state.user) {
      var initial = (state.user.name || 'U').slice(0, 1);
      var roleTxt = state.user.role === 'teacher' ? '教师' : '学生';
      box.innerHTML =
        '<a href="portal.html" class="flex center gap1" style="padding:0">' +
        '<span class="avatar">' + esc(initial) + '</span>' +
        '<span style="line-height:1.15"><b style="font-size:.86rem">' + esc(state.user.name) + '</b>' +
        '<small class="muted" style="display:block;font-size:.72rem">' + roleTxt + '</small></span></a>' +
        '<a href="#" id="logoutBtn" class="btn btn-outline btn-sm">退出</a>';
      var lb = document.getElementById('logoutBtn');
      if (lb) lb.addEventListener('click', function (e) {
        e.preventDefault();
        api('/api/auth/logout', { method: 'POST' }).then(function () { location.href = 'index.html'; });
      });
    } else {
      box.innerHTML = '<a href="login.html" class="btn btn-primary btn-sm">登录 / 选课</a>';
    }
    document.dispatchEvent(new CustomEvent('auth-ready', { detail: state.user }));
  }

  function renderFooter() {
    var host = document.getElementById('site-footer');
    if (!host) return;
    host.innerHTML =
      '<footer class="site-footer"><div class="container">' +
      '<div class="footer-grid">' +
      '<div><div class="footer-brand"><span class="brand-mark">AI</span>人工智能工具应用实践</div>' +
      '<p>大连财经学院管理学院「大数据管理与应用」专业选修课。<br>32 课时 / 16 次课，聚焦以 Harness 为代表的 AI 集成开发环境、智能体与生成式 AI 工具的专业应用实践。</p></div>' +
      '<div><h4>课程内容</h4>' +
      '<a href="about.html">课程介绍</a><a href="syllabus.html">课程大纲</a>' +
      '<a href="courseware.html">课件中心</a><a href="modules.html">知识模块</a></div>' +
      '<div><h4>拓展学习</h4>' +
      '<a href="cases.html">案例展示</a><a href="glossary.html">术语词典</a>' +
      '<a href="trends.html">技术趋势</a><a href="resources.html">拓展资源</a></div>' +
      '<div><h4>学习支持</h4>' +
      '<a href="resources.html#tools">工具清单</a><a href="resources.html#path">学习路径</a>' +
      '<a href="resources.html#reading">阅读与数据</a><a href="resources.html#sources">数据来源</a>' +
      '<a href="resources.html#faq">常见问题</a><a href="portal.html">个人中心</a></div>' +
      '</div>' +
      '<div class="footer-bottom"><span>© 2026 大连财经学院管理学院 · 《人工智能工具应用实践》课程组</span>' +
      '<span>本站为教学用途课程门户 · 数据来源见<a href="resources.html#sources" style="display:inline;color:#bcd0ff">拓展资源</a></span></div>' +
      '</div></footer>';
  }

  /* ---------------- 面包屑 / 返回顶部 ---------------- */
  function renderBreadcrumb() {
    var host = document.querySelector('[data-crumb]');
    if (!host) return;
    var label = host.getAttribute('data-crumb');
    host.innerHTML = '<nav class="crumb" aria-label="面包屑">' +
      '<a href="index.html">首页</a><span class="sep">/</span><span class="cur">' + esc(label) + '</span></nav>';
  }

  function initBackToTop() {
    var btn = document.createElement('button');
    btn.className = 'to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', '返回顶部');
    btn.innerHTML = '↑';
    document.body.appendChild(btn);
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    function onScroll() {
      if (window.scrollY > 420) btn.classList.add('show'); else btn.classList.remove('show');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- 交互增强 ---------------- */
  function initAccordions() {
    document.querySelectorAll('.acc-head').forEach(function (h) {
      h.addEventListener('click', function () {
        var acc = h.parentElement;
        acc.classList.toggle('open');
      });
    });
  }

  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(function (group) {
      var tabs = group.querySelectorAll('.tab');
      tabs.forEach(function (t) {
        t.addEventListener('click', function () {
          var name = t.getAttribute('data-tab');
          group.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('active'); });
          group.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
          t.classList.add('active');
          var panel = group.querySelector('[data-panel="' + name + '"]');
          if (panel) panel.classList.add('active');
        });
      });
    });
  }

  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
  }

  function initCounters() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var decimals = (el.getAttribute('data-decimals') || 0) * 1;
      var start = null, dur = 1100;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var val = target * (1 - Math.pow(1 - p, 3));
        el.textContent = val.toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  /* ---------------- 扫码登录（电脑端） ---------------- */
  function initQrLogin(opts) {
    var box = document.getElementById(opts.container);
    var statusEl = document.getElementById(opts.status);
    if (!box) return;
    var token = null, timer = null, consumed = false;

    function setStatus(text, color) {
      if (!statusEl) return;
      statusEl.innerHTML = '<span class="qr-dot" style="background:' + (color || '#4ade80') + '"></span>' + esc(text);
    }

    function start() {
      box.innerHTML = '<div class="qr-fallback">正在生成二维码…</div>';
      api('/api/qr/create', { method: 'POST' }).then(function (r) {
        if (!r.data || !r.data.ok) { box.innerHTML = '<div class="qr-fallback">二维码生成失败，请稍后重试</div>'; return; }
        token = r.data.token;
        var url = location.origin + '/qr.html?t=' + token;
        box.innerHTML = '';
        if (window.QRCode) {
          new window.QRCode(box, {
            text: url, width: 168, height: 168,
            colorDark: '#0f1729', colorLight: '#ffffff',
            correctLevel: window.QRCode.CorrectLevel.M
          });
        } else {
          box.innerHTML = '<div class="qr-fallback">二维码组件未加载<br>可改用账号密码登录</div>';
          return;
        }
        setStatus('请使用手机微信「扫一扫」或相机扫码', '#4ade80');
        poll();
      });
    }

    function poll() {
      clearInterval(timer);
      timer = setInterval(function () {
        if (!token || consumed) return;
        api('/api/qr/status?token=' + encodeURIComponent(token)).then(function (r) {
          var st = r.data && r.data.status;
          if (st === 'confirmed') {
            clearInterval(timer);
            setStatus('已确认，正在登录…', '#38bdf8');
            consume();
          } else if (st === 'expired' || st === 'missing') {
            clearInterval(timer);
            setStatus('二维码已过期，正在刷新…', '#f59e0b');
            setTimeout(start, 1200);
          }
        });
      }, 2200);
    }

    function consume() {
      api('/api/qr/consume', { method: 'POST', body: { token: token } }).then(function (r) {
        if (r.data && r.data.ok) {
          consumed = true;
          setStatus('登录成功，正在进入个人中心…', '#4ade80');
          setTimeout(function () { location.href = opts.redirect || 'portal.html'; }, 700);
        } else {
          setStatus('登录确认失效，已刷新二维码', '#f59e0b');
          setTimeout(start, 1500);
        }
      });
    }

    start();
    return { refresh: start };
  }

  /* ---------------- 初始化 ---------------- */
  function boot() {
    renderHeader();
    renderFooter();
    renderBreadcrumb();
    initBackToTop();
    initAccordions();
    initTabs();
    initReveal();
    initCounters();

    api('/api/auth/me').then(function (r) {
      state.user = (r.data && r.data.user) || null;
      renderUserArea();
      if (document.body.hasAttribute('data-requires-auth') && !state.user) {
        location.href = 'login.html?next=' + encodeURIComponent(currentPage());
      }
    }).catch(function () { renderUserArea(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.App = {
    api: api, esc: esc, fmtDate: fmtDate, qs: qs,
    initQrLogin: initQrLogin,
    getUser: function () { return state.user; },
    ready: function (cb) {
      if (state.user !== null || document.body.getAttribute('data-auth-checked') === '1') cb(state.user);
      document.addEventListener('auth-ready', function (e) { cb(e.detail); });
    }
  };
})();
