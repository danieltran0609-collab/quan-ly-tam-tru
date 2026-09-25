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
    chev: '<path d="m9 6 6 6-6 6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v7h-4M14 21h.01"/>',
    down: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.1M12 17h.01"/>',
    idcard: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16a3 3 0 0 1 6 0M14 10h4M14 14h3"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    loc: '<path d="M3 5h18l-7 8.5V19l-4 2v-7.5z"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    listcheck: '<path d="M11 6h9M11 12h9M11 18h9"/><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"/>',
    flask: '<path d="M9 3h6M10 3v6.2L4.8 18a1.5 1.5 0 0 0 1.3 2.2h11.8a1.5 1.5 0 0 0 1.3-2.2L14 9.2V3"/><path d="M7.5 15h9"/>'
  };
  var ic = function (k, cls) { return '<svg viewBox="0 0 24 24" class="' + (cls || 'size-4') + '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '</svg>'; };

  // ---------- Trạng thái ứng dụng ----------
  var S = { user: null, dm: null, coSo: null, loc: { q: '', trangThai: '', maCoSo: '', tu: '', den: '', loai: '' }, locCS: { q: '', loaiHinh: '', cskv: '', tdp: '' } };
  var laAdmin = function () { return S.user && S.user.Quyen === 'Admin'; };
  var laLanhDao = function () { return S.user && S.user.Quyen === 'LanhDao'; };
  var duocGhi = function () { return S.user && (S.user.Quyen === 'Admin' || S.user.Quyen === 'CanBo'); };
  var duocGhiBanGhi = function (r) { return duocGhi() || (laLanhDao() && r && r.DuLieuThu === true); };

  var TRANG = [
    { id: 'tong-quan', ten: 'Tổng quan', ic: 'home' },
    { id: 'tam-tru', ten: 'Khách tạm trú', ngan: 'Khách', ic: 'users' },
    { id: 'co-so', ten: 'Cơ sở lưu trú', ngan: 'Cơ sở', ic: 'building', gom: ['co-so', 'bo-sung'] },
    { id: 'bo-sung', ten: 'Bổ sung dữ liệu', ic: 'alert', phu: true },
    { id: 'bao-cao', ten: 'Báo cáo', ic: 'chart' },
    { id: 'du-lieu-thu', ten: 'Dữ liệu thử', ngan: 'Thử', ic: 'flask', chiThu: true, nhom: 'quan-tri' },
    { id: 'can-bo', ten: 'Cán bộ quản lý', ngan: 'Cán bộ', ic: 'shield', admin: true, nhom: 'quan-tri' },
    { id: 'lich-su', ten: 'Lịch sử', ic: 'clock', nhom: 'quan-tri' }
  ];
  var QUAN_TRI = { id: 'quan-tri', ten: 'Quản trị', ic: 'grid', gom: ['quan-tri', 'can-bo', 'lich-su', 'du-lieu-thu'] };
  var TAI_KHOAN = { id: 'tai-khoan', ten: 'Tài khoản', ic: 'user', gom: ['tai-khoan', 'quan-tri', 'can-bo', 'lich-su', 'du-lieu-thu'] };

  function veNav() {
    var cur = (location.hash.replace('#/', '') || 'tong-quan').split('/')[0];
    var ds = TRANG.filter(function (t) { return (!t.admin || laAdmin()) && (!t.chiThu || laAdmin() || laLanhDao()); });
    // Admin: Cán bộ + Lịch sử gom vào nhóm "Quản trị" (điện thoại: 1 nút). Người khác chỉ có Lịch sử nên để chung.
    var gom = laAdmin();
    var chinh = ds.filter(function (t) { return !gom || t.nhom !== 'quan-tri'; });
    var qt = gom ? ds.filter(function (t) { return t.nhom === 'quan-tri'; }) : [];
    var soDuyet = function (t) { return (t.id === 'can-bo' || t.id === 'quan-tri' || t.id === 'tai-khoan') && S.soChoDuyet ? S.soChoDuyet : 0; };
    var link = function (t) {
      return '<a class="nav-a" href="#/' + t.id + '"' + (t.id === cur ? ' aria-current="page"' : '') + '>' + ic(t.ic, 'size-[18px]') + t.ten + (soDuyet(t) ? '<span class="ml-auto badge bg-rose text-rose-ink">' + soDuyet(t) + '</span>' : '') + '</a>';
    };
    $('#navSide').innerHTML = chinh.map(link).join('') +
      (qt.length ? '<p class="px-3 mt-5 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Quản trị</p>' + qt.map(link).join('') : '');
    // Thanh dưới (điện thoại): Tổng quan · Khách · Cơ sở · Báo cáo · Tài khoản (các trang quản trị, lịch sử… nằm trong Tài khoản)
    var duoi = ds.filter(function (t) { return !t.phu && !t.nhom && !t.chiThu; }).concat([TAI_KHOAN]);
    $('#navBottom').style.gridTemplateColumns = 'repeat(' + duoi.length + ', minmax(0, 1fr))';
    $('#navBottom').innerHTML = duoi.map(function (t) {
      var on = t.id === cur || (t.gom && t.gom.indexOf(cur) >= 0);
      return '<a href="#/' + t.id + '" class="flex flex-col items-center justify-center gap-0.5 h-16 text-[11px] font-medium ' + (on ? 'text-brand-600' : 'text-muted') + '"' + (on ? ' aria-current="page"' : '') + '>' +
        '<span class="relative grid place-items-center h-7 w-12 rounded-full ' + (on ? 'bg-brand-50' : '') + '">' + ic(t.ic, 'size-5') + (soDuyet(t) ? '<span class="absolute -top-1 right-1 grid place-items-center min-w-4 h-4 px-1 rounded-full bg-rose-ink text-white text-[10px]">' + soDuyet(t) + '</span>' : '') + '</span>' + (t.ngan || t.ten) + '</a>';
    }).join('');
    var t = TRANG.concat([QUAN_TRI, TAI_KHOAN]).filter(function (x) { return x.id === cur; })[0];
    $('#mTitle').textContent = t ? t.ten : 'Quản lý Tạm trú';
    var oNha = cur === 'tong-quan';
    if ($('#nutLui')) { $('#nutLui').hidden = oNha; $('#nutNha').hidden = oNha; }
  }

  /** Trang "Tài khoản": thông tin người dùng + lối vào quản trị, lịch sử, dữ liệu thử, tài liệu, đăng xuất. */
  function trangTaiKhoan() {
    var u = S.user, pv = S.phamVi || { toanPhuong: true };
    var ten = u.HoTen || u.CSKV || u.Email, chu = boDau(ten).replace(/[^a-z]/g, '').slice(0, 1).toUpperCase() || '?';
    var quyen = { Admin: 'Quản trị', CanBo: 'Cán bộ', Xem: 'Chỉ xem', LanhDao: 'Lãnh đạo' }[u.Quyen] || u.Quyen;
    var o = function (href, icon, ten, moTa, phu, ngoai) {
      return '<a href="' + href + '"' + (ngoai ? ' target="_blank" rel="noopener"' : '') + ' class="flex items-center gap-3 px-4 py-3 min-h-14 hover:bg-canvas/60">' +
        '<span class="grid place-items-center size-10 shrink-0 rounded-xl bg-brand-50 text-brand-600">' + ic(icon, 'size-5') + '</span>' +
        '<span class="min-w-0 flex-1"><b class="block text-sm font-medium">' + ten + '</b><span class="block text-xs text-muted">' + moTa + '</span></span>' + (phu || '') + ic('chev', 'size-4 text-muted shrink-0') + '</a>';
    };
    var nhom = function (tieuDe, ds) { ds = ds.filter(Boolean); return ds.length ? '<h2 class="text-xs font-semibold uppercase tracking-wider text-muted px-1 mt-5 mb-2">' + tieuDe + '</h2><div class="card divide-y divide-line overflow-hidden">' + ds.join('') + '</div>' : ''; };
    $('#view').innerHTML = dauTrang('Tài khoản', '') +
      '<div class="card p-4 flex items-center gap-4"><span class="grid place-items-center size-14 shrink-0 rounded-full bg-peach text-peach-ink text-xl font-semibold">' + esc(chu) + '</span>' +
      '<span class="min-w-0"><b class="block truncate">' + esc(u.HoTen || '(chưa có họ tên)') + '</b><span class="block text-sm text-muted truncate">' + esc(u.Email) + '</span>' +
      '<span class="flex flex-wrap gap-1.5 mt-1.5"><span class="badge bg-lilac text-lilac-ink">' + esc(quyen) + '</span><span class="badge bg-canvas text-ink">' + (pv.toanPhuong ? 'Toàn phường' : 'CSKV ' + esc(pv.cskv || '(chưa gắn)') + ' · ' + soVN(pv.soCoSo) + ' cơ sở') + '</span></span></span></div>' +
      nhom('Quản lý', [
        laAdmin() ? o('#/can-bo', 'shield', 'Cán bộ quản lý', 'Duyệt yêu cầu truy cập, phân quyền, gán CSKV', S.soChoDuyet ? '<span class="badge bg-rose text-rose-ink shrink-0">' + S.soChoDuyet + ' chờ duyệt</span>' : '') : '',
        duocGhi() ? o('#/bo-sung', 'alert', 'Bổ sung dữ liệu cơ sở', 'Cơ sở thiếu số điện thoại, số phòng, đăng ký kinh doanh…') : '',
        laAdmin() || laLanhDao() ? o('#/du-lieu-thu', 'flask', 'Dữ liệu thử', 'Tự tạo cơ sở, khách để thử hệ thống, không tính vào thống kê') : '',
        o('#/lich-su', 'clock', laAdmin() ? 'Lịch sử & sao lưu' : 'Lịch sử thao tác', laAdmin() ? 'Nhật ký thao tác, bản sao lưu hằng ngày, thời hạn lưu trữ' : 'Các thao tác của bạn trên hệ thống')
      ]) +
      nhom('Hỗ trợ', [
        o('huongdan.html', 'help', 'Hướng dẫn sử dụng', 'Cách dùng, cài ứng dụng lên điện thoại (mở tab mới)', '', true),
        o('privacy.html', 'idcard', 'Chính sách quyền riêng tư', 'Dữ liệu được lưu và bảo vệ thế nào (mở tab mới)', '', true)
      ]) +
      (API.cheDo === 'may-chu' ? '<button type="button" data-dang-xuat class="btn-danger w-full h-12 mt-6">' + ic('out') + 'Đăng xuất</button>' : '') +
      '<p class="text-center text-xs text-muted mt-4">Phiên bản giao diện ' + PB_GIAO_DIEN + '</p>';
  }

  function veUser() {
    var u = S.user;
    var ten = u.HoTen || u.CSKV || u.Email;
    var chu = boDau(ten).replace(/[^a-z]/g, '').slice(0, 1).toUpperCase() || '?';
    var quyen = { Admin: 'Quản trị', CanBo: 'Cán bộ', Xem: 'Chỉ xem', LanhDao: 'Lãnh đạo' }[u.Quyen] || u.Quyen;
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
      yes.onclick = function () {
        var inp = $('#dlgExtra input');
        xong(inp ? { v: inp.value, chon: $$('#dlgExtra input[type=checkbox]:checked').map(function (x) { return x.value; }) } : true);
      };
      $('#dlgNo').onclick = function () { xong(false); };
    });
  }
  function goi(action, data) {
    return API.goi(action, data).catch(function (e) { toast(e.message, 'loi'); throw e; });
  }

  // ---------- Bộ nhớ đệm dữ liệu trên máy: chuyển trang hiện ngay, làm mới ngầm ----------
  var DEM = {};              // khoá -> { d: dữ liệu, t: lúc lấy }
  var TUOI_DEM = 20000;      // dữ liệu cũ hơn 20 giây: vẫn hiện ngay, đồng thời tải bản mới
  function layDem(k) { return DEM[k] ? DEM[k].d : null; }
  function datDem(k, d) {
    DEM[k] = { d: d, t: Date.now() };
    if (k === 'dsCoSo') S.coSo = d;
    if (k === 'dsTamTru') dsKhach = d;
  }
  /** Như goi() nhưng: có bộ đệm thì gọi ve(d) ngay, rồi (nếu cũ) tải ngầm và gọi ve lần nữa khi dữ liệu đổi. */
  function docNhanh(k, action, data) {
    var ves = [], lois = [], c = DEM[k], luot = S.luot;
    var obj = { then: function (ve, loi) { ves.push(ve); if (loi) lois.push(loi); return obj; }, catch: function (loi) { lois.push(loi); return obj; } };
    Promise.resolve().then(function () {
      if (c) ves.forEach(function (ve) { ve(c.d, true); });
      if (c && Date.now() - c.t < TUOI_DEM) return;
      API.goi(action, data).then(function (d) {
        var cu = DEM[k]; datDem(k, d);
        if (luot !== S.luot) return;
        if (!cu || JSON.stringify(cu.d) !== JSON.stringify(d)) ves.forEach(function (ve) { ve(d, false); });
      }).catch(function (e) { if (!c) { toast(e.message, 'loi'); lois.forEach(function (l) { l(e); }); } });
    });
    return obj;
  }
  /** Sau khi lưu: đánh dấu các dữ liệu liên quan là cũ (vẫn hiện, lần xem tới sẽ tải ngầm). */
  function sauKhiGhi(nhom) {
    var ds = { khach: ['dsTamTru', 'tongQuan', 'dsCoSo', 'dsLichSu'], coso: ['dsCoSo', 'tongQuan', 'dsLichSu', 'dsTamTru'],
      canbo: ['dsCanBo', 'dsLichSu'], saoluu: ['dsSaoLuu', 'dsLichSu'], nhatky: ['dsLichSu'] }[nhom] || [];
    Object.keys(DEM).forEach(function (k) { if (ds.indexOf(k) >= 0 || (nhom !== 'canbo' && nhom !== 'nhatky' && nhom !== 'saoluu' && k.indexOf('bc:') === 0)) DEM[k].t = 0; });
  }
  function vaKhach(r, xoaId) {
    var ds = layDem('dsTamTru'); if (!ds) return;
    var id = xoaId || r.ID, i = -1;
    for (var j = 0; j < ds.length; j++) if (ds[j].ID === id) { i = j; break; }
    if (xoaId) { if (i >= 0) ds.splice(i, 1); return; }
    if (i >= 0) ds[i] = r; else ds.unshift(r);
  }
  function vaCoSo(c, xoaMa) {
    var ds = layDem('dsCoSo'); if (!ds) return;
    var ma = xoaMa || c.MaCoSo, i = -1;
    for (var j = 0; j < ds.length; j++) if (ds[j].MaCoSo === ma) { i = j; break; }
    if (xoaMa) { if (i >= 0) ds.splice(i, 1); return; }
    var o = {}; for (var k in c) if (k !== '_dong') o[k] = c[k];
    ['KhachDangO', 'KhachSapHet', 'KhachQuaHan'].forEach(function (k) { o[k] = i >= 0 ? ds[i][k] : 0; });
    if (i >= 0) ds[i] = o; else ds.push(o);
  }

  // ---------- Ô ngày: gõ tay dd/mm/yyyy (tự thêm "/") hoặc bấm biểu tượng lịch để chọn ----------
  // Ô ẩn id=<ten> giữ giá trị chuẩn yyyy-mm-dd (hoặc yyyy-mm cho ô tháng) để phần còn lại của mã dùng như cũ.
  function oNgay(ten, giaTri, opt) {
    opt = opt || {};
    var thang = !!opt.thang, mau = thang ? 'mm/yyyy' : 'dd/mm/yyyy';
    var hien = !giaTri ? '' : thang ? giaTri.slice(5, 7) + '/' + giaTri.slice(0, 4) : vn(giaTri);
    return '<div class="relative ' + (opt.cls || '') + '" data-o-ngay="' + ten + '"' + (thang ? ' data-thang="1"' : '') + (opt.min ? ' data-min="' + opt.min + '"' : '') + (opt.max ? ' data-max="' + opt.max + '"' : '') + '>' +
      '<input type="hidden" id="' + ten + '" name="' + ten + '" value="' + esc(giaTri || '') + '">' +
      '<input type="text" id="' + ten + '_g" class="inp pr-10 tabular-nums' + (opt.nho ? ' h-8 text-[13px] w-[8.75rem]' : '') + '" inputmode="numeric" autocomplete="off" placeholder="' + mau + '" maxlength="' + mau.length + '" value="' + esc(hien) + '" aria-label="' + esc((opt.nhan || '') + ' (' + mau + ')') + '">' +
      '<input type="' + (thang ? 'month' : 'date') + '" tabindex="-1" aria-hidden="true" data-lich class="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 opacity-0 cursor-pointer"' + (opt.min ? ' min="' + opt.min + '"' : '') + (opt.max ? ' max="' + opt.max + '"' : '') + ' value="' + esc(giaTri || '') + '">' +
      '<span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted">' + ic('calendar') + '</span></div>' +
      '<p class="hidden text-xs text-rose-ink mt-1" data-loi-ngay="' + ten + '"></p>';
  }
  /** Chuỗi người dùng gõ -> yyyy-mm-dd (hoặc yyyy-mm); null nếu chưa đúng. Nhận "01092026", "1/9/2026", "01-09-2026". */
  function docGo(s, thang) {
    var p = String(s || '').trim().split(/\D+/).filter(String), d, m, y;
    if (thang) {
      if (p.length === 1 && p[0].length === 6) { m = +p[0].slice(0, 2); y = +p[0].slice(2); }
      else if (p.length === 2 && p[1].length === 4) { m = +p[0]; y = +p[1]; } else return null;
      return m >= 1 && m <= 12 && y >= 1900 && y <= 2100 ? y + '-' + pad(m) : null;
    }
    if (p.length === 1 && p[0].length === 8) { d = +p[0].slice(0, 2); m = +p[0].slice(2, 4); y = +p[0].slice(4); }
    else if (p.length === 3 && p[2].length === 4) { d = +p[0]; m = +p[1]; y = +p[2]; } else return null;
    var dt = new Date(y, m - 1, d);
    if (y < 1900 || y > 2100 || dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return isoNgay(dt);
  }
  function hienNgay(iso, thang) { return !iso ? '' : thang ? iso.slice(5, 7) + '/' + iso.slice(0, 4) : vn(iso); }
  function ganNgay(w, iso, tuLich) {
    var an = w.querySelector('input[type=hidden]'), cu = an.value;
    an.value = iso || '';
    var lich = w.querySelector('[data-lich]'); if (lich) lich.value = iso || '';
    if (tuLich) w.querySelector('input[type=text]').value = hienNgay(iso, !!w.dataset.thang);
    if (cu !== an.value) an.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function loiNgay(w, msg) {
    var p = document.querySelector('[data-loi-ngay="' + w.dataset.oNgay + '"]'), o = w.querySelector('input[type=text]');
    if (p) { p.textContent = msg || ''; p.classList.toggle('hidden', !msg); }
    o.classList.toggle('border-rose-ink', !!msg);
  }
  function kiemMotO(w) {
    var o = w.querySelector('input[type=text]'), iso = docGo(o.value, !!w.dataset.thang);
    if (!o.value.trim()) { loiNgay(w, ''); return ''; }
    if (!iso) { loiNgay(w, 'Ngày chưa đúng. Nhập theo dạng ' + (w.dataset.thang ? 'mm/yyyy' : 'dd/mm/yyyy') + '.'); return null; }
    if (w.dataset.max && iso > w.dataset.max) { loiNgay(w, 'Không được sau ' + hienNgay(w.dataset.max, !!w.dataset.thang) + '.'); return null; }
    if (w.dataset.min && iso < w.dataset.min) { loiNgay(w, 'Không được trước ' + hienNgay(w.dataset.min, !!w.dataset.thang) + '.'); return null; }
    loiNgay(w, ''); o.value = hienNgay(iso, !!w.dataset.thang); return iso;
  }
  /** Đặt giá trị cho ô ngày từ mã (nút +N ngày, quét QR…). */
  function datNgay(ten, iso) { var w = document.querySelector('[data-o-ngay="' + ten + '"]'); if (w) { ganNgay(w, iso, true); loiNgay(w, ''); } }
  /** Kiểm tra mọi ô ngày trong vùng; trả về thông báo lỗi đầu tiên (và đưa con trỏ tới ô đó). */
  function kiemNgay(vung) {
    var loi = '';
    $$('[data-o-ngay]', vung).forEach(function (w) {
      if (kiemMotO(w) === null && !loi) { loi = document.querySelector('[data-loi-ngay="' + w.dataset.oNgay + '"]').textContent; w.querySelector('input[type=text]').focus(); }
    });
    return loi;
  }
  document.addEventListener('input', function (e) {
    var o = e.target, w = o.closest && o.closest('[data-o-ngay]');
    if (!w || o.type !== 'text') return;
    var thang = !!w.dataset.thang, xoa = e.inputType && e.inputType.indexOf('delete') === 0;
    // Gõ liền số (hoặc đúng dạng dd/mm/…): tự chèn "/". Gõ tay kiểu 1/9/2026 thì giữ nguyên để tự hiểu.
    var phan = o.value.split('/'), tuDong = /^\d*$/.test(o.value.replace(/\//g, '')) && phan.every(function (x, i) { return i === phan.length - 1 || x.length === 2; });
    if (!xoa && tuDong) {
      var so = o.value.replace(/\//g, '').slice(0, thang ? 6 : 8);
      o.value = thang ? (so.length > 2 ? so.slice(0, 2) + '/' + so.slice(2) : so)
        : so.slice(0, 2) + (so.length > 2 ? '/' + so.slice(2, 4) : '') + (so.length > 4 ? '/' + so.slice(4) : '');
    } else o.value = o.value.replace(/[^\d\/.\-]/g, '');
    var iso = docGo(o.value, thang);
    if (iso && ((w.dataset.max && iso > w.dataset.max) || (w.dataset.min && iso < w.dataset.min))) iso = null;
    ganNgay(w, iso || '', false);
    if (iso) loiNgay(w, '');
  });
  document.addEventListener('focusout', function (e) {
    var w = e.target.closest && e.target.closest('[data-o-ngay]');
    if (w && e.target.type === 'text') kiemMotO(w);
  });
  document.addEventListener('change', function (e) {
    if (!e.target.matches || !e.target.matches('[data-lich]')) return;
    var w = e.target.closest('[data-o-ngay]');
    ganNgay(w, e.target.value, true); loiNgay(w, '');
  });
  document.addEventListener('click', function (e) {
    if (e.target.matches && e.target.matches('[data-lich]') && e.target.showPicker) { try { e.target.showPicker(); } catch (x) {} }
  });

  // ---------- Ngăn kéo ----------
  function moNganKeo(html) {
    var w = $('#drawerWrap'), d = $('#drawer');
    d.dataset.ma = ''; d.dataset.kh = '';   // ngăn kéo mới: bỏ dấu cơ sở / khách cũ
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
  document.addEventListener('click', function (e) { if (e.target.closest('[data-lui]')) { e.preventDefault(); quayLai(); } });
  // Đầu trang điện thoại tự ẩn khi cuộn xuống, hiện lại khi cuộn lên
  (function () {
    var cuoi = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY, dm = $('#dauMobi');
      if (Math.abs(y - cuoi) < 6) return;          // bỏ qua rung nhẹ khi chạm
      if (dm) dm.classList.toggle('an-di', y > cuoi && y > 72);
      cuoi = y;
    }, { passive: true });
  })();
  document.addEventListener('change', function (e) {
    var o = e.target.closest('[data-kt-hop]'); if (!o) return;
    o.disabled = true;
    kiemTraCoSo(o.dataset.ktHop, function () { o.checked = !o.checked; o.disabled = false; }, o.checked);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!$('#dlgWrap').hidden) $('#dlgNo').click(); else if (!$('#drawerWrap').hidden) dongNganKeo();
  });

  // ---------- Khung trang ----------
  function dauTrang(tieuDe, moTa, nut) {
    var cur = (location.hash.replace('#/', '') || 'tong-quan').split('/')[0];
    // Điện thoại: nút chính thành nút tròn nổi (FAB) ở góc dưới bên phải, phía trên thanh điều hướng
    var fab = '';
    if (nut && nut.indexOf('class="btn-primary"') >= 0) {
      var nhanFab = nut.replace(/<[^>]+>/g, '').trim();
      fab = '<div class="fab-wrap sm:hidden fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20">' + nut.replace('class="btn-primary"', 'class="fab" aria-label="' + esc(nhanFab) + '" title="' + esc(nhanFab) + '"') + '</div>';
    }
    var dh = cur === 'tong-quan' ? '' : '<div class="hidden lg:flex items-center gap-1 -ml-2 mb-2">' +
      '<button type="button" data-lui class="btn-ghost btn-sm px-2">' + ic('back') + 'Quay lại</button><span class="text-line">|</span>' +
      '<a href="#/tong-quan" class="btn-ghost btn-sm px-2">' + ic('home') + 'Trang chủ</a></div>';
    return dh + '<div class="flex flex-wrap items-end gap-3 mb-5 lg:mb-7"><div class="min-w-0"><h1 class="text-xl lg:text-[26px] font-semibold tracking-tight">' + tieuDe + '</h1>' +
      (moTa ? '<p class="text-sm text-muted mt-1">' + moTa + '</p>' : '') + '</div>' + (nut ? '<div class="hidden sm:flex sm:ml-auto gap-2">' + nut + '</div>' : '') + '</div>' + fab;
  }
  var khungCho = function (n) { var s = ''; for (var i = 0; i < (n || 4); i++) s += '<div class="skel h-20 mb-3"></div>'; return s; };
  function trong(tieuDe, moTa, nut) {
    return '<div class="card px-6 py-12 text-center"><div class="mx-auto mb-4 grid place-items-center size-14 rounded-2xl bg-brand-50 text-brand-600">' + ic('users', 'size-6') + '</div>' +
      '<h3 class="font-semibold">' + tieuDe + '</h3><p class="text-sm text-muted mt-1 max-w-md mx-auto">' + moTa + '</p>' + (nut ? '<div class="mt-5">' + nut + '</div>' : '') + '</div>';
  }

  // ================= TỔNG QUAN =================
  /** Thống kê những người được đăng ký (nhập vào hệ thống) trong ngày hôm nay, theo từng trạng thái. */
  function theDangKyHomNay(t) {
    var d = t.dangKyHomNay || { tong: 0, theoTrangThai: {}, ds: [] };
    var tt = ['Đang ở', 'Sắp hết hạn', 'Quá hạn', 'Đã rời đi'];
    return '<section class="card mb-4 lg:mb-6 overflow-hidden"><header class="flex flex-wrap items-center gap-x-2 gap-y-1 px-5 pt-4 pb-3"><h2 class="font-semibold">Đăng ký trong ngày</h2>' +
      '<span class="text-[13px] text-muted">' + vn(t.homNay) + ' · ' + soVN(d.tong) + ' người</span>' +
      (d.tong ? '<a href="#/tam-tru" data-xem-ds="homnay" class="ml-auto text-xs text-brand-600 hover:underline">Xem danh sách</a>' : '') + '</header>' +
      '<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 px-5 pb-4">' + tt.map(function (x) {
        return '<div class="rounded-xl p-3 ' + (MAU_TT[x] || 'bg-fog text-fog-ink') + '"><b class="text-xl leading-none">' + soVN(d.theoTrangThai[x] || 0) + '</b> <span class="text-xs opacity-80">người</span><span class="block text-xs mt-1">' + x + '</span></div>';
      }).join('') + '</div>' +
      (d.ds.length ? '<ul>' + d.ds.slice(0, 8).map(function (r) {
        return '<li><button data-xem-khach="' + esc(r.ID) + '" class="w-full text-left flex items-center gap-3 px-5 py-2.5 border-t border-line hover:bg-canvas/60"><span class="min-w-0 flex-1"><b class="block text-sm truncate">' + esc(r.HoTen) + '</b>' +
          '<span class="block text-xs text-muted truncate">' + esc(r.TenCoSo) + (r.SoPhong ? ' · P.' + esc(r.SoPhong) : '') + ' · nhập lúc ' + String(r.NgayTao).slice(11, 16) + (r.NguoiTao ? ' · ' + esc(r.NguoiTao) : '') + '</span></span>' + badgeTT(r.TrangThai) + '</button></li>';
      }).join('') + (d.ds.length > 8 ? '<li class="px-5 py-2.5 border-t border-line text-xs text-muted">… và ' + soVN(d.tong - 8) + ' người khác – bấm “Xem danh sách”.</li>' : '') + '</ul>'
        : '<p class="px-5 pb-4 text-sm text-muted">Hôm nay chưa có ai được đăng ký.</p>') + '</section>';
  }

  function trangTongQuan() {
    var v = $('#view');
    v.innerHTML = dauTrang('Tổng quan', 'Tình hình lưu trú hôm nay', duocGhi() ? '<button class="btn-primary" data-them-khach>' + ic('plus') + 'Đăng ký khách</button>' : '') + khungCho(4);
    var luot = S.luot;
    docNhanh('tongQuan', 'tongQuan', {}).then(function (t) {
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
        '<div class="flex flex-wrap items-center gap-2 mb-4"><button type="button" class="btn-soft btn-sm" data-xuat-tq>' + ic('down') + 'Xuất Excel báo cáo tổng quan</button><span class="text-xs text-muted">Gồm mọi số liệu và danh sách trên trang này</span></div>' +
        '<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">' +
        the('Đang lưu trú', t.khach.dangLuuTru, 'người', 'bg-mint text-mint-ink', 'users', '#/tam-tru') +
        the('Sắp hết hạn', k['Sắp hết hạn'], 'người', 'bg-butter text-butter-ink', 'clock', '#/tam-tru/Sắp hết hạn') +
        the('Quá hạn', k['Quá hạn'], 'người', 'bg-rose text-rose-ink', 'alert', '#/tam-tru/Quá hạn') +
        the('Cơ sở lưu trú', t.coSo.tong, 'cơ sở', 'bg-lilac text-lilac-ink', 'building', '#/co-so') +
        '</div>' + theBoSung() + theDangKyHomNay(t) + '<div class="grid lg:grid-cols-5 gap-4 lg:gap-6">' +
        // Cần xử lý
        '<section class="card lg:col-span-3 overflow-hidden self-start"><header class="flex items-center px-5 py-4"><h2 class="font-semibold">Cần xử lý</h2><span class="text-[13px] text-muted ml-2">quá hạn & còn ≤ 3 ngày</span><a href="#/tam-tru/Quá hạn" class="ml-auto text-xs text-brand-600 hover:underline">Xem danh sách</a></header>' +
        (t.canXuLy.length ? '<ul>' + t.canXuLy.map(function (r) {
          return '<li class="flex items-center border-t border-line hover:bg-canvas/60"><button data-xem-khach="' + esc(r.ID) + '" class="flex-1 min-w-0 text-left flex items-center gap-3 pl-5 pr-3 py-3">' +
            '<span class="min-w-0 flex-1"><b class="block text-sm truncate">' + esc(r.HoTen) + '</b><span class="block text-xs text-muted truncate">' + esc(r.TenCoSo) + (r.SoPhong ? ' · P.' + esc(r.SoPhong) : '') + '</span></span>' +
            '<span class="text-right shrink-0">' + badgeTT(r.TrangThai) + '<span class="block text-xs text-muted mt-1">' + conLaiTxt(r) + '</span></span></button>' +
            (duocGhi() ? '<span class="flex gap-1 pr-4 shrink-0"><button class="btn-ghost btn-sm px-2" data-gia-han="' + esc(r.ID) + '" title="Gia hạn">' + ic('calendar') + '<span class="hidden sm:inline">Gia hạn</span></button>' +
              '<button class="btn-soft btn-sm px-2" data-di="' + esc(r.ID) + '" title="Xác nhận rời đi">' + ic('out') + '<span class="hidden sm:inline">Rời đi</span></button></span>' : '') + '</li>';
        }).join('') + '</ul>' : '<div class="px-5 pb-8 pt-4 text-center"><span class="mx-auto grid place-items-center size-12 rounded-2xl bg-mint text-mint-ink mb-3">' + ic('check', 'size-6') + '</span><p class="text-sm font-medium">Không có việc cần xử lý</p><p class="text-[13px] text-muted mt-0.5">Chưa có khách quá hạn hoặc sắp hết hạn.</p></div>') + '</section>' +
        // Cơ sở theo loại hình
        '<section class="card lg:col-span-2 p-5"><h2 class="font-semibold mb-1">Cơ sở theo loại hình</h2><p class="text-[13px] text-muted mb-4">' + soVN(t.coSo.tong) + ' cơ sở · ' + soVN(t.coSo.dungHoatDong) + ' dừng hoạt động · ' + '<a href="#/co-so" data-xem-ds="kt-da" class="text-brand-600 hover:underline">' + soVN(t.coSo.daKiemTra) + ' đã kiểm tra ' + thangVN(t.coSo.thangKiemTra) + '</a> · <a href="#/co-so" data-xem-ds="kt-chua" class="text-brand-600 hover:underline">xem cơ sở chưa kiểm tra</a></p>' +
        loai.map(function (l) {
          var n = t.coSo.theoLoaiHinh[l];
          return '<a href="#/co-so" data-loc-loai="' + esc(l) + '" class="block mb-3 group"><div class="flex justify-between text-sm mb-1.5"><span class="group-hover:text-brand-600">' + esc(l) + '</span><b class="font-semibold">' + soVN(n) + '</b></div>' +
            '<div class="h-2.5 rounded-full bg-canvas overflow-hidden"><div class="h-full rounded-full ' + (THANH_LOAI[l] || 'bg-[#C5C9D3]') + '" style="width:' + Math.max(4, n / maxL * 100) + '%"></div></div></a>';
        }).join('') + '</section>' +
        '</div>' +
        // Cần gửi CT10
        (t.soCanGuiCT10 ? '<section class="card mt-4 lg:mt-6 overflow-hidden"><header class="flex items-center px-5 py-4"><h2 class="font-semibold">Cần gửi phiếu CT10</h2><span class="text-[13px] text-muted ml-2">' + soVN(t.soCanGuiCT10) + ' người đang lưu trú chưa gửi</span><a href="#/tam-tru" data-xem-ds="ct10" class="ml-auto text-xs text-brand-600 hover:underline">Xem danh sách</a></header><ul>' +
          t.canGuiCT10.map(function (r) {
            return '<li class="flex items-center border-t border-line hover:bg-canvas/60"><button data-xem-khach="' + esc(r.ID) + '" class="flex-1 min-w-0 text-left flex items-center gap-3 pl-5 pr-3 py-3">' +
              '<span class="min-w-0 flex-1"><b class="block text-sm truncate">' + esc(r.HoTen) + '</b><span class="block text-xs text-muted truncate">' + esc(r.TenCoSo) + (r.SoPhong ? ' · P.' + esc(r.SoPhong) : '') + ' · đến ' + vn(r.NgayDen) + '</span></span></button>' +
              (duocGhiBanGhi(r) ? '<span class="pr-4 shrink-0"><button class="btn-soft btn-sm px-2" data-toggle-ct10="' + esc(r.ID) + '">' + ic('check') + '<span class="hidden sm:inline">Đã gửi</span></button></span>' : '') + '</li>';
          }).join('') + (t.soCanGuiCT10 > t.canGuiCT10.length ? '<li class="px-5 py-3 border-t border-line text-xs text-muted">… và ' + soVN(t.soCanGuiCT10 - t.canGuiCT10.length) + ' người khác, xem ở trang Khách tạm trú → “Chưa gửi CT10”.</li>' : '') + '</ul></section>' : '') +
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
      '<div class="flex flex-wrap items-center gap-2 text-[13px] text-muted"><span>Ngày đến từ</span>' + oNgay('kTu', S.loc.tu, { nho: true, nhan: 'Ngày đến từ' }) + '<span>đến</span>' + oNgay('kDen', S.loc.den, { nho: true, nhan: 'Ngày đến đến' }) +
      '<select id="kLoai" class="inp h-8 w-auto text-[13px]"><option value="">Mọi hình thức</option>' + (S.dm.LoaiKhaiBao || []).concat(['(chưa ghi)']).map(function (l) { return '<option' + (l === S.loc.loai ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>' +
      '<button type="button" class="chip" data-ct10-chip aria-pressed="' + !!S.loc.ct10 + '">' + ic('idcard', 'size-3.5') + 'Chưa gửi CT10</button>' +
      '<button type="button" class="chip" data-homnay-chip aria-pressed="' + !!S.loc.homNay + '">' + ic('calendar', 'size-3.5') + 'Đăng ký hôm nay</button>' +
      '<span class="flex-1"></span><button type="button" class="btn-ghost btn-sm" data-tra-cuu>' + ic('idcard') + 'Tra cứu CCCD</button><button type="button" class="btn-soft btn-sm" data-xuat-khach>' + ic('down') + 'Xuất Excel</button></div>' +
      '<div id="kChips" class="flex gap-2 overflow-x-auto scroll-thin -mx-1 px-1 pb-0.5"></div></div>' +
      '<div id="kList">' + khungCho(3) + '</div>';
    napCoSo().then(function (cs) {
      if (!$('#kCS')) return;
      $('#kCS').innerHTML = '<option value="">Tất cả cơ sở</option>' + cs.map(function (c) { return '<option value="' + esc(c.MaCoSo) + '"' + (c.MaCoSo === S.loc.maCoSo ? ' selected' : '') + '>' + esc(c.MaCoSo + ' · ' + c.TenCoSo + ' – ' + c.DiaChi) + '</option>'; }).join('');
    });
    $('#kQ').addEventListener('input', debounce(function (e) { S.loc.q = e.target.value; veDsKhach(); }, 150));
    $('#kCS').addEventListener('change', function (e) { S.loc.maCoSo = e.target.value; veDsKhach(); });
    $('#kTu').addEventListener('change', function (e) { S.loc.tu = e.target.value; veDsKhach(); });
    $('#kDen').addEventListener('change', function (e) { S.loc.den = e.target.value; veDsKhach(); });
    $('#kLoai').addEventListener('change', function (e) { S.loc.loai = e.target.value; veDsKhach(); });
    docNhanh('dsTamTru', 'dsTamTru', {}).then(function (ds) { if (!$('#kList')) return; dsKhach = ds; veDsKhach(); })
      .catch(function () { if ($('#kList')) $('#kList').innerHTML = trong('Không tải được danh sách', 'Thử tải lại trang.'); });
  }

  function veDsKhach() {
    var q = boDau(S.loc.q).trim();
    var theoLoc = dsKhach.filter(function (r) {
      if (S.loc.maCoSo && r.MaCoSo !== S.loc.maCoSo) return false;
      if (S.loc.tu && r.NgayDen < S.loc.tu) return false;
      if (S.loc.den && r.NgayDen > S.loc.den) return false;
      if (S.loc.loai && (r.LoaiKhaiBao || '(chưa ghi)') !== S.loc.loai) return false;
      if (S.loc.ct10 && (r.DaGuiCT10 === true || r.TrangThai === 'Đã rời đi')) return false;
      if (S.loc.homNay && String(r.NgayTao || '').slice(0, 10) !== homNay()) return false;
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
    var ds = S.khachDangXem = theoLoc.filter(function (r) {
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
        '<td class="td"><span class="block truncate max-w-[260px]">' + esc(r.TenCoSo) + '</span><span class="text-xs text-muted">' + esc(r.MaCoSo) + (r.SoPhong ? ' · Phòng ' + esc(r.SoPhong) : '') + '</span><span class="block text-xs ' + (r.LoaiKhaiBao ? 'text-muted' : 'text-rose-ink') + '">' + esc(r.LoaiKhaiBao || 'Chưa ghi hình thức') + '</span></td>' +
        '<td class="td whitespace-nowrap">' + vn(r.NgayDen) + '<span class="text-muted"> → </span>' + (vn(r.NgayDiDuKien) || '<span class="text-muted">—</span>') + '</td>' +
        '<td class="td">' + badgeTT(r.TrangThai) + '<span class="block text-xs text-muted mt-1">' + conLaiTxt(r) + '</span></td>' +
        '<td class="td text-right whitespace-nowrap">' + nutKhach(r, true) + '</td></tr>';
    };
    var the = function (r) {
      return '<article class="card p-4" data-xem-khach="' + esc(r.ID) + '"><div class="flex items-start gap-3"><div class="min-w-0 flex-1"><b class="block truncate">' + esc(r.HoTen) + '</b>' +
        '<span class="text-xs text-muted">' + esc(r.SoCCCD_Pass) + '</span></div>' + badgeTT(r.TrangThai) + '</div>' +
        '<div class="mt-3 text-[13px] text-muted flex flex-col gap-1"><span class="flex items-center gap-1.5">' + ic('building', 'size-3.5 shrink-0') + '<span class="truncate">' + esc(r.TenCoSo) + (r.SoPhong ? ' · P.' + esc(r.SoPhong) : '') + '</span></span>' +
        '<span class="flex items-center gap-1.5">' + ic('clock', 'size-3.5 shrink-0') + vn(r.NgayDen) + ' → ' + (vn(r.NgayDiDuKien) || '—') + ' · <b class="font-medium text-ink">' + conLaiTxt(r) + '</b></span>' +
        '<span class="flex items-center gap-1.5 ' + (r.LoaiKhaiBao ? '' : 'text-rose-ink') + '">' + ic('idcard', 'size-3.5 shrink-0') + esc(r.LoaiKhaiBao || 'Chưa ghi hình thức khai báo') + '</span></div>' +
        (duocGhi() && r.TrangThai !== 'Đã rời đi' ? '<div class="flex gap-2 mt-3 pt-3 border-t border-line">' + nutKhach(r, false) + '</div>' : '') + '</article>';
    };
    var hien = phanTrang('khach', ds, JSON.stringify(S.loc));
    el.innerHTML = '<div class="hidden md:block card overflow-hidden"><div class="overflow-x-auto scroll-thin"><table class="w-full"><thead><tr><th class="th">Khách</th><th class="th">Cơ sở / phòng</th><th class="th">Đến → Đi dự kiến</th><th class="th">Trạng thái</th><th class="th"></th></tr></thead><tbody>' +
      hien.map(hang).join('') + '</tbody></table></div></div>' +
      '<div class="md:hidden flex flex-col gap-3">' + hien.map(the).join('') + '</div>' +
      nutXemThem('khach', hien.length, ds.length) +
      '<p class="text-xs text-muted mt-3 px-1">Hiển thị ' + soVN(hien.length) + (hien.length < ds.length ? ' trong ' + soVN(ds.length) + ' người phù hợp' : '') + ' · tổng ' + soVN(dsKhach.length) + ' người</p>';
  }

  // ---------- Phân trang: hiện từng 50 dòng, bấm "Xem thêm" để hiện tiếp; đổi bộ lọc thì quay về trang đầu ----------
  var MOI_TRANG = 50;
  function phanTrang(loai, ds, khoaLoc) {
    var p = S.phanTrang = S.phanTrang || {};
    if (!p[loai] || p[loai].khoa !== khoaLoc) p[loai] = { khoa: khoaLoc, so: MOI_TRANG };
    return ds.slice(0, p[loai].so);
  }
  function nutXemThem(loai, hien, tong) {
    if (hien >= tong) return '';
    return '<div class="flex justify-center mt-4"><button type="button" class="btn-soft" data-xem-them="' + loai + '">' + ic('down') + 'Xem thêm ' + soVN(Math.min(MOI_TRANG, tong - hien)) + ' (còn ' + soVN(tong - hien) + ')</button></div>';
  }

  function nutKhach(r, gon) {
    if (!duocGhi()) return '';
    var s = '<button class="btn-ghost btn-sm" data-sua-khach="' + esc(r.ID) + '" title="Sửa">' + ic('edit') + (gon ? '' : 'Sửa') + '</button>';
    if (r.TrangThai !== 'Đã rời đi') {
      s += '<button class="btn-ghost btn-sm" data-gia-han="' + esc(r.ID) + '" title="Gia hạn">' + ic('calendar') + (gon ? '' : 'Gia hạn') + '</button>';
      s += '<button class="btn-soft btn-sm" data-di="' + esc(r.ID) + '" title="Xác nhận rời đi">' + ic('out') + 'Rời đi</button>';
    }
    return s;
  }

  function xemKhach(id) {
    var san = (layDem('dsTamTru') || []).filter(function (x) { return x.ID === id; })[0];
    if (san) veKhach(san);
    else moNganKeo(dauNganKeo('Đang tải…') + '<div class="p-6">' + khungCho(3) + '</div>');
    API.goi('layTamTru', { id: id }).then(function (r) {
      vaKhach(r);
      if (!san) return veKhach(r);
      if ($('#drawer').dataset.kh === id && JSON.stringify(san) !== JSON.stringify(r)) veKhach(r);
    }).catch(function (e) { if (!san) { toast(e.message, 'loi'); dongNganKeo(); } });
  }

  function veKhach(r) {
    var dong = function (nhan, gt) { return '<div class="flex gap-4 py-2.5 border-b border-line last:border-0"><dt class="w-36 shrink-0 text-[13px] text-muted">' + nhan + '</dt><dd class="text-sm min-w-0 break-words">' + (gt || '<span class="text-muted">—</span>') + '</dd></div>'; };
      moNganKeo(dauNganKeo(esc(r.HoTen), esc(r.ID) + ' · tạo ' + vnTG(r.NgayTao)) +
        '<div class="flex-1 overflow-y-auto px-5 sm:px-6 py-5">' +
        '<div class="flex flex-wrap items-center gap-2 mb-5">' + badgeTT(r.TrangThai) + '<span class="text-sm text-muted">' + conLaiTxt(r) + '</span></div>' +
        '<dl class="card px-4">' +
        dong('Số CCCD / Hộ chiếu', '<b class="font-medium tracking-wide">' + esc(r.SoCCCD_Pass) + '</b> <button type="button" class="text-xs text-brand-600 hover:underline ml-1" data-tra-cuu="' + esc(r.SoCCCD_Pass) + '">xem lịch sử tạm trú</button>') + dong('Ngày sinh', vn(r.NgaySinh)) + dong('Giới tính', esc(r.GioiTinh)) + dong('Quốc tịch', esc(r.QuocTich)) + dong('Nơi thường trú', esc(r.NoiThuongTru)) +
        '</dl><dl class="card px-4 mt-3">' +
        dong('Cơ sở', '<a href="#/co-so" data-xem-coso="' + esc(r.MaCoSo) + '" class="text-brand-600 hover:underline">' + esc(r.TenCoSo) + '</a><span class="block text-xs text-muted">' + esc(r.MaCoSo + ' · ' + r.DiaChiCoSo) + '</span>') +
        dong('Hình thức khai báo', r.LoaiKhaiBao ? esc(r.LoaiKhaiBao) : '<span class="text-rose-ink">Chưa ghi – bấm Sửa để bổ sung</span>') + dong('Số phòng', esc(r.SoPhong)) + dong('Ngày đến', vn(r.NgayDen)) + dong('Ngày đi dự kiến', vn(r.NgayDiDuKien)) + dong('Ngày đi thực tế', vn(r.NgayDiThucTe)) +
        '</dl><dl class="card px-4 mt-3">' +
        dong('Tiền án, tiền sự', r.TienAn ? esc(r.TienAn) + (r.TienAnGhiChu ? ': ' + esc(r.TienAnGhiChu) : '') : '') +
        dong('Kết quả test', r.KetQuaTest ? esc(r.KetQuaTest) : '') +
        dong('Phiếu CT10', (r.DaGuiCT10 === true ? '<span class="badge bg-mint text-mint-ink">' + ic('check', 'size-3.5') + 'Đã gửi</span>' : '<span class="badge bg-butter text-butter-ink">Chưa gửi</span>') +
          (duocGhiBanGhi(r) && r.TrangThai !== 'Đã rời đi' ? ' <button type="button" class="text-xs text-brand-600 hover:underline ml-1" data-toggle-ct10="' + esc(r.ID) + '">đánh dấu ' + (r.DaGuiCT10 === true ? 'chưa gửi' : 'đã gửi') + '</button>' : '')) +
        '</dl><dl class="card px-4 mt-3">' + dong('Ghi chú', esc(r.GhiChu)) + dong('Người tạo', esc(r.NguoiTao)) + dong('Cập nhật', vnTG(r.NgayCapNhat) + (r.NguoiCapNhat ? ' · ' + esc(r.NguoiCapNhat) : '')) + (r.DuLieuThu === true ? dong('', '<span class="badge bg-mint text-mint-ink">Dữ liệu thử – không tính vào thống kê</span>') : '') + '</dl>' +
        '</div>' +
        (duocGhiBanGhi(r) ? '<footer class="flex items-center gap-2 px-4 sm:px-6 py-4 border-t border-line">' +
          (laAdmin() || (laLanhDao() && r.DuLieuThu === true) ? '<button class="btn-danger px-3" data-xoa-khach="' + esc(r.ID) + '" title="Xoá">' + ic('trash') + '<span class="hidden sm:inline">Xoá</span></button>' : '') +
          '<span class="flex-1"></span><button class="btn-soft px-3" data-sua-khach="' + esc(r.ID) + '" title="Sửa">' + ic('edit') + '<span class="hidden sm:inline">Sửa</span></button>' +
          (r.TrangThai !== 'Đã rời đi' ? '<button class="btn-soft" data-gia-han="' + esc(r.ID) + '">' + ic('calendar') + 'Gia hạn</button><button class="btn-primary" data-di="' + esc(r.ID) + '">' + ic('out') + 'Rời đi</button>' : '') + '</footer>' : ''));
    $('#drawer').dataset.kh = r.ID;
  }

  // Kiểm tra số giấy tờ giống máy chủ: CCCD 12 số (CMND cũ 9 số) hoặc hộ chiếu 6–15 chữ/số
  function loiSoGiayTo(s) {
    s = String(s || '').replace(/\s+/g, '').toUpperCase();
    if (!s) return 'Chưa nhập số CCCD/hộ chiếu.';
    if (/^\d+$/.test(s)) return s.length === 12 || s.length === 9 ? '' : 'Số CCCD phải đủ 12 chữ số (đang có ' + s.length + ').';
    return /^[A-Z0-9]{6,15}$/.test(s) ? '' : 'Số hộ chiếu chỉ gồm chữ và số, dài 6–15 ký tự.';
  }
  // Báo lỗi ngay dưới ô: <p data-loi-o="Ten">
  function loiO(vung, ten, msg) {
    var p = vung.querySelector('[data-loi-o="' + ten + '"]');
    if (p) { p.textContent = msg || ''; p.classList.toggle('hidden', !msg); }
    var o = vung.querySelector('#' + ten) || vung.querySelector('[name="' + ten + '"]');
    if (o && o.type !== 'radio' && o.type !== 'hidden') o.classList.toggle('border-rose-ink', !!msg);
  }
  var oLoi = function (ten) { return '<p class="hidden text-xs text-rose-ink mt-1" data-loi-o="' + ten + '"></p>'; };

  // Ô chọn cơ sở: ≤ 6 cơ sở thì hiện sẵn các nút; nhiều hơn thì ô tìm + danh sách (chạy tốt trên iPhone, không dùng datalist)
  function oChonCoSo(ds, maHienTai) {
    var hienTai = ds.filter(function (c) { return c.MaCoSo === maHienTai; })[0];
    var nhan = function (c) { return c.TenCoSo + ' – ' + c.DiaChi; };
    if (ds.length <= 6) {
      return '<div class="grid gap-2" id="csNut">' + ds.map(function (c) {
        return '<label><input type="radio" name="csChon" value="' + esc(c.MaCoSo) + '" class="peer sr-only"' + (c.MaCoSo === maHienTai ? ' checked' : '') + '><span class="flex flex-col px-3 py-2 rounded-xl border border-line text-sm cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand peer-focus-visible:ring-4 peer-focus-visible:ring-brand/15">' +
          '<b class="font-medium">' + esc(c.TenCoSo) + '</b><span class="text-xs text-muted">' + esc(c.MaCoSo + ' · ' + c.DiaChi) + '</span></span></label>';
      }).join('') + '</div><input type="hidden" name="MaCoSo" id="MaCoSo" value="' + esc(maHienTai || '') + '">';
    }
    return '<div id="csChon"><label class="relative block"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted">' + ic('search') + '</span>' +
      '<input id="csTim" class="inp pl-9" placeholder="Gõ tên, địa chỉ, chủ cơ sở hoặc mã CS-…" autocomplete="off" value="' + esc(hienTai ? nhan(hienTai) : '') + '"></label>' +
      '<div id="csDs" class="hidden mt-1 max-h-64 overflow-y-auto card p-1 flex flex-col"></div></div>' +
      '<input type="hidden" name="MaCoSo" id="MaCoSo" value="' + esc(maHienTai || '') + '">';
  }
  function ganChonCoSo(ds, khiChon) {
    if ($('#csNut')) {
      $$('[name=csChon]').forEach(function (r) { r.addEventListener('change', function () { $('#MaCoSo').value = r.value; khiChon(ds.filter(function (c) { return c.MaCoSo === r.value; })[0]); }); });
      return;
    }
    var tim = $('#csTim'), dsEl = $('#csDs'), chiSo = -1, kq = [];
    var nhan = function (c) { return c.TenCoSo + ' – ' + c.DiaChi; };
    var ve = function () {
      var q = boDau(tim.value).trim();
      kq = ds.filter(function (c) { return !q || boDau([c.MaCoSo, c.TenCoSo, c.DiaChi, c.NguoiQuanLy, c.CSKV].join(' ')).indexOf(q) >= 0; }).slice(0, 40);
      chiSo = kq.length ? 0 : -1;
      dsEl.innerHTML = kq.length ? kq.map(function (c, i) {
        return '<button type="button" data-chon-cs="' + esc(c.MaCoSo) + '" class="text-left px-3 py-2 rounded-lg hover:bg-canvas ' + (i === chiSo ? 'bg-canvas' : '') + '"><b class="block text-sm font-medium truncate">' + esc(c.TenCoSo) + '</b><span class="block text-xs text-muted truncate">' + esc(c.MaCoSo + ' · ' + c.DiaChi + (c.CSKV ? ' · CSKV ' + c.CSKV : '')) + '</span></button>';
      }).join('') : '<p class="px-3 py-2 text-sm text-muted">Không có cơ sở phù hợp.</p>';
      dsEl.classList.remove('hidden');
    };
    var chon = function (ma) {
      var c = ds.filter(function (x) { return x.MaCoSo === ma; })[0]; if (!c) return;
      $('#MaCoSo').value = c.MaCoSo; tim.value = nhan(c); dsEl.classList.add('hidden'); khiChon(c);
    };
    tim.addEventListener('focus', function () { if (!$('#MaCoSo').value) ve(); });
    tim.addEventListener('input', function () { $('#MaCoSo').value = ''; khiChon(null); ve(); });
    tim.addEventListener('keydown', function (e) {
      if (dsEl.classList.contains('hidden') || !kq.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); chiSo = (chiSo + (e.key === 'ArrowDown' ? 1 : -1) + kq.length) % kq.length;
        $$('[data-chon-cs]', dsEl).forEach(function (b, i) { b.classList.toggle('bg-canvas', i === chiSo); if (i === chiSo) b.scrollIntoView({ block: 'nearest' }); });
      } else if (e.key === 'Enter') { e.preventDefault(); if (chiSo >= 0) chon(kq[chiSo].MaCoSo); }
      else if (e.key === 'Escape') dsEl.classList.add('hidden');
    });
    // mousedown để chọn trước khi ô tìm mất tiêu điểm
    dsEl.addEventListener('mousedown', function (e) { var b = e.target.closest('[data-chon-cs]'); if (b) { e.preventDefault(); chon(b.dataset.chonCs); } });
    dsEl.addEventListener('click', function (e) { var b = e.target.closest('[data-chon-cs]'); if (b) chon(b.dataset.chonCs); });
    tim.addEventListener('blur', function () { setTimeout(function () { dsEl.classList.add('hidden'); }, 150); });
  }

  /**
   * Form đăng ký / sửa khách.
   * giu (tuỳ chọn, khi "Lưu và thêm người cùng phòng"): { du: {MaCoSo, SoPhong, NgayDen, NgayDiDuKien, LoaiKhaiBao, QuocTich}, dem: số người đã thêm }
   */
  function formKhach(r, maCoSoSan, giu) {
    var moi = !r;
    r = r || (giu ? Object.assign({}, giu.du) : { NgayDen: homNay(), QuocTich: 'Việt Nam', MaCoSo: maCoSoSan || '' });
    napCoSo().then(function (cs) {
      // Cơ sở "dữ liệu thử" không nằm trong danh sách thật -> tải riêng khi cần (đăng ký khách cho cơ sở thử).
      var can = maCoSoSan || r.MaCoSo;
      if (can && !cs.some(function (c) { return c.MaCoSo === can; })) {
        return goi('layCoSo', { ma: can }).then(function (c) { if (c.DuLieuThu === true) c.TenCoSo = c.TenCoSo + ' (DỮ LIỆU THỬ)'; return cs.concat([c]); });
      }
      return cs;
    }).then(function (cs) {
      var dangHD = cs.filter(function (c) { return c.TrangThaiHoatDong !== 'Dừng hoạt động' || c.MaCoSo === r.MaCoSo; });
      var csHienTai = cs.filter(function (c) { return c.MaCoSo === r.MaCoSo; })[0];
      var laThu = !!(csHienTai && csHienTai.DuLieuThu === true);
      var moTaCS = function (c) { return c ? [c.LoaiHinh, c.NguoiQuanLy, c.DiaChi, c.CSKV ? 'CSKV ' + c.CSKV : ''].filter(Boolean).join(' · ') : ''; };
      var gt = function (g) { return '<label class="flex-1"><input type="radio" name="GioiTinh" value="' + g + '" class="peer sr-only"' + (r.GioiTinh === g ? ' checked' : '') + '><span class="flex h-10 items-center justify-center rounded-xl border border-line text-sm cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand peer-checked:text-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand/15">' + g + '</span></label>'; };
      var tieuDe = moi ? (giu ? 'Thêm người cùng phòng' : 'Đăng ký khách tạm trú') : 'Sửa thông tin khách';
      var phu = moi ? (giu ? 'Đã thêm ' + giu.dem + ' người' + (r.SoPhong ? ' vào phòng ' + esc(r.SoPhong) : '') + (csHienTai ? ' · ' + esc(csHienTai.TenCoSo) : '') + '. Cơ sở, phòng, ngày và hình thức được giữ nguyên.' : 'Các ô có dấu * là bắt buộc') : esc(r.ID);
      moNganKeo(dauNganKeo(tieuDe, phu) +
        '<form id="fKhach" class="flex-1 overflow-y-auto px-5 sm:px-6 py-5 flex flex-col gap-5" novalidate>' +
        (giu ? '<div class="flex gap-2 items-start rounded-xl bg-mint text-mint-ink px-3 py-2 text-sm">' + ic('check', 'size-4 mt-0.5 shrink-0') + '<span>Đã lưu ' + giu.dem + ' người. Nhập người tiếp theo.</span></div>' : '') +
        '<button type="button" id="btnQR" class="btn-soft w-full">' + ic('qr', 'size-5') + 'Quét mã QR trên CCCD để điền nhanh</button>' +
        '<fieldset class="grid grid-cols-2 gap-3"><legend class="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Thông tin cá nhân</legend>' +
        '<div class="col-span-2"><label class="lbl" for="HoTen">Họ và tên *</label><input id="HoTen" name="HoTen" class="inp" required maxlength="100" autocomplete="off" value="' + esc(r.HoTen) + '" autofocus>' + oLoi('HoTen') + '</div>' +
        '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="SoCCCD_Pass">Số CCCD / Hộ chiếu *</label><input id="SoCCCD_Pass" name="SoCCCD_Pass" class="inp tracking-wide" required inputmode="text" autocomplete="off" placeholder="12 số CCCD hoặc số hộ chiếu" value="' + esc(r.SoCCCD_Pass) + '">' + oLoi('SoCCCD_Pass') + '</div>' +
        '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="NgaySinh_g">Ngày sinh</label>' + oNgay('NgaySinh', r.NgaySinh, { max: homNay(), nhan: 'Ngày sinh' }) + '</div>' +
        '<div class="col-span-2 sm:col-span-1"><span class="lbl">Giới tính</span><div class="flex gap-2">' + gt('Nam') + gt('Nữ') + gt('Khác') + '</div></div>' +
        '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="QuocTich">Quốc tịch</label><input id="QuocTich" name="QuocTich" class="inp" value="' + esc(r.QuocTich) + '"></div>' +
        '<div class="col-span-2"><label class="lbl" for="NoiThuongTru">Nơi thường trú</label><input id="NoiThuongTru" name="NoiThuongTru" class="inp" maxlength="300" value="' + esc(r.NoiThuongTru) + '"></div>' +
        '</fieldset>' +
        '<fieldset class="grid grid-cols-2 gap-3"><legend class="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Lưu trú</legend>' +
        '<div class="col-span-2"><span class="lbl">Hình thức khai báo *</span><div class="grid grid-cols-1 sm:grid-cols-3 gap-2" id="oLoai">' + (S.dm.LoaiKhaiBao || []).map(function (l) {
          return '<label><input type="radio" name="LoaiKhaiBao" value="' + esc(l) + '" class="peer sr-only"' + (r.LoaiKhaiBao === l ? ' checked' : '') + '><span class="flex min-h-10 px-2 py-1.5 items-center justify-center text-center rounded-xl border border-line text-sm cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand peer-checked:text-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand/15">' + esc(l) + '</span></label>';
        }).join('') + '</div>' + oLoi('LoaiKhaiBao') + '</div>' +
        '<div class="col-span-2"><span class="lbl">Cơ sở lưu trú *</span>' + oChonCoSo(dangHD, r.MaCoSo) +
        '<p id="csGoiY" class="text-xs text-muted mt-1.5">' + (csHienTai ? esc(moTaCS(csHienTai)) : dangHD.length + ' cơ sở đang hoạt động') + '</p>' + oLoi('MaCoSo') +
        (duocGhi() ? '<button type="button" id="csMoiNut" class="text-xs text-brand-600 hover:underline mt-1.5">+ Cơ sở chưa có trong danh sách? Thêm cơ sở mới</button>' +
          '<div id="csMoi" class="hidden mt-2 rounded-xl border border-line bg-canvas/60 p-3 grid gap-2">' +
          '<b class="text-sm">Thêm cơ sở mới</b>' +
          '<input id="csMoiTen" class="inp" maxlength="150" placeholder="Tên cơ sở (vd: Nhà trọ Hoa Mai)">' +
          '<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">' + ['Nhà trọ', 'Nhà nghỉ', 'Khách sạn', 'Nhà cho thuê'].map(function (l) {
            return '<label><input type="radio" name="csMoiLoai" value="' + l + '" class="peer sr-only"><span class="flex h-9 items-center justify-center rounded-xl border border-line bg-white text-[13px] cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand peer-checked:text-brand-600">' + l + '</span></label>';
          }).join('') + '</div>' +
          '<input id="csMoiDC" class="inp" maxlength="300" placeholder="Địa chỉ cụ thể: số nhà, ngõ/ngách, đường">' +
          '<p id="csMoiLoi" class="hidden text-xs text-rose-ink"></p>' +
          '<div class="flex justify-end gap-2"><button type="button" id="csMoiHuy" class="btn-ghost btn-sm">Huỷ</button><button type="button" id="csMoiLuu" class="btn-primary btn-sm">Lưu cơ sở</button></div></div>' : '') +
        '</div>' +
        '<div><label class="lbl" for="SoPhong">Số phòng</label><input id="SoPhong" name="SoPhong" class="inp" value="' + esc(r.SoPhong) + '"></div>' +
        '<div><label class="lbl" for="NgayDen_g">Ngày đến *</label>' + oNgay('NgayDen', r.NgayDen, { nhan: 'Ngày đến' }) + '</div>' +
        '<div class="col-span-2"><label class="lbl" for="NgayDiDuKien_g">Ngày đi dự kiến</label><div class="flex flex-col gap-2">' + oNgay('NgayDiDuKien', r.NgayDiDuKien, { cls: 'sm:w-56', nhan: 'Ngày đi dự kiến' }) +
        '<div class="flex gap-1.5 flex-wrap"><span class="text-xs text-muted self-center mr-1">Tính từ ngày đến:</span>' + [1, 3, 7, 30].map(function (n) { return '<button type="button" class="chip" data-cong="' + n + '">+' + n + ' ngày</button>'; }).join('') + '</div></div>' +
        '<p id="ttXem" class="text-[13px] mt-2"></p></div>' +
        (moi ? '' : '<div class="col-span-2"><label class="lbl" for="NgayDiThucTe_g">Ngày đi thực tế</label>' + oNgay('NgayDiThucTe', r.NgayDiThucTe, { cls: 'sm:w-56', max: homNay(), nhan: 'Ngày đi thực tế' }) + '</div>') +
        '</fieldset>' +
        '<fieldset class="grid grid-cols-2 gap-3"><legend class="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Thông tin bổ sung <span class="normal-case font-normal text-muted">(có thể điền sau)</span></legend>' +
        '<div class="col-span-2"><span class="lbl">Tiền án, tiền sự</span><div class="flex gap-2">' + ['Có', 'Không'].map(function (v) {
          return '<label class="flex-1"><input type="radio" name="TienAn" value="' + v + '" class="peer sr-only"' + (r.TienAn === v ? ' checked' : '') + '><span class="flex h-10 items-center justify-center rounded-xl border border-line text-sm cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand peer-checked:text-brand-600">' + v + '</span></label>';
        }).join('') + '</div></div>' +
        '<div id="oTienAnGC" class="col-span-2' + (r.TienAn === 'Có' ? '' : ' hidden') + '"><label class="lbl" for="TienAnGhiChu">Ghi rõ tiền án, tiền sự</label><textarea id="TienAnGhiChu" name="TienAnGhiChu" rows="2" maxlength="500" class="inp h-auto py-2">' + esc(r.TienAnGhiChu) + '</textarea></div>' +
        '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="KetQuaTest">Kết quả test (nếu có)</label><select id="KetQuaTest" name="KetQuaTest" class="inp"><option value=""' + (!r.KetQuaTest ? ' selected' : '') + '>— Chưa test / không ghi —</option>' + (S.dm.KetQuaTest || []).map(function (k) { return '<option' + (r.KetQuaTest === k ? ' selected' : '') + '>' + esc(k) + '</option>'; }).join('') + '</select></div>' +
        '<label class="col-span-2 sm:col-span-1 flex items-end pb-2 gap-2 text-sm"><input type="checkbox" name="DaGuiCT10" class="size-4 accent-[#6C7BF2]"' + (r.DaGuiCT10 === true ? ' checked' : '') + '> Đã gửi phiếu CT10</label>' +
        '</fieldset>' +
        '<fieldset><legend class="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Khác</legend>' +
        '<label class="lbl" for="GhiChu">Ghi chú</label><textarea id="GhiChu" name="GhiChu" rows="2" class="inp h-auto py-2">' + esc(moi && giu ? '' : r.GhiChu) + '</textarea>' +
        '<p class="text-xs text-muted mt-3">Hệ thống không lưu ảnh giấy tờ, chỉ lưu số CCCD/hộ chiếu.</p>' +
        '</fieldset>' +
        '<p id="fLoi" class="hidden text-sm bg-rose text-rose-ink rounded-xl px-3 py-2"></p>' +
        '</form><footer class="flex flex-wrap gap-2 px-4 sm:px-6 py-3 border-t border-line"><button data-close class="btn-ghost">' + (giu ? 'Xong' : 'Huỷ') + '</button><span class="flex-1"></span>' +
        (moi ? '<button id="fLuuThem" type="button" class="btn-soft" title="Lưu người này rồi nhập tiếp người khác cùng cơ sở, phòng, ngày">' + ic('plus') + '<span class="hidden sm:inline">Lưu &amp; thêm người cùng phòng</span><span class="sm:hidden">Lưu &amp; thêm</span></button>' : '') +
        '<button id="fLuu" form="fKhach" type="submit" class="btn-primary min-w-24">' + (moi ? 'Đăng ký' : 'Lưu thay đổi') + '</button></footer>');

      var f = $('#fKhach');
      $('#btnQR').addEventListener('click', function () {
        moQuetQR(function (q) {
          f.HoTen.value = q.HoTen; f.SoCCCD_Pass.value = q.SoCCCD_Pass;
          if (q.NgaySinh) datNgay('NgaySinh', q.NgaySinh);
          var g = f.querySelector('[name=GioiTinh][value="' + q.GioiTinh + '"]'); if (g) g.checked = true;
          if (q.NoiThuongTru) f.NoiThuongTru.value = q.NoiThuongTru;
          if (!f.QuocTich.value) f.QuocTich.value = 'Việt Nam';
          [f.HoTen, f.SoCCCD_Pass, $('#NgaySinh_g'), f.NoiThuongTru].forEach(function (o) { o.classList.add('bg-mint'); });
          ['HoTen', 'SoCCCD_Pass'].forEach(function (k) { loiO(f, k, ''); });
          toast('Đã điền từ mã QR CCCD. Kiểm tra lại trước khi lưu.');
        });
      });
      var capNhatTT = function () {
        var tt = tinhTrangThai(f.NgayDiDuKien.value, f.NgayDiThucTe ? f.NgayDiThucTe.value : '');
        var con = f.NgayDiDuKien.value ? soNgay(homNay(), f.NgayDiDuKien.value) : null;
        var soDem = f.NgayDiDuKien.value && f.NgayDen.value ? soNgay(f.NgayDen.value, f.NgayDiDuKien.value) : null;
        $('#ttXem').innerHTML = 'Trạng thái khi lưu: ' + badgeTT(tt) + (soDem != null && soDem >= 0 ? ' <span class="text-muted">· lưu trú ' + soDem + ' ngày' + (con != null && con >= 0 ? ', còn ' + con + ' ngày' : '') + '</span>' : '');
      };
      capNhatTT();
      ['NgayDiDuKien', 'NgayDen', 'NgayDiThucTe'].forEach(function (n) { if (f[n]) f[n].addEventListener('change', capNhatTT); });
      $$('[data-cong]', f).forEach(function (b) {
        b.addEventListener('click', function () { datNgay('NgayDiDuKien', congNgay(f.NgayDen.value || homNay(), +b.dataset.cong)); capNhatTT(); });
      });
      ganChonCoSo(dangHD, function (c) {
        $('#csGoiY').textContent = c ? moTaCS(c) : 'Chọn một cơ sở trong danh sách';
        if (c) loiO(f, 'MaCoSo', '');
      });
      // Thêm nhanh cơ sở mới ngay trong form đăng ký khách
      if ($('#csMoiNut')) {
        var moCSMoi = function (mo) { $('#csMoi').classList.toggle('hidden', !mo); $('#csMoiNut').classList.toggle('hidden', mo); if (mo) $('#csMoiTen').focus(); };
        $('#csMoiNut').addEventListener('click', function () { moCSMoi(true); });
        $('#csMoiHuy').addEventListener('click', function () { moCSMoi(false); });
        $('#csMoi').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('#csMoiLuu').click(); } });
        $('#csMoiLuu').addEventListener('click', function () {
          var ten = $('#csMoiTen').value.trim(), dc = $('#csMoiDC').value.trim(), lh = f.querySelector('[name=csMoiLoai]:checked');
          var loi = !ten ? 'Chưa nhập tên cơ sở.' : !lh ? 'Chưa chọn loại hình.' : !dc ? 'Chưa nhập địa chỉ cơ sở.' : '';
          $('#csMoiLoi').textContent = loi; $('#csMoiLoi').classList.toggle('hidden', !loi);
          if (loi) return;
          var nut = $('#csMoiLuu'); nut.disabled = true; nut.textContent = 'Đang lưu…';
          API.goi('themCoSo', { TenCoSo: ten, LoaiHinh: lh.value, DiaChi: dc }).then(function (c) {
            if (c.DuLieuThu !== true) { vaCoSo(c); sauKhiGhi('coso'); }
            dangHD.push(c);
            $('#MaCoSo').value = c.MaCoSo;
            if ($('#csTim')) $('#csTim').value = c.TenCoSo + ' – ' + c.DiaChi;
            else if ($('#csNut')) {
              $$('[name=csChon]').forEach(function (x) { x.checked = false; });
              $('#csNut').insertAdjacentHTML('beforeend', '<label><input type="radio" name="csChon" value="' + esc(c.MaCoSo) + '" class="peer sr-only" checked><span class="flex flex-col px-3 py-2 rounded-xl border border-line text-sm cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand"><b class="font-medium">' + esc(c.TenCoSo) + '</b><span class="text-xs text-muted">' + esc(c.MaCoSo + ' · ' + c.DiaChi) + '</span></span></label>');
              var r2 = $('#csNut').lastElementChild.querySelector('input');
              r2.addEventListener('change', function () { $('#MaCoSo').value = r2.value; $('#csGoiY').textContent = moTaCS(c); });
            }
            $('#csGoiY').textContent = moTaCS(c); loiO(f, 'MaCoSo', '');
            $('#csMoiTen').value = ''; $('#csMoiDC').value = ''; lh.checked = false; moCSMoi(false);
            toast('Đã thêm cơ sở ' + c.MaCoSo + ' – ' + c.TenCoSo);
          }).catch(function (err) { $('#csMoiLoi').textContent = err.message; $('#csMoiLoi').classList.remove('hidden'); })
            .then(function () { nut.disabled = false; nut.textContent = 'Lưu cơ sở'; });
        });
      }
      // Xoá báo lỗi của ô khi người dùng sửa
      f.addEventListener('input', function (e) { if (e.target.id === 'HoTen' || e.target.id === 'SoCCCD_Pass') loiO(f, e.target.id, ''); });
      f.addEventListener('change', function (e) { if (e.target.name === 'LoaiKhaiBao') loiO(f, 'LoaiKhaiBao', ''); if (e.target.name === 'TienAn') $('#oTienAnGC').classList.toggle('hidden', e.target.value !== 'Có'); });
      $('#SoCCCD_Pass').addEventListener('blur', function (e) { if (e.target.value.trim()) loiO(f, 'SoCCCD_Pass', loiSoGiayTo(e.target.value)); });

      var dangLuu = false;
      var luu = function (themTiep) {
        if (dangLuu) return;
        var d = {};
        ['HoTen', 'SoCCCD_Pass', 'NgaySinh', 'QuocTich', 'NoiThuongTru', 'MaCoSo', 'SoPhong', 'NgayDen', 'NgayDiDuKien', 'NgayDiThucTe', 'GhiChu', 'KetQuaTest'].forEach(function (k) { if (f[k]) d[k] = f[k].value.trim(); });
        var g = f.querySelector('[name=GioiTinh]:checked'); d.GioiTinh = g ? g.value : '';
        var lk = f.querySelector('[name=LoaiKhaiBao]:checked'); d.LoaiKhaiBao = lk ? lk.value : '';
        var ta = f.querySelector('[name=TienAn]:checked'); d.TienAn = ta ? ta.value : '';
        d.TienAnGhiChu = d.TienAn === 'Có' ? f.TienAnGhiChu.value.trim() : '';
        d.DaGuiCT10 = f.DaGuiCT10.checked;
        // Kiểm tra từng ô, báo lỗi ngay dưới ô, đưa tới ô sai đầu tiên
        $('#fLoi').classList.add('hidden');
        var loi = [];
        var dat = function (ten, msg) { loiO(f, ten, msg); if (msg) loi.push(ten); };
        dat('HoTen', d.HoTen ? '' : 'Chưa nhập họ tên.');
        dat('SoCCCD_Pass', loiSoGiayTo(d.SoCCCD_Pass));
        var loiNgayForm = kiemNgay(f);
        if (!loiNgayForm && !d.NgayDen) { loiNgay(document.querySelector('[data-o-ngay=NgayDen]'), 'Chưa nhập ngày đến.'); loiNgayForm = 'x'; }
        if (!loiNgayForm && d.NgayDiDuKien && d.NgayDiDuKien < d.NgayDen) { loiNgay(document.querySelector('[data-o-ngay=NgayDiDuKien]'), 'Ngày đi dự kiến trước ngày đến.'); loiNgayForm = 'x'; }
        dat('LoaiKhaiBao', d.LoaiKhaiBao ? '' : 'Chưa chọn hình thức khai báo.');
        dat('MaCoSo', d.MaCoSo ? '' : 'Chưa chọn cơ sở lưu trú trong danh sách.');
        if (loi.length || loiNgayForm) {
          var dau = loi.length ? (f.querySelector('#' + loi[0]) || f.querySelector('[name="' + loi[0] + '"]')) : null;
          var oNgaySai = f.querySelector('[data-o-ngay] input.border-rose-ink');
          var den = dau || oNgaySai;
          if (loi[0] === 'MaCoSo') den = $('#csTim') || $('#csNut');
          if (loi[0] === 'LoaiKhaiBao') den = $('#oLoai');
          if (den) { den.scrollIntoView({ block: 'center', behavior: 'smooth' }); if (den.focus && den.tagName === 'INPUT') den.focus({ preventScroll: true }); }
          return;
        }
        dangLuu = true;
        var nut = themTiep ? $('#fLuuThem') : $('#fLuu'), chu = nut.innerHTML;
        $('#fLuu').disabled = true; if ($('#fLuuThem')) $('#fLuuThem').disabled = true; nut.textContent = 'Đang lưu…';
        if (!moi) { d.id = r.ID; d._phienBan = r.NgayCapNhat; }
        API.goi(moi ? 'themTamTru' : 'suaTamTru', d).then(function (kq) {
          if (!laThu) { vaKhach(kq); sauKhiGhi('khach'); }
          toast(moi ? 'Đã đăng ký ' + kq.HoTen + ' (' + kq.ID + ')' : 'Đã lưu thay đổi');
          if (themTiep) {
            formKhach(null, null, { du: { MaCoSo: d.MaCoSo, SoPhong: d.SoPhong, NgayDen: d.NgayDen, NgayDiDuKien: d.NgayDiDuKien, LoaiKhaiBao: d.LoaiKhaiBao, QuocTich: d.QuocTich || 'Việt Nam' }, dem: (giu ? giu.dem : 0) + 1 });
            lamMoiNen();
          } else { dongNganKeo(); lamMoi(); }
        }).catch(function (err) {
          dangLuu = false;
          if (!$('#fKhach')) return;
          // Đưa lỗi máy chủ về đúng ô nếu nhận ra
          var m = err.message || '', o = /giấy tờ|CCCD|hộ chiếu/i.test(m) ? 'SoCCCD_Pass' : /hình thức/i.test(m) ? 'LoaiKhaiBao' : /cơ sở/i.test(m) ? 'MaCoSo' : /họ tên/i.test(m) ? 'HoTen' : '';
          if (o) { loiO(f, o, m); (f.querySelector('#' + o) || $('#oLoai') || f).scrollIntoView({ block: 'center', behavior: 'smooth' }); }
          else { var p = $('#fLoi'); p.textContent = m; p.classList.remove('hidden'); p.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
          $('#fLuu').disabled = false; if ($('#fLuuThem')) $('#fLuuThem').disabled = false; nut.innerHTML = chu;
        });
      };
      f.addEventListener('submit', function (e) { e.preventDefault(); luu(false); });
      if ($('#fLuuThem')) $('#fLuuThem').addEventListener('click', function () { luu(true); });
      if (giu) setTimeout(function () { if (window.innerWidth > 640) f.HoTen.focus(); }, 50);
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

  // ---------- Gia hạn nhanh & rời đi cả phòng ----------
  /** Lấy khách từ bộ đệm danh sách (tải danh sách nếu chưa có). */
  function napKhach(id) {
    var tim = function (ds) { return ds.filter(function (x) { return x.ID === id; })[0]; };
    if (layDem('dsTamTru') && tim(layDem('dsTamTru'))) return Promise.resolve(tim(layDem('dsTamTru')));
    return goi('dsTamTru', {}).then(function (ds) { datDem('dsTamTru', ds); return tim(ds) || goi('layTamTru', { id: id }); });
  }
  var khoaPhong = function (r) { return r.MaCoSo + '|' + boDau(String(r.SoPhong || '').trim()); };
  /** Những người KHÁC đang ở cùng cơ sở và cùng số phòng (khách chưa ghi số phòng thì không tính). */
  function cungPhong(r) {
    if (!String(r.SoPhong || '').trim()) return [];
    return (layDem('dsTamTru') || []).filter(function (x) { return x.ID !== r.ID && x.TrangThai !== 'Đã rời đi' && khoaPhong(x) === khoaPhong(r); });
  }
  function oCaPhong(r, ban) {
    if (!ban.length) return '';
    return '<label class="flex items-start gap-2.5 mt-3 p-3 rounded-xl bg-canvas text-sm cursor-pointer"><input type="checkbox" value="ca-phong" class="mt-0.5 size-4 shrink-0 accent-[#5463E6]">' +
      '<span>Áp dụng cho cả phòng ' + esc(r.SoPhong) + ' – thêm ' + ban.length + ' người: <span class="text-muted">' + esc(ban.map(function (x) { return x.HoTen; }).join(', ')) + '</span></span></label>';
  }
  var tenNhom = function (ds) { return ds.map(function (x) { return x.HoTen; }).join(', '); };
  /** Sau khi gia hạn / rời đi: đang xem chi tiết cơ sở thì vẽ lại cơ sở đó, nếu không thì đóng ngăn kéo. */
  function sauXuLyKhach() {
    var ma = !$('#drawerWrap').hidden && $('#csKhach') ? $('#drawer').dataset.ma : '';
    if (ma) { lamMoiNen(); xemCoSo(ma); } else { dongNganKeo(); lamMoi(); }
  }

  function giaHan(id, caPhong) {
    napKhach(id).then(function (r) {
      if (!r) return;
      var ban = cungPhong(r), nhom = caPhong ? [r].concat(ban) : [r];
      var goc = r.NgayDiDuKien && r.NgayDiDuKien >= homNay() ? r.NgayDiDuKien : homNay();
      var nd = caPhong ? 'Phòng ' + r.SoPhong + ' · ' + nhom.length + ' người: ' + tenNhom(nhom) + '. Chọn ngày đi dự kiến mới:'
        : r.HoTen + ' – đi dự kiến ' + (r.NgayDiDuKien ? vn(r.NgayDiDuKien) : '(chưa có)') + '. Chọn ngày đi dự kiến mới:';
      var p = hoi(caPhong ? 'Gia hạn cả phòng' : 'Gia hạn', nd, 'Gia hạn', false,
        oNgay('dlgNgay', congNgay(goc, 7), { min: homNay(), nhan: 'Ngày đi dự kiến mới' }) +
        '<div class="flex gap-1.5 flex-wrap mt-2"><span class="text-xs text-muted self-center mr-1">Cộng từ ' + vn(goc) + ':</span>' +
        [1, 3, 7, 30].map(function (n) { return '<button type="button" class="chip" data-gh-cong="' + n + '">+' + n + ' ngày</button>'; }).join('') + '</div>' +
        (caPhong ? '' : oCaPhong(r, ban)));
      $$('[data-gh-cong]', $('#dlgExtra')).forEach(function (b) { b.addEventListener('click', function () { datNgay('dlgNgay', congNgay(goc, +b.dataset.ghCong)); }); });
      p.then(function (kq) {
        if (!kq) return;
        if (!kq.v) return toast('Ngày đi dự kiến chưa đúng (dd/mm/yyyy).', 'loi');
        var ds = caPhong || kq.chon.indexOf('ca-phong') >= 0 ? [r].concat(ban) : [r];
        goi('giaHan', { ids: ds.map(function (x) { return x.ID; }), ngay: kq.v }).then(function (kqs) {
          if (kqs[0] && kqs[0].DuLieuThu !== true) { kqs.forEach(function (x) { vaKhach(x); }); sauKhiGhi('khach'); }
          toast((kqs.length > 1 ? kqs.length + ' người phòng ' + r.SoPhong : kqs[0].HoTen) + ' được gia hạn đến ' + vn(kq.v));
          sauXuLyKhach();
        });
      });
    });
  }

  function xacNhanDi(id, caPhong) {
    napKhach(id).then(function (r) {
      if (!r) return;
      var ban = cungPhong(r), nhom = caPhong ? [r].concat(ban) : [r];
      var minDen = nhom.reduce(function (m, x) { return x.NgayDen > m ? x.NgayDen : m; }, '');
      hoi(caPhong ? 'Rời đi cả phòng ' + r.SoPhong : 'Xác nhận rời đi', (caPhong ? nhom.length + ' người: ' + tenNhom(nhom) : r.HoTen) + ' – chọn ngày rời đi thực tế:', 'Xác nhận', false,
        oNgay('dlgNgay', homNay(), { max: homNay(), min: minDen, nhan: 'Ngày rời đi' }) + (caPhong ? '' : oCaPhong(r, ban))).then(function (kq) {
        if (!kq) return;
        if (!kq.v) return toast('Ngày rời đi chưa đúng (dd/mm/yyyy).', 'loi');
        var ds = caPhong || kq.chon.indexOf('ca-phong') >= 0 ? [r].concat(ban) : [r];
        var xong = function (kqs) {
          if (kqs[0] && kqs[0].DuLieuThu !== true) { kqs.forEach(function (x) { vaKhach(x); }); sauKhiGhi('khach'); }
          toast((kqs.length > 1 ? kqs.length + ' người phòng ' + r.SoPhong : kqs[0].HoTen) + ' đã rời đi ngày ' + vn(kq.v));
          sauXuLyKhach();
        };
        if (ds.length === 1) goi('xacNhanDi', { id: id, ngay: kq.v }).then(function (x) { xong([x]); });
        else goi('roiDiNhieu', { ids: ds.map(function (x) { return x.ID; }), ngay: kq.v }).then(xong);
      });
    });
  }

  function xoaKhach(id) {
    hoi('Xoá bản ghi ' + id + '?', 'Chỉ dùng khi nhập nhầm. Bản ghi sẽ bị xoá khỏi danh sách (nội dung vẫn lưu trong Lịch sử).', 'Xoá', true).then(function (ok) {
      if (!ok) return;
      goi('xoaTamTru', { id: id }).then(function () { vaKhach(null, id); sauKhiGhi('khach'); toast('Đã xoá ' + id); dongNganKeo(); lamMoi(); });
    });
  }

  // ================= CƠ SỞ LƯU TRÚ =================
  function napCoSo() {
    if (layDem('dsCoSo')) return Promise.resolve(layDem('dsCoSo'));
    return goi('dsCoSo', {}).then(function (ds) { datDem('dsCoSo', ds); return ds; });
  }

  function trangCoSo() {
    var v = $('#view');
    v.innerHTML = dauTrang('Cơ sở lưu trú', 'Nhà trọ, nhà nghỉ, nhà cho thuê, khách sạn trên địa bàn', duocGhi() ? '<button class="btn-primary" data-them-coso>' + ic('plus') + 'Thêm cơ sở</button>' : '') +
      '<div class="card p-3 sm:p-4 mb-4 flex flex-col gap-3"><div class="flex gap-2">' +
      '<label class="relative flex-1 min-w-0"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted">' + ic('search') + '</span><input id="cQ" type="search" class="inp pl-9" placeholder="Tìm tên, địa chỉ, chủ cơ sở, mã…" value="' + esc(S.locCS.q) + '"></label>' +
      '<button type="button" class="sm:hidden relative grid place-items-center size-11 shrink-0 rounded-xl bg-brand-50 text-brand-600" data-mo-loc aria-label="Bộ lọc">' + ic('loc', 'size-5') +
      '<span id="cSoLoc" hidden class="absolute -top-1.5 -right-1.5 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-brand-600 text-white text-[11px] font-semibold"></span></button>' +
      '<div class="hidden sm:flex gap-2"><select id="cCSKV" class="inp sm:w-40"' + (S.phamVi && !S.phamVi.toanPhuong ? ' hidden' : '') + '></select><select id="cTDP" class="inp sm:w-32"></select>' +
      '<select id="cKT" class="inp sm:w-52">' + [['', 'Mọi tình trạng kiểm tra'], ['da', 'Đã kiểm tra ' + thangVN(homNay())], ['chua', 'Chưa kiểm tra ' + thangVN(homNay())]].map(function (o) { return '<option value="' + o[0] + '"' + ((S.locCS.kt || '') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="flex items-center gap-2"><div id="cChips" class="flex-1 min-w-0 flex gap-2 overflow-x-auto scroll-thin -mx-1 px-1 pb-0.5"></div>' +
      (duocGhi() ? '<button type="button" class="btn-soft btn-sm shrink-0" data-chon-nhieu aria-pressed="' + !!S.chonCS + '" title="Chọn nhiều cơ sở để đánh dấu đã kiểm tra">' + ic('listcheck') + '<span class="hidden sm:inline">Chọn nhiều</span></button>' : '') +
      '<button type="button" class="btn-soft btn-sm shrink-0" data-xuat-coso title="Xuất Excel">' + ic('down') + '<span class="hidden sm:inline">Xuất Excel</span></button></div></div><div id="cBS"></div><div id="cList">' + khungCho(3) + '</div><div id="cThanhChon"></div>';
    docNhanh('dsCoSo', 'dsCoSo', {}).then(function (ds) {
      if (!$('#cList')) return;   // đã chuyển sang trang khác
      var uniq = function (k) { var m = {}; ds.forEach(function (c) { if (c[k] !== '') m[c[k]] = 1; }); return Object.keys(m); };
      $('#cCSKV').innerHTML = '<option value="">Mọi CSKV</option>' + uniq('CSKV').sort(function (a, b) { return a.localeCompare(b, 'vi'); }).map(function (c) { return '<option' + (c === S.locCS.cskv ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
      $('#cTDP').innerHTML = '<option value="">Mọi tổ DP</option>' + uniq('ToDanPho').sort(function (a, b) { return a - b; }).map(function (c) { return '<option value="' + esc(c) + '"' + (String(c) === String(S.locCS.tdp) ? ' selected' : '') + '>Tổ ' + esc(c) + '</option>'; }).join('');
      veDsCoSo();
      if ($('#cBS')) $('#cBS').innerHTML = theBoSung();
    }).catch(function () { if ($('#cList')) $('#cList').innerHTML = trong('Không tải được danh sách', 'Thử tải lại trang.'); });
    $('#cQ').addEventListener('input', debounce(function (e) { S.locCS.q = e.target.value; veDsCoSo(); }, 150));
    $('#cCSKV').addEventListener('change', function (e) { S.locCS.cskv = e.target.value; veDsCoSo(); });
    $('#cTDP').addEventListener('change', function (e) { S.locCS.tdp = e.target.value; veDsCoSo(); });
    $('#cKT').addEventListener('change', function (e) { S.locCS.kt = e.target.value; veDsCoSo(); });
  }

  function veDsCoSo() {
    var q = boDau(S.locCS.q).trim(), L = S.locCS;
    var theoLoc = S.coSo.filter(function (c) {
      if (L.cskv && c.CSKV !== L.cskv) return false;
      if (L.tdp && String(c.ToDanPho) !== String(L.tdp)) return false;
      if (L.kt === 'da' && !c.DaKiemTraThang) return false;
      if (L.kt === 'chua' && (c.DaKiemTraThang || c.TrangThaiHoatDong === 'Dừng hoạt động')) return false;
      if (q && boDau([c.MaCoSo, c.TenCoSo, c.DiaChi, c.NguoiQuanLy, c.SoDienThoai, c.MaSoThue].join(' ')).indexOf(q) < 0) return false;
      return true;
    });
    var dem = { '': theoLoc.length };
    theoLoc.forEach(function (c) { dem[c.LoaiHinh] = (dem[c.LoaiHinh] || 0) + 1; });
    var loai = [''].concat((S.dm ? S.dm.LoaiHinh : []).filter(function (l) { return dem[l]; }));
    $('#cChips').innerHTML = loai.map(function (l) {
      return '<button class="chip shrink-0" data-loai="' + esc(l) + '" aria-pressed="' + (L.loaiHinh === l) + '">' + esc(l || 'Tất cả') + '<span class="opacity-60">' + soVN(dem[l] || 0) + '</span></button>';
    }).join('');
    var ds = S.coSoDangXem = theoLoc.filter(function (c) { return !L.loaiHinh || c.LoaiHinh === L.loaiHinh; });
    if (!ds.length) { $('#cList').innerHTML = '<div class="card px-6 py-10 text-center text-sm text-muted">Không có cơ sở phù hợp bộ lọc.</div>'; return; }
    var soLoc = ['cskv', 'tdp', 'loaiHinh', 'kt'].filter(function (k) { return L[k]; }).length;
    if ($('#cSoLoc')) { $('#cSoLoc').hidden = !soLoc; $('#cSoLoc').textContent = soLoc; }
    veThanhChon();
    var t = trangSo('coso', ds, JSON.stringify(S.locCS), 10);
    $('#cList').innerHTML = '<ul class="card divide-y divide-line overflow-hidden">' + t.hien.map(dongCoSo).join('') + '</ul>' + nutTrang('coso', t) +
      '<p class="text-xs text-muted mt-3 px-1">Cơ sở ' + soVN(t.bd + 1) + '–' + soVN(t.bd + t.hien.length) + ' trong ' + soVN(ds.length) + ' cơ sở phù hợp · tổng ' + soVN(S.coSo.length) + ' cơ sở · ' +
      soVN(ds.filter(function (c) { return c.DaKiemTraThang; }).length) + ' đã kiểm tra ' + thangVN(homNay()) + '</p>';
  }

  /** Thẻ cơ sở 2 dòng: (1) tên · loại hình · trạng thái kiểm tra; (2) mã · địa chỉ · tổ · CSKV · số khách. Nút ⋯ mở thao tác nhanh. */
  function dongCoSo(c) {
    var dung = c.TrangThaiHoatDong === 'Dừng hoạt động';
    var chon = S.chonCS, daChon = chon && S.chonCS[c.MaCoSo];
    var dc = String(c.DiaChi || ''); if (dc.length > 28) dc = dc.slice(0, 27) + '…';
    var phu = '<span class="truncate">' + [c.MaCoSo, dc, c.ToDanPho !== '' ? 'Tổ ' + c.ToDanPho : '', c.CSKV ? 'CSKV ' + c.CSKV : ''].filter(String).map(esc).join(' · ') + '</span>' +
      '<span class="shrink-0 whitespace-nowrap inline-flex items-center gap-0.5">· ' + ic('users', 'size-3.5') + soVN(c.KhachDangO) + '</span>' +
      (c.KhachQuaHan ? '<span class="shrink-0 whitespace-nowrap text-rose-ink">· ' + c.KhachQuaHan + ' quá hạn</span>' : '');
    var nhan = dung ? '<span class="badge bg-fog text-fog-ink">Dừng HĐ</span>' : nhanKiemTra(c);
    var than = '<span class="min-w-0 flex-1"><span class="flex items-center gap-1.5 min-w-0"><b class="text-sm font-semibold truncate">' + esc(c.TenCoSo) + '</b>' +
      '<span class="inline-flex shrink-0">' + badgeLoai(c.LoaiHinh) + '</span><span class="shrink-0">' + nhan + '</span></span>' +
      '<span class="flex items-center gap-1 text-xs text-muted mt-0.5 min-w-0">' + phu + '</span></span>';
    if (chon) {
      var duocChon = !dung && !c.DaKiemTraThang;
      return '<li><button type="button" ' + (duocChon ? 'data-tich-cs="' + esc(c.MaCoSo) + '"' : 'disabled') + ' class="w-full text-left flex items-center gap-3 px-3 sm:px-4 py-2.5 min-h-14 ' + (daChon ? 'bg-brand-50' : 'hover:bg-canvas/60') + (duocChon ? '' : ' opacity-50') + '">' +
        '<span class="grid place-items-center size-6 shrink-0 rounded-md border-2 ' + (daChon ? 'bg-brand-600 border-brand-600 text-white' : 'border-line bg-white text-transparent') + '">' + ic('check', 'size-4') + '</span>' + than + '</button></li>';
    }
    return '<li class="flex items-center hover:bg-canvas/60' + (dung ? ' opacity-70' : '') + '">' +
      '<button data-xem-coso="' + esc(c.MaCoSo) + '" class="min-w-0 flex-1 text-left flex items-center gap-3 pl-3 sm:pl-4 py-2.5 min-h-14">' + than + '</button>' +
      '<button type="button" data-thao-tac-cs="' + esc(c.MaCoSo) + '" class="grid place-items-center size-11 shrink-0 mr-1 rounded-xl text-muted hover:bg-canvas hover:text-ink" aria-label="Thao tác nhanh với ' + esc(c.TenCoSo) + '">' + ic('more', 'size-5') + '</button></li>';
  }

  // ---------- Bảng trượt từ dưới lên (điện thoại) / hộp giữa màn hình (máy tính) ----------
  function moBangDuoi(tieuDe, noiDung, chan) {
    dongBangDuoi();
    var w = document.createElement('div');
    w.id = 'bangDuoi'; w.className = 'fixed inset-0 z-50 flex items-end sm:items-center justify-center';
    w.innerHTML = '<div data-dong-bang class="absolute inset-0 bg-ink/30 fade"></div>' +
      '<section role="dialog" aria-modal="true" aria-label="' + esc(tieuDe) + '" class="bang-truot relative w-full sm:max-w-md max-h-[85vh] flex flex-col bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl">' +
      '<div class="sm:hidden mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line"></div>' +
      '<header class="flex items-center gap-2 px-5 pt-3 pb-2"><h2 class="font-semibold flex-1 min-w-0 truncate">' + tieuDe + '</h2><button type="button" data-dong-bang class="grid place-items-center size-11 -mr-2 rounded-xl text-muted hover:bg-canvas" aria-label="Đóng">' + ic('x', 'size-5') + '</button></header>' +
      '<div class="flex-1 overflow-y-auto px-5 pb-4">' + noiDung + '</div>' +
      (chan ? '<footer class="flex gap-2 px-5 py-3 border-t border-line pb-[max(0.75rem,env(safe-area-inset-bottom))]">' + chan + '</footer>' : '<div class="pb-[env(safe-area-inset-bottom)]"></div>') + '</section>';
    document.body.appendChild(w);
    return w;
  }
  function dongBangDuoi() { var w = $('#bangDuoi'); if (w) w.remove(); }
  document.addEventListener('click', function (e) { if (e.target.closest('[data-dong-bang]')) dongBangDuoi(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#bangDuoi')) dongBangDuoi(); });

  /** Bộ lọc cơ sở trên điện thoại: CSKV, tổ dân phố, loại hình, trạng thái kiểm tra + nút Áp dụng cố định ở đáy. */
  function moBoLocCoSo() {
    var L = S.locCS, ds = S.coSo || [];
    var uniq = function (k) { var m = {}; ds.forEach(function (c) { if (c[k] !== '' && c[k] != null) m[c[k]] = 1; }); return Object.keys(m); };
    var chon = function (id, nhan, rong, tuyChon, gt) {
      return '<label class="block mb-3"><span class="lbl">' + nhan + '</span><select id="' + id + '" class="inp"><option value="">' + rong + '</option>' +
        tuyChon.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(gt || '') === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
    };
    moBangDuoi('Bộ lọc cơ sở',
      (S.phamVi && !S.phamVi.toanPhuong ? '' : chon('bl-cskv', 'CSKV phụ trách', 'Mọi CSKV', uniq('CSKV').sort(function (a, b) { return a.localeCompare(b, 'vi'); }).map(function (x) { return [x, x]; }), L.cskv)) +
      chon('bl-tdp', 'Tổ dân phố', 'Mọi tổ dân phố', uniq('ToDanPho').sort(function (a, b) { return a - b; }).map(function (x) { return [x, 'Tổ ' + x]; }), L.tdp) +
      chon('bl-loai', 'Loại hình cơ sở', 'Mọi loại hình', ((S.dm && S.dm.LoaiHinh) || []).map(function (x) { return [x, x]; }), L.loaiHinh) +
      chon('bl-kt', 'Trạng thái kiểm tra', 'Mọi trạng thái', [['da', 'Đã kiểm tra ' + thangVN(homNay())], ['chua', 'Chưa kiểm tra ' + thangVN(homNay())]], L.kt),
      '<button type="button" class="btn-ghost h-11 flex-1" data-xoa-loc>Xoá lọc</button><button type="button" class="btn-primary h-11 flex-[2]" data-ap-dung-loc>Áp dụng</button>');
  }
  function apDungLocCoSo(xoa) {
    var g = function (id) { var o = $('#' + id); return o && !xoa ? o.value : ''; };
    S.locCS.cskv = g('bl-cskv'); S.locCS.tdp = g('bl-tdp'); S.locCS.loaiHinh = g('bl-loai'); S.locCS.kt = g('bl-kt');
    ['cCSKV', 'cTDP', 'cKT'].forEach(function (id, i) { var o = $('#' + id); if (o) o.value = [S.locCS.cskv, S.locCS.tdp, S.locCS.kt][i] || ''; });
    dongBangDuoi(); veDsCoSo();
  }

  /** Thao tác nhanh với 1 cơ sở: đánh dấu kiểm tra, gọi chủ cơ sở, xem chi tiết, đăng ký khách. */
  function moThaoTacCoSo(ma) {
    var c = (S.coSo || []).filter(function (x) { return x.MaCoSo === ma; })[0]; if (!c) return;
    var dung = c.TrangThaiHoatDong === 'Dừng hoạt động', ghi = duocGhiBanGhi(c);
    var muc = function (attr, icon, nhan, phu, tat, mau) {
      return '<li><' + (attr.indexOf('href=') === 0 ? 'a ' + attr : 'button type="button" ' + attr) + ' class="w-full flex items-center gap-3 px-3 py-3 min-h-14 rounded-xl text-left ' + (tat ? 'opacity-40 pointer-events-none' : 'hover:bg-canvas') + '">' +
        '<span class="grid place-items-center size-10 shrink-0 rounded-xl ' + (mau || 'bg-brand-50 text-brand-600') + '">' + ic(icon, 'size-5') + '</span>' +
        '<span class="min-w-0"><b class="block text-sm font-medium">' + nhan + '</b>' + (phu ? '<span class="block text-xs text-muted">' + phu + '</span>' : '') + '</span></' + (attr.indexOf('href=') === 0 ? 'a' : 'button') + '></li>';
    };
    moBangDuoi(esc(c.TenCoSo), '<p class="text-xs text-muted -mt-1 mb-2">' + esc(c.MaCoSo + ' · ' + c.DiaChi) + '</p><ul class="flex flex-col gap-0.5 -mx-2">' +
      (ghi && !dung ? muc('data-tt-kt="' + esc(ma) + '"', 'check', c.DaKiemTraThang ? 'Bỏ tích đã kiểm tra ' + thangVN(homNay()) : 'Đánh dấu đã kiểm tra ' + thangVN(homNay()),
        c.DaKiemTraThang ? (c.NgayKiemTraThang ? 'Đã tích ngày ' + vn(c.NgayKiemTraThang) : 'Theo phiếu thống kê') : 'Ghi nhận ngày hôm nay ' + vn(homNay()), false, c.DaKiemTraThang ? 'bg-butter text-butter-ink' : 'bg-mint text-mint-ink') : '') +
      muc(c.SoDienThoai ? 'href="tel:' + esc(String(c.SoDienThoai).replace(/[^0-9+]/g, '')) + '"' : 'disabled', 'phone', 'Gọi chủ cơ sở', c.SoDienThoai ? esc((c.NguoiQuanLy ? c.NguoiQuanLy + ' · ' : '') + c.SoDienThoai) : 'Chưa có số điện thoại', !c.SoDienThoai) +
      muc('data-tt-xem="' + esc(ma) + '"', 'building', 'Xem chi tiết', 'Thông tin cơ sở và khách đang ở') +
      (ghi && !dung ? muc('data-tt-khach="' + esc(ma) + '"', 'plus', 'Đăng ký khách tại đây', '') : '') + '</ul>');
  }

  // ---------- Chọn nhiều cơ sở để đánh dấu "đã kiểm tra" cùng lúc ----------
  function veThanhChon() {
    var el = $('#cThanhChon'); if (!el) return;
    document.body.classList.toggle('dang-chon', !!S.chonCS);
    if (!S.chonCS) { el.innerHTML = ''; return; }
    var n = Object.keys(S.chonCS).length;
    el.innerHTML = '<div class="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] lg:bottom-4 lg:left-64 z-30 px-3 lg:px-10"><div class="mx-auto max-w-[1280px] card shadow-lg flex flex-wrap items-center gap-2 px-3 py-2">' +
      '<b class="text-sm px-1">Đã chọn ' + n + '</b><button type="button" class="btn-ghost btn-sm" data-bulk="trang">Chọn cả trang</button>' +
      (n ? '<button type="button" class="btn-ghost btn-sm" data-bulk="bo">Bỏ chọn</button>' : '') + '<span class="flex-1"></span>' +
      '<button type="button" class="btn-ghost btn-sm" data-chon-nhieu>Xong</button>' +
      '<button type="button" class="btn-primary btn-sm"' + (n ? ' data-bulk="kt"' : ' disabled') + '>' + ic('check') + 'Đánh dấu đã KT ' + thangVN(homNay()) + '</button></div></div>';
  }
  function bulkCoSo(viec) {
    if (viec === 'bo') { S.chonCS = {}; return veDsCoSo(); }
    if (viec === 'trang') {
      var t = S.trangSo && S.trangSo.coso, ds = S.coSoDangXem || [];
      var bd = t ? (t.so - 1) * 10 : 0;
      ds.slice(bd, bd + 10).forEach(function (c) { if (!c.DaKiemTraThang && c.TrangThaiHoatDong !== 'Dừng hoạt động') S.chonCS[c.MaCoSo] = 1; });
      return veDsCoSo();
    }
    var mas = Object.keys(S.chonCS);
    hoi('Đánh dấu đã kiểm tra?', 'Ghi nhận ' + mas.length + ' cơ sở đã được kiểm tra ngày ' + vn(homNay()) + '.', 'Đánh dấu').then(function (ok) {
      if (!ok) return;
      goi('kiemTraNhieu', { mas: mas }).then(function (kq) {
        kq.daGhi.forEach(function (c) { if (c.DuLieuThu !== true) vaCoSo(c); });
        sauKhiGhi('coso');
        toast('Đã đánh dấu ' + kq.daGhi.length + ' cơ sở' + (kq.boQua.length ? ', bỏ qua ' + kq.boQua.length + ' cơ sở đã kiểm tra trước đó' : '') + '.');
        S.chonCS = null; veDsCoSo();
        var nut = $('[data-chon-nhieu]'); if (nut) nut.setAttribute('aria-pressed', 'false');
      });
    });
  }

  /** Chi tiết kiểm tra trong ngăn kéo cơ sở: ô tích "đã kiểm tra tháng này" (kèm ngày tích) + các lần trước. */
  function oKiemTraChiTiet(c) {
    var da = !!c.DaKiemTraThang, thang = homNay().slice(0, 7);
    var duoc = duocGhiBanGhi(c) && (da || c.TrangThaiHoatDong !== 'Dừng hoạt động');
    var truoc = String(c.LichSuKiemTra || '').split(';').filter(function (x) { return /^\d{4}-\d{2}-\d{2}$/.test(x) && x.slice(0, 7) !== thang; }).sort().reverse().slice(0, 6);
    return '<label class="flex items-start gap-3 rounded-xl border px-3 py-2.5 ' + (da ? 'border-mint-ink/30 bg-mint/60' : 'border-line bg-white') + (duoc ? ' cursor-pointer' : ' opacity-80') + '">' +
      '<input type="checkbox" class="mt-0.5 size-5 shrink-0 accent-[#1F6B4A]" data-kt-hop="' + esc(c.MaCoSo) + '"' + (da ? ' checked' : '') + (duoc ? '' : ' disabled') + '>' +
      '<span class="min-w-0"><b class="block text-sm font-medium">Đã kiểm tra tháng ' + thangVN(homNay()) + '</b>' +
      '<span class="block text-xs ' + (da ? 'text-mint-ink' : 'text-muted') + '">' + (da ? (c.NgayKiemTraThang ? 'Ngày tích: ' + vn(c.NgayKiemTraThang) : 'Theo phiếu thống kê 9/2026') : (duoc ? 'Bấm để ghi nhận đã kiểm tra hôm nay' : 'Chưa kiểm tra')) + '</span></span></label>' +
      (truoc.length ? '<span class="block text-xs text-muted mt-1.5">Các lần trước: ' + truoc.map(vn).join(', ') + '</span>' : '') +
      '<span class="block text-xs text-muted mt-0.5">Tự chuyển về “chưa kiểm tra” khi sang tháng mới.</span>';
  }
  /** Nhãn trạng thái kiểm tra tháng này trong danh sách cơ sở (không bấm được – tích ở chi tiết cơ sở). */
  function nhanKiemTra(c) {
    if (c.DaKiemTraThang) return '<span class="badge bg-mint text-mint-ink" title="Đã kiểm tra ' + thangVN(homNay()) + (c.NgayKiemTraThang ? ' – ngày ' + vn(c.NgayKiemTraThang) : ' (theo phiếu thống kê)') + '">' + ic('check', 'size-3.5') + 'Đã KT' + (c.NgayKiemTraThang ? ' ' + vn(c.NgayKiemTraThang).slice(0, 5) : '') + '</span>';
    if (c.TrangThaiHoatDong === 'Dừng hoạt động') return '';
    return '<span class="badge bg-butter text-butter-ink" title="Chưa kiểm tra ' + thangVN(homNay()) + '">Chưa KT</span>';
  }
  var thangVN = function (iso) { var x = String(iso).split('-'); return (+x[1]) + '/' + x[0]; };

  /** Tích / bỏ tích kiểm tra tháng này cho cơ sở ma. */
  function kiemTraCoSo(ma, khiHuy, muonDa) {
    var c = (S.coSo || []).filter(function (x) { return x.MaCoSo === ma; })[0] || (S.coSoThu || []).filter(function (x) { return x.MaCoSo === ma; })[0];
    var da = muonDa !== undefined ? !muonDa : !!(c && c.DaKiemTraThang);
    var chay = function () {
      goi('kiemTraCoSo', { ma: ma, daKiemTra: !da }).then(function (kq) {
        if (kq.DuLieuThu !== true) { vaCoSo(kq); sauKhiGhi('coso'); }
        toast(kq.DaKiemTraThang ? 'Đã ghi kiểm tra ' + kq.TenCoSo + ' ngày ' + vn(kq.NgayKiemTraThang) : 'Đã bỏ tích kiểm tra ' + kq.TenCoSo);
        if ($('#cList')) veDsCoSo();
        if (!$('#drawerWrap').hidden && $('#drawer').dataset.ma === ma && $('#csKhach')) { if (kq.DuLieuThu === true) veCoSo(kq, null); xemCoSo(ma); }
      }, function () { if (khiHuy) khiHuy(); });
    };
    if (!da) return chay();
    hoi('Bỏ tích đã kiểm tra?', (c ? c.TenCoSo + ' – ' : '') + 'xoá ghi nhận kiểm tra ' + thangVN(homNay()) + (c && c.NgayKiemTraThang ? ' (ngày ' + vn(c.NgayKiemTraThang) + ')' : '') + '.', 'Bỏ tích', true).then(function (ok) { if (ok) chay(); else if (khiHuy) khiHuy(); });
  }

  // ---------- Phân trang theo số trang (danh sách cơ sở: 10 dòng / trang) ----------
  function trangSo(loai, ds, khoaLoc, moiTrang) {
    var p = S.trangSo = S.trangSo || {};
    if (!p[loai] || p[loai].khoa !== khoaLoc) p[loai] = { khoa: khoaLoc, so: 1 };
    var tong = Math.max(1, Math.ceil(ds.length / moiTrang));
    if (p[loai].so > tong) p[loai].so = tong;
    var bd = (p[loai].so - 1) * moiTrang;
    return { loai: loai, hien: ds.slice(bd, bd + moiTrang), trang: p[loai].so, tong: tong, bd: bd };
  }
  function nutTrang(loai, t) {
    if (t.tong <= 1) return '';
    var b = Math.min(t.tong, Math.max(t.trang + 2, 5)), a = Math.max(1, b - 4), so = [];
    for (var i = a; i <= b; i++) so.push(i);
    var nut = function (nhan, trang, tat, dangO, tieuDe) {
      return '<button type="button" class="grid place-items-center min-w-11 h-11 sm:min-w-9 sm:h-9 px-2 rounded-lg text-sm font-medium ' + (dangO ? 'bg-ink text-white' : 'bg-white border border-line text-ink hover:bg-canvas') + (tat ? ' opacity-40 pointer-events-none' : '') + '"' +
        (tat || dangO ? '' : ' data-trang="' + loai + ':' + trang + '"') + ' aria-label="' + tieuDe + '"' + (dangO ? ' aria-current="page"' : '') + '>' + nhan + '</button>';
    };
    return '<nav class="flex flex-wrap items-center justify-center gap-1.5 mt-4" aria-label="Phân trang">' +
      nut('‹', t.trang - 1, t.trang === 1, false, 'Trang trước') +
      (a > 1 ? nut('1', 1, false, false, 'Trang 1') + (a > 2 ? '<span class="px-1 text-muted">…</span>' : '') : '') +
      so.map(function (n) { return nut(String(n), n, false, n === t.trang, 'Trang ' + n); }).join('') +
      (b < t.tong ? (b < t.tong - 1 ? '<span class="px-1 text-muted">…</span>' : '') + nut(String(t.tong), t.tong, false, false, 'Trang ' + t.tong) : '') +
      nut('›', t.trang + 1, t.trang === t.tong, false, 'Trang sau') + '</nav>';
  }

  // ================= BỔ SUNG DỮ LIỆU CƠ SỞ =================
  // Chỉ chỉ ra chỗ thiếu/cần kiểm tra; cán bộ tự điền thông tin thật khi đi kiểm tra cơ sở.
  var LOAI_VD = {
    sdt: ['Thiếu số điện thoại', 'bg-butter text-butter-ink', 'Chưa có số liên hệ chủ cơ sở'],
    ten: ['Tên chung chung', 'bg-sky text-sky-ink', 'Tên chỉ là loại hình (vd "Nhà trọ"), khó phân biệt'],
    diachi: ['Trùng địa chỉ', 'bg-rose text-rose-ink', 'Có cơ sở khác cùng địa chỉ – kiểm tra có nhập 2 lần không'],
    phong: ['Thiếu số phòng', 'bg-lilac text-lilac-ink', 'Chưa ghi số lượng phòng'],
    dkkd: ['Chưa ghi ĐKKD', 'bg-peach text-peach-ink', 'Chưa chọn có/không đăng ký kinh doanh, hoặc thiếu mã số thuế']
  };
  var chuanDC = function (s) { return boDau(s).replace(/[.,;]/g, ' ').replace(/\s+/g, ' ').trim(); };
  /** Cơ sở đang hoạt động còn thiếu thông tin: [{ c, loi: ['sdt'|'ten'|'diachi'|'phong'], trung: [mã cơ sở cùng địa chỉ] }] */
  function vanDeCoSo(ds) {
    var chung = ((S.dm && S.dm.LoaiHinh) || []).concat(['Phòng trọ', 'Khu trọ', 'Nhà', 'Cơ sở']).map(function (x) { return boDau(x).trim(); });
    var theoDC = {};
    ds.forEach(function (c) { var k = chuanDC(c.DiaChi); if (k) (theoDC[k] = theoDC[k] || []).push(c.MaCoSo); });
    return ds.filter(function (c) { return c.TrangThaiHoatDong !== 'Dừng hoạt động'; }).map(function (c) {
      var loi = [], trung = (theoDC[chuanDC(c.DiaChi)] || []).filter(function (m) { return m !== c.MaCoSo; });
      if (!String(c.SoDienThoai || '').trim()) loi.push('sdt');
      if (chung.indexOf(boDau(c.TenCoSo).trim()) >= 0) loi.push('ten');
      if (trung.length) loi.push('diachi');
      if (c.SoLuongPhong === '' || c.SoLuongPhong == null) loi.push('phong');
      if (!c.DangKyKinhDoanh || (c.DangKyKinhDoanh === 'Có' && !c.MaSoThue)) loi.push('dkkd');
      return { c: c, loi: loi, trung: trung };
    }).filter(function (x) { return x.loi.length; });
  }
  /** Thẻ nhắc ở Tổng quan / trang Cơ sở (chỉ người được sửa). */
  function theBoSung() {
    if (!duocGhi() || !S.coSo) return '';
    var n = vanDeCoSo(S.coSo).length;
    if (!n) return '';
    return '<a href="#/bo-sung" class="card flex items-center gap-3 px-4 py-3 mb-4 lg:mb-6 hover:border-[#D6DAF5] transition"><span class="grid place-items-center size-9 shrink-0 rounded-xl bg-butter text-butter-ink">' + ic('alert') + '</span>' +
      '<span class="min-w-0 flex-1 text-sm"><b class="font-medium">' + soVN(n) + ' cơ sở cần bổ sung thông tin</b><span class="block text-xs text-muted">Số điện thoại, số phòng, đăng ký kinh doanh, tên chung chung, trùng địa chỉ</span></span>' + ic('chev', 'size-4 text-muted shrink-0') + '</a>';
  }

  function trangBoSung() {
    S.locBS = S.locBS || { loai: '', q: '' };
    $('#view').innerHTML = dauTrang('Bổ sung dữ liệu cơ sở', 'Cơ sở đang hoạt động còn thiếu thông tin hoặc cần kiểm tra lại. Bấm vào cơ sở để sửa.') +
      '<div id="bsTom" class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4"></div>' +
      '<div class="card p-3 mb-4"><label class="relative block"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted">' + ic('search') + '</span><input id="bsQ" class="inp pl-9" placeholder="Tìm tên, địa chỉ, mã, chủ cơ sở, CSKV…" value="' + esc(S.locBS.q) + '"></label></div>' +
      '<div id="bsCSKV"></div><div id="bsList">' + khungCho(3) + '</div>';
    $('#bsQ').addEventListener('input', debounce(function (e) { S.locBS.q = e.target.value; veBoSung(); }, 150));
    docNhanh('dsCoSo', 'dsCoSo', {}).then(function () { if ($('#bsList')) veBoSung(); })
      .catch(function () { if ($('#bsList')) $('#bsList').innerHTML = trong('Không tải được danh sách', 'Thử tải lại trang.'); });
  }

  function veBoSung() {
    if (!$('#bsList')) return;
    var vd = vanDeCoSo(S.coSo || []), L = S.locBS, q = boDau(L.q).trim();
    var dem = {}; vd.forEach(function (x) { x.loi.forEach(function (l) { dem[l] = (dem[l] || 0) + 1; }); });
    $('#bsTom').innerHTML = Object.keys(LOAI_VD).map(function (l) {
      var on = L.loai === l;
      return '<button type="button" data-bs-loai="' + l + '" aria-pressed="' + on + '" class="card p-4 text-left transition ' + (on ? 'border-brand ring-4 ring-brand/15' : 'hover:border-[#D6DAF5]') + '">' +
        '<span class="badge ' + LOAI_VD[l][1] + '">' + LOAI_VD[l][0] + '</span><b class="block text-2xl mt-2 leading-none">' + soVN(dem[l] || 0) + '</b><span class="block text-xs text-muted mt-1.5">' + LOAI_VD[l][2] + '</span></button>';
    }).join('');
    if (!vd.length) { $('#bsCSKV').innerHTML = ''; $('#bsList').innerHTML = trong('Dữ liệu cơ sở đã đầy đủ', 'Không còn cơ sở đang hoạt động nào thiếu thông tin.'); return; }
    // Admin: tiến độ theo CSKV (bấm để lọc)
    if (laAdmin()) {
      var theo = {};
      vd.forEach(function (x) { var k = x.c.CSKV || '(chưa gán)'; theo[k] = (theo[k] || 0) + 1; });
      var tong = {}; (S.coSo || []).forEach(function (c) { var k = c.CSKV || '(chưa gán)'; tong[k] = (tong[k] || 0) + 1; });
      $('#bsCSKV').innerHTML = '<details class="card mb-4"><summary class="px-4 py-3 cursor-pointer text-sm font-medium">Theo CSKV <span class="text-muted font-normal">(' + Object.keys(theo).length + ' CSKV còn cơ sở cần bổ sung)</span></summary>' +
        '<div class="flex flex-wrap gap-2 px-4 pb-4">' + Object.keys(theo).sort(function (a, b) { return theo[b] - theo[a]; }).map(function (k) {
          return '<button type="button" class="chip" data-bs-cskv="' + esc(k === '(chưa gán)' ? '' : k) + '">' + esc(k) + '<span class="opacity-60">' + theo[k] + '/' + (tong[k] || 0) + '</span></button>';
        }).join('') + '</div></details>';
    } else $('#bsCSKV').innerHTML = '';
    var ds = vd.filter(function (x) {
      if (L.loai && x.loi.indexOf(L.loai) < 0) return false;
      var c = x.c;
      return !q || boDau([c.MaCoSo, c.TenCoSo, c.DiaChi, c.NguoiQuanLy, c.CSKV].join(' ')).indexOf(q) >= 0;
    });
    if (!ds.length) { $('#bsList').innerHTML = '<div class="card px-6 py-10 text-center text-sm text-muted">Không có cơ sở phù hợp bộ lọc.</div>'; return; }
    var ten = {}; (S.coSo || []).forEach(function (c) { ten[c.MaCoSo] = c.TenCoSo; });
    var hien = phanTrang('bosung', ds, JSON.stringify(L));
    $('#bsList').innerHTML = '<ul class="card divide-y divide-line">' + hien.map(function (x) {
      var c = x.c;
      return '<li><button type="button" ' + (duocGhi() ? 'data-sua-coso' : 'data-xem-coso') + '="' + esc(c.MaCoSo) + '" class="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-canvas/60">' +
        '<span class="min-w-0 flex-1"><b class="block text-sm truncate">' + esc(c.TenCoSo) + '</b>' +
        '<span class="block text-xs text-muted truncate">' + esc(c.MaCoSo) + ' · ' + esc(c.DiaChi) + (c.NguoiQuanLy ? ' · ' + esc(c.NguoiQuanLy) : '') + (c.CSKV ? ' · CSKV ' + esc(c.CSKV) : '') + '</span>' +
        '<span class="flex flex-wrap gap-1.5 mt-2">' + x.loi.map(function (l) { return '<span class="badge ' + LOAI_VD[l][1] + '">' + LOAI_VD[l][0] + '</span>'; }).join('') + '</span>' +
        (x.trung.length ? '<span class="block text-xs text-rose-ink mt-1.5">Cùng địa chỉ: ' + esc(x.trung.map(function (m) { return m + (ten[m] ? ' ' + ten[m] : ''); }).join('; ')) + '</span>' : '') + '</span>' +
        (duocGhi() ? '<span class="shrink-0 text-brand-600 text-xs font-medium flex items-center gap-1 mt-0.5">' + ic('edit', 'size-3.5') + 'Sửa</span>' : '') + '</button></li>';
    }).join('') + '</ul>' + nutXemThem('bosung', hien.length, ds.length) +
      '<p class="text-xs text-muted mt-3 px-1">Hiển thị ' + soVN(hien.length) + (hien.length < ds.length ? ' trong ' + soVN(ds.length) : '') + ' · ' + soVN(vd.length) + ' cơ sở cần bổ sung / ' + soVN((S.coSo || []).length) + ' cơ sở</p>';
  }

  // Chi tiết cơ sở: hiện ngay từ danh sách đã tải (kèm nút Đăng ký khách), danh sách khách tải bổ sung sau
  function xemCoSo(ma) {
    var sanCo = (S.coSo || []).filter(function (x) { return x.MaCoSo === ma; })[0];
    var khachSan = layDem('dsTamTru');
    if (sanCo) veCoSo(sanCo, khachSan ? khachSan.filter(function (k) { return k.MaCoSo === ma; }) : null);
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
      dong('Tổ dân phố', esc(c.ToDanPho)) + dong('CSKV', esc(c.CSKV)) +
      dong('Đăng ký kinh doanh', c.DangKyKinhDoanh === 'Có' ? 'Có' + (c.MaSoThue ? ' · MST <b class="font-medium tracking-wide">' + esc(c.MaSoThue) + '</b>' : ' <span class="text-xs text-rose-ink">(chưa ghi mã số thuế)</span>') : esc(c.DangKyKinhDoanh)) +
      dong('Kiểm tra ' + thangVN(homNay()), oKiemTraChiTiet(c)) +
      dong('Hoạt động', esc(c.TrangThaiHoatDong)) + dong('Ghi chú', esc(c.GhiChu)) + (laAdmin() ? dong('Nguồn', '<span class="text-xs text-muted">' + esc(c.NguonDuLieu) + '</span>') : '') +
      (c.DuLieuThu === true ? dong('', '<span class="badge bg-mint text-mint-ink">Dữ liệu thử – không tính vào thống kê</span>') : '') + '</dl>' +
      '<div id="csKhach" class="mt-6"></div>' +
      '</div>' +
      (duocGhiBanGhi(c) ? '<footer class="flex items-center gap-2 px-4 sm:px-6 py-4 border-t border-line">' + (laAdmin() || (laLanhDao() && c.DuLieuThu === true) ? '<button class="btn-danger px-3" data-xoa-coso="' + esc(c.MaCoSo) + '" title="Xoá">' + ic('trash') + '<span class="hidden sm:inline">Xoá</span></button>' : '') +
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
        dangO.length ? nhomTheoPhong(dangO).map(function (g) {
          var nutPhong = g.phong && g.ds.length > 1 && duocGhi() ? '<span class="flex gap-1"><button class="btn-ghost btn-sm px-2" data-gia-han="' + esc(g.ds[0].ID) + '" data-ca-phong title="Gia hạn cả phòng">' + ic('calendar') + 'Gia hạn</button>' +
            '<button class="btn-soft btn-sm px-2" data-di="' + esc(g.ds[0].ID) + '" data-ca-phong title="Xác nhận cả phòng rời đi">' + ic('out') + 'Rời đi</button></span>' : '';
          return '<div class="mb-3"><div class="flex items-center gap-2 mb-1.5 px-1 min-h-8"><span class="text-[13px] font-medium">' + (g.phong ? 'Phòng ' + esc(g.phong) : 'Chưa ghi số phòng') + '</span><span class="text-xs text-muted">' + g.ds.length + ' người</span><span class="flex-1"></span>' + nutPhong + '</div>' +
            '<ul class="card divide-y divide-line">' + g.ds.map(function (k) {
              return '<li><button data-xem-khach="' + esc(k.ID) + '" class="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-canvas/60"><span class="min-w-0 flex-1"><b class="block text-sm truncate">' + esc(k.HoTen) + '</b><span class="text-xs text-muted">' + conLaiTxt(k) + '</span></span>' + badgeTT(k.TrangThai) + '</button></li>';
            }).join('') + '</ul></div>';
        }).join('') : '<p class="text-sm text-muted">Chưa có khách đang lưu trú.</p>');
  }
  /** Gom khách theo số phòng (không phân biệt hoa thường/dấu), phòng xếp theo số; người chưa ghi phòng để cuối. */
  function nhomTheoPhong(ds) {
    var m = {}, thuTu = [];
    ds.forEach(function (k) {
      var p = String(k.SoPhong || '').trim(), key = boDau(p);
      if (!m[key]) { m[key] = { phong: p, ds: [] }; thuTu.push(key); }
      m[key].ds.push(k);
    });
    return thuTu.sort(function (a, b) { return !a ? 1 : !b ? -1 : a.localeCompare(b, 'vi', { numeric: true }); }).map(function (k) { return m[k]; });
  }

  function formCoSo(c, ganDuLieuThu) {
    var moi = !c; c = c || {};
    var dm = S.dm || { LoaiHinh: [] };
    var o = function (id, nhan, cls, attr) { return '<div class="' + (cls || '') + '"><label class="lbl" for="' + id + '">' + nhan + '</label><input id="' + id + '" name="' + id + '" class="inp" value="' + esc(c[id]) + '" ' + (attr || '') + '></div>'; };
    moNganKeo(dauNganKeo(moi ? (ganDuLieuThu ? 'Thêm cơ sở thử' : 'Thêm cơ sở lưu trú') : 'Sửa cơ sở', moi ? (ganDuLieuThu ? 'Dữ liệu thử – không tính vào thống kê thật' : 'Mã cơ sở được cấp tự động') : esc(c.MaCoSo)) +
      '<form id="fCS" class="flex-1 overflow-y-auto px-5 sm:px-6 py-5 grid grid-cols-2 gap-3 content-start" novalidate>' +
      (ganDuLieuThu ? '<div class="col-span-2 flex gap-2 items-start rounded-xl bg-mint text-mint-ink px-3 py-2 text-sm">' + ic('check', 'size-4 mt-0.5 shrink-0') + '<span>Cơ sở này chỉ dùng để thử nghiệm, sẽ không xuất hiện trong Tổng quan, Báo cáo hay danh sách cơ sở thật.</span></div>' : '') +
      o('TenCoSo', 'Tên cơ sở *', 'col-span-2', 'required autofocus') +
      '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="LoaiHinh">Loại hình *</label><select id="LoaiHinh" name="LoaiHinh" class="inp"><option value="">— Chọn —</option>' + dm.LoaiHinh.map(function (l) { return '<option' + (l === c.LoaiHinh ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></div>' +
      '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="TrangThaiHoatDong">Hoạt động</label><select id="TrangThaiHoatDong" name="TrangThaiHoatDong" class="inp"><option value="">(chưa ghi nhận)</option>' + (dm.TrangThaiHoatDong || []).map(function (l) { return '<option' + (l === c.TrangThaiHoatDong ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></div>' +
      o('DiaChi', 'Địa chỉ cơ sở *', 'col-span-2', 'required') +
      o('NguoiQuanLy', 'Người quản lý / chủ cơ sở', 'col-span-2 sm:col-span-1') + o('SoDienThoai', 'Số điện thoại', 'col-span-2 sm:col-span-1', 'inputmode="tel"') +
      o('DiaChiNguoiQuanLy', 'Địa chỉ thường trú của chủ cơ sở', 'col-span-2') +
      o('SoLuongPhong', 'Số lượng phòng', '', 'inputmode="numeric"') + o('SoNhanKhauKhaiBao', 'Nhân khẩu khai báo', '', 'inputmode="numeric"') +
      o('ToDanPho', 'Tổ dân phố', '', 'inputmode="numeric"') + (laAdmin() || laLanhDao() ? o('CSKV', 'CSKV phụ trách', '', 'list="dsCSKV"') : '<div><label class="lbl" for="CSKV">CSKV phụ trách</label><input id="CSKV" name="CSKV" class="inp bg-canvas text-muted" readonly value="' + esc(moi ? S.user.CSKV : c.CSKV) + '" title="Chỉ Admin được đổi CSKV"></div>') +
      '<datalist id="dsCSKV">' + (S.coSo || []).map(function (x) { return x.CSKV; }).filter(function (x, i, a) { return x && a.indexOf(x) === i; }).map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>' +
      '<div class="col-span-2"><span class="lbl">Đăng ký kinh doanh</span><div class="grid grid-cols-2 gap-2">' + ['Có', 'Không'].map(function (v) {
        return '<label><input type="radio" name="DangKyKinhDoanh" value="' + v + '" class="peer sr-only"' + (c.DangKyKinhDoanh === v ? ' checked' : '') + '><span class="flex h-10 items-center justify-center rounded-xl border border-line text-sm cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand peer-checked:text-brand-600">' + (v === 'Có' ? 'Có đăng ký kinh doanh' : 'Không đăng ký') + '</span></label>';
      }).join('') + '</div></div>' +
      '<div id="oMST" class="col-span-2' + (c.DangKyKinhDoanh === 'Có' ? '' : ' hidden') + '"><label class="lbl" for="MaSoThue">Mã số thuế</label><input id="MaSoThue" name="MaSoThue" class="inp tracking-wide" inputmode="numeric" maxlength="14" placeholder="10 chữ số (chi nhánh: 0101234567-001)" value="' + esc(c.MaSoThue) + '"></div>' +
      '<div class="col-span-2"><label class="lbl" for="GhiChuCS">Ghi chú</label><textarea id="GhiChuCS" name="GhiChu" rows="2" class="inp h-auto py-2">' + esc(c.GhiChu) + '</textarea></div>' +
      '<p id="fLoi" class="col-span-2 hidden text-sm bg-rose text-rose-ink rounded-xl px-3 py-2"></p></form>' +
      '<footer class="flex gap-2 px-5 sm:px-6 py-4 border-t border-line"><button data-close class="btn-ghost">Huỷ</button><span class="flex-1"></span><button id="fLuu" form="fCS" class="btn-primary min-w-28">' + (moi ? 'Thêm' : 'Lưu thay đổi') + '</button></footer>');
    var f = $('#fCS');
    f.addEventListener('change', function (e) { if (e.target.name === 'DangKyKinhDoanh') $('#oMST').classList.toggle('hidden', e.target.value !== 'Có'); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = {};
      ['TenCoSo', 'LoaiHinh', 'TrangThaiHoatDong', 'DiaChi', 'NguoiQuanLy', 'SoDienThoai', 'DiaChiNguoiQuanLy', 'SoLuongPhong', 'SoNhanKhauKhaiBao', 'ToDanPho', 'CSKV', 'GhiChu'].forEach(function (k) { d[k] = f[k].value.trim(); });
      var dk = f.querySelector('[name=DangKyKinhDoanh]:checked'); d.DangKyKinhDoanh = dk ? dk.value : '';
      d.MaSoThue = d.DangKyKinhDoanh === 'Có' ? f.MaSoThue.value.replace(/\s+/g, '') : '';
      if (d.MaSoThue && !/^\d{10}(-?\d{3})?$/.test(d.MaSoThue)) { $('#fLoi').textContent = 'Mã số thuế gồm 10 chữ số (chi nhánh: 10 số, dấu -, 3 số).'; $('#fLoi').classList.remove('hidden'); return; }
      var loi = !d.TenCoSo ? 'Chưa nhập tên cơ sở.' : !d.LoaiHinh ? 'Chưa chọn loại hình.' : !d.DiaChi ? 'Chưa nhập địa chỉ.' : '';
      if (loi) { $('#fLoi').textContent = loi; $('#fLoi').classList.remove('hidden'); return; }
      if (!moi) { d.ma = c.MaCoSo; d._phienBan = c.NgayCapNhat; }
      if (moi && ganDuLieuThu) d.duLieuThu = true;
      var nut = $('#fLuu'); nut.disabled = true;
      API.goi(moi ? 'themCoSo' : 'suaCoSo', d).then(function (kq) {
        if (kq.DuLieuThu !== true) { vaCoSo(kq); sauKhiGhi('coso'); }
        toast(moi ? 'Đã thêm ' + kq.MaCoSo : 'Đã lưu ' + kq.MaCoSo); dongNganKeo();
        if (kq.DuLieuThu === true) trangDuLieuThu(); else lamMoi();
      }).catch(function (err) { $('#fLoi').textContent = err.message; $('#fLoi').classList.remove('hidden'); nut.disabled = false; });
    });
  }

  // ================= DỮ LIỆU THỬ (Lãnh đạo dùng thử / Admin demo) =================
  function trangDuLieuThu() {
    if (!laAdmin() && !laLanhDao()) { location.hash = '#/tong-quan'; return; }
    var v = $('#view');
    v.innerHTML = dauTrang('Dữ liệu thử', 'Cơ sở và khách tự tạo để dùng thử – không tính vào Tổng quan, Báo cáo hay tra cứu thật',
      '<button class="btn-primary" data-them-cs-thu>' + ic('plus') + 'Thêm cơ sở thử</button>') +
      '<div class="flex gap-2 items-start rounded-2xl bg-sky text-sky-ink px-4 py-3 text-sm mb-5">' + ic('alert', 'size-4 mt-0.5 shrink-0') +
      '<span>Dùng để tự tạo cơ sở và khai báo khách nhằm thử các chức năng của hệ thống. Toàn bộ dữ liệu ở trang này tách riêng khỏi dữ liệu thật.</span></div>' +
      '<div id="dtList">' + khungCho(3) + '</div>';
    var luot = S.luot;
    API.goi('dsCoSo', { duLieuThu: true }).then(function (cs) {
      if (luot !== S.luot || !$('#dtList')) return;
      S.coSoThu = cs;
      if (!cs.length) { $('#dtList').innerHTML = trong('Chưa có cơ sở thử', 'Bấm "Thêm cơ sở thử" để bắt đầu, sau đó khai báo khách vào cơ sở đó.'); return; }
      API.goi('dsTamTru', { duLieuThu: true }).then(function (kh) {
        if (luot !== S.luot || !$('#dtList')) return;
        var demKhach = {};
        kh.forEach(function (k) { demKhach[k.MaCoSo] = (demKhach[k.MaCoSo] || 0) + (k.TrangThai !== 'Đã rời đi' ? 1 : 0); });
        $('#dtList').innerHTML = '<div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">' + cs.map(function (c) {
          return '<div class="card p-4 flex flex-col gap-3"><button data-xem-coso="' + esc(c.MaCoSo) + '" class="text-left"><b class="block truncate">' + esc(c.TenCoSo) + '</b><span class="text-xs text-muted">' + esc(c.MaCoSo) + (c.DiaChi ? ' · ' + esc(c.DiaChi) : '') + '</span></button>' +
            '<span class="text-[13px] text-muted">' + soVN(demKhach[c.MaCoSo] || 0) + ' khách đang ở (thử)</span>' +
            '<button type="button" class="btn-soft btn-sm w-full" data-them-kh-thu="' + esc(c.MaCoSo) + '">' + ic('plus') + 'Đăng ký khách thử</button></div>';
        }).join('') + '</div>';
      });
    }).catch(function () { if ($('#dtList')) $('#dtList').innerHTML = trong('Không tải được dữ liệu thử', 'Thử tải lại trang.'); });
  }

  // ================= CÁN BỘ =================
  var dsCB = [];
  function trangCanBo() {
    var v = $('#view');
    v.innerHTML = dauTrang('Cán bộ quản lý', 'Tài khoản Google được phép đăng nhập và quyền hạn', laAdmin() ? '<button class="btn-primary" data-them-cb>' + ic('plus') + 'Thêm cán bộ</button>' : '') + '<div id="cbList">' + khungCho(3) + '</div>';
    docNhanh('dsCanBo', 'dsCanBo', {}).then(function (ds) {
      if (!$('#cbList')) return;   // đã chuyển sang trang khác
      dsCB = ds;
      var chua = ds.filter(function (x) { return x.TrangThai === 'Chưa kích hoạt'; }).length;
      var mauQ = { Admin: 'bg-lilac text-lilac-ink', CanBo: 'bg-sky text-sky-ink', Xem: 'bg-fog text-fog-ink', LanhDao: 'bg-mint text-mint-ink' };
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
        (chua ? '<div class="flex gap-2 items-start rounded-2xl bg-butter text-butter-ink px-4 py-3 text-sm mb-4">' + ic('alert', 'size-4 mt-0.5 shrink-0') + '<span>' + chua + ' cán bộ chưa có email nên chưa đăng nhập được. Gửi lời mời ở mục <b>Triển khai tới CSKV</b> bên dưới để họ tự đăng nhập và gửi yêu cầu.</span></div>' : '') +
        '<div class="card overflow-hidden"><div class="overflow-x-auto scroll-thin"><table class="w-full min-w-[640px]"><thead><tr><th class="th">Mã</th><th class="th">Họ tên / CSKV</th><th class="th">Email</th><th class="th">Quyền</th><th class="th">Trạng thái</th>' + (laAdmin() ? '<th class="th"></th>' : '') + '</tr></thead><tbody>' +
        ds.map(function (x) {
          return '<tr class="hover:bg-canvas/60"><td class="td text-muted">' + esc(x.MaCanBo) + '</td><td class="td"><b class="font-medium block">' + esc(x.HoTen || (x.CSKV ? 'CSKV ' + x.CSKV : '')) + '</b><span class="text-xs text-muted">' + (x.HoTen ? (x.CSKV ? 'CSKV ' + esc(x.CSKV) : '') : 'chưa có họ tên') + (x.PhuongXa ? ' · ' + esc(x.PhuongXa) : '') + '</span></td>' +
            '<td class="td">' + (esc(x.Email) || '<span class="text-muted">—</span>') + '</td><td class="td"><span class="badge ' + (mauQ[x.Quyen] || '') + '">' + esc(x.Quyen) + '</span></td><td class="td"><span class="badge ' + (mauT[x.TrangThai] || 'bg-fog text-fog-ink') + '">' + esc(x.TrangThai) + '</span></td>' +
            (laAdmin() ? '<td class="td text-right"><button class="btn-ghost btn-sm" data-sua-cb="' + esc(x.MaCanBo) + '">' + ic('edit') + '</button></td>' : '') + '</tr>';
        }).join('') + '</tbody></table></div></div><div id="tkCSKV" class="mt-6"></div>';
      dsCB = ds.concat(choDuyet);
      if (laAdmin()) veTrienKhai(ds.concat(choDuyet));
    });
  }

  // ---------- Triển khai tới CSKV: ai đã dùng, ai chưa, sao chép lời mời ----------
  function veTrienKhai(dsCanBo) {
    Promise.all([napCoSo(), layDem('dsTamTru') ? Promise.resolve(layDem('dsTamTru')) : API.goi('dsTamTru', {}).then(function (d) { datDem('dsTamTru', d); return d; })]).then(function (kq) {
      var el = $('#tkCSKV'); if (!el) return;
      var coSo = kq[0], khach = kq[1], vd = vanDeCoSo(coSo), m = {};
      var lay = function (ten) { var k = boDau(ten).trim(); if (!m[k]) m[k] = { ten: ten, coSo: 0, khach: 0, boSung: 0, cb: null }; return m[k]; };
      coSo.forEach(function (c) { if (c.CSKV) lay(c.CSKV).coSo++; });
      khach.forEach(function (k) { if (k.CSKV) lay(k.CSKV).khach++; });
      vd.forEach(function (x) { if (x.c.CSKV) lay(x.c.CSKV).boSung++; });
      dsCanBo.forEach(function (c) {
        if (!c.CSKV) return;
        var k = boDau(c.CSKV).trim(); if (!m[k]) return;   // chỉ CSKV có cơ sở
        var cu = m[k].cb, hang = { 'Hoạt động': 3, 'Chờ duyệt': 2, 'Chưa kích hoạt': 1 };
        if (!cu || (hang[c.TrangThai] || 0) > (hang[cu.TrangThai] || 0)) m[k].cb = c;
      });
      var ds = Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) { return a.ten.localeCompare(b.ten, 'vi'); });
      var daDung = ds.filter(function (x) { return x.cb && x.cb.TrangThai === 'Hoạt động'; }).length;
      var tt = function (x) {
        if (!x.cb || !x.cb.Email) return '<span class="badge bg-butter text-butter-ink">Chưa có tài khoản</span>';
        if (x.cb.TrangThai === 'Chờ duyệt') return '<span class="badge bg-sky text-sky-ink">Chờ duyệt</span>';
        if (x.cb.TrangThai === 'Hoạt động') return '<span class="badge bg-mint text-mint-ink">Đang dùng</span><span class="block text-xs text-muted mt-1 truncate max-w-[200px]">' + esc(x.cb.Email) + '</span>';
        return '<span class="badge bg-fog text-fog-ink">' + esc(x.cb.TrangThai) + '</span>';
      };
      el.innerHTML = '<div class="flex flex-wrap items-end gap-3 mb-3"><div><h2 class="font-semibold">Triển khai tới CSKV</h2><p class="text-[13px] text-muted">' + daDung + '/' + ds.length + ' CSKV đang dùng hệ thống. Sao chép lời mời rồi tự gửi qua Zalo, tin nhắn hoặc email.</p></div>' +
        '<button type="button" class="btn-soft btn-sm sm:ml-auto" data-sao-loi-moi="">' + ic('clip') + 'Sao chép lời mời chung</button></div>' +
        '<div class="card overflow-hidden"><div class="overflow-x-auto scroll-thin"><table class="w-full min-w-[640px]"><thead><tr><th class="th">CSKV</th><th class="th text-right">Cơ sở</th><th class="th text-right">Khách đã nhập</th><th class="th text-right">Cần bổ sung</th><th class="th">Tài khoản</th><th class="th"></th></tr></thead><tbody>' +
        ds.map(function (x) {
          var dung = x.cb && x.cb.TrangThai === 'Hoạt động';
          return '<tr class="hover:bg-canvas/60"><td class="td font-medium">' + esc(x.ten) + (x.cb && x.cb.HoTen ? '<span class="block text-xs text-muted font-normal">' + esc(x.cb.HoTen) + '</span>' : '') + '</td>' +
            '<td class="td text-right">' + soVN(x.coSo) + '</td><td class="td text-right">' + (x.khach ? soVN(x.khach) : '<span class="text-muted">0</span>') + '</td>' +
            '<td class="td text-right">' + (x.boSung ? soVN(x.boSung) : '<span class="text-muted">0</span>') + '</td><td class="td">' + tt(x) + '</td>' +
            '<td class="td text-right">' + (dung ? '' : '<button type="button" class="btn-ghost btn-sm" data-sao-loi-moi="' + esc(x.ten) + '" title="Sao chép lời mời cho CSKV ' + esc(x.ten) + '">' + ic('clip') + 'Lời mời</button>') + '</td></tr>';
        }).join('') + '</tbody></table></div></div>';
      S.trienKhai = m;
    }).catch(function () { if ($('#tkCSKV')) $('#tkCSKV').innerHTML = '<p class="text-sm text-rose-ink">Không tải được số liệu triển khai.</p>'; });
  }

  function saoLoiMoi(cskv) {
    var url = location.origin + location.pathname;
    var x = cskv && S.trienKhai ? S.trienKhai[boDau(cskv).trim()] : null;
    var txt = 'Chào ' + (cskv ? 'đồng chí CSKV ' + cskv : 'các đồng chí') + ',\n' +
      'Phường đang dùng Hệ thống Quản lý Tạm trú tại cơ sở lưu trú để ghi nhận khách tạm trú' + (x ? ' (địa bàn ' + cskv + ' có ' + x.coSo + ' cơ sở)' : '') + '.\n' +
      '1. Mở ' + url + ' (trên điện thoại hoặc máy tính)\n' +
      '2. Bấm "Đăng nhập bằng Google" bằng Gmail của mình\n' +
      '3. Ở form "Gửi yêu cầu truy cập", ô CSKV điền đúng: ' + (cskv || '<tên CSKV của mình như trong danh sách phường>') + '\n' +
      '4. Chờ quản trị viên duyệt, sau đó mở lại trang là dùng được.\n' +
      'Hướng dẫn sử dụng: ' + url.replace(/index\.html$/, '') + 'huongdan.html';
    var xong = function () { toast('Đã sao chép lời mời' + (cskv ? ' cho CSKV ' + cskv : '') + '. Dán vào Zalo / tin nhắn để gửi.'); };
    var duPhong = function () {
      var t = document.createElement('textarea'); t.value = txt; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); xong(); } catch (e) { toast('Không sao chép được, hãy chép tay.', 'loi'); }
      t.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(xong, duPhong); else duPhong();
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
      '<div><span class="lbl">Cấp quyền *</span><div class="grid grid-cols-2 sm:grid-cols-4 gap-2">' + [['Xem', 'Chỉ xem'], ['CanBo', 'Cán bộ'], ['LanhDao', 'Lãnh đạo'], ['Admin', 'Quản trị']].map(function (q) {
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
      API.goi('duyetCanBo', d).then(function (r) { sauKhiGhi('canbo'); toast('Đã duyệt ' + x.Email + ' → ' + r.MaCanBo); dongNganKeo(); lamMoi(); })
        .catch(function (err) { $('#fLoi').textContent = err.message; $('#fLoi').classList.remove('hidden'); nut.disabled = false; });
    });
  }

  function tuChoi(ma) {
    var x = dsCB.filter(function (c) { return c.MaCanBo === ma; })[0];
    hoi('Từ chối yêu cầu của ' + (x ? x.Email : ma) + '?', 'Người này sẽ không đăng nhập được và không gửi lại yêu cầu được. Lý do (không bắt buộc):', 'Từ chối', true,
      '<input class="inp" maxlength="200" placeholder="VD: không xác định được danh tính">').then(function (kq) {
      if (!kq) return;
      goi('tuChoiCanBo', { ma: ma, lyDo: kq.v }).then(function () { sauKhiGhi('canbo'); toast('Đã từ chối'); dongNganKeo(); lamMoi(); });
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
      API.goi(moi ? 'themCanBo' : 'suaCanBo', d).then(function () { sauKhiGhi('canbo'); toast('Đã lưu'); dongNganKeo(); lamMoi(); })
        .catch(function (err) { $('#fLoi').textContent = err.message; $('#fLoi').classList.remove('hidden'); });
    });
  }

  // ================= LỊCH SỬ =================
  function trangLichSu() {
    var v = $('#view');
    if (!laAdmin()) {
      v.innerHTML = dauTrang('Lịch sử thao tác', '200 thao tác gần nhất do chính tài khoản của bạn thực hiện') + '<div id="lsList">' + khungCho(4) + '</div>';
      return veLichSu();
    }
    v.innerHTML = dauTrang('Lịch sử thao tác', '200 thao tác gần nhất · sao lưu · chính sách dữ liệu') +
      '<section id="csDuLieu" class="card p-4 sm:p-5 mb-4 text-sm"><h2 class="font-semibold mb-1">Chính sách dữ liệu</h2><p class="text-muted">Đang tải…</p></section>' +
      '<section class="card p-4 sm:p-5 mb-5"><div class="flex flex-wrap items-center gap-3"><div class="min-w-0 flex-1"><h2 class="font-semibold">Sao lưu</h2><p class="text-[13px] text-muted">Tự động lúc 1 giờ sáng mỗi ngày, giữ 30 bản gần nhất trong thư mục Drive “TamTru – Sao lưu”.</p></div>' +
      '<button id="btnSaoLuu" class="btn-soft btn-sm">' + ic('check') + 'Sao lưu ngay</button></div><div id="slList" class="mt-3 text-sm text-muted">Đang tải danh sách…</div></section>' +
      '<div id="lsList">' + khungCho(4) + '</div>';
    var veSaoLuu = function () {
      docNhanh('dsSaoLuu', 'dsSaoLuu', {}).then(function (ds) {
        if (!$('#slList')) return;
        $('#slList').innerHTML = ds.length ? '<ul class="divide-y divide-line">' + ds.slice(0, 5).map(function (x) {
          return '<li class="py-2 flex gap-3"><span class="flex-1 min-w-0 truncate text-ink">' + esc(x.ten) + '</span><a class="text-brand-600 shrink-0" href="' + esc(x.url) + '" target="_blank" rel="noopener">Mở</a></li>';
        }).join('') + '</ul>' + (ds.length > 5 ? '<p class="text-xs mt-1">… và ' + (ds.length - 5) + ' bản cũ hơn</p>' : '') : 'Chưa có bản sao lưu nào.';
      }).catch(function () { if ($('#slList')) $('#slList').textContent = 'Không tải được danh sách sao lưu.'; });
    };
    veSaoLuu();
    $('#btnSaoLuu').addEventListener('click', function (e) {
      var b = e.currentTarget; b.disabled = true; b.textContent = 'Đang sao lưu…';
      goi('saoLuu').then(function (r) { sauKhiGhi('saoluu'); toast('Đã sao lưu: ' + r.ten); veSaoLuu(); })
        .catch(function () {}).then(function () { if (document.body.contains(b)) { b.disabled = false; b.innerHTML = ic('check') + 'Sao lưu ngay'; } });
    });
    docNhanh('chinhSach', 'chinhSachDuLieu', {}).then(function (p) {
      if (!$('#csDuLieu')) return;
      $('#csDuLieu').innerHTML = '<h2 class="font-semibold mb-2">Chính sách dữ liệu</h2><ul class="list-disc pl-5 text-muted flex flex-col gap-1">' +
        '<li>Hồ sơ khách <b class="text-ink">đã rời đi quá ' + p.soNgayLuu + ' ngày</b> được tự động ẩn danh lúc 2 giờ sáng: xoá họ tên, số giấy tờ, ngày sinh, nơi thường trú, ghi chú; giữ cơ sở, ngày đến/đi, quốc tịch để thống kê. Nhật ký liên quan cũng được làm mờ.</li>' +
        '<li>Không lưu ảnh giấy tờ, chỉ lưu số CCCD/hộ chiếu.</li>' +
        '<li>Đã ẩn danh: <b class="text-ink">' + soVN(p.daAnDanh) + '</b> hồ sơ · sẽ ẩn danh trong 30 ngày tới: <b class="text-ink">' + soVN(p.sapAnDanh30Ngay) + '</b> hồ sơ.</li>' +
        '<li>Khách chưa được xác nhận rời đi sẽ không bị ẩn danh. Hãy xử lý các khách <a class="text-brand-600 underline" href="#/tam-tru/Quá hạn">Quá hạn</a>.</li></ul>';
    }).catch(function () {});
    veLichSu();
  }

  function veLichSu() {
    docNhanh('dsLichSu', 'dsLichSu', { gioiHan: 200 }).then(function (ds) {
      if (!$('#lsList')) return;
      var mau = { 'Thêm': 'bg-mint text-mint-ink', 'Sửa': 'bg-sky text-sky-ink', 'Xoá': 'bg-rose text-rose-ink', 'Tải tệp': 'bg-lilac text-lilac-ink', 'Duyệt': 'bg-mint text-mint-ink', 'Sao lưu': 'bg-fog text-fog-ink', 'Tra cứu': 'bg-butter text-butter-ink', 'Xuất Excel': 'bg-peach text-peach-ink', 'Ẩn danh': 'bg-fog text-fog-ink' };
      var tenBang = { DanhSachTamTru: 'Khách', CoSoLuuTru: 'Cơ sở', CanBoQuanLy: 'Cán bộ' };
      $('#lsList').innerHTML = ds.length ? '<ol class="card divide-y divide-line">' + ds.map(function (x) {
        var nd = x.HanhDong === 'Xoá' ? 'Nội dung bản ghi đã lưu' : x.NoiDung;
        return '<li class="px-4 py-3 flex gap-3"><span class="badge shrink-0 ' + (mau[x.HanhDong] || 'bg-fog text-fog-ink') + '">' + esc(x.HanhDong) + '</span><div class="min-w-0 flex-1 text-sm"><b class="font-medium">' + esc((tenBang[x.Bang] || x.Bang) + ' ' + x.MaBanGhi) + '</b>' +
          '<p class="text-muted text-[13px] break-words line-clamp-2">' + esc(nd) + '</p><p class="text-xs text-muted mt-0.5">' + vnTG(x.ThoiGian) + ' · ' + esc(x.Email) + '</p></div></li>';
      }).join('') + '</ol>' : trong('Chưa có thao tác nào', 'Các thao tác thêm, sửa, xoá sẽ được ghi lại tại đây.');
    });
  }

  // ================= THƯ VIỆN NẠP KHI CẦN =================
  var THU_VIEN = {
    jsQR: 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',
    XLSX: 'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js'   // SheetJS + định dạng ô (kẻ viền, tô màu)
  };
  var daNap = {};
  function napThuVien(ten) {
    if (window[ten]) return Promise.resolve(window[ten]);
    if (daNap[ten]) return daNap[ten];
    daNap[ten] = new Promise(function (ok, loi) {
      var s = document.createElement('script');
      s.src = THU_VIEN[ten]; s.async = true;
      s.onload = function () { ok(window[ten]); };
      s.onerror = function () { delete daNap[ten]; loi(new Error('Không tải được thư viện ' + ten + '. Kiểm tra mạng.')); };
      document.head.appendChild(s);
    });
    return daNap[ten];
  }

  // ================= QUÉT MÃ QR CCCD =================
  // Mã QR mặt trước CCCD gắn chip: SốCCCD|SốCMND cũ|Họ tên|NgàySinh(ddMMyyyy)|Giới tính|Nơi thường trú|Ngày cấp(ddMMyyyy)
  function docQRCCCD(chuoi) {
    var p = String(chuoi || '').normalize('NFC').trim().split('|');
    if (p.length < 5 || !/^\d{12}$/.test(p[0]) || !p[2]) return null;
    var ns = /^\d{8}$/.test(p[3] || '') ? p[3].slice(4) + '-' + p[3].slice(2, 4) + '-' + p[3].slice(0, 2) : '';
    var gt = (p[4] || '').trim();
    return { SoCCCD_Pass: p[0], HoTen: p[2].trim(), NgaySinh: ns, GioiTinh: gt === 'Nam' || gt === 'Nữ' ? gt : '', NoiThuongTru: (p[5] || '').trim() };
  }
  window.__docQRCCCD = docQRCCCD;   // cho bài thử

  function moQuetQR(khiXong) {
    var w = document.createElement('div');
    w.id = 'qrWrap';
    w.className = 'fixed inset-0 z-[70] bg-ink/90 flex flex-col items-center justify-center p-4 text-white';
    w.innerHTML = '<div class="w-full max-w-md flex flex-col gap-3">' +
      '<div class="flex items-center"><b class="text-base">Quét mã QR trên CCCD</b><button type="button" data-qr-dong class="ml-auto btn-ghost btn-sm text-white hover:bg-white/10" aria-label="Đóng">' + ic('x', 'size-5') + '</button></div>' +
      '<div class="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]"><video id="qrVideo" playsinline muted class="w-full h-full object-cover"></video>' +
      '<div class="absolute inset-[12%] border-2 border-white/80 rounded-2xl pointer-events-none"></div></div>' +
      '<p id="qrMsg" class="text-sm text-white/80 text-center">Đưa mã QR ở góc trên bên phải mặt trước CCCD vào khung. Giữ máy yên, đủ sáng.</p>' +
      '<label class="btn bg-white/15 hover:bg-white/25 text-white cursor-pointer">' + ic('idcard') + 'Chụp / chọn ảnh CCCD<input id="qrAnh" type="file" accept="image/*" capture="environment" class="sr-only"></label>' +
      '</div>';
    document.body.appendChild(w);
    var video = $('#qrVideo'), msg = $('#qrMsg'), luong = null, dung = false, canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
    var detector = ('BarcodeDetector' in window) ? (function () { try { return new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { return null; } })() : null;
    function dong() {
      dung = true;
      if (luong) luong.getTracks().forEach(function (t) { t.stop(); });
      w.remove();
    }
    function xuLyChuoi(s) {
      var q = docQRCCCD(s);
      if (!q) { msg.textContent = 'Đã đọc được mã QR nhưng không đúng định dạng CCCD. Thử lại.'; return false; }
      dong(); khiXong(q); return true;
    }
    function giaiMa(nguon, rong, cao, thuDaoMau) {
      canvas.width = rong; canvas.height = cao;
      ctx.drawImage(nguon, 0, 0, rong, cao);
      var anh = ctx.getImageData(0, 0, rong, cao);
      var kq = window.jsQR(anh.data, rong, cao, { inversionAttempts: thuDaoMau ? 'attemptBoth' : 'dontInvert' });
      return kq ? kq.data : null;
    }
    function vongQuet() {
      if (dung) return;
      if (video.readyState >= 2 && video.videoWidth) {
        var p = detector ? detector.detect(video).then(function (ds) { return ds.length ? ds[0].rawValue : null; }).catch(function () { return null; }) : Promise.resolve(null);
        p.then(function (s) {
          if (dung) return;
          if (!s && window.jsQR) {
            var tl = Math.min(1, 900 / video.videoWidth);
            s = giaiMa(video, Math.round(video.videoWidth * tl), Math.round(video.videoHeight * tl), false);
          }
          if (s && xuLyChuoi(s)) return;
          setTimeout(vongQuet, 180);
        });
      } else setTimeout(vongQuet, 200);
    }
    w.addEventListener('click', function (e) { if (e.target.closest('[data-qr-dong]')) dong(); });
    $('#qrAnh').addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) return;
      msg.textContent = 'Đang đọc ảnh…';
      napThuVien('jsQR').then(function () {
        var img = new Image();
        img.onload = function () {
          var s = null;
          [1600, 1100, 800].some(function (max) {
            var tl = Math.min(1, max / Math.max(img.width, img.height));
            s = giaiMa(img, Math.round(img.width * tl), Math.round(img.height * tl), true);
            return !!s;
          });
          URL.revokeObjectURL(img.src);
          if (!s) { msg.textContent = 'Không tìm thấy mã QR trong ảnh. Chụp gần hơn, rõ nét, đủ sáng.'; return; }
          xuLyChuoi(s);
        };
        img.src = URL.createObjectURL(f);
      }).catch(function (err) { msg.textContent = err.message; });
    });
    napThuVien('jsQR').catch(function () {});   // nạp sẵn cho vòng quét
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { msg.textContent = 'Thiết bị không hỗ trợ camera trên trình duyệt. Dùng “Chụp / chọn ảnh CCCD”.'; return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false }).then(function (st) {
      if (dung) { st.getTracks().forEach(function (t) { t.stop(); }); return; }
      luong = st; video.srcObject = st; video.play().catch(function () {});
      vongQuet();
    }).catch(function () {
      msg.textContent = 'Không mở được camera (chưa cho phép hoặc máy không có). Dùng “Chụp / chọn ảnh CCCD”.';
    });
  }

  // ================= XUẤT EXCEL =================
  // bang: [{ ten, cot: [[khoá, tiêu đề, chữ?]], dong: [...] }] – cột "chữ" giữ nguyên dạng văn bản (CCCD không mất số 0)
  // Mỗi trang tính: dòng tiêu đề lớn, dòng thông tin, hàng tiêu đề cột tô màu, kẻ viền toàn bảng, dòng xen kẽ màu, số canh phải.
  var KIEU_XL = (function () {
    var vien = function (mau) { var v = { style: 'thin', color: { rgb: mau } }; return { top: v, bottom: v, left: v, right: v }; };
    var font = function (them) { var f = { name: 'Arial', sz: 10, color: { rgb: '2B2D42' } }; for (var k in them) f[k] = them[k]; return f; };
    return {
      tieuDe: { font: font({ sz: 14, bold: true, color: { rgb: '3B45B5' } }), alignment: { vertical: 'center' } },
      phu: { font: font({ sz: 9, italic: true, color: { rgb: '6B7089' } }), alignment: { vertical: 'center' } },
      cot: { font: font({ bold: true, color: { rgb: 'FFFFFF' } }), fill: { patternType: 'solid', fgColor: { rgb: '5463E6' } }, border: vien('3B45B5'),
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true } },
      o: function (chan, so) {
        return { font: font({}), border: vien('C9CCD9'), fill: chan ? { patternType: 'solid', fgColor: { rgb: 'F3F4FA' } } : undefined,
          alignment: { horizontal: so ? 'right' : 'left', vertical: 'center', wrapText: true } };
      },
      khoa: { font: font({ bold: true }), fill: { patternType: 'solid', fgColor: { rgb: 'EEF0FE' } }, border: vien('C9CCD9'), alignment: { vertical: 'center', wrapText: true } },
      tong: { font: font({ bold: true }), fill: { patternType: 'solid', fgColor: { rgb: 'DDF4EA' } }, border: vien('C9CCD9'), alignment: { horizontal: 'right', vertical: 'center' } }
    };
  })();
  /** Dựng một trang tính có kẻ bảng. dong0 = mảng các dòng dữ liệu (mảng giá trị); cotChu[j] = true nếu cột j là văn bản. */
  function trangTinh(X, tieuDe, phu, tieuDeCot, dong0, cotChu) {
    var n = tieuDeCot.length, aoa = [[tieuDe], [phu], tieuDeCot].concat(dong0);
    var sh = X.utils.aoa_to_sheet(aoa);
    var dat = function (r, c, kieu) { var ref = X.utils.encode_cell({ r: r, c: c }); if (!sh[ref]) sh[ref] = { t: 's', v: '' }; sh[ref].s = kieu; return sh[ref]; };
    dat(0, 0, KIEU_XL.tieuDe); dat(1, 0, KIEU_XL.phu);
    sh['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(n - 1, 0) } }, { s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(n - 1, 0) } }];
    for (var j = 0; j < n; j++) dat(2, j, KIEU_XL.cot);
    for (var i = 0; i < dong0.length; i++) {
      for (var k = 0; k < n; k++) {
        var o = dat(i + 3, k, KIEU_XL.o(i % 2 === 1, !cotChu[k] && typeof dong0[i][k] === 'number'));
        if (cotChu[k] && o.v !== '') { o.t = 's'; o.v = String(o.v); o.z = '@'; }
      }
    }
    // Độ rộng cột theo nội dung dài nhất (tối đa 45 ký tự)
    sh['!cols'] = tieuDeCot.map(function (t, c) {
      var m = String(t).length;
      dong0.forEach(function (d) { var v = d[c]; if (v != null) m = Math.max(m, String(v).length); });
      return { wch: Math.min(45, Math.max(8, m + 2)) };
    });
    sh['!rows'] = [{ hpt: 24 }, { hpt: 16 }, { hpt: 30 }];
    if (dong0.length) sh['!autofilter'] = { ref: X.utils.encode_range({ s: { r: 2, c: 0 }, e: { r: dong0.length + 2, c: n - 1 } }) };
    return sh;
  }
  function xuatExcel(tenFile, bang, thongTin, nhatKy) {
    return napThuVien('XLSX').then(function (X) {
      var wb = X.utils.book_new(), luc = new Date().toLocaleString('vi-VN');
      var phamVi = S.phamVi && !S.phamVi.toanPhuong ? 'Địa bàn CSKV ' + S.phamVi.cskv : 'Toàn phường';
      var tt = [['Hệ thống', 'Quản lý Tạm trú tại Cơ sở Lưu trú'], ['Người xuất', (S.user.HoTen || '') + ' <' + S.user.Email + '>'], ['Thời điểm', luc], ['Phạm vi', phamVi]]
        .concat(thongTin || []).concat(bang.map(function (b) { return ['Trang “' + b.ten + '”', b.dong.length + ' dòng']; }));
      var sh0 = trangTinh(X, 'THÔNG TIN BÁO CÁO', 'Tệp ' + tenFile, ['Mục', 'Nội dung'], tt.map(function (x) { return [x[0], x[1] == null ? '' : x[1]]; }), [true, true]);
      for (var i = 0; i < tt.length; i++) sh0[X.utils.encode_cell({ r: i + 3, c: 0 })].s = KIEU_XL.khoa;
      sh0['!cols'] = [{ wch: 26 }, { wch: 70 }];
      X.utils.book_append_sheet(wb, sh0, 'Thông tin');
      bang.forEach(function (b) {
        var dong0 = b.dong.map(function (r) { return b.cot.map(function (c) { var v = r[c[0]]; return v == null ? '' : (c[2] ? String(v) : v); }); });
        var coTong = b.cot[0][0] === 'k' && !/Tổng hợp/.test(b.ten) && dong0.length > 1;
        if (coTong) dong0.push(b.cot.map(function (c, j) { return j === 0 ? 'Tổng cộng' : dong0.reduce(function (t, d) { return typeof d[j] === 'number' ? t + d[j] : t; }, 0); }));
        var cotChu = b.cot.map(function (c) { return !!c[2]; });
        var sh = trangTinh(X, b.ten.toUpperCase(), phamVi + ' · ' + b.dong.length + ' dòng · xuất lúc ' + luc, b.cot.map(function (c) { return c[1]; }), dong0, cotChu);
        // Trang dạng "chỉ tiêu – số lượng": in đậm cột chỉ tiêu, tô nền cột số
        if (b.cot.length <= 3 && b.cot[0][0] === 'k') {
          for (var r = 0; r < dong0.length; r++) {
            sh[X.utils.encode_cell({ r: r + 3, c: 0 })].s = KIEU_XL.khoa;
            if (/^—/.test(String(dong0[r][0]))) sh[X.utils.encode_cell({ r: r + 3, c: 0 })].s = KIEU_XL.o(false, false);
            var o1 = sh[X.utils.encode_cell({ r: r + 3, c: 1 })]; if (o1 && typeof o1.v === 'number') o1.s = KIEU_XL.tong;
          }
        }
        if (coTong) for (var t2 = 0; t2 < b.cot.length; t2++) sh[X.utils.encode_cell({ r: dong0.length + 2, c: t2 })].s = t2 === 0 ? KIEU_XL.khoa : KIEU_XL.tong;
        X.utils.book_append_sheet(wb, sh, b.ten.slice(0, 31));
      });
      X.writeFile(wb, tenFile);
      API.goi('ghiNhatKy', { loai: 'Xuất Excel', bang: nhatKy.bang, noiDung: nhatKy.noiDung }).then(function () { sauKhiGhi('nhatky'); }).catch(function () {});
      toast('Đã xuất ' + tenFile);
    }).catch(function (e) { toast(e.message, 'loi'); });
  }
  var ngayFile = function () { return homNay().replace(/-/g, ''); };
  var tenPhamVi = function () { return S.phamVi && !S.phamVi.toanPhuong ? boDau(S.phamVi.cskv).replace(/[^a-z0-9]+/g, '') : 'toanphuong'; };

  function xuatKhach() {
    var ds = S.khachDangXem || [];
    if (!ds.length) return toast('Không có dòng nào để xuất.', 'canh');
    var boLoc = [S.loc.trangThai === '*' ? 'Tất cả trạng thái' : (S.loc.trangThai || 'Đang lưu trú'), S.loc.maCoSo ? 'cơ sở ' + S.loc.maCoSo : '', S.loc.loai ? 'hình thức ' + S.loc.loai : '',
      S.loc.tu ? 'đến từ ' + vn(S.loc.tu) : '', S.loc.den ? 'đến trước ' + vn(S.loc.den) : '', S.loc.q ? 'tìm "' + S.loc.q + '"' : ''].filter(String).join(', ');
    xuatExcel('TamTru_khach_' + tenPhamVi() + '_' + ngayFile() + '.xlsx', [{ ten: 'Khách tạm trú', dong: dongKhach(ds), cot: COT_KHACH }],
      [['Bộ lọc', boLoc], ['Số dòng', ds.length]], { bang: 'TamTru', noiDung: ds.length + ' khách · ' + boLoc });
  }

  // Báo cáo Excel đầy đủ cho trang Tổng quan: số liệu tổng hợp + mọi danh sách đang hiển thị (không cắt bớt).
  var COT_KHACH = [['ID', 'Mã', 1], ['HoTen', 'Họ tên', 1], ['SoCCCD_Pass', 'Số CCCD/Hộ chiếu', 1], ['NgaySinh', 'Ngày sinh', 1], ['GioiTinh', 'Giới tính', 1], ['QuocTich', 'Quốc tịch', 1],
    ['NoiThuongTru', 'Nơi thường trú', 1], ['LoaiKhaiBao', 'Hình thức khai báo', 1], ['MaCoSo', 'Mã cơ sở', 1], ['TenCoSo', 'Tên cơ sở', 1], ['DiaChiCoSo', 'Địa chỉ cơ sở', 1], ['CSKV', 'CSKV', 1], ['SoPhong', 'Phòng', 1],
    ['NgayDen', 'Ngày đến', 1], ['NgayDiDuKien', 'Ngày đi dự kiến', 1], ['NgayDiThucTe', 'Ngày đi thực tế', 1], ['TrangThai', 'Trạng thái', 1],
    ['TienAn', 'Tiền án, tiền sự', 1], ['TienAnGhiChu', 'Ghi rõ tiền án', 1], ['KetQuaTest', 'Kết quả test', 1], ['CT10', 'Phiếu CT10', 1], ['NgayNhap', 'Thời điểm nhập', 1], ['NguoiTao', 'Người nhập', 1], ['GhiChu', 'Ghi chú', 1]];
  var dongKhach = function (ds) {
    return ds.map(function (r) { var o = {}; for (var k in r) o[k] = r[k]; ['NgaySinh', 'NgayDen', 'NgayDiDuKien', 'NgayDiThucTe'].forEach(function (k) { o[k] = vn(r[k]); });
      o.CT10 = r.DaGuiCT10 === true ? 'Đã gửi' : 'Chưa gửi'; o.NgayNhap = r.NgayTao ? vnTG(r.NgayTao) : ''; return o; });
  };
  function xuatTongQuan() {
    var t = layDem('tongQuan');
    if (!t) return toast('Chưa tải xong số liệu tổng quan.', 'canh');
    var napKh = layDem('dsTamTru') ? Promise.resolve(layDem('dsTamTru')) : goi('dsTamTru', {}).then(function (d) { datDem('dsTamTru', d); return d; });
    Promise.all([napKh, napCoSo()]).then(function (kq) {
      var kh = kq[0], cs = kq[1], hn = homNay(), thang = thangVN(t.coSo.thangKiemTra || hn);
      var dangO = kh.filter(function (r) { return r.TrangThai !== 'Đã rời đi'; });
      var homNayDK = kh.filter(function (r) { return String(r.NgayTao || '').slice(0, 10) === hn; });
      var canXuLy = kh.filter(function (r) { return r.TrangThai === 'Quá hạn' || r.TrangThai === 'Sắp hết hạn'; });
      var ct10 = dangO.filter(function (r) { return r.DaGuiCT10 !== true; });
      var csHD = cs.filter(function (c) { return c.TrangThaiHoatDong !== 'Dừng hoạt động'; });
      var daKT = cs.filter(function (c) { return c.DaKiemTraThang; }), chuaKT = csHD.filter(function (c) { return !c.DaKiemTraThang; });
      var k = t.khach.theoTrangThai, dk = (t.dangKyHomNay || {}).theoTrangThai || {};
      var tongHop = [
        ['Khách đang lưu trú', t.khach.dangLuuTru, 'người'], ['— Còn hạn (Đang ở)', k['Đang ở'], 'người'], ['— Sắp hết hạn', k['Sắp hết hạn'], 'người'], ['— Quá hạn', k['Quá hạn'], 'người'],
        ['Đã rời đi (còn lưu hồ sơ)', k['Đã rời đi'], 'người'], ['Cần gửi phiếu CT10', t.soCanGuiCT10 || 0, 'người'],
        ['Đăng ký trong ngày ' + vn(hn), (t.dangKyHomNay || {}).tong || 0, 'người'], ['— Đang ở', dk['Đang ở'] || 0, 'người'], ['— Sắp hết hạn', dk['Sắp hết hạn'] || 0, 'người'], ['— Quá hạn', dk['Quá hạn'] || 0, 'người'], ['— Đã rời đi', dk['Đã rời đi'] || 0, 'người'],
        ['Cơ sở lưu trú', t.coSo.tong, 'cơ sở'], ['— Dừng hoạt động', t.coSo.dungHoatDong, 'cơ sở'], ['— Đã kiểm tra ' + thang, t.coSo.daKiemTra, 'cơ sở'], ['— Đang hoạt động chưa kiểm tra ' + thang, chuaKT.length, 'cơ sở']
      ].map(function (x) { return { k: x[0], v: x[1], dv: x[2] }; });
      var cotCS = [['MaCoSo', 'Mã', 1], ['TenCoSo', 'Tên cơ sở', 1], ['LoaiHinh', 'Loại hình', 1], ['DiaChi', 'Địa chỉ', 1], ['NguoiQuanLy', 'Người quản lý', 1], ['SoDienThoai', 'Số điện thoại', 1],
        ['ToDanPho', 'Tổ', 1], ['CSKV', 'CSKV', 1], ['DangKyKinhDoanh', 'Đăng ký KD', 1], ['MaSoThue', 'Mã số thuế', 1], ['NgayKT', 'Ngày kiểm tra', 1], ['KhachDangO', 'Khách đang ở']];
      var dongCS = function (ds) { return ds.map(function (c) { var o = {}; for (var x in c) o[x] = c[x]; o.NgayKT = c.NgayKiemTraThang ? vn(c.NgayKiemTraThang) : (c.KiemTraTheoPhieu ? 'Theo phiếu thống kê' : ''); return o; }); };
      var bang = [
        { ten: 'Tổng hợp', cot: [['k', 'Chỉ tiêu'], ['v', 'Số lượng'], ['dv', 'Đơn vị']], dong: tongHop },
        { ten: 'Đăng ký hôm nay', cot: COT_KHACH, dong: dongKhach(homNayDK) },
        { ten: 'Cần xử lý', cot: COT_KHACH, dong: dongKhach(canXuLy) },
        { ten: 'Cần gửi CT10', cot: COT_KHACH, dong: dongKhach(ct10) },
        { ten: 'Đang lưu trú', cot: COT_KHACH, dong: dongKhach(dangO) },
        { ten: 'Theo loại hình', cot: [['k', 'Loại hình', 1], ['v', 'Số cơ sở']], dong: Object.keys(t.coSo.theoLoaiHinh).map(function (x) { return { k: x, v: t.coSo.theoLoaiHinh[x] }; }) }
      ];
      if (S.phamVi && S.phamVi.toanPhuong !== false) bang.push({ ten: 'Theo CSKV', cot: [['k', 'CSKV', 1], ['cs', 'Số cơ sở'], ['kh', 'Khách đang ở']],
        dong: Object.keys(t.coSo.theoCSKV).map(function (x) { return { k: x, cs: t.coSo.theoCSKV[x].coSo, kh: t.coSo.theoCSKV[x].khachDangO }; }) });
      bang.push({ ten: 'Đã KT ' + thang.replace('/', '-'), cot: cotCS, dong: dongCS(daKT) });
      bang.push({ ten: 'Chưa KT ' + thang.replace('/', '-'), cot: cotCS, dong: dongCS(chuaKT) });
      xuatExcel('TamTru_tongquan_' + tenPhamVi() + '_' + ngayFile() + '.xlsx', bang, [['Báo cáo', 'Tổng quan – số liệu đến ngày ' + vn(t.homNay)]],
        { bang: 'TongQuan', noiDung: 'Báo cáo tổng quan ' + vn(t.homNay) + ': ' + dangO.length + ' khách đang lưu trú, ' + cs.length + ' cơ sở' });
    });
  }

  function xuatCoSo() {
    var ds = S.coSoDangXem || [];
    if (!ds.length) return toast('Không có dòng nào để xuất.', 'canh');
    var L = S.locCS;
    var boLoc = [L.loaiHinh || 'Mọi loại hình', L.cskv ? 'CSKV ' + L.cskv : '', L.tdp ? 'tổ ' + L.tdp : '', L.kt ? (L.kt === 'da' ? 'đã' : 'chưa') + ' kiểm tra ' + thangVN(homNay()) : '', L.q ? 'tìm "' + L.q + '"' : ''].filter(String).join(', ');
    var dong = ds.map(function (c) { var o = {}; for (var k in c) o[k] = c[k]; o.KTThang = c.DaKiemTraThang ? 'Đã kiểm tra' : 'Chưa'; o.NgayKT = c.NgayKiemTraThang ? vn(c.NgayKiemTraThang) : (c.KiemTraTheoPhieu ? 'Theo phiếu thống kê' : ''); return o; });
    xuatExcel('TamTru_coso_' + tenPhamVi() + '_' + ngayFile() + '.xlsx', [{ ten: 'Cơ sở lưu trú', dong: dong, cot: [
      ['MaCoSo', 'Mã', 1], ['TenCoSo', 'Tên cơ sở', 1], ['LoaiHinh', 'Loại hình', 1], ['DiaChi', 'Địa chỉ', 1], ['NguoiQuanLy', 'Người quản lý', 1], ['SoDienThoai', 'Số điện thoại', 1],
      ['DiaChiNguoiQuanLy', 'Địa chỉ chủ cơ sở', 1], ['SoLuongPhong', 'Số phòng'], ['SoNhanKhauKhaiBao', 'Nhân khẩu khai báo'], ['ToDanPho', 'Tổ dân phố', 1], ['CSKV', 'CSKV', 1],
      ['DangKyKinhDoanh', 'Đăng ký kinh doanh', 1], ['MaSoThue', 'Mã số thuế', 1],
      ['KTThang', 'Kiểm tra ' + thangVN(homNay()), 1], ['NgayKT', 'Ngày kiểm tra', 1], ['TrangThaiHoatDong', 'Hoạt động', 1], ['KhachDangO', 'Khách đang ở'], ['KhachSapHet', 'Sắp hết hạn'], ['KhachQuaHan', 'Quá hạn'], ['GhiChu', 'Ghi chú', 1]] }],
      [['Bộ lọc', boLoc], ['Số dòng', ds.length]], { bang: 'CoSo', noiDung: ds.length + ' cơ sở · ' + boLoc });
  }

  // ================= TRA CỨU THEO CCCD =================
  function traCuuCCCD(soSan) {
    var pv = S.phamVi || { toanPhuong: true };
    moNganKeo(dauNganKeo('Tra cứu lịch sử tạm trú', pv.toanPhuong ? 'Toàn phường · mỗi lần tra cứu được ghi nhật ký' : 'Trong địa bàn CSKV ' + esc(pv.cskv) + ' · mỗi lần tra cứu được ghi nhật ký') +
      '<div class="flex-1 overflow-y-auto px-5 sm:px-6 py-5"><form id="fTraCuu" class="flex gap-2"><input id="tcSo" class="inp tracking-wide" inputmode="text" placeholder="Số CCCD (12 số) hoặc hộ chiếu" value="' + esc(soSan || '') + '" autofocus>' +
      '<button class="btn-primary shrink-0">' + ic('search') + 'Tra cứu</button></form><div id="tcKq" class="mt-5"></div></div>');
    var chay = function () {
      var so = $('#tcSo').value.replace(/\s+/g, '');
      if (!so) return;
      $('#tcKq').innerHTML = khungCho(2);
      goi('traCuuCCCD', { so: so }).then(function (kq) {
        sauKhiGhi('nhatky');
        if (!$('#tcKq')) return;
        $('#tcKq').innerHTML = '<p class="text-sm text-muted mb-3">' + (kq.ketQua.length ? 'Tìm thấy <b class="text-ink">' + kq.ketQua.length + '</b> lần tạm trú của số <b class="text-ink">' + esc(kq.so) + '</b>' : 'Không có lần tạm trú nào của số <b class="text-ink">' + esc(kq.so) + '</b>') + (kq.toanPhuong ? ' trong toàn phường.' : ' trong địa bàn của bạn.') + '</p>' +
          (kq.ketQua.length ? '<ol class="relative border-l-2 border-line ml-2 flex flex-col gap-4">' + kq.ketQua.map(function (r) {
            return '<li class="pl-4 relative"><span class="absolute -left-[7px] top-2 size-3 rounded-full ' + (CHAM_TT[r.TrangThai] || 'bg-fog-ink') + '"></span>' +
              '<button data-xem-khach="' + esc(r.ID) + '" class="card w-full text-left p-3 hover:border-[#D6DAF5]"><div class="flex items-start gap-2"><b class="flex-1 min-w-0 truncate text-sm">' + esc(r.TenCoSo || r.MaCoSo) + '</b>' + badgeTT(r.TrangThai) + '</div>' +
              '<span class="block text-xs text-muted mt-1">' + esc(r.HoTen) + ' · ' + vn(r.NgayDen) + ' → ' + (vn(r.NgayDiThucTe) || vn(r.NgayDiDuKien) || '…') + (r.SoPhong ? ' · P.' + esc(r.SoPhong) : '') + '</span>' +
              '<span class="block text-xs text-muted">' + esc(r.MaCoSo + ' · ' + r.DiaChiCoSo + (r.CSKV ? ' · CSKV ' + r.CSKV : '')) + '</span></button></li>';
          }).join('') + '</ol>' : '');
      }).catch(function () { if ($('#tcKq')) $('#tcKq').innerHTML = ''; });
    };
    $('#fTraCuu').addEventListener('submit', function (e) { e.preventDefault(); chay(); });
    if (soSan) chay();
  }

  // ================= BÁO CÁO THÁNG =================
  function trangBaoCao() {
    var v = $('#view'), luot = S.luot;
    var thang = S.thangBC || homNay().slice(0, 7);
    v.innerHTML = dauTrang('Báo cáo tháng', (S.phamVi && !S.phamVi.toanPhuong ? 'Địa bàn CSKV ' + esc(S.phamVi.cskv) : 'Toàn phường') + ' · lượt khách, cơ sở, việc cần kiểm tra') +
      '<div class="card p-3 sm:p-4 mb-4 flex flex-wrap items-center gap-2"><label class="text-sm text-muted" for="bcThang_g">Tháng</label>' + oNgay('bcThang', thang, { thang: true, max: homNay().slice(0, 7), cls: 'w-36', nhan: 'Tháng báo cáo' }) +
      '<span class="flex-1"></span><button type="button" id="bcXuat" class="btn-soft btn-sm" disabled>' + ic('down') + 'Xuất Excel</button></div><div id="bcND">' + khungCho(4) + '</div>';
    $('#bcThang').addEventListener('change', function (e) { if (e.target.value) { S.thangBC = e.target.value; trangBaoCao(); } });
    docNhanh('bc:' + thang, 'baoCaoThang', { thang: thang }).then(function (b) {
      if (luot !== S.luot || !$('#bcND')) return;
      var bang = function (tieuDe, obj, cot1) {
        var ks = Object.keys(obj || {}).sort(function (a, c) { return obj[c] - obj[a]; });
        return '<section class="card overflow-hidden"><header class="px-5 py-3"><h2 class="font-semibold">' + tieuDe + '</h2></header>' +
          (ks.length ? '<table class="w-full"><thead><tr><th class="th">' + cot1 + '</th><th class="th text-right">Lượt đến (lượt)</th></tr></thead><tbody>' +
            ks.map(function (k) { return '<tr><td class="td">' + esc(k) + '</td><td class="td text-right font-medium">' + soVN(obj[k]) + '</td></tr>'; }).join('') + '</tbody></table>' :
            '<p class="px-5 pb-4 text-sm text-muted">Không có lượt khách đến trong tháng.</p>') + '</section>';
      };
      var the = function (nhan, so, donVi, mau) { return '<div class="card p-4"><b class="block text-2xl font-semibold">' + soVN(so) + '</b><span class="text-[13px] text-muted">' + nhan + ' <span class="opacity-70">(' + donVi + ')</span></span><span class="block h-1 w-10 rounded-full mt-3 ' + mau + '"></span></div>'; };
      $('#bcND').innerHTML = '<p class="text-[13px] text-muted mb-3">Từ ' + vn(b.tuNgay) + ' đến ' + vn(b.denNgay) + ' · lập lúc ' + vnTG(b.lapLuc) + '</p>' +
        '<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">' + the('Lượt khách đến', b.khach.luotDen, 'lượt', 'bg-[#8EC5F5]') + the('Lượt rời đi', b.khach.luotDi, 'lượt', 'bg-[#C5C9D3]') +
        the('Đang lưu trú cuối tháng', b.khach.dangOCuoiThang, 'người', 'bg-[#8FD6B5]') + the('Người nước ngoài đến', b.khach.nuocNgoai, 'lượt', 'bg-[#B9A6E8]') + '</div>' +
        (b.khach.quaHanHienTai ? '<div class="flex gap-2 items-start rounded-2xl bg-rose text-rose-ink px-4 py-3 text-sm mb-5">' + ic('alert', 'size-4 mt-0.5 shrink-0') + '<span>Hiện có <b>' + b.khach.quaHanHienTai + '</b> khách quá hạn chưa xác nhận rời đi. <a href="#/tam-tru/Quá hạn" class="underline">Xem danh sách</a></span></div>' : '') +
        '<div class="grid lg:grid-cols-2 gap-4 mb-5">' + bang('Theo hình thức khai báo', b.theoLoaiKhaiBao, 'Hình thức') + bang('Theo loại hình cơ sở', b.theoLoaiHinh, 'Loại hình') + bang('Theo quốc tịch', b.theoQuocTich, 'Quốc tịch') +
        (b.theoCSKV ? bang('Theo cảnh sát khu vực', b.theoCSKV, 'CSKV') : '') +
        '<section class="card overflow-hidden"><header class="px-5 py-3"><h2 class="font-semibold">Cơ sở có nhiều lượt đến nhất</h2></header>' +
        (b.topCoSo.length ? '<table class="w-full"><tbody>' + b.topCoSo.map(function (c) { return '<tr class="hover:bg-canvas/60 cursor-pointer" data-xem-coso="' + esc(c.MaCoSo) + '"><td class="td"><b class="font-medium block">' + esc(c.TenCoSo) + '</b><span class="text-xs text-muted">' + esc(c.MaCoSo + ' · ' + c.DiaChi) + '</span></td><td class="td text-right font-medium whitespace-nowrap">' + soVN(c.luot) + ' lượt</td></tr>'; }).join('') + '</tbody></table>' : '<p class="px-5 pb-4 text-sm text-muted">Không có.</p>') + '</section></div>' +
        '<section class="card p-5"><h2 class="font-semibold mb-3">Cơ sở lưu trú</h2><div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">' +
        [['Tổng số', b.coSo.tong], ['Có khách trong tháng', b.coSo.coKhachTrongThang], ['Đã kiểm tra ' + thangVN(b.thang), b.coSo.daKiemTra], ['Dừng hoạt động', b.coSo.dungHoatDong]].map(function (x) { return '<div class="rounded-xl bg-canvas p-3"><b class="block text-lg">' + soVN(x[1]) + '</b><span class="text-muted text-xs">' + x[0] + ' (cơ sở)</span></div>'; }).join('') + '</div>' +
        '<details class="group"><summary class="cursor-pointer text-sm font-medium text-brand-600">Cơ sở đang hoạt động chưa kiểm tra ' + thangVN(b.thang) + ' (' + b.coSo.chuaKiemTra.length + ')</summary>' +
        '<div class="overflow-x-auto scroll-thin mt-3"><table class="w-full min-w-[520px]"><thead><tr><th class="th">Mã</th><th class="th">Tên / địa chỉ</th><th class="th">Tổ</th><th class="th">CSKV</th></tr></thead><tbody>' +
        b.coSo.chuaKiemTra.map(function (c) { return '<tr class="hover:bg-canvas/60 cursor-pointer" data-xem-coso="' + esc(c.MaCoSo) + '"><td class="td text-muted">' + esc(c.MaCoSo) + '</td><td class="td"><b class="font-medium block">' + esc(c.TenCoSo) + '</b><span class="text-xs text-muted">' + esc(c.LoaiHinh + ' · ' + c.DiaChi) + '</span></td><td class="td">' + esc(c.ToDanPho) + '</td><td class="td">' + esc(c.CSKV) + '</td></tr>'; }).join('') +
        '</tbody></table></div></details></section>';
      var nut = $('#bcXuat'); nut.disabled = false;
      nut.onclick = function () { xuatBaoCao(b); };
    }).catch(function () { if ($('#bcND')) $('#bcND').innerHTML = trong('Không lập được báo cáo', 'Thử lại sau.'); });
  }

  function xuatBaoCao(b) {
    var doiBang = function (obj, ten) { return Object.keys(obj || {}).sort(function (a, c) { return obj[c] - obj[a]; }).map(function (k) { var o = {}; o.k = k; o.v = obj[k]; return o; }); };
    var bang = [
      { ten: 'Tổng hợp', cot: [['k', 'Chỉ tiêu', 1], ['v', 'Số lượng'], ['dv', 'Đơn vị', 1]], dong: [
        { k: 'Lượt khách đến', v: b.khach.luotDen, dv: 'lượt' }, { k: 'Lượt rời đi', v: b.khach.luotDi, dv: 'lượt' }, { k: 'Đang lưu trú cuối tháng', v: b.khach.dangOCuoiThang, dv: 'người' },
        { k: 'Người nước ngoài đến', v: b.khach.nuocNgoai, dv: 'lượt' }, { k: 'Khách quá hạn (tại thời điểm lập)', v: b.khach.quaHanHienTai, dv: 'người' },
        { k: 'Cơ sở lưu trú', v: b.coSo.tong, dv: 'cơ sở' }, { k: 'Cơ sở có khách trong tháng', v: b.coSo.coKhachTrongThang, dv: 'cơ sở' },
        { k: 'Cơ sở đã kiểm tra ' + thangVN(b.thang), v: b.coSo.daKiemTra, dv: 'cơ sở' }, { k: 'Cơ sở dừng hoạt động', v: b.coSo.dungHoatDong, dv: 'cơ sở' },
        { k: 'Cơ sở đang hoạt động chưa kiểm tra ' + thangVN(b.thang), v: b.coSo.chuaKiemTra.length, dv: 'cơ sở' }] },
      { ten: 'Theo hình thức', cot: [['k', 'Hình thức khai báo', 1], ['v', 'Lượt đến']], dong: doiBang(b.theoLoaiKhaiBao) },
      { ten: 'Theo loại hình', cot: [['k', 'Loại hình', 1], ['v', 'Lượt đến']], dong: doiBang(b.theoLoaiHinh) },
      { ten: 'Theo quốc tịch', cot: [['k', 'Quốc tịch', 1], ['v', 'Lượt đến']], dong: doiBang(b.theoQuocTich) }
    ];
    if (b.theoCSKV) bang.push({ ten: 'Theo CSKV', cot: [['k', 'CSKV', 1], ['v', 'Lượt đến']], dong: doiBang(b.theoCSKV) });
    bang.push({ ten: 'Top cơ sở', cot: [['MaCoSo', 'Mã', 1], ['TenCoSo', 'Tên cơ sở', 1], ['DiaChi', 'Địa chỉ', 1], ['CSKV', 'CSKV', 1], ['luot', 'Lượt đến']], dong: b.topCoSo });
    bang.push({ ten: 'Chưa kiểm tra ' + thangVN(b.thang).replace('/', '-'), cot: [['MaCoSo', 'Mã', 1], ['TenCoSo', 'Tên cơ sở', 1], ['LoaiHinh', 'Loại hình', 1], ['DiaChi', 'Địa chỉ', 1], ['ToDanPho', 'Tổ', 1], ['CSKV', 'CSKV', 1]], dong: b.coSo.chuaKiemTra });
    xuatExcel('TamTru_baocao_' + b.thang.replace('-', '') + '_' + tenPhamVi() + '.xlsx', bang, [['Tháng', b.thang], ['Khoảng ngày', vn(b.tuNgay) + ' – ' + vn(b.denNgay)]], { bang: 'BaoCao', noiDung: 'Báo cáo tháng ' + b.thang });
  }

  // ---------- Điều hướng & sự kiện chung ----------
  function lamMoi() { route(); }
  /** Vẽ lại trang đang xem phía sau ngăn kéo (ví dụ sau "Lưu & thêm người cùng phòng"). */
  function lamMoiNen() { var y = window.scrollY; S.luot = (S.luot || 0) + 1; veTrang(); window.scrollTo(0, y); }
  // Lịch sử trang trong ứng dụng cho nút "Quay lại" (không phụ thuộc lịch sử trình duyệt)
  var LICH_SU_TRANG = [], dangLui = false;
  function quayLai() {
    if (!$('#drawerWrap').hidden) return dongNganKeo();   // đang mở ngăn kéo: đóng trước
    LICH_SU_TRANG.pop();
    var truoc = LICH_SU_TRANG.pop();
    dangLui = true;
    location.hash = truoc || '#/tong-quan';
    if ((truoc || '#/tong-quan') === (location.hash || '#/tong-quan')) { dangLui = false; route(); }
  }
  function route() {
    var h = location.hash || '#/tong-quan';
    if ($('#dauMobi')) $('#dauMobi').classList.remove('an-di');
    S.chonCS = null; document.body.classList.remove('dang-chon'); dongBangDuoi();
    if (LICH_SU_TRANG[LICH_SU_TRANG.length - 1] !== h) LICH_SU_TRANG.push(h);
    if (LICH_SU_TRANG.length > 50) LICH_SU_TRANG.shift();
    dangLui = false;
    S.luot = (S.luot || 0) + 1;
    veNav();
    if (!$('#drawerWrap').hidden) dongNganKeo();
    window.scrollTo(0, 0);
    veTrang();
  }
  function veTrang() {
    var h = decodeURIComponent(location.hash.replace('#/', '')).split('/');
    if (h[0] === 'tam-tru') return trangTamTru(h[1] !== undefined ? h[1] : undefined);
    if (h[0] === 'co-so') return trangCoSo();
    if (h[0] === 'bao-cao') return trangBaoCao();
    if (h[0] === 'can-bo' && laAdmin()) return trangCanBo();
    if (h[0] === 'lich-su') return trangLichSu();
    if (h[0] === 'quan-tri' || h[0] === 'tai-khoan') return trangTaiKhoan();
    if (h[0] === 'bo-sung') return trangBoSung();
    if (h[0] === 'du-lieu-thu') return trangDuLieuThu();
    return trangTongQuan();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-them-khach],[data-xem-khach],[data-sua-khach],[data-di],[data-xoa-khach],[data-tt],[data-loai],[data-them-coso],[data-xem-coso],[data-sua-coso],[data-xoa-coso],[data-loc-loai],[data-loc-cskv],[data-them-cb],[data-sua-cb],[data-xoa-cb],[data-duyet-cb],[data-tuchoi-cb],[data-tra-cuu],[data-xuat-khach],[data-xuat-coso],[data-gia-han],[data-xem-them],[data-bs-loai],[data-bs-cskv],[data-sao-loi-moi],[data-toggle-ct10],[data-ct10-chip],[data-them-cs-thu],[data-them-kh-thu],[data-kt-coso],[data-trang],[data-homnay-chip],[data-xem-ds],[data-xuat-tq],[data-mo-loc],[data-xoa-loc],[data-ap-dung-loc],[data-thao-tac-cs],[data-tt-kt],[data-tt-xem],[data-tt-khach],[data-chon-nhieu],[data-tich-cs],[data-bulk]');
    if (!t) return;
    var d = t.dataset;
    if ('tt' in d) { S.loc.trangThai = d.tt; return veDsKhach(); }
    if ('loai' in d) { S.locCS.loaiHinh = d.loai; return veDsCoSo(); }
    if ('trang' in d) {
      var pt = d.trang.split(':'); S.trangSo[pt[0]].so = +pt[1];
      if (pt[0] === 'coso') { veDsCoSo(); $('#cList').scrollIntoView({ block: 'start', behavior: 'smooth' }); }
      return;
    }
    if ('homnayChip' in d) { S.loc.homNay = !S.loc.homNay; if (S.loc.homNay && S.loc.trangThai === '') S.loc.trangThai = '*'; t.setAttribute('aria-pressed', String(S.loc.homNay)); return veDsKhach(); }
    if ('ct10Chip' in d) { S.loc.ct10 = !S.loc.ct10; t.setAttribute('aria-pressed', String(S.loc.ct10)); return veDsKhach(); }
    e.preventDefault(); e.stopPropagation();
    if ('themKhach' in d) return formKhach(null, d.themKhach);
    if ('suaKhach' in d) {
      var sanK = (layDem('dsTamTru') || []).filter(function (x) { return x.ID === d.suaKhach; })[0];
      return sanK ? formKhach(sanK) : goi('layTamTru', { id: d.suaKhach }).then(function (r) { formKhach(r); });
    }
    if ('di' in d) return xacNhanDi(d.di, 'caPhong' in d);
    if ('giaHan' in d) return giaHan(d.giaHan, 'caPhong' in d);
    if ('xemThem' in d) { S.phanTrang[d.xemThem].so += MOI_TRANG; return ({ khach: veDsKhach, coso: veDsCoSo, bosung: veBoSung })[d.xemThem](); }
    if ('bsLoai' in d) { S.locBS.loai = S.locBS.loai === d.bsLoai ? '' : d.bsLoai; return veBoSung(); }
    if ('bsCskv' in d) { S.locBS.q = d.bsCskv; $('#bsQ').value = d.bsCskv; return veBoSung(); }
    if ('saoLoiMoi' in d) return saoLoiMoi(d.saoLoiMoi);
    if ('xoaKhach' in d) return xoaKhach(d.xoaKhach);
    if ('xemKhach' in d) return xemKhach(d.xemKhach);
    if ('themCoso' in d) return formCoSo(null);
    if ('suaCoso' in d) {
      var sanCS = (S.coSo || []).filter(function (c) { return c.MaCoSo === d.suaCoso; })[0];
      return sanCS ? formCoSo(sanCS) : goi('layCoSo', { ma: d.suaCoso }).then(function (c) { formCoSo(c); });
    }
    if ('ktCoso' in d) return kiemTraCoSo(d.ktCoso);
    if ('moLoc' in d) return moBoLocCoSo();
    if ('xoaLoc' in d) return apDungLocCoSo(true);
    if ('apDungLoc' in d) return apDungLocCoSo(false);
    if ('thaoTacCs' in d) return moThaoTacCoSo(d.thaoTacCs);
    if ('ttKt' in d) { dongBangDuoi(); return kiemTraCoSo(d.ttKt); }
    if ('ttXem' in d) { dongBangDuoi(); return xemCoSo(d.ttXem); }
    if ('ttKhach' in d) { dongBangDuoi(); return formKhach(null, d.ttKhach); }
    if ('chonNhieu' in d) { S.chonCS = S.chonCS ? null : {}; $$('[data-chon-nhieu]').forEach(function (b) { b.setAttribute('aria-pressed', String(!!S.chonCS)); }); return veDsCoSo(); }
    if ('tichCs' in d) { if (S.chonCS[d.tichCs]) delete S.chonCS[d.tichCs]; else S.chonCS[d.tichCs] = 1; return veDsCoSo(); }
    if ('bulk' in d) return bulkCoSo(d.bulk);
    if ('xuatTq' in d) return xuatTongQuan();
    if ('xemDs' in d) {
      var locMoi = { q: '', trangThai: '', maCoSo: '', tu: '', den: '', loai: '' };
      if (d.xemDs === 'ct10') { locMoi.ct10 = true; S.loc = locMoi; location.hash = '#/tam-tru'; }
      else if (d.xemDs === 'homnay') { locMoi.homNay = true; locMoi.trangThai = '*'; S.loc = locMoi; location.hash = '#/tam-tru'; }
      else { S.locCS = { q: '', loaiHinh: '', cskv: '', tdp: '', kt: d.xemDs.slice(3) }; location.hash = '#/co-so'; }
      return;
    }
    if ('toggleCt10' in d) {
      var sanK2 = (layDem('dsTamTru') || []).filter(function (x) { return x.ID === d.toggleCt10; })[0];
      var chuoi = sanK2 ? Promise.resolve(sanK2) : goi('layTamTru', { id: d.toggleCt10 });
      return chuoi.then(function (kh) { return goi('suaTamTru', { id: d.toggleCt10, _phienBan: kh.NgayCapNhat, DaGuiCT10: kh.DaGuiCT10 !== true }); })
        .then(function (kq) { if (kq.DuLieuThu !== true) { vaKhach(kq); sauKhiGhi('khach'); } toast(kq.DaGuiCT10 ? 'Đã đánh dấu gửi CT10' : 'Đã bỏ đánh dấu CT10'); if (!$('#drawerWrap').hidden) veKhach(kq); lamMoiNen(); });
    }
    if ('xoaCoso' in d) return hoi('Xoá cơ sở ' + d.xoaCoso + '?', 'Chỉ xoá được cơ sở chưa có bản ghi tạm trú nào. Nếu cơ sở ngừng kinh doanh, hãy sửa "Hoạt động" thành "Dừng hoạt động".', 'Xoá', true)
      .then(function (ok) { if (ok) goi('xoaCoSo', { ma: d.xoaCoso }).then(function () { vaCoSo(null, d.xoaCoso); sauKhiGhi('coso'); toast('Đã xoá ' + d.xoaCoso); dongNganKeo(); lamMoi(); }); });
    if ('xemCoso' in d) return xemCoSo(d.xemCoso);
    if ('locLoai' in d) { S.locCS = { q: '', loaiHinh: d.locLoai, cskv: '', tdp: '' }; location.hash = '#/co-so'; return; }
    if ('locCskv' in d) { S.locCS = { q: '', loaiHinh: '', cskv: d.locCskv, tdp: '' }; location.hash = '#/co-so'; return; }
    if ('traCuu' in d) return traCuuCCCD(d.traCuu);
    if ('xuatKhach' in d) return xuatKhach();
    if ('xuatCoso' in d) return xuatCoSo();
    if ('duyetCb' in d) return formDuyet(dsCB.filter(function (x) { return x.MaCanBo === d.duyetCb; })[0]);
    if ('tuchoiCb' in d) return tuChoi(d.tuchoiCb);
    if ('themCsThu' in d) return formCoSo(null, true);
    if ('themKhThu' in d) return formKhach(null, d.themKhThu);
    if ('themCb' in d) return formCanBo(null);
    if ('suaCb' in d) return formCanBo(dsCB.filter(function (x) { return x.MaCanBo === d.suaCb; })[0]);
    if ('xoaCb' in d) return hoi('Xoá cán bộ ' + d.xoaCb + '?', 'Tài khoản này sẽ không đăng nhập được nữa.', 'Xoá', true)
      .then(function (ok) { if (ok) goi('xoaCanBo', { ma: d.xoaCb }).then(function () { sauKhiGhi('canbo'); toast('Đã xoá'); dongNganKeo(); lamMoi(); }); });
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

  var daKhoiTaoGIS = false;
  function khoiTaoGIS() {
    return napGIS().then(function () {
      if (daKhoiTaoGIS) return;
      daKhoiTaoGIS = true;
      google.accounts.id.initialize({
        client_id: CFG.GOOGLE_CLIENT_ID, callback: khiCoTheDangNhap,
        auto_select: true, cancel_on_tap_outside: false, ux_mode: 'popup', use_fedcm_for_prompt: true
      });
    });
  }
  function khiCoTheDangNhap(res) {
    var emailCu = S.user && S.user.Email;
    API.datToken(res.credential);
    // Đổi Google ID token (1 giờ) lấy phiên làm việc của hệ thống (tự gia hạn khi còn thao tác)
    taoPhien().then(function () {
      $('#loginWrap').hidden = true;
      if (!S.user) return vaoHeThong();
      if (API.emailToken() && API.emailToken() !== emailCu) return location.reload();   // đổi sang tài khoản khác
      toast('Đã đăng nhập lại. Dữ liệu đang nhập vẫn giữ nguyên.');
    });
  }
  function taoPhien() {
    if (API.cheDo !== 'may-chu' || API.coPhien()) return Promise.resolve();
    return API.goi('taoPhien').then(function (p) { API.datPhien(p.phien, p.hetHanToiDa); }).catch(function () {});
  }
  function manDangNhap(thongBao, loai) {
    var w = $('#loginWrap');
    w.hidden = false;
    $('#loginMsg').innerHTML = thongBao ? '<p class="text-sm rounded-xl px-3 py-2 ' + (loai === 'loi' ? 'bg-rose text-rose-ink' : 'bg-butter text-butter-ink') + '">' + thongBao + '</p>' : '';
    if (!CFG.GOOGLE_CLIENT_ID) { $('#gBtn').innerHTML = '<p class="text-sm text-rose-ink">Chưa điền GOOGLE_CLIENT_ID trong js/config.js.</p>'; return; }
    khoiTaoGIS().then(function () {
      $('#gBtn').innerHTML = '';
      google.accounts.id.renderButton($('#gBtn'), { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', locale: 'vi', width: 280 });
      if (!thongBao) google.accounts.id.prompt();
    }).catch(function (e) { $('#gBtn').innerHTML = '<p class="text-sm text-rose-ink">' + esc(e.message) + '</p>'; });
    API.ping().then(function (p) { $('#loginPing').textContent = 'Máy chủ sẵn sàng · phiên bản ' + p.phienBan; })
      .catch(function () { $('#loginPing').textContent = 'Chưa kết nối được máy chủ (kiểm tra API_URL).'; });
  }

  function dangXuat() {
    var em = API.emailToken();
    if (API.coPhien()) API.goi('dongPhien').catch(function () {});
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
    taoPhien().then(function () { return API.goi('batDau', { kem: ['tongQuan', 'dsCoSo', 'dsTamTru'] }); }).then(function (kq) {
      ['tongQuan', 'dsCoSo', 'dsTamTru'].forEach(function (k) { if (kq[k]) datDem(k, kq[k]); });
      S.user = kq.toi; S.dm = kq.danhMuc; S.soChoDuyet = kq.soChoDuyet || 0; S.phamVi = kq.phamVi || { toanPhuong: true };
      $('#loginWrap').hidden = true;
      veUser();
      if (!daGanRoute) { window.addEventListener('hashchange', route); daGanRoute = true; }
      route();
      // Tải ngầm dữ liệu các trang còn lại để lần đầu mở cũng hiện ngay
      setTimeout(function () {
        var viec = [['dsLichSu', 'dsLichSu', { gioiHan: 200 }], ['bc:' + homNay().slice(0, 7), 'baoCaoThang', { thang: homNay().slice(0, 7) }]];
        if (laAdmin()) viec.push(['dsCanBo', 'dsCanBo', {}], ['chinhSach', 'chinhSachDuLieu', {}], ['dsSaoLuu', 'dsSaoLuu', {}]);
        viec.forEach(function (v) { if (!DEM[v[0]]) API.goi(v[1], v[2]).then(function (d) { if (!DEM[v[0]]) datDem(v[0], d); }).catch(function () {}); });
      }, 1200);
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
  var PB_GIAO_DIEN = '2.3.0';
  function kiemTraBanMoi() {
    if (API.cheDo !== 'may-chu') return;
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) {
      if (!j.v || j.v === PB_GIAO_DIEN || !$('#drawerWrap').hidden || !$('#dlgWrap').hidden) return;
      var k = 'tamtru-nang-' + j.v;
      try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1'); } catch (e) { return; }
      location.replace(location.pathname + '?v=' + encodeURIComponent(j.v) + location.hash);
    }).catch(function () {});
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    kiemTraBanMoi();
    Object.keys(DEM).forEach(function (k) { DEM[k].t = 0; });
    // Chỉ vẽ lại trang phía sau (giữ vị trí cuộn, bảng lọc/thao tác đang mở và các cơ sở đang chọn)
    if (S.user && $('#drawerWrap').hidden && $('#dlgWrap').hidden && !$('#bangDuoi')) lamMoiNen();
  });

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
      // Không đóng form đang nhập: màn đăng nhập hiện đè lên, đăng nhập xong quay lại đúng chỗ cũ
      var dangNhap = !$('#drawerWrap').hidden;
      manDangNhap('Phiên làm việc đã hết hạn.' + (dangNhap ? ' Đăng nhập lại để tiếp tục – thông tin đang nhập vẫn được giữ, sau đó bấm Lưu lần nữa.' : ' Vui lòng đăng nhập lại.'));
      setTimeout(function () { daBao = false; }, 3000);
    };
    var daBaoThuLai = 0;
    API.khiThuLai = function () { if (Date.now() - daBaoThuLai > 10000) { daBaoThuLai = Date.now(); toast('Mạng chập chờn, đang tự thử lại…', 'canh'); } };
    if (API.coToken()) vaoHeThong(); else manDangNhap();
  }
  khoiDong();

  // Cho phép cài đặt lên màn hình chính (PWA): service worker không lưu đệm gì, chỉ để trình duyệt coi là cài được.
  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
})();
