(function () {
  'use strict';
  var NO_BACKEND = '本页为 GitHub Pages 静态展示版，登录、选课意向、学习反馈与教师管理需要后端服务；请在本地运行 node server.js 后使用完整交互版。练习资源可直接下载。';
  var DATA = {
    'api/stats': { ok: true, stats: { students: '—', intents: '—', feedback: '—', avgRating: 0 } },
    'api/updates': { ok: true, updates: [] },
    'api/enrollments': { ok: true, enrollments: [] },
    'api/feedback': { ok: true, feedback: [] },
    'api/auth/me': { ok: false, user: null, message: NO_BACKEND },
    'api/qr/confirm': { ok: false, message: NO_BACKEND }
  };
  function reply(body, status) {
    return Promise.resolve(new Response(JSON.stringify(body), {
      status: status, headers: { 'Content-Type': 'application/json; charset=utf-8' }
    }));
  }
  var realFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.charAt(0) === '/') url = url.slice(1);
    if (url.indexOf('api/') !== 0) return realFetch.apply(this, arguments);
    var method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    if (method !== 'GET') return reply({ ok: false, status: 403, message: NO_BACKEND }, 403);
    var key = url.split('?')[0];
    var body = DATA[key] || { ok: false, status: 404, message: NO_BACKEND };
    return reply(body, body.ok ? 200 : 401);
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('staticModeBanner')) return;
    var bar = document.createElement('div');
    bar.id = 'staticModeBanner';
    bar.setAttribute('role', 'note');
    bar.style.cssText = 'position:relative;z-index:9999;background:#1d3a8f;color:#eaf0ff;' +
      'font:13px/1.65 "Segoe UI","Microsoft YaHei",Arial,sans-serif;' +
      'padding:9px 46px 9px 16px;text-align:center;letter-spacing:.01em';
    bar.innerHTML = '📘 课程门户静态展示版 · 登录与提交功能需本地后端；' +
      '<b style="color:#fff">16 次课练习资源与《最热AI应用实践课》全部素材无需登录即可直接下载</b>。' +
      '<button type="button" aria-label="关闭提示" style="position:absolute;right:12px;top:6px;' +
      'background:none;border:0;color:#dbe3fb;font-size:19px;line-height:1;cursor:pointer">×</button>';
    bar.querySelector('button').onclick = function () { bar.style.display = 'none'; };
    document.body.insertBefore(bar, document.body.firstChild);
  });
})();
