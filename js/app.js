// Giao diện Quản lý Tạm trú – HTML + Tailwind + JavaScript thuần (không cần build).
(function () {
  'use strict';

  // ---------- Tiện ích ----------
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var boDau = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase(); };
  var pad = function (n) { return ('0' + n).slice(-2); };
  var isoNgay = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var homNay = function () { return isoNgay(new Date()); };
  var congNgay = function (iso, n) { var x = iso.split('-'); return isoNgay(new Date(+x[0], +x[1] - 1, +x[2] + n)); };
  var soNgay = function (a, b) { var p = function (s) { var x = s.split('-'); return Date.UTC(+x[0], +x[1] - 1, +x[2]); }; return Math.round((p(b) - p(a)) / 864e5); };
  var vn = function (iso) { if (!iso) return ''; var x = String(iso).slice(0, 10).split('-'); return x.length === 3 ? x[2] + '/' + x[1] + '/' + x[0] : iso; };
  var vnTG = function (s) { return s ? vn(s) + ' ' + String(s).slice(11, 16) : ''; };
  var soVN = function (n) { return Number(n || 0).toLocaleString('vi-VN'); };
  var debounce = function (fn, ms) { var t; return function () { var a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, ms); }; };

  // Phải khớp tinhTrangThai_ trong Code.gs (dùng để xem trước trên form)
  var SAP_HET = 3;
  function tinhTrangThai(ngayDi, ngayDiThucTe) {
    if (ngayDiThucTe) return 'Đã rời đi';
    if (!ngayDi) return 'Đang ở';
    var con = soNgay(homNay(), ngayDi);
    return con < 0 ? 'Quá hạn' : con <= SAP_HET ? 'Sắp hết hạn' : 'Đang ở';
  }

  var MAU_TT = {
    'Đang ở': 'bg-mint text-mint-ink', 'Sắp hết hạn': 'bg-butter text-butter-ink',
    'Quá hạn': 'bg-rose text-rose-ink', 'Đã rời đi': 'bg-fog text-fog-ink'
  };
  var CHAM_TT = { 'Đang ở': 'bg-mint-ink', 'Sắp hết hạn': 'bg-butter-ink', 'Quá hạn': 'bg-rose-ink', 'Đã rời đi': 'bg-fog-ink' };
  var MAU_LOAI = {
    'Nhà trọ': 'bg-sky text-sky-ink', 'Nhà nghỉ': 'bg-lilac text-lilac-ink', 'Nhà cho thuê': 'bg-peach text-peach-ink',
    'Khách sạn': 'bg-mint text-mint-ink', 'Khác': 'bg-fog text-fog-ink'
  };
  var THANH_LOAI = { 'Nhà trọ': 'bg-[#8EC5F5]', 'Nhà nghỉ': 'bg-[#B9A6E8]', 'Nhà cho thuê': 'bg-[#F5B98A]', 'Khách sạn': 'bg-[#8FD6B5]', 'Khác': 'bg-[#C5C9D3]' };
  var badgeTT = function (tt) { return '<span class="badge ' + (MAU_TT[tt] || 'bg-fog text-fog-ink') + '"><span class="size-1.5 rounded-full ' + (CHAM_TT[tt] || 'bg-fog-ink') + '"></span>' + esc(tt) + '</span>'; };
  var badgeLoai = function (l) { return '<span class="badge ' + (MAU_LOAI[l] || 'bg-fog text-fog-ink') + '">' + esc(l || '—') + '</span>'; };
  function conLaiTxt(r) {
    if (r.TrangThai === 'Đã rời đi') return 'Đi ' + vn(r.NgayDiThucTe);
    if (r.SoNgayConLai === '' || r.SoNgayConLai == null) return 'Chưa có ngày đi';
    var n = Number(r.SoNgayConLai);
    return n < 0 ? 'Quá ' + (-n) + ' ngày' : n === 0 ? 'Hết hạn hôm nay' : 'Còn ' + n + ' ngày';
  }

  var IC = {
    home: '<path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    out: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5M5 12h11"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    door: '<path d="M5 21V4a1 1 0 0 1 1-1h9l4 2v16"/><path d="M3 21h18M12 12h.01"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>', check: '<path d="m5 12 5 5 9-10"/>',
    clip: '<path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7"/>',
    chev: '<path d="m9 6 6 6-6 6"/>'
  };
  var ic = function (k, cls) { return '<svg viewBox="0 0 24 24" class="' + (cls || 'size-4') + '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '</svg>'; };

  // ---------- Trạng thái ứng dụng ----------
  var S = { user: null, dm: null, coSo: null, loc: { q: '', trangThai: '', maCoSo: '' }, locCS: { q: '', loaiHinh: '', cskv: '', tdp: '' } };
  var laAdmin = function () { return S.user && S.user.Quyen === 'Admin'; };
  var duocGhi = function () { return S.user && (S.user.Quyen === 'Admin' || S.user.Quyen === 'CanBo'); };

  var TRANG = [
    { id: 'tong-quan', ten: 'Tổng quan', ic: 'home' },
    { id: 'tam-tru', ten: 'Khách tạm trú', ngan: 'Khách', ic: 'users' },
    { id: 'co-so', ten: 'Cơ sở lưu trú', ngan: 'Cơ sở', ic: 'building' },
    { id: 'can-bo', ten: 'Cán bộ quản lý', ngan: 'Cán bộ', ic: 'shield', admin: true },
    { id: 'lich-su', ten: 'Lịch sử', ic: 'clock', admin: true }
  ];

  function veNav() {
    var cur = (location.hash.replace('#/', '') || 'tong-quan').split('/')[0];
    var ds = TRANG.filter(function (t) { return !t.admin || laAdmin(); });
    $('#navSide').innerHTML = ds.map(function (t) {
      var soDuyet = t.id === 'can-bo' && S.soChoDuyet ? '<span class="ml-auto badge bg-rose text-rose-ink">' + S.soChoDuyet + '</span>' : '';
      return '<a class="nav-a" href="#/' + t.id + '"' + (t.id === cur ? ' aria-current="page"' : '') + '>' + ic(t.ic, 'size-[18px]') + t.ten + soDuyet + '</a>';
    }).join('');
    $('#navBottom').style.gridTemplateColumns = 'repeat(' + ds.length + ', minmax(0, 1fr))';
    $('#navBottom').innerHTML = ds.map(function (t) {
      var on = t.id === cur;
      return '<a href="#/' + t.id + '" class="flex flex-col items-center justify-center gap-0.5 h-16 text-[11px] font-medium ' + (on ? 'text-brand-600' : 'text-muted') + '">' +
        '<span class="relative grid place-items-center h-7 w-12 rounded-full ' + (on ? 'bg-brand-50' : '') + '">' + ic(t.ic, 'size-5') + (t.id === 'can-bo' && S.soChoDuyet ? '<span class="absolute -top-1 right-1 grid place-items-center min-w-4 h-4 px-1 rounded-full bg-rose-ink text-white text-[10px]">' + S.soChoDuyet + '</span>' : '') + '</span>' + (t.ngan || t.ten) + '</a>';
    }).join('');
    var t = TRANG.filter(function (x) { return x.id === cur; })[0];
    $('#mTitle').textContent = t ? t.ten : 'Quản lý Tạm trú';
  }

  function veUser() {
    var u = S.user;
    var ten = u.HoTen || u.CSKV || u.Email;
    var chu = boDau(ten).replace(/[^a-z]/g, '').slice(0, 1).toUpperCase() || '?';
    var quyen = { Admin: 'Quản trị', CanBo: 'Cán bộ', Xem: 'Chỉ xem' }[u.Quyen] || u.Quyen;
    $('#userBox').innerHTML = '<span class="grid place-items-center size-9 rounded-full bg-peach text-peach-ink font-semibold">' + esc(chu) + '</span>' +
      '<span class="min-w-0 leading-tight"><b class="block text-sm truncate">' + esc(u.HoTen || '(chưa có họ tên)') + '</b><span class="block text-xs text-muted truncate">' + esc(u.Email) + ' · ' + esc(quyen) + '</span></span>' +
      (API.cheDo === 'may-chu' ? '<button data-dang-xuat class="btn-ghost btn-sm ml-auto px-2" title="Đăng xuất">' + ic('out') + '</button>' : '');
    $('#userMini').innerHTML = (API.cheDo === 'may-chu' ? '<button data-dang-xuat class="grid place-items-center size-8 rounded-full bg-peach text-peach-ink text-sm font-semibold" title="' + esc(u.Email) + ' – bấm để đăng xuất">' : '<span class="grid place-items-center size-8 rounded-full bg-peach text-peach-ink text-sm font-semibold" title="' + esc(u.Email) + '">') + esc(chu) + (API.cheDo === 'may-chu' ? '</button>' : '</span>');
  }

  // ---------- Thông báo & xác nhận ----------
  function toast(msg, loai) {
    var el = document.createElement('div');
    var mau = loai === 'loi' ? 'bg-rose text-rose-ink' : loai === 'canh' ? 'bg-butter text-butter-ink' : 'bg-ink text-white';
    el.className = 'fade pointer-events-auto max-w-sm rounded-xl px-4 py-3 text-sm shadow-soft ' + mau;
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(function () { el.remove(); }, 300); }, loai === 'loi' ? 6000 : 3000);
  }
  function hoi(tieuDe, noiDung, nutDongY, nguyHiem, extraHtml) {
    return new Promise(function (ok) {
      $('#dlgTitle').textContent = tieuDe; $('#dlgText').textContent = noiDung || '';
      $('#dlgExtra').innerHTML = extraHtml || '';
      var yes = $('#dlgYes'); yes.textContent = nutDongY || 'Đồng ý';
      yes.className = nguyHiem ? 'btn-danger' : 'btn-primary';
      $('#dlgWrap').hidden = false; yes.focus();
      var xong = function (v) { $('#dlgWrap').hidden = true; yes.onclick = null; $('#dlgNo').onclick = null; ok(v); };
      yes.onclick = function () { var inp = $('#dlgExtra input'); xong(inp ? { v: inp.value } : true); };
      $('#dlgNo').onclick = function () { xong(false); };
    });
  }
  function goi(action, data) {
    return API.goi(action, data).catch(function (e) { toast(e.message, 'loi'); throw e; });
  }

  // ---------- Ngăn kéo ----------
  function moNganKeo(html) {
    var w = $('#drawerWrap'), d = $('#drawer');
    d.dataset.ma = '';   // ngăn kéo mới: bỏ dấu cơ sở cũ
    d.innerHTML = html; w.hidden = false;
    requestAnimationFrame(function () { d.classList.remove('translate-x-full'); });
    document.body.style.overflow = 'hidden';
    var f = d.querySelector('[autofocus]'); if (f && window.innerWidth > 640) f.focus();
  }
  function dongNganKeo() {
    var w = $('#drawerWrap'), d = $('#drawer');
    d.classList.add('translate-x-full');
    document.body.style.overflow = '';
    d.dataset.ma = '';
    setTimeout(function () { w.hidden = true; d.innerHTML = ''; }, 220);
  }
  function dauNganKeo(tieuDe, phu) {
    return '<header class="flex items-start gap-3 px-5 sm:px-6 py-4 border-b border-line">' +
      '<div class="min-w-0"><h2 class="font-semibold text-lg leading-tight">' + tieuDe + '</h2>' + (phu ? '<p class="text-[13px] text-muted mt-0.5">' + phu + '</p>' : '') + '</div>' +
      '<button data-close class="btn-ghost btn-sm ml-auto -mr-2" aria-label="Đóng">' + ic('x', 'size-5') + '</button></header>';
  }
  document.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) dongNganKeo(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!$('#dlgWrap').hidden) $('#dlgNo').click(); else if (!$('#drawerWrap').hidden) dongNganKeo();
  });

  // ---------- Khung trang ----------
  function dauTrang(tieuDe, moTa, nut) {
    return '<div class="flex flex-wrap items-end gap-3 mb-5 lg:mb-7"><div class="min-w-0"><h1 class="text-xl lg:text-[26px] font-semibold tracking-tight">' + tieuDe + '</h1>' +
      (moTa ? '<p class="text-sm text-muted mt-1">' + moTa + '</p>' : '') + '</div><div class="fixed right-4 bottom-[84px] z-20 sm:static sm:ml-auto flex gap-2 [&_.btn-primary]:h-12 [&_.btn-primary]:px-5 [&_.btn-primary]:rounded-2xl [&_.btn-primary]:shadow-lg [&_.btn-primary]:shadow-brand/30 sm:[&_.btn-primary]:h-10 sm:[&_.btn-primary]:px-4 sm:[&_.btn-primary]:rounded-xl sm:[&_.btn-primary]:shadow-none">' + (nut || '') + '</div></div>';
  }
  var khungCho = function (n) { var s = ''; for (var i = 0; i < (n || 4); i++) s += '<div class="skel h-20 mb-3"></div>'; return s; };
  function trong(tieuDe, moTa, nut) {
    return '<div class="card px-6 py-12 text-center"><div class="mx-auto mb-4 grid place-items-center size-14 rounded-2xl bg-brand-50 text-brand-600">' + ic('users', 'size-6') + '</div>' +
      '<h3 class="font-semibold">' + tieuDe + '</h3><p class="text-sm text-muted mt-1 max-w-md mx-auto">' + moTa + '</p>' + (nut ? '<div class="mt-5">' + nut + '</div>' : '') + '</div>';
  }

  // ================= TỔNG QUAN =================
  function trangTongQuan() {
    var v = $('#view');
    v.innerHTML = dauTrang('Tổng quan', 'Tình hình lưu trú hôm nay', duocGhi() ? '<button class="btn-primary" data-them-khach>' + ic('plus') + 'Đăng ký khách</button>' : '') + khungCho(4);
    var luot = S.luot;
    var tq = S.tqSan ? Promise.resolve(S.tqSan) : goi('tongQuan');
    S.tqSan = null;   // chỉ dùng số liệu gửi kèm lúc mở app 1 lần
    tq.then(function (t) {
      if (luot !== S.luot) return;   // đã chuyển sang trang khác
      var k = t.khach.theoTrangThai;
      var the = function (nhan, so, donVi, mau, icon, link) {
        return '<a href="' + link + '" class="card p-4 lg:p-5 flex flex-col gap-3 hover:-translate-y-0.5 transition">' +
          '<span class="grid place-items-center size-10 rounded-xl ' + mau + '">' + ic(icon, 'size-5') + '</span>' +
          '<span><b class="block text-2xl lg:text-[28px] font-semibold leading-none">' + soVN(so) + '</b><span class="text-[13px] text-muted mt-1.5 block">' + nhan + ' <span class="opacity-70">(' + donVi + ')</span></span></span></a>';
      };
      var loai = Object.keys(t.coSo.theoLoaiHinh).sort(function (a, b) { return t.coSo.theoLoaiHinh[b] - t.coSo.theoLoaiHinh[a]; });
      var maxL = Math.max.apply(null, loai.map(function (l) { return t.coSo.theoLoaiHinh[l]; }).concat([1]));
      var cskv = Object.keys(t.coSo.theoCSKV).sort(function (a, b) { return t.coSo.theoCSKV[b].coSo - t.coSo.theoCSKV[a].coSo; });

      var pv = S.phamVi || { toanPhuong: true };
      var moTa = (pv.toanPhuong ? 'Toàn phường' : 'Địa bàn CSKV ' + esc(pv.cskv || '(chưa gắn)') + ' · ' + soVN(pv.soCoSo) + ' cơ sở') + ' · số liệu đến ngày ' + vn(t.homNay);
      var html = dauTrang('Tổng quan', moTa, duocGhi() && (pv.toanPhuong || pv.soCoSo) ? '<button class="btn-primary" data-them-khach>' + ic('plus') + 'Đăng ký khách</button>' : '') +
        (!pv.toanPhuong && !pv.soCoSo ? '<div class="flex gap-2 items-start rounded-2xl bg-butter text-butter-ink px-4 py-3 text-sm mb-5">' + ic('alert', 'size-4 mt-0.5 shrink-0') + '<span>Tài khoản của bạn ' + (pv.cskv ? 'gắn CSKV <b>' + esc(pv.cskv) + '</b> nhưng chưa có cơ sở nào mang tên CSKV này' : 'chưa được gắn CSKV') + '. Liên hệ Admin để gắn đúng địa bàn.</span></div>' : '') +
        '<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">' +
        the('Đang lưu trú', t.khach.dangLuuTru, 'người', 'bg-mint text-mint-ink', 'users', '#/tam-tru') +
        the('Sắp hết hạn', k['Sắp hết hạn'], 'người', 'bg-butter text-butter-ink', 'clock', '#/tam-tru/Sắp hết hạn') +
        the('Quá hạn', k['Quá hạn'], 'người', 'bg-rose text-rose-ink', 'alert', '#/tam-tru/Quá hạn') +
        the('Cơ sở lưu trú', t.coSo.tong, 'cơ sở', 'bg-lilac text-lilac-ink', 'building', '#/co-so') +
        '</div><div class="grid lg:grid-cols-5 gap-4 lg:gap-6">' +
        // Cần xử lý
        '<section class="card lg:col-span-3 overflow-hidden self-start"><header class="flex items-center px-5 py-4"><h2 class="font-semibold">Cần xử lý</h2><span class="text-[13px] text-muted ml-2">quá hạn & còn ≤ 3 ngày</span></header>' +
        (t.canXuLy.length ? '<ul>' + t.canXuLy.map(function (r) {
          return '<li><button data-xem-khach="' + esc(r.ID) + '" class="w-full text-left flex items-center gap-3 px-5 py-3 border-t border-line hover:bg-canvas/60">' +
            '<span class="min-w-0 flex-1"><b class="block text-sm truncate">' + esc(r.HoTen) + '</b><span class="block text-xs text-muted truncate">' + esc(r.TenCoSo) + (r.SoPhong ? ' · P.' + esc(r.SoPhong) : '') + '</span></span>' +
            '<span class="text-right shrink-0">' + badgeTT(r.TrangThai) + '<span class="block text-xs text-muted mt-1">' + conLaiTxt(r) + '</span></span></button></li>';
        }).join('') + '</ul>' : '<div class="px-5 pb-8 pt-4 text-center"><span class="mx-auto grid place-items-center size-12 rounded-2xl bg-mint text-mint-ink mb-3">' + ic('check', 'size-6') + '</span><p class="text-sm font-medium">Không có việc cần xử lý</p><p class="text-[13px] text-muted mt-0.5">Chưa có khách quá hạn hoặc sắp hết hạn.</p></div>') + '</section>' +
        // Cơ sở theo loại hình
        '<section class="card lg:col-span-2 p-5"><h2 class="font-semibold mb-1">Cơ sở theo loại hình</h2><p class="text-[13px] text-muted mb-4">' + soVN(t.coSo.tong) + ' cơ sở · ' + soVN(t.coSo.dungHoatDong) + ' dừng hoạt động · ' + soVN(t.coSo.daKiemTra) + ' đã kiểm tra 9/2026</p>' +
        loai.map(function (l) {
          var n = t.coSo.theoLoaiHinh[l];
          return '<a href="#/co-so" data-loc-loai="' + esc(l) + '" class="block mb-3 group"><div class="flex justify-between text-sm mb-1.5"><span class="group-hover:text-brand-600">' + esc(l) + '</span><b class="font-semibold">' + soVN(n) + '</b></div>' +
            '<div class="h-2.5 rounded-full bg-canvas overflow-hidden"><div class="h-full rounded-full ' + (THANH_LOAI[l] || 'bg-[#C5C9D3]') + '" style="width:' + Math.max(4, n / maxL * 100) + '%"></div></div></a>';
        }).join('') + '</section>' +
        '</div>' +
        // Theo CSKV (chỉ Admin – người khác chỉ có 1 địa bàn)
        (!pv.toanPhuong ? '' : '<section class="card mt-4 lg:mt-6 overflow-hidden"><header class="px-5 py-4"><h2 class="font-semibold">Theo cảnh sát khu vực</h2><p class="text-[13px] text-muted">Số cơ sở phụ trách và số khách đang lưu trú</p></header>' +
        '<div class="overflow-x-auto scroll-thin"><table class="w-full min-w-[420px]"><thead><tr><th class="th">CSKV</th><th class="th text-right">Cơ sở (cơ sở)</th><th class="th text-right">Khách đang ở (người)</th></tr></thead><tbody>' +
        cskv.map(function (c) { var x = t.coSo.theoCSKV[c]; return '<tr class="hover:bg-canvas/60 cursor-pointer" data-loc-cskv="' + esc(c) + '"><td class="td font-medium">' + esc(c) + '</td><td class="td text-right">' + soVN(x.coSo) + '</td><td class="td text-right">' + soVN(x.khachDangO) + '</td></tr>'; }).join('') +
        '</tbody></table></div></section>');
      v.innerHTML = html;
    }).catch(function () { if (luot === S.luot) v.innerHTML = dauTrang('Tổng quan') + trong('Không tải được dữ liệu', 'Kiểm tra kết nối rồi tải lại trang.'); });
  }

  // ================= KHÁCH TẠM TRÚ =================
  var dsKhach = [];
  function trangTamTru(ttTuLink) {
    if (ttTuLink !== undefined) S.loc.trangThai = ttTuLink;
    var v = $('#view');
    v.innerHTML = dauTrang('Khách tạm trú', 'Đăng ký, gia hạn và xác nhận rời đi', duocGhi() ? '<button class="btn-primary" data-them-khach>' + ic('plus') + '<span>Đăng ký khách</span></button>' : '') +
      '<div class="card p-3 sm:p-4 mb-4 flex flex-col gap-3">' +
      '<div class="flex flex-col sm:flex-row gap-2"><label class="relative flex-1"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted">' + ic('search') + '</span>' +
      '<input id="kQ" class="inp pl-9" placeholder="Tìm họ tên, số CCCD/hộ chiếu, phòng…" value="' + esc(S.loc.q) + '"></label>' +
      '<select id="kCS" class="inp sm:w-72"><option value="">Tất cả cơ sở</option></select></div>' +
      '<div id="kChips" class="flex gap-2 overflow-x-auto scroll-thin -mx-1 px-1 pb-0.5"></div></div>' +
      '<div id="kList">' + khungCho(3) + '</div>';
    napCoSo().then(function (cs) {
      if (!$('#kCS')) return;
      $('#kCS').innerHTML = '<option value="">Tất cả cơ sở</option>' + cs.map(function (c) { return '<option value="' + esc(c.MaCoSo) + '"' + (c.MaCoSo === S.loc.maCoSo ? ' selected' : '') + '>' + esc(c.MaCoSo + ' · ' + c.TenCoSo + ' – ' + c.DiaChi) + '</option>'; }).join('');
    });
    $('#kQ').addEventListener('input', debounce(function (e) { S.loc.q = e.target.value; veDsKhach(); }, 150));
    $('#kCS').addEventListener('change', function (e) { S.loc.maCoSo = e.target.value; veDsKhach(); });
    goi('dsTamTru', {}).then(function (ds) { if (!$('#kList')) return; dsKhach = ds; veDsKhach(); })
      .catch(function () { if ($('#kList')) $('#kList').innerHTML = trong('Không tải được danh sách', 'Thử tải lại trang.'); });
  }

  function veDsKhach() {
    var q = boDau(S.loc.q).trim();
    var theoLoc = dsKhach.filter(function (r) {
      if (S.loc.maCoSo && r.MaCoSo !== S.loc.maCoSo) return false;
      if (q && boDau([r.HoTen, r.SoCCCD_Pass, r.SoPhong, r.ID, r.TenCoSo].join(' ')).indexOf(q) < 0) return false;
      return true;
    });
    var dem = { '': 0 };
    theoLoc.forEach(function (r) { dem[r.TrangThai] = (dem[r.TrangThai] || 0) + 1; if (r.TrangThai !== 'Đã rời đi') dem['']++; });
    var chips = [['', 'Đang lưu trú'], ['Sắp hết hạn', 'Sắp hết hạn'], ['Quá hạn', 'Quá hạn'], ['Đang ở', 'Còn hạn'], ['Đã rời đi', 'Đã rời đi'], ['*', 'Tất cả']];
    dem['*'] = theoLoc.length;
    $('#kChips').innerHTML = chips.map(function (c) {
      return '<button class="chip shrink-0" data-tt="' + esc(c[0]) + '" aria-pressed="' + (S.loc.trangThai === c[0]) + '">' + (c[0] && c[0] !== '*' ? '<span class="size-2 rounded-full ' + CHAM_TT[c[0]] + '"></span>' : '') + esc(c[1]) + '<span class="opacity-60">' + soVN(dem[c[0]] || 0) + '</span></button>';
    }).join('');
    var ds = theoLoc.filter(function (r) {
      if (S.loc.trangThai === '*') return true;
      if (S.loc.trangThai === '') return r.TrangThai !== 'Đã rời đi';
      return r.TrangThai === S.loc.trangThai;
    });
    var el = $('#kList');
    if (!dsKhach.length) {
      el.innerHTML = trong('Chưa có khách tạm trú', 'Bấm “Đăng ký khách” để nhập người đến lưu trú tại một cơ sở.', duocGhi() ? '<button class="btn-primary" data-them-khach>' + ic('plus') + 'Đăng ký khách</button>' : '');
      return;
    }
    if (!ds.length) { el.innerHTML = '<div class="card px-6 py-10 text-center text-sm text-muted">Không có khách phù hợp bộ lọc.</div>'; return; }
    var hang = function (r) {
      return '<tr class="hover:bg-canvas/60 cursor-pointer" data-xem-khach="' + esc(r.ID) + '">' +
        '<td class="td"><b class="font-medium block">' + esc(r.HoTen) + '</b><span class="text-xs text-muted">' + esc(r.SoCCCD_Pass) + (r.NgaySinh ? ' · ' + vn(r.NgaySinh) : '') + '</span></td>' +
        '<td class="td"><span class="block truncate max-w-[260px]">' + esc(r.TenCoSo) + '</span><span class="text-xs text-muted">' + esc(r.MaCoSo) + (r.SoPhong ? ' · Phòng ' + esc(r.SoPhong) : '') + '</span></td>' +
        '<td class="td whitespace-nowrap">' + vn(r.NgayDen) + '<span class="text-muted"> → </span>' + (vn(r.NgayDiDuKien) || '<span class="text-muted">—</span>') + '</td>' +
        '<td class="td">' + badgeTT(r.TrangThai) + '<span class="block text-xs text-muted mt-1">' + conLaiTxt(r) + '</span></td>' +
        '<td class="td text-right whitespace-nowrap">' + nutKhach(r, true) + '</td></tr>';
    };
    var the = function (r) {
      return '<article class="card p-4" data-xem-khach="' + esc(r.ID) + '"><div class="flex items-start gap-3"><div class="min-w-0 flex-1"><b class="block truncate">' + esc(r.HoTen) + '</b>' +
        '<span class="text-xs text-muted">' + esc(r.SoCCCD_Pass) + '</span></div>' + badgeTT(r.TrangThai) + '</div>' +
        '<div class="mt-3 text-[13px] text-muted flex flex-col gap-1"><span class="flex items-center gap-1.5">' + ic('building', 'size-3.5 shrink-0') + '<span class="truncate">' + esc(r.TenCoSo) + (r.SoPhong ? ' · P.' + esc(r.SoPhong) : '') + '</span></span>' +
        '<span class="flex items-center gap-1.5">' + ic('clock', 'size-3.5 shrink-0') + vn(r.NgayDen) + ' → ' + (vn(r.NgayDiDuKien) || '—') + ' · <b class="font-medium text-ink">' + conLaiTxt(r) + '</b></span></div>' +
        (duocGhi() && r.TrangThai !== 'Đã rời đi' ? '<div class="flex gap-2 mt-3 pt-3 border-t border-line">' + nutKhach(r, false) + '</div>' : '') + '</article>';
    };
    el.innerHTML = '<div class="hidden md:block card overflow-hidden"><div class="overflow-x-auto scroll-thin"><table class="w-full"><thead><tr><th class="th">Khách</th><th class="th">Cơ sở / phòng</th><th class="th">Đến → Đi dự kiến</th><th class="th">Trạng thái</th><th class="th"></th></tr></thead><tbody>' +
      ds.map(hang).join('') + '</tbody></table></div></div>' +
      '<div class="md:hidden flex flex-col gap-3">' + ds.map(the).join('') + '</div>' +
      '<p class="text-xs text-muted mt-3 px-1">Hiển thị ' + soVN(ds.length) + ' / ' + soVN(dsKhach.length) + ' người</p>';
  }

  function nutKhach(r, gon) {
    if (!duocGhi()) return '';
    var s = '<button class="btn-ghost btn-sm" data-sua-khach="' + esc(r.ID) + '" title="Sửa">' + ic('edit') + (gon ? '' : 'Sửa') + '</button>';
    if (r.TrangThai !== 'Đã rời đi') s += '<button class="btn-soft btn-sm" data-di="' + esc(r.ID) + '" title="Xác nhận rời đi">' + ic('out') + 'Rời đi</button>';
    return s;
  }

  function xemKhach(id) {
    moNganKeo(dauNganKeo('Đang tải…') + '<div class="p-6">' + khungCho(3) + '</div>');
    goi('layTamTru', { id: id }).then(function (r) {
      var dong = function (nhan, gt) { return '<div class="flex gap-4 py-2.5 border-b border-line last:border-0"><dt class="w-36 shrink-0 text-[13px] text-muted">' + nhan + '</dt><dd class="text-sm min-w-0 break-words">' + (gt || '<span class="text-muted">—</span>') + '</dd></div>'; };
      var tep = String(r.AnhGiayTo || '').split(',').filter(String);
      moNganKeo(dauNganKeo(esc(r.HoTen), esc(r.ID) + ' · tạo ' + vnTG(r.NgayTao)) +
        '<div class="flex-1 overflow-y-auto px-5 sm:px-6 py-5">' +
        '<div class="flex flex-wrap items-center gap-2 mb-5">' + badgeTT(r.TrangThai) + '<span class="text-sm text-muted">' + conLaiTxt(r) + '</span></div>' +
        '<dl class="card px-4">' +
        dong('Số CCCD / Hộ chiếu', '<b class="font-medium tracking-wide">' + esc(r.SoCCCD_Pass) + '</b>') + dong('Ngày sinh', vn(r.NgaySinh)) + dong('Giới tính', esc(r.GioiTinh)) + dong('Quốc tịch', esc(r.QuocTich)) +
        '</dl><dl class="card px-4 mt-3">' +
        dong('Cơ sở', '<a href="#/co-so" data-xem-coso="' + esc(r.MaCoSo) + '" class="text-brand-600 hover:underline">' + esc(r.TenCoSo) + '</a><span class="block text-xs text-muted">' + esc(r.MaCoSo + ' · ' + r.DiaChiCoSo) + '</span>') +
        dong('Số phòng', esc(r.SoPhong)) + dong('Ngày đến', vn(r.NgayDen)) + dong('Ngày đi dự kiến', vn(r.NgayDiDuKien)) + dong('Ngày đi thực tế', vn(r.NgayDiThucTe)) +
        '</dl><dl class="card px-4 mt-3">' + dong('Ghi chú', esc(r.GhiChu)) + dong('Tệp đính kèm', tep.length ? tep.length + ' tệp' : '') + dong('Người tạo', esc(r.NguoiTao)) + dong('Cập nhật', vnTG(r.NgayCapNhat) + (r.NguoiCapNhat ? ' · ' + esc(r.NguoiCapNhat) : '')) + '</dl>' +
        '</div>' +
        (duocGhi() ? '<footer class="flex items-center gap-2 px-4 sm:px-6 py-4 border-t border-line">' +
          (laAdmin() ? '<button class="btn-danger px-3" data-xoa-khach="' + esc(r.ID) + '" title="Xoá">' + ic('trash') + '<span class="hidden sm:inline">Xoá</span></button>' : '') +
          '<span class="flex-1"></span><button class="btn-soft" data-sua-khach="' + esc(r.ID) + '">' + ic('edit') + 'Sửa</button>' +
          (r.TrangThai !== 'Đã rời đi' ? '<button class="btn-primary" data-di="' + esc(r.ID) + '">' + ic('out') + 'Xác nhận rời đi</button>' : '') + '</footer>' : ''));
    }).catch(dongNganKeo);
  }

  function formKhach(r, maCoSoSan) {
    var moi = !r;
    r = r || { NgayDen: homNay(), QuocTich: 'Việt Nam', MaCoSo: maCoSoSan || '' };
    napCoSo().then(function (cs) {
      var dangHD = cs.filter(function (c) { return c.TrangThaiHoatDong !== 'Dừng hoạt động' || c.MaCoSo === r.MaCoSo; });
      var nhanCS = function (c) { return c.MaCoSo + ' · ' + c.TenCoSo + ' – ' + c.DiaChi; };
      var csHienTai = cs.filter(function (c) { return c.MaCoSo === r.MaCoSo; })[0];
      var gt = function (g) { return '<label class="flex-1"><input type="radio" name="GioiTinh" value="' + g + '" class="peer sr-only"' + (r.GioiTinh === g ? ' checked' : '') + '><span class="flex h-10 items-center justify-center rounded-xl border border-line text-sm cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand peer-checked:text-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand/15">' + g + '</span></label>'; };
      moNganKeo(dauNganKeo(moi ? 'Đăng ký khách tạm trú' : 'Sửa thông tin khách', moi ? 'Các ô có dấu * là bắt buộc' : esc(r.ID)) +
        '<form id="fKhach" class="flex-1 overflow-y-auto px-5 sm:px-6 py-5 flex flex-col gap-5" novalidate>' +
        '<fieldset class="grid grid-cols-2 gap-3"><legend class="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Thông tin cá nhân</legend>' +
        '<div class="col-span-2"><label class="lbl" for="HoTen">Họ và tên *</label><input id="HoTen" name="HoTen" class="inp" required maxlength="100" autocomplete="off" value="' + esc(r.HoTen) + '" autofocus></div>' +
        '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="SoCCCD_Pass">Số CCCD / Hộ chiếu *</label><input id="SoCCCD_Pass" name="SoCCCD_Pass" class="inp tracking-wide" required inputmode="text" autocomplete="off" placeholder="12 số CCCD hoặc số hộ chiếu" value="' + esc(r.SoCCCD_Pass) + '"></div>' +
        '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="NgaySinh">Ngày sinh</label><input id="NgaySinh" name="NgaySinh" type="date" class="inp" max="' + homNay() + '" value="' + esc(r.NgaySinh) + '"></div>' +
        '<div class="col-span-2 sm:col-span-1"><span class="lbl">Giới tính</span><div class="flex gap-2">' + gt('Nam') + gt('Nữ') + gt('Khác') + '</div></div>' +
        '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="QuocTich">Quốc tịch</label><input id="QuocTich" name="QuocTich" class="inp" value="' + esc(r.QuocTich) + '"></div>' +
        '</fieldset>' +
        '<fieldset class="grid grid-cols-2 gap-3"><legend class="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Lưu trú</legend>' +
        '<div class="col-span-2"><label class="lbl" for="csTim">Cơ sở lưu trú *</label><input id="csTim" class="inp" list="dsCS" placeholder="Gõ tên, địa chỉ hoặc mã CS-…" autocomplete="off" value="' + esc(csHienTai ? nhanCS(csHienTai) : '') + '">' +
        '<datalist id="dsCS">' + dangHD.map(function (c) { return '<option value="' + esc(nhanCS(c)) + '">'; }).join('') + '</datalist>' +
        '<input type="hidden" name="MaCoSo" id="MaCoSo" value="' + esc(r.MaCoSo) + '"><p id="csGoiY" class="text-xs text-muted mt-1.5">' + (csHienTai ? esc(csHienTai.LoaiHinh + ' · ' + (csHienTai.NguoiQuanLy || '') + ' · CSKV ' + (csHienTai.CSKV || '—')) : dangHD.length + ' cơ sở đang hoạt động') + '</p></div>' +
        '<div><label class="lbl" for="SoPhong">Số phòng</label><input id="SoPhong" name="SoPhong" class="inp" value="' + esc(r.SoPhong) + '"></div>' +
        '<div><label class="lbl" for="NgayDen">Ngày đến *</label><input id="NgayDen" name="NgayDen" type="date" class="inp" required value="' + esc(r.NgayDen) + '"></div>' +
        '<div class="col-span-2"><label class="lbl" for="NgayDiDuKien">Ngày đi dự kiến</label><div class="flex flex-col gap-2"><input id="NgayDiDuKien" name="NgayDiDuKien" type="date" class="inp sm:w-56" value="' + esc(r.NgayDiDuKien) + '">' +
        '<div class="flex gap-1.5 flex-wrap"><span class="text-xs text-muted self-center mr-1">Tính từ ngày đến:</span>' + [1, 3, 7, 30].map(function (n) { return '<button type="button" class="chip" data-cong="' + n + '">+' + n + ' ngày</button>'; }).join('') + '</div></div>' +
        '<p id="ttXem" class="text-[13px] mt-2"></p></div>' +
        (moi ? '' : '<div class="col-span-2"><label class="lbl" for="NgayDiThucTe">Ngày đi thực tế</label><input id="NgayDiThucTe" name="NgayDiThucTe" type="date" class="inp sm:w-48" value="' + esc(r.NgayDiThucTe) + '"></div>') +
        '</fieldset>' +
        '<fieldset><legend class="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Khác</legend>' +
        '<label class="lbl" for="GhiChu">Ghi chú</label><textarea id="GhiChu" name="GhiChu" rows="2" class="inp h-auto py-2">' + esc(r.GhiChu) + '</textarea>' +
        '<label class="lbl mt-3" for="tep">Ảnh CCCD / hộ chiếu</label><label class="flex items-center gap-3 h-12 px-3 rounded-xl border border-dashed border-line text-sm text-muted cursor-pointer hover:border-brand hover:text-brand-600">' + ic('clip') + '<span id="tepTen">' + (String(r.AnhGiayTo || '').split(',').filter(String).length ? 'Đã có ' + String(r.AnhGiayTo).split(',').filter(String).length + ' tệp · chọn để thêm' : 'Chọn ảnh JPG/PNG hoặc PDF (≤ 5 MB)') + '</span><input id="tep" type="file" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" multiple class="sr-only"></label>' +
        '</fieldset>' +
        '<p id="fLoi" class="hidden text-sm bg-rose text-rose-ink rounded-xl px-3 py-2"></p>' +
        '</form><footer class="flex gap-2 px-5 sm:px-6 py-4 border-t border-line"><button data-close class="btn-ghost">Huỷ</button><span class="flex-1"></span><button id="fLuu" form="fKhach" type="submit" class="btn-primary min-w-28">' + (moi ? 'Đăng ký' : 'Lưu thay đổi') + '</button></footer>');

      var f = $('#fKhach');
      var capNhatTT = function () {
        var tt = tinhTrangThai(f.NgayDiDuKien.value, f.NgayDiThucTe ? f.NgayDiThucTe.value : '');
        var con = f.NgayDiDuKien.value ? soNgay(homNay(), f.NgayDiDuKien.value) : null;
        var soDem = f.NgayDiDuKien.value && f.NgayDen.value ? soNgay(f.NgayDen.value, f.NgayDiDuKien.value) : null;
        $('#ttXem').innerHTML = 'Trạng thái khi lưu: ' + badgeTT(tt) + (soDem != null && soDem >= 0 ? ' <span class="text-muted">· lưu trú ' + soDem + ' ngày' + (con != null && con >= 0 ? ', còn ' + con + ' ngày' : '') + '</span>' : '');
      };
      capNhatTT();
      ['NgayDiDuKien', 'NgayDen', 'NgayDiThucTe'].forEach(function (n) { if (f[n]) f[n].addEventListener('change', capNhatTT); });
      $$('[data-cong]', f).forEach(function (b) {
        b.addEventListener('click', function () { f.NgayDiDuKien.value = congNgay(f.NgayDen.value || homNay(), +b.dataset.cong); capNhatTT(); });
      });
      $('#csTim').addEventListener('input', function (e) {
        var c = cs.filter(function (x) { return nhanCS(x) === e.target.value; })[0];
        $('#MaCoSo').value = c ? c.MaCoSo : '';
        $('#csGoiY').textContent = c ? c.LoaiHinh + ' · ' + (c.NguoiQuanLy || '') + ' · CSKV ' + (c.CSKV || '—') : 'Chọn một cơ sở trong danh sách gợi ý';
      });
      $('#tep').addEventListener('change', function (e) {
        var n = e.target.files.length; if (n) $('#tepTen').textContent = n + ' tệp sẽ tải lên khi lưu';
      });
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var d = {};
        ['HoTen', 'SoCCCD_Pass', 'NgaySinh', 'QuocTich', 'MaCoSo', 'SoPhong', 'NgayDen', 'NgayDiDuKien', 'NgayDiThucTe', 'GhiChu'].forEach(function (k) { if (f[k]) d[k] = f[k].value.trim(); });
        var g = f.querySelector('[name=GioiTinh]:checked'); d.GioiTinh = g ? g.value : '';
        var loi = !d.HoTen ? 'Chưa nhập họ tên.' : !d.SoCCCD_Pass ? 'Chưa nhập số CCCD/hộ chiếu.' : !d.MaCoSo ? 'Chưa chọn cơ sở lưu trú trong danh sách gợi ý.' : !d.NgayDen ? 'Chưa chọn ngày đến.' :
          (d.NgayDiDuKien && d.NgayDiDuKien < d.NgayDen) ? 'Ngày đi dự kiến trước ngày đến.' : '';
        if (loi) { var p = $('#fLoi'); p.textContent = loi; p.classList.remove('hidden'); return; }
        var nut = $('#fLuu'); nut.disabled = true; nut.textContent = 'Đang lưu…';
        if (!moi) { d.id = r.ID; d._phienBan = r.NgayCapNhat; }
        var tep = Array.prototype.slice.call($('#tep').files);
        API.goi(moi ? 'themTamTru' : 'suaTamTru', d).then(function (kq) {
          return taiTep(kq.ID, tep).then(function () { return kq; });
        }).then(function (kq) {
          S.coSo = null;
          toast(moi ? 'Đã đăng ký ' + kq.HoTen + ' (' + kq.ID + ')' : 'Đã lưu thay đổi');
          dongNganKeo(); lamMoi();
        }).catch(function (err) {
          var p = $('#fLoi'); if (p) { p.textContent = err.message; p.classList.remove('hidden'); }
          nut.disabled = false; nut.textContent = moi ? 'Đăng ký' : 'Lưu thay đổi';
        });
      });
    });
  }

  function taiTep(id, files) {
    var chuoi = Promise.resolve();
    files.forEach(function (file) {
      chuoi = chuoi.then(function () {
        if (file.size > 5 * 1024 * 1024) { toast(file.name + ': vượt quá 5 MB, bỏ qua', 'canh'); return; }
        return new Promise(function (ok, loi) {
          var rd = new FileReader();
          rd.onload = function () { ok(String(rd.result).split(',')[1]); };
          rd.onerror = loi; rd.readAsDataURL(file);
        }).then(function (b64) { return API.goi('taiTep', { id: id, tenTep: file.name, mimeType: file.type, base64: b64 }); });
      });
    });
    return chuoi;
  }

  function xacNhanDi(id) {
    var r = dsKhach.filter(function (x) { return x.ID === id; })[0];
    hoi('Xác nhận rời đi', (r ? r.HoTen + ' – ' : '') + 'chọn ngày rời đi thực tế:', 'Xác nhận', false,
      '<input type="date" class="inp" value="' + homNay() + '" max="' + homNay() + '"' + (r ? ' min="' + esc(r.NgayDen) + '"' : '') + '>').then(function (kq) {
      if (!kq) return;
      goi('xacNhanDi', { id: id, ngay: kq.v }).then(function (x) { S.coSo = null; toast(x.HoTen + ' đã rời đi ngày ' + vn(x.NgayDiThucTe)); dongNganKeo(); lamMoi(); });
    });
  }

  function xoaKhach(id) {
    hoi('Xoá bản ghi ' + id + '?', 'Chỉ dùng khi nhập nhầm. Bản ghi sẽ bị xoá khỏi danh sách (nội dung vẫn lưu trong Lịch sử).', 'Xoá', true).then(function (ok) {
      if (!ok) return;
      goi('xoaTamTru', { id: id }).then(function () { S.coSo = null; toast('Đã xoá ' + id); dongNganKeo(); lamMoi(); });
    });
  }

  // ================= CƠ SỞ LƯU TRÚ =================
  function napCoSo(buoc) {
    if (S.coSo && !buoc) return Promise.resolve(S.coSo);
    return goi('dsCoSo', {}).then(function (ds) { S.coSo = ds; return ds; });
  }

  function trangCoSo() {
    var v = $('#view');
    v.innerHTML = dauTrang('Cơ sở lưu trú', 'Nhà trọ, nhà nghỉ, nhà cho thuê, khách sạn trên địa bàn', duocGhi() ? '<button class="btn-primary" data-them-coso>' + ic('plus') + 'Thêm cơ sở</button>' : '') +
      '<div class="card p-3 sm:p-4 mb-4 flex flex-col gap-3"><div class="flex flex-col sm:flex-row gap-2">' +
      '<label class="relative flex-1"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted">' + ic('search') + '</span><input id="cQ" class="inp pl-9" placeholder="Tìm tên, địa chỉ, chủ cơ sở, mã…" value="' + esc(S.locCS.q) + '"></label>' +
      '<div class="grid grid-cols-2 gap-2 sm:flex"><select id="cCSKV" class="inp sm:w-40"' + (S.phamVi && !S.phamVi.toanPhuong ? ' hidden' : '') + '></select><select id="cTDP" class="inp sm:w-32"></select></div></div>' +
      '<div id="cChips" class="flex gap-2 overflow-x-auto scroll-thin -mx-1 px-1 pb-0.5"></div></div><div id="cList">' + khungCho(3) + '</div>';
    napCoSo(true).then(function (ds) {
      if (!$('#cList')) return;   // đã chuyển sang trang khác
      var uniq = function (k) { var m = {}; ds.forEach(function (c) { if (c[k] !== '') m[c[k]] = 1; }); return Object.keys(m); };
      $('#cCSKV').innerHTML = '<option value="">Mọi CSKV</option>' + uniq('CSKV').sort(function (a, b) { return a.localeCompare(b, 'vi'); }).map(function (c) { return '<option' + (c === S.locCS.cskv ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
      $('#cTDP').innerHTML = '<option value="">Mọi tổ DP</option>' + uniq('ToDanPho').sort(function (a, b) { return a - b; }).map(function (c) { return '<option value="' + esc(c) + '"' + (String(c) === String(S.locCS.tdp) ? ' selected' : '') + '>Tổ ' + esc(c) + '</option>'; }).join('');
      veDsCoSo();
    }).catch(function () { if ($('#cList')) $('#cList').innerHTML = trong('Không tải được danh sách', 'Thử tải lại trang.'); });
    $('#cQ').addEventListener('input', debounce(function (e) { S.locCS.q = e.target.value; veDsCoSo(); }, 150));
    $('#cCSKV').addEventListener('change', function (e) { S.locCS.cskv = e.target.value; veDsCoSo(); });
    $('#cTDP').addEventListener('change', function (e) { S.locCS.tdp = e.target.value; veDsCoSo(); });
  }

  function veDsCoSo() {
    var q = boDau(S.locCS.q).trim(), L = S.locCS;
    var theoLoc = S.coSo.filter(function (c) {
      if (L.cskv && c.CSKV !== L.cskv) return false;
      if (L.tdp && String(c.ToDanPho) !== String(L.tdp)) return false;
      if (q && boDau([c.MaCoSo, c.TenCoSo, c.DiaChi, c.NguoiQuanLy, c.SoDienThoai].join(' ')).indexOf(q) < 0) return false;
      return true;
    });
    var dem = { '': theoLoc.length };
    theoLoc.forEach(function (c) { dem[c.LoaiHinh] = (dem[c.LoaiHinh] || 0) + 1; });
    var loai = [''].concat((S.dm ? S.dm.LoaiHinh : []).filter(function (l) { return dem[l]; }));
    $('#cChips').innerHTML = loai.map(function (l) {
      return '<button class="chip shrink-0" data-loai="' + esc(l) + '" aria-pressed="' + (L.loaiHinh === l) + '">' + esc(l || 'Tất cả') + '<span class="opacity-60">' + soVN(dem[l] || 0) + '</span></button>';
    }).join('');
    var ds = theoLoc.filter(function (c) { return !L.loaiHinh || c.LoaiHinh === L.loaiHinh; });
    if (!ds.length) { $('#cList').innerHTML = '<div class="card px-6 py-10 text-center text-sm text-muted">Không có cơ sở phù hợp bộ lọc.</div>'; return; }
    $('#cList').innerHTML = '<div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">' + ds.map(function (c) {
      var dung = c.TrangThaiHoatDong === 'Dừng hoạt động';
      return '<button data-xem-coso="' + esc(c.MaCoSo) + '" class="card min-w-0 p-4 text-left flex flex-col gap-3 hover:-translate-y-0.5 hover:border-[#D6DAF5] transition' + (dung ? ' opacity-70' : '') + '">' +
        '<div class="flex items-start gap-2 w-full"><div class="min-w-0 flex-1"><b class="block truncate">' + esc(c.TenCoSo) + '</b><span class="text-xs text-muted">' + esc(c.MaCoSo) + (c.ToDanPho !== '' ? ' · Tổ ' + esc(c.ToDanPho) : '') + '</span></div>' + badgeLoai(c.LoaiHinh) + '</div>' +
        '<div class="text-[13px] text-muted flex flex-col gap-1 w-full"><span class="flex items-center gap-1.5">' + ic('pin', 'size-3.5 shrink-0') + '<span class="truncate">' + esc(c.DiaChi) + '</span></span>' +
        '<span class="flex items-center gap-1.5">' + ic('user', 'size-3.5 shrink-0') + '<span class="truncate">' + esc(c.NguoiQuanLy || '—') + (c.CSKV ? ' · CSKV ' + esc(c.CSKV) : '') + '</span></span></div>' +
        '<div class="flex flex-wrap gap-1.5 w-full pt-3 border-t border-line">' +
        '<span class="badge bg-canvas text-ink">' + ic('users', 'size-3.5') + soVN(c.KhachDangO) + ' khách đang ở</span>' +
        (c.KhachQuaHan ? '<span class="badge bg-rose text-rose-ink">' + c.KhachQuaHan + ' quá hạn</span>' : '') +
        (c.KhachSapHet ? '<span class="badge bg-butter text-butter-ink">' + c.KhachSapHet + ' sắp hết hạn</span>' : '') +
        (dung ? '<span class="badge bg-fog text-fog-ink">Dừng hoạt động</span>' : '') +
        (c.KiemTra092026 === true ? '<span class="badge bg-mint text-mint-ink">' + ic('check', 'size-3.5') + 'Đã KT 9/2026</span>' : '') +
        '</div></button>';
    }).join('') + '</div><p class="text-xs text-muted mt-3 px-1">Hiển thị ' + soVN(ds.length) + ' / ' + soVN(S.coSo.length) + ' cơ sở</p>';
  }

  // Chi tiết cơ sở: hiện ngay từ danh sách đã tải (kèm nút Đăng ký khách), danh sách khách tải bổ sung sau
  function xemCoSo(ma) {
    var sanCo = (S.coSo || []).filter(function (x) { return x.MaCoSo === ma; })[0];
    if (sanCo) veCoSo(sanCo);
    else moNganKeo(dauNganKeo('Đang tải…') + '<div class="p-6">' + khungCho(3) + '</div>');
    goi('layCoSo', { ma: ma }).then(function (c) {
      if (!sanCo) return veCoSo(c, c.Khach);
      if ($('#drawer').dataset.ma === ma) veKhachCoSo(c, c.Khach);   // ngăn kéo vẫn đang mở đúng cơ sở này
    }).catch(function () {
      if (!sanCo) return dongNganKeo();
      if ($('#drawer').dataset.ma === ma && $('#csKhach')) $('#csKhach').innerHTML = '<p class="text-sm text-rose-ink">Không tải được danh sách khách. Đóng và mở lại để thử lại.</p>';
    });
  }

  function veCoSo(c, khach) {
    var dong = function (nhan, gt) { return '<div class="flex gap-4 py-2.5 border-b border-line last:border-0"><dt class="w-36 shrink-0 text-[13px] text-muted">' + nhan + '</dt><dd class="text-sm min-w-0 break-words">' + (gt === '' || gt == null ? '<span class="text-muted">—</span>' : gt) + '</dd></div>'; };
    moNganKeo(dauNganKeo(esc(c.TenCoSo), esc(c.MaCoSo) + ' · ' + esc(c.LoaiHinh)) +
      '<div class="flex-1 overflow-y-auto px-5 sm:px-6 py-5">' +
      '<div id="csDem" class="grid grid-cols-3 gap-2 mb-4"></div>' +
      '<dl class="card px-4">' + dong('Địa chỉ', esc(c.DiaChi)) + dong('Người quản lý', esc(c.NguoiQuanLy)) + dong('Số điện thoại', c.SoDienThoai ? '<a class="text-brand-600" href="tel:' + esc(c.SoDienThoai) + '">' + esc(c.SoDienThoai) + '</a>' : '') +
      dong('Địa chỉ chủ cơ sở', esc(c.DiaChiNguoiQuanLy)) + dong('Số phòng', c.SoLuongPhong === '' ? '' : soVN(c.SoLuongPhong)) + dong('Nhân khẩu khai báo', c.SoNhanKhauKhaiBao === '' ? '' : soVN(c.SoNhanKhauKhaiBao) + ' <span class="text-xs text-muted">(theo phiếu thống kê' + (c.NgayKhaiBao ? ' ' + vn(c.NgayKhaiBao) : '') + ')</span>') +
      dong('Tổ dân phố', esc(c.ToDanPho)) + dong('CSKV', esc(c.CSKV)) + dong('Kiểm tra 9/2026', c.KiemTra092026 === true ? 'Đã kiểm tra' : 'Chưa') +
      dong('Hoạt động', esc(c.TrangThaiHoatDong)) + dong('Ghi chú', esc(c.GhiChu)) + dong('Nguồn', '<span class="text-xs text-muted">' + esc(c.NguonDuLieu) + '</span>') + '</dl>' +
      '<div id="csKhach" class="mt-6"></div>' +
      '</div>' +
      (duocGhi() ? '<footer class="flex items-center gap-2 px-4 sm:px-6 py-4 border-t border-line">' + (laAdmin() ? '<button class="btn-danger px-3" data-xoa-coso="' + esc(c.MaCoSo) + '" title="Xoá">' + ic('trash') + '<span class="hidden sm:inline">Xoá</span></button>' : '') +
        '<span class="flex-1"></span><button class="btn-soft" data-sua-coso="' + esc(c.MaCoSo) + '">' + ic('edit') + 'Sửa</button>' +
        (c.TrangThaiHoatDong !== 'Dừng hoạt động' ? '<button class="btn-primary" data-them-khach="' + esc(c.MaCoSo) + '">' + ic('plus') + 'Đăng ký khách</button>' : '') + '</footer>' : ''));
    $('#drawer').dataset.ma = c.MaCoSo;
    veKhachCoSo(c, khach);
  }

  /** khach = null: đang tải (hiện số đếm từ danh sách, khung chờ cho danh sách khách). */
  function veKhachCoSo(c, khach) {
    if (!$('#csDem')) return;
    var dangO = khach ? khach.filter(function (k) { return k.TrangThai !== 'Đã rời đi'; }) : null;
    $('#csDem').innerHTML = [['Đang ở', dangO ? dangO.length : c.KhachDangO, 'bg-mint text-mint-ink'], ['Sắp hết hạn', c.KhachSapHet, 'bg-butter text-butter-ink'], ['Quá hạn', c.KhachQuaHan, 'bg-rose text-rose-ink']].map(function (x) {
      return '<div class="rounded-xl p-3 ' + x[2] + '"><b class="text-xl leading-none">' + soVN(x[1]) + '</b> <span class="text-xs opacity-80">người</span><span class="block text-xs mt-1">' + x[0] + '</span></div>';
    }).join('');
    $('#csKhach').innerHTML = '<h3 class="font-semibold mb-3">Khách đang lưu trú' + (dangO ? ' <span class="text-muted font-normal">(' + dangO.length + ' người)</span>' : '') + '</h3>' +
      (!dangO ? '<div class="skel h-14 mb-2"></div><div class="skel h-14"></div>' :
        dangO.length ? '<ul class="card divide-y divide-line">' + dangO.map(function (k) {
          return '<li><button data-xem-khach="' + esc(k.ID) + '" class="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-canvas/60"><span class="min-w-0 flex-1"><b class="block text-sm truncate">' + esc(k.HoTen) + '</b><span class="text-xs text-muted">' + (k.SoPhong ? 'Phòng ' + esc(k.SoPhong) + ' · ' : '') + conLaiTxt(k) + '</span></span>' + badgeTT(k.TrangThai) + '</button></li>';
        }).join('') + '</ul>' : '<p class="text-sm text-muted">Chưa có khách đang lưu trú.</p>');
  }

  function formCoSo(c) {
    var moi = !c; c = c || { KiemTra092026: false };
    var dm = S.dm || { LoaiHinh: [] };
    var o = function (id, nhan, cls, attr) { return '<div class="' + (cls || '') + '"><label class="lbl" for="' + id + '">' + nhan + '</label><input id="' + id + '" name="' + id + '" class="inp" value="' + esc(c[id]) + '" ' + (attr || '') + '></div>'; };
    moNganKeo(dauNganKeo(moi ? 'Thêm cơ sở lưu trú' : 'Sửa cơ sở', moi ? 'Mã cơ sở được cấp tự động' : esc(c.MaCoSo)) +
      '<form id="fCS" class="flex-1 overflow-y-auto px-5 sm:px-6 py-5 grid grid-cols-2 gap-3 content-start" novalidate>' +
      o('TenCoSo', 'Tên cơ sở *', 'col-span-2', 'required autofocus') +
      '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="LoaiHinh">Loại hình *</label><select id="LoaiHinh" name="LoaiHinh" class="inp"><option value="">— Chọn —</option>' + dm.LoaiHinh.map(function (l) { return '<option' + (l === c.LoaiHinh ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></div>' +
      '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="TrangThaiHoatDong">Hoạt động</label><select id="TrangThaiHoatDong" name="TrangThaiHoatDong" class="inp"><option value="">(chưa ghi nhận)</option>' + (dm.TrangThaiHoatDong || []).map(function (l) { return '<option' + (l === c.TrangThaiHoatDong ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></div>' +
      o('DiaChi', 'Địa chỉ cơ sở *', 'col-span-2', 'required') +
      o('NguoiQuanLy', 'Người quản lý / chủ cơ sở', 'col-span-2 sm:col-span-1') + o('SoDienThoai', 'Số điện thoại', 'col-span-2 sm:col-span-1', 'inputmode="tel"') +
      o('DiaChiNguoiQuanLy', 'Địa chỉ thường trú của chủ cơ sở', 'col-span-2') +
      o('SoLuongPhong', 'Số lượng phòng', '', 'inputmode="numeric"') + o('SoNhanKhauKhaiBao', 'Nhân khẩu khai báo', '', 'inputmode="numeric"') +
      o('ToDanPho', 'Tổ dân phố', '', 'inputmode="numeric"') + (laAdmin() ? o('CSKV', 'CSKV phụ trách', '', 'list="dsCSKV"') : '<div><label class="lbl" for="CSKV">CSKV phụ trách</label><input id="CSKV" name="CSKV" class="inp bg-canvas text-muted" readonly value="' + esc(moi ? S.user.CSKV : c.CSKV) + '" title="Chỉ Admin được đổi CSKV"></div>') +
      '<datalist id="dsCSKV">' + (S.coSo || []).map(function (x) { return x.CSKV; }).filter(function (x, i, a) { return x && a.indexOf(x) === i; }).map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>' +
      '<label class="col-span-2 flex items-center gap-2 text-sm mt-1"><input type="checkbox" name="KiemTra092026" class="size-4 accent-[#6C7BF2]"' + (c.KiemTra092026 === true ? ' checked' : '') + '> Đã kiểm tra đợt 9/2026</label>' +
      '<div class="col-span-2"><label class="lbl" for="GhiChuCS">Ghi chú</label><textarea id="GhiChuCS" name="GhiChu" rows="2" class="inp h-auto py-2">' + esc(c.GhiChu) + '</textarea></div>' +
      '<p id="fLoi" class="col-span-2 hidden text-sm bg-rose text-rose-ink rounded-xl px-3 py-2"></p></form>' +
      '<footer class="flex gap-2 px-5 sm:px-6 py-4 border-t border-line"><button data-close class="btn-ghost">Huỷ</button><span class="flex-1"></span><button id="fLuu" form="fCS" class="btn-primary min-w-28">' + (moi ? 'Thêm' : 'Lưu thay đổi') + '</button></footer>');
    var f = $('#fCS');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = {};
      ['TenCoSo', 'LoaiHinh', 'TrangThaiHoatDong', 'DiaChi', 'NguoiQuanLy', 'SoDienThoai', 'DiaChiNguoiQuanLy', 'SoLuongPhong', 'SoNhanKhauKhaiBao', 'ToDanPho', 'CSKV', 'GhiChu'].forEach(function (k) { d[k] = f[k].value.trim(); });
      d.KiemTra092026 = f.KiemTra092026.checked;
      var loi = !d.TenCoSo ? 'Chưa nhập tên cơ sở.' : !d.LoaiHinh ? 'Chưa chọn loại hình.' : !d.DiaChi ? 'Chưa nhập địa chỉ.' : '';
      if (loi) { $('#fLoi').textContent = loi; $('#fLoi').classList.remove('hidden'); return; }
      if (!moi) { d.ma = c.MaCoSo; d._phienBan = c.NgayCapNhat; }
      var nut = $('#fLuu'); nut.disabled = true;
      API.goi(moi ? 'themCoSo' : 'suaCoSo', d).then(function (kq) {
        toast(moi ? 'Đã thêm ' + kq.MaCoSo : 'Đã lưu ' + kq.MaCoSo); S.coSo = null; dongNganKeo(); lamMoi();
      }).catch(function (err) { $('#fLoi').textContent = err.message; $('#fLoi').classList.remove('hidden'); nut.disabled = false; });
    });
  }

  // ================= CÁN BỘ =================
  var dsCB = [];
  function trangCanBo() {
    var v = $('#view');
    v.innerHTML = dauTrang('Cán bộ quản lý', 'Tài khoản Google được phép đăng nhập và quyền hạn', laAdmin() ? '<button class="btn-primary" data-them-cb>' + ic('plus') + 'Thêm cán bộ</button>' : '') + '<div id="cbList">' + khungCho(3) + '</div>';
    goi('dsCanBo').then(function (ds) {
      if (!$('#cbList')) return;   // đã chuyển sang trang khác
      dsCB = ds;
      var chua = ds.filter(function (x) { return x.TrangThai === 'Chưa kích hoạt'; }).length;
      var mauQ = { Admin: 'bg-lilac text-lilac-ink', CanBo: 'bg-sky text-sky-ink', Xem: 'bg-fog text-fog-ink' };
      var mauT = { 'Hoạt động': 'bg-mint text-mint-ink', 'Chưa kích hoạt': 'bg-butter text-butter-ink', 'Chờ duyệt': 'bg-sky text-sky-ink', 'Từ chối': 'bg-rose text-rose-ink', 'Khoá': 'bg-rose text-rose-ink' };
      var choDuyet = ds.filter(function (x) { return x.TrangThai === 'Chờ duyệt'; });
      S.soChoDuyet = laAdmin() ? choDuyet.length : 0; veNav();
      ds = ds.filter(function (x) { return x.TrangThai !== 'Chờ duyệt'; });
      $('#cbList').innerHTML = (laAdmin() && choDuyet.length ? '<section class="mb-5"><h2 class="font-semibold mb-3">Yêu cầu truy cập chờ duyệt <span class="text-muted font-normal">(' + choDuyet.length + ')</span></h2><div class="grid md:grid-cols-2 gap-3">' +
        choDuyet.map(function (x) {
          return '<article class="card p-4 border-sky"><div class="flex items-start gap-3"><span class="grid place-items-center size-10 rounded-full bg-sky text-sky-ink shrink-0">' + ic('user', 'size-5') + '</span>' +
            '<div class="min-w-0 flex-1"><b class="block truncate">' + esc(x.HoTen) + '</b><span class="block text-xs text-muted truncate">' + esc(x.Email) + '</span>' +
            '<span class="block text-xs text-muted mt-1">' + (x.CSKV ? 'Khai CSKV: <b class="text-ink">' + esc(x.CSKV) + '</b> · ' : '') + 'gửi ' + vnTG(x.NgayTao) + '</span>' +
            (x.GhiChu ? '<span class="block text-xs text-muted mt-1 break-words">' + esc(x.GhiChu) + '</span>' : '') + '</div></div>' +
            '<div class="flex gap-2 mt-3 pt-3 border-t border-line"><button class="btn-danger btn-sm" data-tuchoi-cb="' + esc(x.MaCanBo) + '">Từ chối</button><span class="flex-1"></span><button class="btn-primary btn-sm" data-duyet-cb="' + esc(x.MaCanBo) + '">' + ic('check') + 'Xem & duyệt</button></div></article>';
        }).join('') + '</div></section>' : '') +
        (chua ? '<div class="flex gap-2 items-start rounded-2xl bg-butter text-butter-ink px-4 py-3 text-sm mb-4">' + ic('alert', 'size-4 mt-0.5 shrink-0') + '<span>' + chua + ' cán bộ chưa có email nên chưa đăng nhập được. Họ tên và email cần được bổ sung.</span></div>' : '') +
        '<div class="card overflow-hidden"><div class="overflow-x-auto scroll-thin"><table class="w-full min-w-[640px]"><thead><tr><th class="th">Mã</th><th class="th">Họ tên / CSKV</th><th class="th">Email</th><th class="th">Quyền</th><th class="th">Trạng thái</th>' + (laAdmin() ? '<th class="th"></th>' : '') + '</tr></thead><tbody>' +
        ds.map(function (x) {
          return '<tr class="hover:bg-canvas/60"><td class="td text-muted">' + esc(x.MaCanBo) + '</td><td class="td"><b class="font-medium block">' + esc(x.HoTen || (x.CSKV ? 'CSKV ' + x.CSKV : '')) + '</b><span class="text-xs text-muted">' + (x.HoTen ? (x.CSKV ? 'CSKV ' + esc(x.CSKV) : '') : 'chưa có họ tên') + (x.PhuongXa ? ' · ' + esc(x.PhuongXa) : '') + '</span></td>' +
            '<td class="td">' + (esc(x.Email) || '<span class="text-muted">—</span>') + '</td><td class="td"><span class="badge ' + (mauQ[x.Quyen] || '') + '">' + esc(x.Quyen) + '</span></td><td class="td"><span class="badge ' + (mauT[x.TrangThai] || 'bg-fog text-fog-ink') + '">' + esc(x.TrangThai) + '</span></td>' +
            (laAdmin() ? '<td class="td text-right"><button class="btn-ghost btn-sm" data-sua-cb="' + esc(x.MaCanBo) + '">' + ic('edit') + '</button></td>' : '') + '</tr>';
        }).join('') + '</tbody></table></div></div>';
      dsCB = ds.concat(choDuyet);
    });
  }

  function formDuyet(x) {
    var trongCho = dsCB.filter(function (c) { return c.TrangThai === 'Chưa kích hoạt' && !c.Email; });
    var khop = trongCho.filter(function (c) { return x.CSKV && boDau(c.CSKV) === boDau(x.CSKV); })[0];
    moNganKeo(dauNganKeo('Duyệt yêu cầu truy cập', esc(x.MaCanBo) + ' · gửi ' + vnTG(x.NgayTao)) +
      '<form id="fDuyet" class="flex-1 overflow-y-auto px-5 sm:px-6 py-5 flex flex-col gap-4" novalidate>' +
      '<dl class="card px-4 text-sm">' +
      [['Họ tên', esc(x.HoTen)], ['Email Google', '<b class="font-medium">' + esc(x.Email) + '</b>'], ['CSKV tự khai', esc(x.CSKV) || '—'], ['Ghi chú', esc(x.GhiChu) || '—']].map(function (d) {
        return '<div class="flex gap-4 py-2.5 border-b border-line last:border-0"><dt class="w-28 shrink-0 text-muted text-[13px]">' + d[0] + '</dt><dd class="min-w-0 break-words">' + d[1] + '</dd></div>';
      }).join('') + '</dl>' +
      '<div><span class="lbl">Cấp quyền *</span><div class="grid grid-cols-3 gap-2">' + [['Xem', 'Chỉ xem'], ['CanBo', 'Cán bộ'], ['Admin', 'Quản trị']].map(function (q) {
        return '<label><input type="radio" name="Quyen" value="' + q[0] + '" class="peer sr-only"' + (q[0] === 'CanBo' ? ' checked' : '') + '><span class="flex h-10 items-center justify-center rounded-xl border border-line text-sm cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand peer-checked:text-brand-600">' + q[1] + '</span></label>';
      }).join('') + '</div><p class="text-xs text-muted mt-1.5">Cán bộ: đăng ký, sửa khách và cơ sở · Chỉ xem: không sửa được · Quản trị: toàn quyền, duyệt người khác.</p>' +
      '<label id="xnAdmin" class="hidden mt-2 flex gap-2 items-start text-sm bg-rose text-rose-ink rounded-xl px-3 py-2"><input type="checkbox" name="xacNhanAdmin" class="mt-0.5"> Tôi xác nhận cấp toàn quyền quản trị cho tài khoản này.</label></div>' +
      '<div><label class="lbl" for="gopVao">Gắn vào dòng CSKV có sẵn</label><select id="gopVao" name="gopVao" class="inp"><option value="">— Không gắn, tạo cán bộ mới —</option>' +
      trongCho.map(function (c) { return '<option value="' + esc(c.MaCanBo) + '"' + (khop && khop.MaCanBo === c.MaCanBo ? ' selected' : '') + '>' + esc(c.MaCanBo + ' · CSKV ' + (c.CSKV || '?')) + '</option>'; }).join('') +
      '</select><p class="text-xs text-muted mt-1.5">' + (khop ? 'Đã tự chọn dòng có tên CSKV trùng với tên người gửi khai. Kiểm tra lại cho đúng người.' : 'Chọn nếu người này là một CSKV đã có sẵn trong danh sách (chưa có email).') + '</p></div>' +
      '<p id="fLoi" class="hidden text-sm bg-rose text-rose-ink rounded-xl px-3 py-2"></p></form>' +
      '<footer class="flex gap-2 px-5 sm:px-6 py-4 border-t border-line"><button class="btn-danger" data-tuchoi-cb="' + esc(x.MaCanBo) + '">Từ chối</button><span class="flex-1"></span><button id="fLuu" form="fDuyet" class="btn-primary min-w-28">' + ic('check') + 'Duyệt</button></footer>');
    var f = $('#fDuyet');
    $$('[name=Quyen]', f).forEach(function (r) { r.addEventListener('change', function () { $('#xnAdmin').classList.toggle('hidden', f.Quyen.value !== 'Admin'); }); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = { ma: x.MaCanBo, Quyen: f.Quyen.value, gopVao: f.gopVao.value, xacNhanAdmin: f.xacNhanAdmin.checked };
      if (d.Quyen === 'Admin' && !d.xacNhanAdmin) { $('#fLoi').textContent = 'Cần tích xác nhận khi cấp quyền Quản trị.'; $('#fLoi').classList.remove('hidden'); return; }
      var nut = $('#fLuu'); nut.disabled = true;
      API.goi('duyetCanBo', d).then(function (r) { toast('Đã duyệt ' + x.Email + ' → ' + r.MaCanBo); dongNganKeo(); lamMoi(); })
        .catch(function (err) { $('#fLoi').textContent = err.message; $('#fLoi').classList.remove('hidden'); nut.disabled = false; });
    });
  }

  function tuChoi(ma) {
    var x = dsCB.filter(function (c) { return c.MaCanBo === ma; })[0];
    hoi('Từ chối yêu cầu của ' + (x ? x.Email : ma) + '?', 'Người này sẽ không đăng nhập được và không gửi lại yêu cầu được. Lý do (không bắt buộc):', 'Từ chối', true,
      '<input class="inp" maxlength="200" placeholder="VD: không xác định được danh tính">').then(function (kq) {
      if (!kq) return;
      goi('tuChoiCanBo', { ma: ma, lyDo: kq.v }).then(function () { toast('Đã từ chối'); dongNganKeo(); lamMoi(); });
    });
  }

  function formCanBo(x) {
    var moi = !x; x = x || { Quyen: 'CanBo', TrangThai: 'Hoạt động' };
    var dm = S.dm;
    var sel = function (id, list, nhan) { return '<div><label class="lbl" for="' + id + '">' + nhan + '</label><select id="' + id + '" name="' + id + '" class="inp">' + list.map(function (l) { return '<option' + (l === x[id] ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></div>'; };
    var o = function (id, nhan, cls, attr) { return '<div class="' + (cls || '') + '"><label class="lbl" for="' + id + '">' + nhan + '</label><input id="' + id + '" name="' + id + '" class="inp" value="' + esc(x[id]) + '" ' + (attr || '') + '></div>'; };
    moNganKeo(dauNganKeo(moi ? 'Thêm cán bộ' : 'Sửa cán bộ', moi ? '' : esc(x.MaCanBo)) +
      '<form id="fCB" class="flex-1 overflow-y-auto px-5 sm:px-6 py-5 grid grid-cols-2 gap-3 content-start" novalidate>' +
      o('HoTen', 'Họ và tên', 'col-span-2', 'autofocus') + o('Email', 'Email Google (dùng để đăng nhập)', 'col-span-2', 'type="email" autocomplete="off"') +
      o('CSKV', 'Tên CSKV', '') + o('PhuongXa', 'Phường / Xã', '') +
      sel('Quyen', dm.Quyen, 'Quyền') + sel('TrangThai', dm.TrangThaiCanBo, 'Trạng thái') +
      '<div class="col-span-2"><label class="lbl" for="GhiChuCB">Ghi chú</label><input id="GhiChuCB" name="GhiChu" class="inp" value="' + esc(x.GhiChu) + '"></div>' +
      '<p class="col-span-2 text-xs text-muted">Admin: toàn quyền, quản lý cán bộ, xoá bản ghi · CanBo: đăng ký, sửa khách và cơ sở · Xem: chỉ xem.</p>' +
      '<p id="fLoi" class="col-span-2 hidden text-sm bg-rose text-rose-ink rounded-xl px-3 py-2"></p></form>' +
      '<footer class="flex gap-2 px-5 sm:px-6 py-4 border-t border-line">' + (!moi ? '<button class="btn-danger" data-xoa-cb="' + esc(x.MaCanBo) + '">' + ic('trash') + '</button>' : '') + '<button data-close class="btn-ghost">Huỷ</button><span class="flex-1"></span><button id="fLuu" form="fCB" class="btn-primary min-w-28">Lưu</button></footer>');
    var f = $('#fCB');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = {};
      ['HoTen', 'Email', 'CSKV', 'PhuongXa', 'Quyen', 'TrangThai', 'GhiChu'].forEach(function (k) { d[k] = f[k].value.trim(); });
      if (!moi) { d.ma = x.MaCanBo; d._phienBan = x.NgayCapNhat; }
      API.goi(moi ? 'themCanBo' : 'suaCanBo', d).then(function () { toast('Đã lưu'); dongNganKeo(); lamMoi(); })
        .catch(function (err) { $('#fLoi').textContent = err.message; $('#fLoi').classList.remove('hidden'); });
    });
  }

  // ================= LỊCH SỬ =================
  function trangLichSu() {
    var v = $('#view');
    v.innerHTML = dauTrang('Lịch sử thao tác', '200 thao tác gần nhất · sao lưu dữ liệu') +
      '<section class="card p-4 sm:p-5 mb-5"><div class="flex flex-wrap items-center gap-3"><div class="min-w-0 flex-1"><h2 class="font-semibold">Sao lưu</h2><p class="text-[13px] text-muted">Tự động lúc 1 giờ sáng mỗi ngày, giữ 30 bản gần nhất trong thư mục Drive “TamTru – Sao lưu”.</p></div>' +
      '<button id="btnSaoLuu" class="btn-soft btn-sm">' + ic('check') + 'Sao lưu ngay</button></div><div id="slList" class="mt-3 text-sm text-muted">Đang tải danh sách…</div></section>' +
      '<div id="lsList">' + khungCho(4) + '</div>';
    var veSaoLuu = function () {
      goi('dsSaoLuu').then(function (ds) {
        if (!$('#slList')) return;
        $('#slList').innerHTML = ds.length ? '<ul class="divide-y divide-line">' + ds.slice(0, 5).map(function (x) {
          return '<li class="py-2 flex gap-3"><span class="flex-1 min-w-0 truncate text-ink">' + esc(x.ten) + '</span><a class="text-brand-600 shrink-0" href="' + esc(x.url) + '" target="_blank" rel="noopener">Mở</a></li>';
        }).join('') + '</ul>' + (ds.length > 5 ? '<p class="text-xs mt-1">… và ' + (ds.length - 5) + ' bản cũ hơn</p>' : '') : 'Chưa có bản sao lưu nào.';
      }).catch(function () { if ($('#slList')) $('#slList').textContent = 'Không tải được danh sách sao lưu.'; });
    };
    veSaoLuu();
    $('#btnSaoLuu').addEventListener('click', function (e) {
      var b = e.currentTarget; b.disabled = true; b.textContent = 'Đang sao lưu…';
      goi('saoLuu').then(function (r) { toast('Đã sao lưu: ' + r.ten); veSaoLuu(); })
        .catch(function () {}).then(function () { if (document.body.contains(b)) { b.disabled = false; b.innerHTML = ic('check') + 'Sao lưu ngay'; } });
    });
    goi('dsLichSu', { gioiHan: 200 }).then(function (ds) {
      if (!$('#lsList')) return;
      var mau = { 'Thêm': 'bg-mint text-mint-ink', 'Sửa': 'bg-sky text-sky-ink', 'Xoá': 'bg-rose text-rose-ink', 'Tải tệp': 'bg-lilac text-lilac-ink', 'Duyệt': 'bg-mint text-mint-ink', 'Sao lưu': 'bg-fog text-fog-ink' };
      var tenBang = { DanhSachTamTru: 'Khách', CoSoLuuTru: 'Cơ sở', CanBoQuanLy: 'Cán bộ' };
      $('#lsList').innerHTML = ds.length ? '<ol class="card divide-y divide-line">' + ds.map(function (x) {
        var nd = x.HanhDong === 'Xoá' ? 'Nội dung bản ghi đã lưu' : x.NoiDung;
        return '<li class="px-4 py-3 flex gap-3"><span class="badge shrink-0 ' + (mau[x.HanhDong] || 'bg-fog text-fog-ink') + '">' + esc(x.HanhDong) + '</span><div class="min-w-0 flex-1 text-sm"><b class="font-medium">' + esc((tenBang[x.Bang] || x.Bang) + ' ' + x.MaBanGhi) + '</b>' +
          '<p class="text-muted text-[13px] break-words line-clamp-2">' + esc(nd) + '</p><p class="text-xs text-muted mt-0.5">' + vnTG(x.ThoiGian) + ' · ' + esc(x.Email) + '</p></div></li>';
      }).join('') + '</ol>' : trong('Chưa có thao tác nào', 'Các thao tác thêm, sửa, xoá sẽ được ghi lại tại đây.');
    });
  }

  // ---------- Điều hướng & sự kiện chung ----------
  function lamMoi() { route(); }
  function route() {
    var h = decodeURIComponent(location.hash.replace('#/', '')).split('/');
    S.luot = (S.luot || 0) + 1;
    veNav();
    if (!$('#drawerWrap').hidden) dongNganKeo();
    window.scrollTo(0, 0);
    if (h[0] === 'tam-tru') return trangTamTru(h[1] !== undefined ? h[1] : undefined);
    if (h[0] === 'co-so') return trangCoSo();
    if (h[0] === 'can-bo' && laAdmin()) return trangCanBo();
    if (h[0] === 'lich-su' && laAdmin()) return trangLichSu();
    return trangTongQuan();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-them-khach],[data-xem-khach],[data-sua-khach],[data-di],[data-xoa-khach],[data-tt],[data-loai],[data-them-coso],[data-xem-coso],[data-sua-coso],[data-xoa-coso],[data-loc-loai],[data-loc-cskv],[data-them-cb],[data-sua-cb],[data-xoa-cb],[data-duyet-cb],[data-tuchoi-cb]');
    if (!t) return;
    var d = t.dataset;
    if ('tt' in d) { S.loc.trangThai = d.tt; return veDsKhach(); }
    if ('loai' in d) { S.locCS.loaiHinh = d.loai; return veDsCoSo(); }
    e.preventDefault(); e.stopPropagation();
    if ('themKhach' in d) return formKhach(null, d.themKhach);
    if ('suaKhach' in d) return goi('layTamTru', { id: d.suaKhach }).then(function (r) { formKhach(r); });
    if ('di' in d) return xacNhanDi(d.di);
    if ('xoaKhach' in d) return xoaKhach(d.xoaKhach);
    if ('xemKhach' in d) return xemKhach(d.xemKhach);
    if ('themCoso' in d) return formCoSo(null);
    if ('suaCoso' in d) return formCoSo((S.coSo || []).filter(function (c) { return c.MaCoSo === d.suaCoso; })[0]);
    if ('xoaCoso' in d) return hoi('Xoá cơ sở ' + d.xoaCoso + '?', 'Chỉ xoá được cơ sở chưa có bản ghi tạm trú nào. Nếu cơ sở ngừng kinh doanh, hãy sửa "Hoạt động" thành "Dừng hoạt động".', 'Xoá', true)
      .then(function (ok) { if (ok) goi('xoaCoSo', { ma: d.xoaCoso }).then(function () { toast('Đã xoá ' + d.xoaCoso); S.coSo = null; dongNganKeo(); lamMoi(); }); });
    if ('xemCoso' in d) return xemCoSo(d.xemCoso);
    if ('locLoai' in d) { S.locCS = { q: '', loaiHinh: d.locLoai, cskv: '', tdp: '' }; location.hash = '#/co-so'; return; }
    if ('locCskv' in d) { S.locCS = { q: '', loaiHinh: '', cskv: d.locCskv, tdp: '' }; location.hash = '#/co-so'; return; }
    if ('duyetCb' in d) return formDuyet(dsCB.filter(function (x) { return x.MaCanBo === d.duyetCb; })[0]);
    if ('tuchoiCb' in d) return tuChoi(d.tuchoiCb);
    if ('themCb' in d) return formCanBo(null);
    if ('suaCb' in d) return formCanBo(dsCB.filter(function (x) { return x.MaCanBo === d.suaCb; })[0]);
    if ('xoaCb' in d) return hoi('Xoá cán bộ ' + d.xoaCb + '?', 'Tài khoản này sẽ không đăng nhập được nữa.', 'Xoá', true)
      .then(function (ok) { if (ok) goi('xoaCanBo', { ma: d.xoaCb }).then(function () { toast('Đã xoá'); dongNganKeo(); lamMoi(); }); });
  });

  // ---------- Khởi động ----------
  // ---------- Đăng nhập Google (Google Identity Services) ----------
  var CFG = window.TAMTRU_CONFIG || {};
  function napGIS() {
    if (window.google && google.accounts && google.accounts.id) return Promise.resolve();
    return new Promise(function (ok, loi) {
      var s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = function () { ok(); }; s.onerror = function () { loi(new Error('Không tải được dịch vụ đăng nhập Google.')); };
      document.head.appendChild(s);
    });
  }

  function manDangNhap(thongBao, loai) {
    var w = $('#loginWrap');
    w.hidden = false;
    $('#loginMsg').innerHTML = thongBao ? '<p class="text-sm rounded-xl px-3 py-2 ' + (loai === 'loi' ? 'bg-rose text-rose-ink' : 'bg-butter text-butter-ink') + '">' + thongBao + '</p>' : '';
    if (!CFG.GOOGLE_CLIENT_ID) { $('#gBtn').innerHTML = '<p class="text-sm text-rose-ink">Chưa điền GOOGLE_CLIENT_ID trong js/config.js.</p>'; return; }
    napGIS().then(function () {
      google.accounts.id.initialize({
        client_id: CFG.GOOGLE_CLIENT_ID,
        callback: function (res) { API.datToken(res.credential); w.hidden = true; vaoHeThong(); },
        auto_select: true, cancel_on_tap_outside: false, ux_mode: 'popup', use_fedcm_for_prompt: true
      });
      $('#gBtn').innerHTML = '';
      google.accounts.id.renderButton($('#gBtn'), { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', locale: 'vi', width: 280 });
      if (!thongBao) google.accounts.id.prompt();
    }).catch(function (e) { $('#gBtn').innerHTML = '<p class="text-sm text-rose-ink">' + esc(e.message) + '</p>'; });
    API.ping().then(function (p) { $('#loginPing').textContent = 'Máy chủ sẵn sàng · phiên bản ' + p.phienBan; })
      .catch(function () { $('#loginPing').textContent = 'Chưa kết nối được máy chủ (kiểm tra API_URL).'; });
  }

  function dangXuat() {
    var em = API.emailToken();
    API.xoaToken();
    if (window.google && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
      if (em) try { google.accounts.id.revoke(em, function () {}); } catch (e) {}
    }
    location.hash = '';
    location.reload();
  }
  document.addEventListener('click', function (e) { if (e.target.closest('[data-dang-xuat]')) { e.preventDefault(); dangXuat(); } });

  // Người đăng nhập Google nhưng chưa có trong CanBoQuanLy: gửi yêu cầu để Admin duyệt
  function manXinQuyen() {
    $('#loginWrap').hidden = false;
    $('#gBtn').innerHTML = '';
    $('#view').innerHTML = '';
    var em = API.emailToken();
    $('#loginMsg').innerHTML = '<form id="fXin" class="text-left flex flex-col gap-3" novalidate>' +
      '<p class="text-sm rounded-xl px-3 py-2 bg-sky text-sky-ink">Tài khoản ' + (em ? '<b>' + esc(em) + '</b> ' : '') + 'chưa có quyền. Gửi yêu cầu để Admin phê duyệt.</p>' +
      '<div><label class="lbl" for="xHoTen">Họ và tên *</label><input id="xHoTen" class="inp" maxlength="100" value="' + esc(API.tenToken()) + '"></div>' +
      '<div class="grid grid-cols-2 gap-2"><div><label class="lbl" for="xCSKV">CSKV / đơn vị</label><input id="xCSKV" class="inp" maxlength="50" placeholder="VD: Long"></div>' +
      '<div><label class="lbl" for="xSDT">Số điện thoại</label><input id="xSDT" class="inp" inputmode="tel" maxlength="20"></div></div>' +
      '<div><label class="lbl" for="xLyDo">Ghi chú cho Admin</label><textarea id="xLyDo" rows="2" maxlength="300" class="inp h-auto py-2" placeholder="Chức vụ, địa bàn phụ trách…"></textarea></div>' +
      '<p id="xLoi" class="hidden text-sm bg-rose text-rose-ink rounded-xl px-3 py-2"></p>' +
      '<div class="flex gap-2 mt-1"><button type="button" data-dang-xuat class="btn-ghost">Tài khoản khác</button><span class="flex-1"></span><button id="xGui" class="btn-primary">Gửi yêu cầu</button></div></form>';
    $('#fXin').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = { HoTen: $('#xHoTen').value.trim(), CSKV: $('#xCSKV').value.trim(), SoDienThoai: $('#xSDT').value.trim(), LyDo: $('#xLyDo').value.trim() };
      if (!d.HoTen) { $('#xLoi').textContent = 'Chưa nhập họ tên.'; $('#xLoi').classList.remove('hidden'); return; }
      $('#xGui').disabled = true; $('#xGui').textContent = 'Đang gửi…';
      API.goi('xinQuyen', d).then(function (r) { manChoDuyet('Đã gửi yêu cầu cho tài khoản ' + r.email + '.'); })
        .catch(function (err) {
          if (err.code === 'CHO_DUYET') return manChoDuyet(err.message);
          $('#xLoi').textContent = err.message; $('#xLoi').classList.remove('hidden');
          $('#xGui').disabled = false; $('#xGui').textContent = 'Gửi yêu cầu';
        });
    });
  }

  function manChoDuyet(thongBao) {
    $('#loginWrap').hidden = false;
    $('#gBtn').innerHTML = '';
    $('#view').innerHTML = '';
    $('#loginMsg').innerHTML = '<div class="flex flex-col items-center gap-3">' +
      '<span class="grid place-items-center size-12 rounded-2xl bg-butter text-butter-ink">' + ic('clock', 'size-6') + '</span>' +
      '<p class="font-medium">Đang chờ Admin phê duyệt</p>' +
      '<p class="text-sm text-muted">' + esc(thongBao || ('Yêu cầu của ' + API.emailToken() + ' đã được gửi.')) + ' Khi được duyệt, bấm "Kiểm tra lại" để vào hệ thống.</p>' +
      '<div class="flex gap-2 mt-2"><button type="button" data-dang-xuat class="btn-ghost">Tài khoản khác</button><button type="button" id="xKiemTra" class="btn-primary">Kiểm tra lại</button></div></div>';
    $('#xKiemTra').addEventListener('click', function () { vaoHeThong(); });
  }

  var daGanRoute = false;
  function vaoHeThong() {
    $('#view').innerHTML = '<div class="py-16 text-center text-sm text-muted">Đang tải dữ liệu…</div>';
    API.goi('batDau', { kemTongQuan: !location.hash || /tong-quan/.test(location.hash) }).then(function (kq) {
      S.user = kq.toi; S.dm = kq.danhMuc; S.soChoDuyet = kq.soChoDuyet || 0; S.phamVi = kq.phamVi || { toanPhuong: true }; S.tqSan = kq.tongQuan || null;
      $('#loginWrap').hidden = true;
      veUser();
      if (!daGanRoute) { window.addEventListener('hashchange', route); daGanRoute = true; }
      route();
    }).catch(function (e) {
      if (e.code === 'CHUA_CAP_QUYEN') return manXinQuyen();
      if (e.code === 'CHO_DUYET') return manChoDuyet(e.message);
      if (API.cheDo !== 'may-chu') { $('#view').innerHTML = trong('Không vào được hệ thống', esc(e.message)); return; }
      if (e.code === 'TU_CHOI' || e.code === 'KHOA') {
        API.xoaToken();
        if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
        return manDangNhap(esc(e.message) + ' Có thể đăng nhập bằng tài khoản khác.', 'loi');
      }
      if (e.code === 'TOKEN' || e.code === 'CHUA_DANG_NHAP') return;   // khiHetPhien đã mở màn đăng nhập
      $('#view').innerHTML = trong('Không vào được hệ thống', esc(e.message) + '<br><button class="btn-soft mt-4" onclick="location.reload()">Thử lại</button>');
    });
  }

  // Tự cập nhật: GitHub Pages cho trình duyệt giữ trang cũ ~10 phút. So phiên bản với version.json (không đệm),
  // khác thì tải lại bằng URL mới (?v=...) để lấy index.html mới. Không tải lại khi đang mở form/ngăn kéo.
  var PB_GIAO_DIEN = '1.3.2';
  function kiemTraBanMoi() {
    if (API.cheDo !== 'may-chu') return;
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) {
      if (!j.v || j.v === PB_GIAO_DIEN || !$('#drawerWrap').hidden || !$('#dlgWrap').hidden) return;
      var k = 'tamtru-nang-' + j.v;
      try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1'); } catch (e) { return; }
      location.replace(location.pathname + '?v=' + encodeURIComponent(j.v) + location.hash);
    }).catch(function () {});
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kiemTraBanMoi(); });

  function khoiDong() {
    kiemTraBanMoi();
    if (API.cheDo === 'xem-truoc') {
      var b = $('#previewBanner'); b.hidden = false;
      b.innerHTML = '<b>Bản xem trước</b> · chạy mã máy chủ thật trong trình duyệt với dữ liệu cơ sở thật từ Excel. Chưa kết nối Google Sheet: mọi thao tác chỉ lưu tạm, tải lại trang là mất.';
      return vaoHeThong();
    }
    if (API.cheDo === 'chua-cau-hinh') {
      $('#view').innerHTML = trong('Chưa kết nối máy chủ', 'Điền API_URL và GOOGLE_CLIENT_ID trong js/config.js.');
      return;
    }
    var daBao = false;
    API.khiHetPhien = function () {
      if (daBao) return; daBao = true;
      dongNganKeo();
      manDangNhap('Phiên đăng nhập đã hết hạn (Google cấp phiên 1 giờ). Vui lòng đăng nhập lại.');
      setTimeout(function () { daBao = false; }, 3000);
    };
    if (API.coToken()) vaoHeThong(); else manDangNhap();
  }
  khoiDong();
})();
