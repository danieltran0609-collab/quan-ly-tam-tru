// Lớp gọi API. Chế độ:
//  - "may-chu": fetch() tới Web App Apps Script, kèm Google ID token (đăng nhập bằng Google)
//  - "xem-truoc": chạy chính mã Code.gs trong trình duyệt (tools/build_preview.py), dữ liệu chỉ trong bộ nhớ
(function () {
  var cfg = window.TAMTRU_CONFIG || {};
  var KHOA = 'tamtru-token';
  var HET_GIO = 45000;   // Apps Script khởi động nguội có thể mất 5–10 giây

  // ID token chỉ giữ trong phiên tab (sessionStorage), tự bỏ khi hết hạn
  function docToken() {
    try {
      var o = JSON.parse(sessionStorage.getItem(KHOA) || 'null');
      if (o && o.exp * 1000 > Date.now() + 60000) return o;
    } catch (e) {}
    return null;
  }
  function giaiMa(jwt) {
    try {
      var p = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(p))));
    } catch (e) { return {}; }
  }
  var hienTai = docToken();

  var API = {
    cheDo: cfg.API_URL ? 'may-chu' : (typeof window.apiNoiBo === 'function' ? 'xem-truoc' : 'chua-cau-hinh'),
    khiHetPhien: null,   // app.js gán: gọi khi máy chủ báo token hỏng/hết hạn
    coToken: function () { hienTai = docToken(); return !!hienTai; },
    emailToken: function () { return hienTai ? hienTai.email : ''; },
    tenToken: function () { return hienTai ? (hienTai.ten || '') : ''; },
    hetHan: function () { return hienTai ? hienTai.exp * 1000 : 0; },
    khiThuLai: null,     // app.js gán: báo người dùng đang thử lại khi mạng chập chờn
    datToken: function (jwt) {
      var c = giaiMa(jwt);
      hienTai = { t: jwt, exp: c.exp || 0, email: c.email || '', ten: c.name || '' };
      try { sessionStorage.setItem(KHOA, JSON.stringify(hienTai)); } catch (e) {}
    },
    xoaToken: function () { hienTai = null; try { sessionStorage.removeItem(KHOA); } catch (e) {} },

    /** Kiểm tra URL máy chủ (GET ?action=ping, không cần đăng nhập). */
    ping: function () {
      if (API.cheDo !== 'may-chu') return Promise.resolve({ ten: 'xem trước' });
      return fetch(cfg.API_URL + '?action=ping').then(function (r) { return r.json(); })
        .then(function (r) { if (!r.ok) throw new Error(r.error); return r.data; });
    },

    goi: function (action, data) {
      if (API.cheDo === 'xem-truoc') {
        return new Promise(function (ok, loi) {
          setTimeout(function () {
            var r = window.apiNoiBo(action, JSON.parse(JSON.stringify(data || {})));
            r = JSON.parse(JSON.stringify(r));
            r.ok ? ok(r.data) : loi(Object.assign(new Error(r.error), { code: r.code }));
          }, 120);
        });
      }
      if (API.cheDo !== 'may-chu') return Promise.reject(Object.assign(new Error('Chưa cấu hình API_URL trong js/config.js'), { code: 'CAU_HINH' }));
      if (!API.coToken()) {
        if (API.khiHetPhien) API.khiHetPhien();
        return Promise.reject(Object.assign(new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'), { code: 'TOKEN' }));
      }
      var ctl = window.AbortController ? new AbortController() : null;
      var hg = ctl && setTimeout(function () { ctl.abort(); }, HET_GIO);
      // Mỗi lần gọi có một mã yêu cầu; gửi lại (khi mạng lỗi) dùng lại mã này nên máy chủ không ghi trùng
      var ma = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'yc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
      var goi = Object.assign({}, data || {}, { _yc: ma });
      var body = JSON.stringify({ action: action, token: hienTai.t, data: goi });
      var cho = function (lan) {
        return new Promise(function (ok) {
          var ms = [800, 2000, 4000][lan - 1] || 4000, t0 = Date.now();
          (function doi() { if (navigator.onLine === false && Date.now() - t0 < 15000) return setTimeout(doi, 500); setTimeout(ok, ms); })();
        });
      };
      var gui = function (lan) {
        return fetch(cfg.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // "simple request" => không có CORS preflight
          body: body,
          signal: ctl ? ctl.signal : undefined,
          redirect: 'follow'
        }).then(function (res) {
          // Google đôi khi trả 404/502/503/504 thoáng qua -> thử lại (tối đa 3 lần)
          if ([404, 502, 503, 504].indexOf(res.status) >= 0 && lan <= 3) return cho(lan).then(function () { return gui(lan + 1); });
          return res;
        }, function (e) {
          if (e && e.name === 'AbortError') throw e;
          if (lan <= 3) { if (lan === 1 && API.khiThuLai) API.khiThuLai(); return cho(lan).then(function () { return gui(lan + 1); }); }
          throw e;
        });
      };
      return gui(1).then(function (res) {
        if (!res.ok) throw new Error('Máy chủ trả lỗi HTTP ' + res.status);
        return res.json();
      }, function (e) {
        throw new Error(e && e.name === 'AbortError' ? 'Máy chủ phản hồi quá lâu, thử lại sau.' : 'Không kết nối được máy chủ. Kiểm tra mạng rồi bấm lại.');
      }).then(function (r) {
        if (hg) clearTimeout(hg);
        if (!r.ok) {
          if (r.code === 'TOKEN' || r.code === 'CHUA_DANG_NHAP') { API.xoaToken(); if (API.khiHetPhien) API.khiHetPhien(); }
          throw Object.assign(new Error(r.error), { code: r.code });
        }
        return r.data;
      });
    }
  };
  window.API = API;
})();
