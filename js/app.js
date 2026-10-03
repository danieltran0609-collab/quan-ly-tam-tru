// Giao diện Ứng dụng khai báo cư trú – HTML + Tailwind + JavaScript thuần (không cần build).
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
    'Khách sạn': 'bg-mint text-mint-ink', 'KT2 đến': 'bg-butter text-butter-ink', 'Khác': 'bg-fog text-fog-ink'
  };
  var THANH_LOAI = { 'Nhà trọ': 'bg-[#8EC5F5]', 'Nhà nghỉ': 'bg-[#B9A6E8]', 'Nhà cho thuê': 'bg-[#F5B98A]', 'Khách sạn': 'bg-[#8FD6B5]', 'KT2 đến': 'bg-[#F2D57E]', 'Khác': 'bg-[#C5C9D3]' };
  var badgeTT = function (tt) { return '<span class="badge ' + (MAU_TT[tt] || 'bg-fog text-fog-ink') + '"><span class="size-1.5 rounded-full ' + (CHAM_TT[tt] || 'bg-fog-ink') + '"></span>' + esc(tt) + '</span>'; };
  var badgeLoai = function (l, chu) { return '<span class="badge ' + (MAU_LOAI[l] || 'bg-fog text-fog-ink') + '">' + esc(chu || (l === 'KT2 đến' ? 'Hộ KT2 đến' : l) || '—') + '</span>'; };
  /** Tên loại hình để hiển thị: "Khác" kèm loại hình cụ thể (nếu có) → "Khác: Homestay". */
  var tenLoaiHinh = function (c) { return c ? (c.LoaiHinh === 'Khác' && c.LoaiHinhKhac ? 'Khác: ' + c.LoaiHinhKhac : c.LoaiHinh === 'KT2 đến' ? 'Hộ KT2 đến' : (c.LoaiHinh || '')) : ''; };
  var BON_LOAI = ['Nhà trọ', 'Nhà nghỉ', 'Nhà cho thuê', 'Khách sạn'];
  var daKhaiBao = function (r) { return r.DaKhaiBao === true || r.DaKhaiBao === 'true' || ((r.DaKhaiBao === '' || r.DaKhaiBao == null) && !!r.LoaiKhaiBao); };
  var laHoKT2 = function (c) { return !!c && c.LoaiHinh === 'KT2 đến'; };
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
    flask: '<path d="M9 3h6M10 3v6.2L4.8 18a1.5 1.5 0 0 0 1.3 2.2h11.8a1.5 1.5 0 0 0 1.3-2.2L14 9.2V3"/><path d="M7.5 15h9"/>',
    refresh: '<path d="M20 6v5h-5"/><path d="M18.5 15a7 7 0 1 1-.8-7.8L20 11"/>'
  };
  var ic = function (k, cls) { return '<svg viewBox="0 0 24 24" class="' + (cls || 'size-4') + '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '</svg>'; };

  // ---------- Trạng thái ứng dụng ----------
  var S = { user: null, dm: null, coSo: null, loc: { q: '', trangThai: '', maCoSo: '', tu: '', den: '', loai: '' }, locCS: { q: '', loaiHinh: '', cskv: '', tdp: '' } };
  var laAdmin = function () { return S.user && S.user.Quyen === 'Admin'; };
  var laLanhDao = function () { return S.user && S.user.Quyen === 'LanhDao'; };
  var laChuCoSo = function () { return S.user && S.user.Quyen === 'ChuCoSo'; };
  var duocGhi = function () { return S.user && (S.user.Quyen === 'Admin' || S.user.Quyen === 'CanBo'); };
  /** Được đăng ký khách mới: cán bộ/Admin, và cộng tác viên (chỉ cơ sở của mình, do máy chủ kiểm). */
  var duocDangKy = function () { return duocGhi() || laChuCoSo(); };
  var duocGhiBanGhi = function (r) { return duocGhi() || (laLanhDao() && r && r.DuLieuThu === true); };
  /** Mô tả ngắn địa bàn của phạm vi (pv từ máy chủ: {toanPhuong, cskv?, to?, soCoSo?}): "Tổ 1, 5" hoặc "CSKV Huy". */
  var moTaDiaBanNgan = function (pv) { if (pv && pv.chuCoSo) return 'Cộng tác viên'; return (pv && pv.to && pv.to.length) ? 'Tổ ' + pv.to.join(', ') : 'CSKV ' + ((pv && pv.cskv) || '(chưa gắn)'); };
  var moTaDiaBanDay = function (pv) { return !pv || pv.toanPhuong ? 'Toàn phường' : 'Địa bàn ' + moTaDiaBanNgan(pv); };

  var TRANG = [
    { id: 'tong-quan', ten: 'Tổng quan', ic: 'home' },
    { id: 'tam-tru', ten: 'Công dân cư trú', ngan: 'Công dân', ic: 'users' },
    { id: 'co-so', ten: 'Cơ sở', ngan: 'Cơ sở', ic: 'building', gom: ['co-so', 'bo-sung', 'ho-kt2'] },
    { id: 'ho-kt2', ten: 'Hộ KT2 đến', ic: 'home', phu: true },
    { id: 'bo-sung', ten: 'Bổ sung dữ liệu', ic: 'alert', phu: true },
    { id: 'bao-cao', ten: 'Báo cáo', ic: 'chart' },
    { id: 'de-xuat', ten: 'Đề xuất chờ duyệt', ic: 'clock', phu: true, ghi: true },
    { id: 'chu-co-so', ten: 'Cộng tác viên', ic: 'users', phu: true, ghi: true },
    { id: 'du-lieu-thu', ten: 'Dữ liệu thử', ngan: 'Thử', ic: 'flask', chiThu: true, nhom: 'quan-tri' },
    { id: 'can-bo', ten: 'Cán bộ quản lý', ngan: 'Cán bộ', ic: 'shield', admin: true, nhom: 'quan-tri' },
    { id: 'lich-su', ten: 'Lịch sử', ic: 'clock', nhom: 'quan-tri' }
  ];
  // Cộng tác viên: Tổng quan, cơ sở được giao, công dân toàn địa bàn và đề xuất.
  var TRANG_CC = [
    { id: 'tong-quan', ten: 'Tổng quan', ngan: 'Tổng quan', ic: 'home' },
    { id: 'co-so', ten: 'Cơ sở của tôi', ngan: 'Cơ sở', ic: 'building' },
    { id: 'tam-tru', ten: 'Công dân cư trú', ngan: 'Công dân', ic: 'users' },
    { id: 'de-xuat', ten: 'Khai báo & đề xuất', ngan: 'Đề xuất', ic: 'clock' }
  ];
  var QUAN_TRI = { id: 'quan-tri', ten: 'Quản trị', ic: 'grid', gom: ['quan-tri', 'can-bo', 'lich-su', 'du-lieu-thu'] };
  var TAI_KHOAN = { id: 'tai-khoan', ten: 'Tài khoản', ic: 'user', gom: ['tai-khoan', 'quan-tri', 'can-bo', 'lich-su', 'du-lieu-thu', 'de-xuat', 'chu-co-so'] };

  function veNav() {
    var cur = (location.hash.replace('#/', '') || 'tong-quan').split('/')[0];
    var ds = laChuCoSo() ? TRANG_CC : TRANG.filter(function (t) { return (!t.admin || laAdmin()) && (!t.chiThu || laAdmin() || laLanhDao()) && (!t.ghi || duocGhi()); });
    // Admin: Cán bộ + Lịch sử gom vào nhóm "Quản trị" (điện thoại: 1 nút). Người khác chỉ có Lịch sử nên để chung.
    var gom = laAdmin();
    var chinh = ds.filter(function (t) { return !gom || t.nhom !== 'quan-tri'; });
    var qt = gom ? ds.filter(function (t) { return t.nhom === 'quan-tri'; }) : [];
    var nDx = duocGhi() ? ((layDem('tongQuan') || {}).deXuatChoDuyet || 0) + ((layDem('tongQuan') || {}).kiemTraChoDuyet || 0) : 0;
    var soDuyet = function (t) { var n = 0; if (t.id === 'can-bo' || t.id === 'quan-tri' || t.id === 'tai-khoan') n += S.soChoDuyet || 0; if (t.id === 'de-xuat' || t.id === 'tai-khoan') n += nDx; return n; };
    var link = function (t) {
      return '<a class="nav-a" href="#/' + t.id + '"' + (t.id === cur ? ' aria-current="page"' : '') + '>' + ic(t.ic, 'size-[18px] shrink-0') + '<span class="side-nav-label">' + t.ten + '</span>' + (soDuyet(t) ? '<span class="ml-auto badge bg-rose text-rose-ink">' + soDuyet(t) + '</span>' : '') + '</a>';
    };
    $('#navSide').innerHTML = chinh.map(link).join('') +
      (qt.length ? '<p class="side-nav-heading px-3 mt-5 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Quản trị</p>' + qt.map(link).join('') : '');
    // Thanh dưới (điện thoại): Tổng quan · Khách · Cơ sở · Báo cáo · Tài khoản (các trang quản trị, lịch sử… nằm trong Tài khoản)
    var duoi = ds.filter(function (t) { return !t.phu && !t.nhom && !t.chiThu; }).concat([TAI_KHOAN]);
    $('#navBottom').style.gridTemplateColumns = 'repeat(' + duoi.length + ', minmax(0, 1fr))';
    $('#navBottom').innerHTML = duoi.map(function (t) {
      var on = t.id === cur || (t.gom && t.gom.indexOf(cur) >= 0);
      return '<a href="#/' + t.id + '" class="flex flex-col items-center justify-center gap-0.5 h-16 text-[11px] font-medium ' + (on ? 'text-brand-600' : 'text-muted') + '"' + (on ? ' aria-current="page"' : '') + '>' +
        '<span class="relative grid place-items-center h-7 w-12 rounded-full ' + (on ? 'bg-brand-50' : '') + '">' + ic(t.ic, 'size-5') + (soDuyet(t) ? '<span class="absolute -top-1 right-1 grid place-items-center min-w-4 h-4 px-1 rounded-full bg-rose-ink text-white text-[10px]">' + soDuyet(t) + '</span>' : '') + '</span>' + (t.ngan || t.ten) + '</a>';
    }).join('');
    var t = (laChuCoSo() ? TRANG_CC : TRANG).concat([QUAN_TRI, TAI_KHOAN]).filter(function (x) { return x.id === cur; })[0];
    $('#mTitle').textContent = t ? t.ten : 'Ứng dụng khai báo cư trú';
    var oNha = cur === 'tong-quan';
    if ($('#nutLui')) { $('#nutLui').hidden = oNha; $('#nutNha').hidden = oNha; }
  }

  /** Trang "Tài khoản": thông tin người dùng + lối vào quản trị, lịch sử, dữ liệu thử, tài liệu, đăng xuất. */
  function trangTaiKhoan() {
    var u = S.user, pv = S.phamVi || { toanPhuong: true };
    var ten = u.HoTen || u.CSKV || u.Email, chu = boDau(ten).replace(/[^a-z]/g, '').slice(0, 1).toUpperCase() || '?';
    var quyen = { Admin: 'Quản trị', CanBo: 'Cán bộ', Xem: 'Chỉ xem', LanhDao: 'Lãnh đạo', ChuCoSo: 'Cộng tác viên' }[u.Quyen] || u.Quyen;
    var nDx = duocGhi() ? ((layDem('tongQuan') || {}).deXuatChoDuyet || 0) + ((layDem('tongQuan') || {}).kiemTraChoDuyet || 0) : 0;
    var o = function (href, icon, ten, moTa, phu, ngoai) {
      return '<a href="' + href + '"' + (ngoai ? ' target="_blank" rel="noopener"' : '') + ' class="flex items-center gap-3 px-4 py-3 min-h-14 hover:bg-canvas/60">' +
        '<span class="grid place-items-center size-10 shrink-0 rounded-xl bg-brand-50 text-brand-600">' + ic(icon, 'size-5') + '</span>' +
        '<span class="min-w-0 flex-1"><b class="block text-sm font-medium">' + ten + '</b><span class="block text-xs text-muted">' + moTa + '</span></span>' + (phu || '') + ic('chev', 'size-4 text-muted shrink-0') + '</a>';
    };
    var nhom = function (tieuDe, ds) { ds = ds.filter(Boolean); return ds.length ? '<h2 class="text-xs font-semibold uppercase tracking-wider text-muted px-1 mt-5 mb-2">' + tieuDe + '</h2><div class="card divide-y divide-line overflow-hidden">' + ds.join('') + '</div>' : ''; };
    var nk = (API.nhatKy || []).slice(-12).reverse();
    var chanDoan = nk.length ? '<details class="card px-4 py-3 mt-5"><summary class="text-sm font-medium cursor-pointer">Tốc độ các lần tải gần đây</summary><p class="text-xs text-muted mt-2 mb-1">“Tổng” là thời gian chờ thực tế; “Máy chủ” là phần xử lý trong Apps Script. Hiệu số là đường truyền + khởi động nguội (thường khoảng 1–2 giây mỗi lần gọi).</p><table class="w-full text-xs"><thead><tr class="text-left text-muted"><th class="py-1">Việc</th><th class="py-1 text-right">Tổng</th><th class="py-1 text-right">Máy chủ</th></tr></thead><tbody>' + nk.map(function (x) { return '<tr class="border-t border-line"><td class="py-1">' + esc(x.hd) + '</td><td class="py-1 text-right tabular-nums">' + (x.tong / 1000).toFixed(1) + ' s</td><td class="py-1 text-right tabular-nums">' + (x.may != null ? (x.may / 1000).toFixed(1) + ' s' : '—') + '</td></tr>'; }).join('') + '</tbody></table></details>' : '';
    $('#view').innerHTML = dauTrang('Tài khoản', '') +
      '<div class="card p-4 flex items-center gap-4"><span class="grid place-items-center size-14 shrink-0 rounded-full bg-peach text-peach-ink text-xl font-semibold">' + esc(chu) + '</span>' +
      '<span class="min-w-0"><b class="block truncate">' + esc(u.HoTen || '(chưa có họ tên)') + '</b><span class="block text-sm text-muted truncate">' + esc(u.Email) + '</span>' +
      '<span class="flex flex-wrap gap-1.5 mt-1.5"><span class="badge bg-lilac text-lilac-ink">' + esc(quyen) + '</span><span class="badge bg-canvas text-ink">' + (pv.toanPhuong ? 'Toàn phường' : esc(moTaDiaBanNgan(pv)) + ' · ' + soVN(pv.soCoSo) + ' cơ sở') + '</span></span></span></div>' +
      nhom('Quản lý', laChuCoSo() ? [
        o('#/de-xuat', 'clock', 'Khai báo & đề xuất', 'Khai báo mới, sửa, xoá hồ sơ, xác nhận rời đi đã gửi cho cán bộ')
      ] : [
        duocGhi() ? o('#/de-xuat', 'clock', 'Đề xuất từ cộng tác viên', 'Duyệt sửa, xoá hồ sơ, xác nhận rời đi', nDx ? '<span class="badge bg-rose text-rose-ink shrink-0">' + nDx + ' chờ duyệt</span>' : '') : '',
        duocGhi() ? o('#/chu-co-so', 'users', 'Cộng tác viên', 'Tạo tài khoản cho chủ nhà trọ, khách sạn hỗ trợ đăng ký khách') : '',
        laAdmin() ? o('#/can-bo', 'shield', 'Cán bộ quản lý', 'Duyệt yêu cầu truy cập, phân quyền, gán CSKV', S.soChoDuyet ? '<span class="badge bg-rose text-rose-ink shrink-0">' + S.soChoDuyet + ' chờ duyệt</span>' : '') : '',
        duocGhi() ? o('#/bo-sung', 'alert', 'Bổ sung dữ liệu cơ sở', 'Cơ sở thiếu số điện thoại, số phòng, đăng ký kinh doanh…') : '',
        laAdmin() || laLanhDao() ? o('#/du-lieu-thu', 'flask', 'Dữ liệu thử', 'Tự tạo cơ sở, khách để thử hệ thống, không tính vào thống kê') : '',
        o('#/lich-su', 'clock', laAdmin() ? 'Lịch sử & sao lưu' : 'Lịch sử thao tác', laAdmin() ? 'Nhật ký thao tác, bản sao lưu hằng ngày, thời hạn lưu trữ' : 'Các thao tác của bạn trên hệ thống')
      ]) +
      nhom('Hỗ trợ', [
        o('huongdan.html', 'help', 'Hướng dẫn sử dụng', 'Cách dùng, cài ứng dụng lên điện thoại (mở tab mới)', '', true),
        o('privacy.html', 'idcard', 'Chính sách quyền riêng tư', 'Dữ liệu được lưu và bảo vệ thế nào (mở tab mới)', '', true)
      ]) +
      chanDoan +
      '<div class="grid ' + (API.cheDo === 'may-chu' ? 'grid-cols-2' : 'grid-cols-1') + ' gap-2 mt-6"><button type="button" data-lam-moi class="btn-soft h-12">' + ic('refresh') + 'Làm mới</button>' +
      (API.cheDo === 'may-chu' ? '<button type="button" data-dang-xuat class="btn-danger h-12">' + ic('out') + 'Đăng xuất</button>' : '') + '</div>' +
      '<p class="text-center text-xs text-muted mt-4">Phiên bản giao diện ' + PB_GIAO_DIEN + '</p>';
  }

  function veUser() {
    var u = S.user;
    var ten = u.HoTen || u.CSKV || u.Email;
    var chu = boDau(ten).replace(/[^a-z]/g, '').slice(0, 1).toUpperCase() || '?';
    var quyen = { Admin: 'Quản trị', CanBo: 'Cán bộ', Xem: 'Chỉ xem', LanhDao: 'Lãnh đạo', ChuCoSo: 'Cộng tác viên' }[u.Quyen] || u.Quyen;
    $('#userBox').innerHTML = '<span class="grid place-items-center size-9 shrink-0 rounded-full bg-peach text-peach-ink font-semibold">' + esc(chu) + '</span>' +
      '<span class="min-w-0 leading-tight"><b class="block text-sm truncate">' + esc(u.HoTen || '(chưa có họ tên)') + '</b><span class="block text-xs text-muted truncate">' + esc(u.Email) + ' · ' + esc(quyen) + '</span></span>';
    if ($('#sideLogout')) $('#sideLogout').hidden = API.cheDo !== 'may-chu';
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
  var lanChamCuoi = 0;
  API.khiCham = function (hd, tong, may) {
    if (Date.now() - lanChamCuoi < 30000) return;
    lanChamCuoi = Date.now();
    toast('Tải chậm: "' + hd + '" mất ' + (tong / 1000).toFixed(1) + ' giây' + (may != null ? ' (máy chủ xử lý ' + (may / 1000).toFixed(1) + ' giây)' : '') + '. Có thể báo số này cho quản trị.', 'canh');
  };
  var DEM = {};              // khoá -> { d: dữ liệu, t: lúc lấy }
  var TUOI_DEM = 20000;      // dữ liệu cũ hơn 20 giây: vẫn hiện ngay, đồng thời tải bản mới
  function layDem(k) { return DEM[k] ? DEM[k].d : null; }
  function datDem(k, d) {
    DEM[k] = { d: d, t: Date.now() };
    if (k === 'dsCoSo') S.coSo = d;
    if (k === 'dsTamTru') dsKhach = d;
  }
  /** Như goi() nhưng: có bộ đệm thì gọi ve(d) ngay, rồi (nếu cũ) tải ngầm và gọi ve lần nữa khi dữ liệu đổi. */
  /** Gọi API theo khoá dữ liệu: nếu cùng khoá đang được tải (ví dụ tải ngầm) thì dùng chung lời gọi đó, không gửi lần thứ hai. */
  var DANG_TAI = {};
  function goiChung(k, action, data) {
    if (DANG_TAI[k]) return DANG_TAI[k];
    var p = API.goi(action, data);
    DANG_TAI[k] = p;
    var xong = function () { if (DANG_TAI[k] === p) delete DANG_TAI[k]; };
    p.then(xong, xong);
    return p;
  }
  function docNhanh(k, action, data) {
    var ves = [], lois = [], c = DEM[k], luot = S.luot;
    var obj = { then: function (ve, loi) { ves.push(ve); if (loi) lois.push(loi); return obj; }, catch: function (loi) { lois.push(loi); return obj; } };
    Promise.resolve().then(function () {
      if (c) ves.forEach(function (ve) { ve(c.d, true); });
      if (c && Date.now() - c.t < TUOI_DEM) return;
      goiChung(k, action, data).then(function (d) {
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
    d.classList.remove('drawer-rong');
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
  function dauTrang(tieuDe, moTa, nut, congCu) {
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
    return dh + '<div class="flex items-center gap-3 mb-4 lg:mb-7"><div class="min-w-0"><h1 class="text-xl lg:text-[26px] font-semibold tracking-tight">' + tieuDe + '</h1>' +
      (moTa ? '<p class="hidden sm:block text-sm text-muted mt-1">' + moTa + '</p>' : '') + '</div>' +
      (congCu || nut ? '<div class="ml-auto flex items-center gap-1 sm:gap-2">' + (congCu || '') + (nut ? '<span class="hidden sm:contents">' + nut + '</span>' : '') + '</div>' : '') + '</div>' + fab;
  }
  /** Nút công cụ cạnh tiêu đề: điện thoại chỉ biểu tượng (44px), máy tính có chữ. */
  var nutCongCu = function (attr, icon, nhan) {
    return '<button type="button" ' + attr + ' class="btn-ghost h-11 w-11 sm:w-auto sm:h-9 px-0 sm:px-3 text-ink" title="' + nhan + '" aria-label="' + nhan + '">' + ic(icon, 'size-5 sm:size-4') + '<span class="hidden sm:inline">' + nhan + '</span></button>';
  };
  /** Thanh tab trạng thái chia đều (phương án A). ds: [[giá trị, nhãn, số]] */
  var thanhTab = function (attr, ds, dangChon) {
    return '<div class="flex border-b border-line -mx-3 sm:-mx-4 px-1" role="tablist">' + ds.map(function (t) {
      var on = t[0] === dangChon;
      return '<button type="button" role="tab" aria-selected="' + on + '" ' + attr + '="' + esc(t[0]) + '" class="flex-1 min-w-0 h-11 px-1 text-[13px] border-b-2 -mb-px truncate ' + (on ? 'border-ink text-ink font-semibold' : 'border-transparent text-muted') + '">' +
        esc(t[1]) + (t[2] != null ? ' <span class="' + (on ? '' : 'opacity-70') + '">' + soVN(t[2]) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  };
  var chipNho = function (attr, bat, noiDung) {
    return '<button type="button" ' + attr + ' aria-pressed="' + !!bat + '" class="chip chip-nho shrink-0">' + noiDung + '</button>';
  };
  var khungCho = function (n) { var s = ''; for (var i = 0; i < (n || 4); i++) s += '<div class="skel h-20 mb-3"></div>'; return s; };
  function trong(tieuDe, moTa, nut) {
    return '<div class="card px-6 py-12 text-center"><div class="mx-auto mb-4 grid place-items-center size-14 rounded-2xl bg-brand-50 text-brand-600">' + ic('users', 'size-6') + '</div>' +
      '<h3 class="font-semibold">' + tieuDe + '</h3><p class="text-sm text-muted mt-1 max-w-md mx-auto">' + moTa + '</p>' + (nut ? '<div class="mt-5">' + nut + '</div>' : '') + '</div>';
  }

  // ================= TỔNG QUAN =================
  /** Đầu một mục (phương án A): tiêu đề + liên kết "Xem" bên phải, dòng phụ nhỏ bên dưới không bị xuống dòng lộn xộn. */
  function dauMuc(tieuDe, phu, lienKet) {
    return '<header class="flex items-start gap-3 px-4 sm:px-5 pt-3.5 pb-3"><div class="min-w-0 flex-1"><h2 class="font-semibold text-[15px] leading-tight">' + tieuDe + '</h2>' +
      (phu ? '<p class="text-xs text-muted mt-0.5">' + phu + '</p>' : '') + '</div>' + (lienKet || '') + '</header>';
  }
  var lienKetXem = function (href, attr, nhan) {
    return '<a href="' + href + '" ' + (attr || '') + ' class="shrink-0 -my-1 -mr-2 px-2 h-9 inline-flex items-center gap-0.5 rounded-lg text-[13px] text-brand-600 hover:bg-brand-50">' + (nhan || 'Xem') + ic('chev', 'size-4') + '</a>';
  };
  /** Một dòng khách gọn trong các mục của Tổng quan (bấm để xem chi tiết; nút thao tác bên phải). */
  function dongKhachTQ(r, phu, phai) {
    return '<li class="flex items-center border-t border-line hover:bg-canvas/60"><button data-xem-khach="' + esc(r.ID) + '" class="flex-1 min-w-0 text-left flex items-center gap-3 pl-4 sm:pl-5 pr-2 py-2.5 min-h-14">' +
      '<span class="min-w-0 flex-1"><b class="block text-sm font-medium truncate">' + esc(r.HoTen) + '</b><span class="block text-xs text-muted truncate">' + phu + '</span></span>' + (phai || '') + '</button>';
  }
  var nutDongTQ = function (attr, icon, nhan, mau) {
    return '<button type="button" ' + attr + ' class="grid place-items-center size-11 sm:size-9 rounded-xl ' + (mau || 'text-muted hover:bg-canvas') + '" title="' + nhan + '" aria-label="' + nhan + '">' + ic(icon, 'size-5 sm:size-4') + '</button>';
  };

  /** Thống kê những người được đăng ký (nhập vào hệ thống) trong ngày hôm nay, theo từng trạng thái. */
  function theDangKyHomNay(t) {
    var d = t.dangKyHomNay || { tong: 0, theoTrangThai: {}, ds: [] };
    var tt = [['Đang ở', 'Đang ở'], ['Sắp hết hạn', 'Sắp hết'], ['Quá hạn', 'Quá hạn'], ['Đã rời đi', 'Đã đi']];
    return '<section class="card mb-3 lg:mb-6 overflow-hidden">' +
      dauMuc('Đăng ký trong ngày', vn(t.homNay) + ' · ' + soVN(d.tong) + ' người', d.tong ? lienKetXem('#/tam-tru', 'data-xem-ds="homnay"') : '') +
      '<div class="grid grid-cols-4 gap-1.5 px-4 sm:px-5 pb-3">' + tt.map(function (x) {
        return '<div class="rounded-xl px-2 py-2 text-center ' + (MAU_TT[x[0]] || 'bg-fog text-fog-ink') + '"><b class="block text-lg leading-none">' + soVN(d.theoTrangThai[x[0]] || 0) + '</b><span class="block text-[11px] mt-1 truncate">' + x[1] + '</span></div>';
      }).join('') + '</div>' +
      (d.ds.length ? '<ul>' + d.ds.slice(0, 5).map(function (r) {
        return dongKhachTQ(r, esc(r.TenCoSo) + (r.SoPhong ? ' · P.' + esc(r.SoPhong) : '') + ' · ' + String(r.NgayTao).slice(11, 16), badgeTT(r.TrangThai)) + '</li>';
      }).join('') + (d.ds.length > 5 ? '<li class="border-t border-line"><a href="#/tam-tru" data-xem-ds="homnay" class="block px-4 sm:px-5 py-2.5 text-xs text-brand-600">Xem thêm ' + soVN(d.tong - 5) + ' người</a></li>' : '') + '</ul>'
        : '<p class="px-4 sm:px-5 pb-4 text-sm text-muted">Hôm nay chưa có ai được đăng ký.</p>') + '</section>';
  }

  /** Hộ KT2 đến: thống kê RIÊNG (không gộp vào cơ sở lưu trú) — N hộ = M người đang cư trú. */
  function theHoKT2TQ(t) {
    var k = t.coSo.kt2;
    if (!k || (!k.ho && !k.nguoi)) return '';
    return '<a href="#/ho-kt2" class="card mb-3 lg:mb-6 flex items-center gap-3 px-4 py-3 hover:border-[#D6DAF5] transition"><span class="grid place-items-center size-9 shrink-0 rounded-xl bg-butter text-butter-ink">' + ic('home') + '</span>' +
      '<span class="min-w-0 flex-1 text-sm"><b class="font-medium">Hộ KT2 đến</b><span class="block text-xs text-muted"><b class="text-ink font-semibold">' + soVN(k.ho) + '</b> hộ = <b class="text-ink font-semibold">' + soVN(k.nguoi) + '</b> người đang cư trú</span></span>' + ic('chev', 'size-4 text-muted shrink-0') + '</a>';
  }

  /** Gộp mọi việc cần xử lý ở Tổng quan vào MỘT thẻ: các dòng tóm tắt (số + nhãn ngắn) và danh sách người cần xử lý (thu gọn 5 dòng). */
  function theCanXuLy(t) {
    var ghi = duocGhi(), soHet = t.canXuLy.length, soCT = t.soCanGuiCT10 || 0;
    var nBS = ghi && S.coSo ? vanDeCoSo(S.coSo).length : 0;
    var nCB = t.canBoChuaKiemTra ? t.canBoChuaKiemTra.length : 0;
    var nDX = ghi ? (t.deXuatChoDuyet || 0) : 0, nKT = laAdmin() ? (t.kiemTraChoDuyet || 0) : 0;
    var mucTom = [
      [nDX, 'đề xuất chờ duyệt', '#/de-xuat', '', 'clock', 'bg-butter text-butter-ink'],
      [nKT, 'cơ sở chờ phê duyệt kiểm tra', '#/de-xuat', '', 'check', 'bg-sky text-sky-ink'],
      [soHet, 'người quá hạn / sắp hết hạn', '#/tam-tru/Quá hạn', '', 'alert', 'bg-rose text-rose-ink'],
      [t.khach.chuaKhaiBao || 0, 'công dân chưa khai báo', '#/tam-tru', 'data-xem-ds="chuakhaibao"', 'idcard', 'bg-rose text-rose-ink'],
      [soCT, 'người chưa gửi CT10', '#/tam-tru', 'data-xem-ds="ct10"', 'idcard', 'bg-butter text-butter-ink'],
      [nBS, 'cơ sở cần bổ sung thông tin', '#/bo-sung', '', 'building', 'bg-peach text-peach-ink'],
      [nCB, 'cán bộ chưa kiểm tra hết cơ sở', '#/can-bo', '', 'users', 'bg-lilac text-lilac-ink']
    ].filter(function (m) { return m[0] > 0; });
    var tong = mucTom.reduce(function (s, m) { return s + m[0]; }, 0);
    var daCo = {}, dong = [];
    t.canXuLy.forEach(function (r) { daCo[r.ID] = 1; dong.push(r); });
    (t.canGuiCT10 || []).forEach(function (r) { if (!daCo[r.ID]) { daCo[r.ID] = 1; dong.push(r); } });
    var hienThi = dong.slice(0, 5), conLai = dong.length - hienThi.length;
    var dongNguoi = function (r) {
      var hetHan = r.TrangThai === 'Quá hạn' || r.TrangThai === 'Sắp hết hạn', chuaCT = daKhaiBao(r) && r.DaGuiCT10 !== true && r.TrangThai !== 'Đã rời đi';
      var phu = esc(r.TenCoSo) + (r.SoPhong ? ' · P.' + esc(r.SoPhong) : '') +
        (hetHan ? ' · <span class="' + (r.TrangThai === 'Quá hạn' ? 'text-rose-ink' : 'text-butter-ink') + '">' + conLaiTxt(r) + '</span>' : ' · đến ' + vn(r.NgayDen)) +
        (chuaCT ? ' · <span class="text-butter-ink">chưa gửi CT10</span>' : '');
      var nut = '';
      if (duocGhiBanGhi(r)) {
        nut = (hetHan ? nutDongTQ('data-gia-han="' + esc(r.ID) + '"', 'calendar', 'Gia hạn') + nutDongTQ('data-di="' + esc(r.ID) + '"', 'out', 'Xác nhận rời đi', 'bg-brand-50 text-brand-600') : '') +
          (chuaCT ? nutDongTQ('data-toggle-ct10="' + esc(r.ID) + '"', 'idcard', 'Đánh dấu đã gửi CT10', 'bg-brand-50 text-brand-600') : '');
      }
      return dongKhachTQ(r, phu, hetHan ? '<span class="hidden sm:inline">' + badgeTT(r.TrangThai) + '</span>' : '') + (nut ? '<span class="flex gap-0.5 pr-2 sm:pr-3 shrink-0">' + nut + '</span>' : '') + '</li>';
    };
    return '<section class="card mb-3 lg:mb-6 overflow-hidden">' + dauMuc('Cần xử lý', tong ? soVN(tong) + ' việc' : 'Không có việc nào tồn đọng') +
      (mucTom.length ? '<ul>' + mucTom.map(function (m) {
        return '<li class="border-t border-line"><a href="' + m[2] + '" ' + m[3] + ' class="flex items-center gap-3 px-4 sm:px-5 py-2 min-h-11 hover:bg-canvas/60"><span class="grid place-items-center size-7 shrink-0 rounded-lg ' + m[5] + '">' + ic(m[4], 'size-4') + '</span>' +
          '<span class="min-w-0 flex-1 text-sm truncate"><b class="font-semibold">' + soVN(m[0]) + '</b> ' + m[1] + '</span>' + ic('chev', 'size-4 text-muted shrink-0') + '</a></li>';
      }).join('') + '</ul>'
        : '<div class="flex items-center gap-3 px-4 sm:px-5 pb-4"><span class="grid place-items-center size-9 shrink-0 rounded-xl bg-mint text-mint-ink">' + ic('check', 'size-5') + '</span><p class="text-sm text-muted">Không có ai cần xử lý.</p></div>') +
      (hienThi.length ? '<ul class="border-t border-line">' + hienThi.map(dongNguoi).join('') +
        (conLai > 0 ? '<li class="border-t border-line"><a href="#/tam-tru' + (soHet ? '/Quá hạn' : '') + '" class="block px-4 sm:px-5 py-2.5 text-xs text-brand-600">Xem thêm ' + soVN(conLai) + ' người</a></li>' : '') + '</ul>' : '') +
      '</section>';
  }

  function trangTongQuan() {
    var v = $('#view');
    v.innerHTML = dauTrang('Tổng quan', 'Tình hình lưu trú hôm nay', duocGhi() ? '<button class="btn-primary" data-them-khach>' + ic('plus') + 'Khai báo</button>' : '') + khungCho(4);
    var luot = S.luot;
    docNhanh('tongQuan', 'tongQuan', {}).then(function (t) {
      if (luot !== S.luot) return;   // đã chuyển sang trang khác
      var k = t.khach.theoTrangThai;
      // Ô số liệu gọn: biểu tượng nhỏ + số + nhãn, 4 ô trong một khung
      var oSo = function (nhan, so, donVi, mau, icon, link) {
        return '<a href="' + link + '" class="mobile-stat flex items-center gap-3 p-3 sm:p-4 lg:p-5 hover:bg-canvas/60">' +
          '<span class="grid place-items-center size-9 lg:size-10 shrink-0 rounded-xl ' + mau + '">' + ic(icon, 'size-[18px] lg:size-5') + '</span>' +
          '<span class="min-w-0"><b class="block text-xl lg:text-[26px] font-semibold leading-none">' + soVN(so) + '</b><span class="stat-label block text-xs lg:text-[13px] text-muted mt-1">' + nhan + ' <span class="opacity-70 hidden sm:inline">(' + donVi + ')</span></span></span></a>';
      };
      var thongKeChua = '<a href="#/tam-tru" data-xem-ds="chuakhaibao" class="card flex items-center justify-between px-4 py-3 mb-3"><span>Công dân chưa khai báo đang cư trú</span><b>' + soVN(t.khach.chuaKhaiBao) + '</b></a>';
      var loai = Object.keys(t.coSo.theoLoaiHinh).sort(function (a, b) { return t.coSo.theoLoaiHinh[b] - t.coSo.theoLoaiHinh[a]; });
      var maxL = Math.max.apply(null, loai.map(function (l) { return t.coSo.theoLoaiHinh[l]; }).concat([1]));
      var cskv = Object.keys(t.coSo.theoCSKV).sort(function (a, b) { return t.coSo.theoCSKV[b].coSo - t.coSo.theoCSKV[a].coSo; });
      var ghi = duocGhi();

      var pv = S.phamVi || { toanPhuong: true };
      var moTa = (pv.toanPhuong ? 'Toàn phường' : esc(moTaDiaBanDay(pv)) + ' · ' + soVN(pv.soCoSo) + ' cơ sở') + ' · số liệu đến ngày ' + vn(t.homNay);
      var theLoaiHinhTQ =         '<section class="card mb-3 lg:mb-6 overflow-hidden">' + dauMuc('Cơ sở theo loại hình', soVN(t.coSo.tong) + ' cơ sở · ' + soVN(t.coSo.dungHoatDong) + ' dừng hoạt động', lienKetXem('#/co-so')) +
        '<div class="grid grid-cols-2 gap-1.5 px-4 sm:px-5 pb-3">' +
        '<a href="#/co-so" data-xem-ds="kt-da" class="rounded-xl bg-mint text-mint-ink px-3 py-2"><b class="text-lg leading-none">' + soVN(t.coSo.daKiemTra) + '</b><span class="block text-[11px] mt-1">Đã KT ' + thangVN(t.coSo.thangKiemTra) + '</span></a>' +
        '<a href="#/co-so" data-xem-ds="kt-chua" class="rounded-xl bg-butter text-butter-ink px-3 py-2"><b class="text-lg leading-none">' + (t.coSo.chuaKiemTra != null ? soVN(t.coSo.chuaKiemTra) : '…') + '</b><span class="block text-[11px] mt-1">Chưa kiểm tra</span></a></div>' +
        '<div class="px-4 sm:px-5 pb-2 lg:grid lg:grid-cols-2 lg:gap-x-10">' + loai.map(function (l) {
          var n = t.coSo.theoLoaiHinh[l], ng = (t.coSo.nguoiTheoLoaiHinh || {})[l] || 0;
          return '<a href="#/co-so" data-loc-loai="' + esc(l) + '" class="block py-1.5 group"><div class="flex flex-wrap justify-between items-baseline gap-x-2 text-[13px] mb-1"><b class="font-medium group-hover:text-brand-600">' + esc(l) + '</b><span><b class="font-semibold">' + soVN(n) + '</b> cơ sở = <b class="font-semibold">' + soVN(ng) + '</b> người đang cư trú</span></div>' +
            '<div class="h-2 rounded-full bg-canvas overflow-hidden"><div class="h-full rounded-full ' + (THANH_LOAI[l] || 'bg-[#C5C9D3]') + '" style="width:' + Math.max(4, n / maxL * 100) + '%"></div></div></a>';
        }).join('') +
        '</div></section>';
      var html = dauTrang('Tổng quan', moTa, ghi && (pv.toanPhuong || pv.soCoSo) ? '<button class="btn-primary" data-them-khach>' + ic('plus') + 'Khai báo</button>' : '',
        nutCongCu('data-xuat-tq', 'down', 'Xuất Excel')) +
        '<p class="sm:hidden -mt-3 mb-3 text-xs text-muted">' + moTa + '</p>' +
        (!pv.toanPhuong && !pv.soCoSo ? '<div class="flex gap-2 items-start rounded-2xl bg-butter text-butter-ink px-4 py-3 text-sm mb-3">' + ic('alert', 'size-4 mt-0.5 shrink-0') + '<span>Tài khoản của bạn ' + ((pv.cskv || (pv.to && pv.to.length)) ? 'gắn <b>' + esc(moTaDiaBanNgan(pv)) + '</b> nhưng chưa có cơ sở nào phù hợp' : 'chưa được gắn địa bàn') + '. Liên hệ Admin để gắn đúng địa bàn.</span></div>' : '') +
        '<div class="card grid grid-cols-2 lg:grid-cols-4 divide-line overflow-hidden mb-3 lg:mb-6 [&>a:nth-child(odd)]:border-r [&>a:nth-child(-n+2)]:border-b lg:[&>a]:border-b-0 lg:[&>a]:border-r lg:[&>a:last-child]:border-r-0 [&>a]:border-line">' +
        oSo('Đang cư trú', t.khach.dangLuuTru, 'người', 'bg-mint text-mint-ink', 'users', '#/tam-tru') +
        oSo('Sắp hết hạn', k['Sắp hết hạn'], 'người', 'bg-butter text-butter-ink', 'clock', '#/tam-tru/Sắp hết hạn') +
        oSo('Quá hạn', k['Quá hạn'], 'người', 'bg-rose text-rose-ink', 'alert', '#/tam-tru/Quá hạn') +
        oSo('Cơ sở', t.coSo.tong, 'cơ sở', 'bg-lilac text-lilac-ink', 'building', '#/co-so') +
        '</div>' + thongKeChua + theCanXuLy(t) + theLoaiHinhTQ + theHoKT2TQ(t) + theDangKyHomNay(t) + '' +
        // Cán bộ có cơ sở chưa kiểm tra trong tháng (chỉ Admin/Lãnh đạo, xem toàn phường)
        // Theo CSKV (chỉ Admin – người khác chỉ có 1 địa bàn)
        (!pv.toanPhuong ? '' : '<section class="card mt-3 lg:mt-6 overflow-hidden">' + dauMuc('Theo cảnh sát khu vực', soVN(cskv.length) + ' CSKV · số cơ sở phụ trách và khách đang lưu trú') +
        (cskv.length > 8 ? '<div class="px-4 sm:px-5 pb-3"><label class="relative block"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted">' + ic('search', 'size-4') + '</span>' +
          '<input id="cskvQ" type="search" class="inp h-10 pl-9 text-sm" placeholder="Tìm CSKV…" autocomplete="off"></label></div>' : '') +
        '<div id="cskvLuoi" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 px-4 sm:px-5 pb-4">' + cskv.map(function (c) {
          var x = t.coSo.theoCSKV[c];
          return '<button type="button" data-loc-cskv="' + esc(c) + '" data-ten="' + esc(boDau(c)) + '" class="flex items-center gap-2 px-3 py-2.5 min-h-12 rounded-xl border border-line text-left hover:bg-canvas/60 hover:border-[#D6DAF5]"><b class="flex-1 min-w-0 truncate text-sm font-medium">' + esc(c) + '</b>' +
            '<span class="shrink-0 text-xs text-muted tabular-nums"><b class="text-ink font-semibold">' + soVN(x.coSo) + '</b> CS</span><span class="shrink-0 text-xs text-muted tabular-nums"><b class="text-ink font-semibold">' + soVN(x.khachDangO) + '</b> khách</span>' + ic('chev', 'size-4 text-muted shrink-0') + '</button>';
        }).join('') + '</div>' +
        '<p id="cskvRong" class="hidden px-4 sm:px-5 pb-4 text-sm text-muted">Không có CSKV nào khớp tìm kiếm.</p></section>');
      v.innerHTML = html;
      if ($('#cskvQ')) $('#cskvQ').addEventListener('input', debounce(function (e) {
        var q = boDau(e.target.value).trim(), hien = 0;
        $$('#cskvLuoi [data-ten]').forEach(function (b) { var an = q && b.dataset.ten.indexOf(q) < 0; b.hidden = an; if (!an) hien++; });
        $('#cskvRong').classList.toggle('hidden', hien > 0);
      }, 120));
    }).catch(function () { if (luot === S.luot) v.innerHTML = dauTrang('Tổng quan') + trong('Không tải được dữ liệu', 'Kiểm tra kết nối rồi tải lại trang.'); });
  }

  // ================= KHÁCH TẠM TRÚ =================
  var dsKhach = [];
  function trangTamTru(ttTuLink) {
    if (ttTuLink !== undefined) S.loc.trangThai = ttTuLink;
    var v = $('#view');
    v.innerHTML = dauTrang('Công dân cư trú', 'Đăng ký, gia hạn và xác nhận rời đi', duocGhi() ? '<button class="btn-primary" data-them-khach>' + ic('plus') + '<span>Khai báo</span></button>' : '',
      (duocGhi() ? nutCongCu('data-nhap-ds', 'users', 'Khai báo nhiều người') : '') + nutCongCu('data-tra-cuu', 'idcard', 'Tra cứu CCCD') + nutCongCu('data-xuat-khach', 'down', 'Xuất Excel')) +
      '<div class="card px-3 sm:px-4 pt-3 mb-3">' +
      '<div class="flex gap-2"><label class="relative flex-1 min-w-0"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted">' + ic('search') + '</span>' +
      '<input id="kQ" type="search" class="inp pl-9" placeholder="Tìm họ tên, CCCD, phòng…" value="' + esc(S.loc.q) + '"></label>' +
      '<button type="button" class="relative grid place-items-center size-11 sm:size-10 shrink-0 rounded-xl bg-brand-50 text-brand-600" data-loc-khach aria-label="Bộ lọc">' + ic('loc', 'size-5') +
      '<span id="kSoLoc" hidden class="absolute -top-1.5 -right-1.5 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-brand-600 text-white text-[11px] font-semibold"></span></button></div>' +
      '<div id="kTabs" class="mt-2"></div>' +
      '<div class="flex gap-2 py-2.5 overflow-x-auto scroll-thin -mx-1 px-1">' +
      chipNho('data-homnay-chip', S.loc.homNay, ic('calendar', 'size-3.5') + 'Hôm nay') +
      (S.loc.chuaKhaiBao ? '<button class="btn-soft" data-bo-loc-khach>Chưa khai báo ×</button>' : '') +
      chipNho('data-ct10-chip', S.loc.ct10, ic('idcard', 'size-3.5') + 'Chưa gửi CT10') +
      '<span id="kLocDangChon" class="contents"></span></div></div>' +
      '<div id="kList">' + khungCho(3) + '</div>';
    napCoSo();
    $('#kQ').addEventListener('input', debounce(function (e) { S.loc.q = e.target.value; veDsKhach(); }, 150));
    docNhanh('dsTamTru', 'dsTamTru', {}).then(function (ds) { if (!$('#kList')) return; dsKhach = ds; veDsKhach(); })
      .catch(function () { if ($('#kList')) $('#kList').innerHTML = trong('Không tải được danh sách', 'Thử tải lại trang.'); });
  }

  /** Bộ lọc khách (bảng trượt): cơ sở, ngày đến từ–đến, hình thức khai báo, trạng thái chi tiết. */
  function moBoLocKhach() {
    var L = S.loc, cs = S.coSo || [];
    var chon = function (id, nhan, rong, tuyChon, gt) {
      return '<label class="block mb-3"><span class="lbl">' + nhan + '</span><select id="' + id + '" class="inp"><option value="">' + rong + '</option>' +
        tuyChon.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(gt || '') === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
    };
    moBangDuoi('Bộ lọc khách',
      chon('bk-cs', 'Cơ sở', 'Tất cả cơ sở', cs.map(function (c) { return [c.MaCoSo, c.TenCoSo + (c.DiaChi ? ' – ' + c.DiaChi : '')]; }), L.maCoSo) +
      '<div class="grid grid-cols-2 gap-2 mb-3"><div><span class="lbl">Ngày đến từ</span>' + oNgay('bk-tu', L.tu, { nhan: 'Ngày đến từ' }) + '</div><div><span class="lbl">đến ngày</span>' + oNgay('bk-den', L.den, { nhan: 'Ngày đến đến' }) + '</div></div>' +
      chon('bk-loai', 'Hình thức khai báo', 'Mọi hình thức', (S.dm.LoaiKhaiBao || []).concat(['(chưa ghi)']).map(function (x) { return [x, x]; }), L.loai) +
      chon('bk-tt', 'Trạng thái khác', 'Theo tab đang chọn', [['Đang ở', 'Còn hạn'], ['Đã rời đi', 'Đã rời đi']], ['Đang ở', 'Đã rời đi'].indexOf(L.trangThai) >= 0 ? L.trangThai : ''),
      '<button type="button" class="btn-ghost h-11 flex-1" data-xoa-loc-khach>Xoá lọc</button><button type="button" class="btn-primary h-11 flex-[2]" data-ap-loc-khach>Áp dụng</button>');
  }
  function apDungLocKhach(xoa) {
    var g = function (id) { var o = $('#' + id); return o && !xoa ? o.value : ''; };
    if (!xoa && kiemNgay($('#bangDuoi'))) return;
    S.loc.maCoSo = g('bk-cs'); S.loc.tu = g('bk-tu'); S.loc.den = g('bk-den'); S.loc.loai = g('bk-loai');
    var tt = g('bk-tt');
    if (tt) S.loc.trangThai = tt; else if (['Đang ở', 'Đã rời đi'].indexOf(S.loc.trangThai) >= 0) S.loc.trangThai = '';
    dongBangDuoi(); veDsKhach();
  }

  /** Thao tác nhanh với 1 khách: gia hạn, rời đi, CT10, sửa, xem chi tiết. */
  /** Đảo trạng thái "đã gửi phiếu CT10" của 1 khách. */
  function doiCT10(id) {
      var sanK2 = (layDem('dsTamTru') || []).filter(function (x) { return x.ID === id; })[0];
      var chuoi = sanK2 ? Promise.resolve(sanK2) : goi('layTamTru', { id: id });
      return chuoi.then(function (kh) { if (!daKhaiBao(kh)) throw new Error('Cần cập nhật trạng thái Đã khai báo trước khi gửi CT10.'); return goi('suaTamTru', { id: id, _phienBan: kh.NgayCapNhat, DaGuiCT10: kh.DaGuiCT10 !== true }); })
        .then(function (kq) { if (kq.DuLieuThu !== true) { vaKhach(kq); sauKhiGhi('khach'); } toast(kq.DaGuiCT10 ? 'Đã đánh dấu gửi CT10' : 'Đã bỏ đánh dấu CT10'); if (!$('#drawerWrap').hidden) veKhach(kq); lamMoiNen(); });
  }

  function moThaoTacKhach(id) {
    var r = (dsKhach || []).filter(function (x) { return x.ID === id; })[0]; if (!r) return;
    var conO = r.TrangThai !== 'Đã rời đi', ghi = duocGhiBanGhi(r);
    var muc = function (attr, icon, nhan, phu, mau) {
      return '<li><button type="button" ' + attr + ' class="w-full flex items-center gap-3 px-3 py-3 min-h-14 rounded-xl text-left hover:bg-canvas">' +
        '<span class="grid place-items-center size-10 shrink-0 rounded-xl ' + (mau || 'bg-brand-50 text-brand-600') + '">' + ic(icon, 'size-5') + '</span>' +
        '<span class="min-w-0"><b class="block text-sm font-medium">' + nhan + '</b>' + (phu ? '<span class="block text-xs text-muted">' + phu + '</span>' : '') + '</span></button></li>';
    };
    moBangDuoi(esc(r.HoTen), '<p class="text-xs text-muted -mt-1 mb-2">' + esc(r.SoCCCD_Pass + ' · ' + r.TenCoSo + (r.SoPhong ? ' · P.' + r.SoPhong : '')) + '</p><ul class="flex flex-col gap-0.5 -mx-2">' +
      (ghi && conO ? muc('data-tk-gh="' + esc(id) + '"', 'calendar', 'Gia hạn', 'Đi dự kiến ' + (r.NgayDiDuKien ? vn(r.NgayDiDuKien) : '(chưa có)')) +
        muc('data-tk-di="' + esc(id) + '"', 'out', 'Xác nhận rời đi', '', 'bg-butter text-butter-ink') +
        (daKhaiBao(r) ? muc('data-tk-ct10="' + esc(id) + '"', 'idcard', r.DaGuiCT10 === true ? 'Bỏ đánh dấu CT10' : 'Đánh dấu đã gửi CT10', r.DaGuiCT10 === true ? 'Hiện: đã gửi' : 'Hiện: chưa gửi', 'bg-mint text-mint-ink') : '') : '') +
      (ghi ? muc('data-tk-sua="' + esc(id) + '"', 'edit', 'Sửa thông tin', '') : '') +
      muc('data-tk-xem="' + esc(id) + '"', 'user', 'Xem chi tiết', 'Toàn bộ thông tin khai báo') + '</ul>');
  }

  function veDsKhach() {
    var q = boDau(S.loc.q).trim();
    var theoLoc = dsKhach.filter(function (r) {
      if (S.loc.maCoSo && r.MaCoSo !== S.loc.maCoSo) return false;
      if (S.loc.tu && r.NgayDen < S.loc.tu) return false;
      if (S.loc.den && r.NgayDen > S.loc.den) return false;
      if (S.loc.loai && (r.LoaiKhaiBao || '(chưa ghi)') !== S.loc.loai) return false;
      if (S.loc.chuaKhaiBao && (daKhaiBao(r) || r.TrangThai === 'Đã rời đi')) return false;
      if (S.loc.ct10 && (!daKhaiBao(r) || r.DaGuiCT10 === true || r.TrangThai === 'Đã rời đi')) return false;
      if (S.loc.homNay && String(r.NgayTao || '').slice(0, 10) !== homNay()) return false;
      if (q && boDau([r.HoTen, r.SoCCCD_Pass, r.SoDienThoai, r.SoPhong, r.ID, r.TenCoSo].join(' ')).indexOf(q) < 0) return false;
      return true;
    });
    var dem = { '': 0 };
    theoLoc.forEach(function (r) { dem[r.TrangThai] = (dem[r.TrangThai] || 0) + 1; if (r.TrangThai !== 'Đã rời đi') dem['']++; });
    dem['*'] = theoLoc.length;
    var tabDangChon = ['Đang ở', 'Đã rời đi'].indexOf(S.loc.trangThai) >= 0 ? null : S.loc.trangThai;
    $('#kTabs').innerHTML = thanhTab('data-tt', [['', 'Đang ở', dem['']], ['Sắp hết hạn', 'Sắp hết', dem['Sắp hết hạn'] || 0], ['Quá hạn', 'Quá hạn', dem['Quá hạn'] || 0], ['*', 'Tất cả', dem['*']]], tabDangChon);
    // Bộ lọc đang áp dụng (từ bảng lọc): hiện thành nhãn nhỏ, bấm × để bỏ
    var cs = S.loc.maCoSo ? (S.coSo || []).filter(function (c) { return c.MaCoSo === S.loc.maCoSo; })[0] : null;
    var dangLoc = [S.loc.maCoSo ? ['maCoSo', cs ? cs.TenCoSo : S.loc.maCoSo] : null, S.loc.tu ? ['tu', 'Từ ' + vn(S.loc.tu)] : null, S.loc.den ? ['den', 'Đến ' + vn(S.loc.den)] : null,
      S.loc.loai ? ['loai', S.loc.loai] : null, tabDangChon === null ? ['trangThai', S.loc.trangThai === 'Đang ở' ? 'Còn hạn' : S.loc.trangThai] : null].filter(Boolean);
    $('#kLocDangChon').innerHTML = dangLoc.map(function (x) { return '<button type="button" class="chip chip-nho shrink-0 bg-brand-50 text-brand-600 border-brand/30" data-bo-loc-khach="' + x[0] + '" aria-label="Bỏ lọc ' + esc(x[1]) + '">' + esc(x[1]) + ic('x', 'size-3.5') + '</button>'; }).join('');
    if ($('#kSoLoc')) { $('#kSoLoc').hidden = !dangLoc.length; $('#kSoLoc').textContent = dangLoc.length; }
    var ds = S.khachDangXem = theoLoc.filter(function (r) {
      if (S.loc.trangThai === '*') return true;
      if (S.loc.trangThai === '') return r.TrangThai !== 'Đã rời đi';
      return r.TrangThai === S.loc.trangThai;
    });
    var el = $('#kList');
    if (!dsKhach.length) {
      el.innerHTML = trong('Chưa có công dân cư trú', 'Bấm “Khai báo” để nhập người đến lưu trú tại một cơ sở.', duocGhi() ? '<button class="btn-primary" data-them-khach>' + ic('plus') + 'Khai báo</button>' : '');
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
    // Điện thoại: thẻ gọn 3 dòng trong một khung, nút ⋯ mở thao tác nhanh
    var the = function (r) {
      return '<li class="flex items-center"><button data-xem-khach="' + esc(r.ID) + '" class="min-w-0 flex-1 text-left pl-3 py-2.5">' +
        '<span class="flex items-center gap-2"><b class="min-w-0 flex-1 truncate text-sm font-semibold">' + esc(r.HoTen) + '</b>' + badgeTT(r.TrangThai) + '</span>' +
        '<span class="block text-xs text-muted truncate mt-0.5">' + esc([r.SoCCCD_Pass, r.TenCoSo, r.SoPhong ? 'P.' + r.SoPhong : ''].filter(String).join(' · ')) + '</span>' +
        '<span class="block text-xs text-muted truncate">' + vn(r.NgayDen).slice(0, 5) + ' → ' + (r.NgayDiDuKien ? vn(r.NgayDiDuKien).slice(0, 5) : '—') + ' · ' + conLaiTxt(r) +
        (!daKhaiBao(r) || r.DaGuiCT10 === true || r.TrangThai === 'Đã rời đi' ? '' : ' · <span class="text-butter-ink">chưa CT10</span>') + '</span></button>' +
        '<button type="button" data-thao-tac-kh="' + esc(r.ID) + '" class="grid place-items-center size-11 shrink-0 mr-1 rounded-xl text-muted hover:bg-canvas" aria-label="Thao tác với ' + esc(r.HoTen) + '">' + ic('more', 'size-5') + '</button></li>';
    };
    var hien = phanTrang('khach', ds, JSON.stringify(S.loc));
    el.innerHTML = '<div class="hidden md:block card overflow-hidden"><div class="overflow-x-auto scroll-thin"><table class="w-full"><thead><tr><th class="th">Khách</th><th class="th">Cơ sở / phòng</th><th class="th">Đến → Đi dự kiến</th><th class="th">Trạng thái</th><th class="th"></th></tr></thead><tbody>' +
      hien.map(hang).join('') + '</tbody></table></div></div>' +
      '<ul class="md:hidden card divide-y divide-line overflow-hidden">' + hien.map(the).join('') + '</ul>' +
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
    if (laChuCoSo()) return xemKhachCC(id);
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
      moNganKeo(dauNganKeo(esc(r.HoTen), 'Tạo lúc ' + vnTG(r.NgayTao)) +
        '<div class="flex-1 overflow-y-auto px-5 sm:px-6 py-5">' +
        '<div class="flex flex-wrap items-center gap-2 mb-5">' + badgeTT(r.TrangThai) + '<span class="text-sm text-muted">' + conLaiTxt(r) + '</span></div>' +
        '<dl class="card px-4">' +
        dong('Số CCCD / Hộ chiếu', '<b class="font-medium tracking-wide">' + esc(r.SoCCCD_Pass) + '</b> <button type="button" class="text-xs text-brand-600 hover:underline ml-1" data-tra-cuu="' + esc(r.SoCCCD_Pass) + '">xem lịch sử tạm trú</button>') + dong('Số điện thoại', r.SoDienThoai ? '<a class="text-brand-600" href="tel:' + esc(String(r.SoDienThoai).replace(/[^0-9+]/g, '')) + '">' + esc(r.SoDienThoai) + '</a>' : '') + dong('Ngày sinh', vn(r.NgaySinh)) + dong('Giới tính', esc(r.GioiTinh)) + dong('Dân tộc', esc(r.DanToc)) + dong('Quốc tịch', esc(r.QuocTich)) + dong('Nơi thường trú', esc(r.NoiThuongTru)) +
        '</dl><dl class="card px-4 mt-3">' +
        dong('Cơ sở', '<a href="#/co-so" data-xem-coso="' + esc(r.MaCoSo) + '" class="text-brand-600 hover:underline">' + esc(r.TenCoSo) + '</a><span class="block text-xs text-muted">' + esc(r.DiaChiCoSo) + '</span>') +
        dong('Trạng thái khai báo', daKhaiBao(r) ? 'Đã khai báo' : 'Chưa khai báo') + (daKhaiBao(r) ? dong('Hình thức khai báo', esc(r.LoaiKhaiBao)) : '') + dong('Số phòng', esc(r.SoPhong)) + dong('Ngày đến', vn(r.NgayDen)) + dong('Ngày đi dự kiến', vn(r.NgayDiDuKien)) + dong('Ngày đi thực tế', vn(r.NgayDiThucTe)) +
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
  /** 54 dân tộc Việt Nam (gợi ý khi nhập; vẫn gõ tự do được). Để trống = Kinh. */
  var DAN_TOC = ['Kinh', 'Tày', 'Thái', 'Hoa', 'Khmer', 'Mường', 'Nùng', 'HMông', 'Dao', 'Gia Rai', 'Ngái', 'Ê Đê', 'Ba Na', 'Xơ Đăng', 'Sán Chay', 'Cơ Ho', 'Chăm', 'Sán Dìu', 'Hrê', 'Mnông', 'Ra Glai', 'Xtiêng', 'Bru-Vân Kiều', 'Thổ', 'Giáy', 'Cơ Tu', 'Gié Triêng', 'Mạ', 'Khơ Mú', 'Co', 'Tà Ôi', 'Chơ Ro', 'Kháng', 'Xinh Mun', 'Hà Nhì', 'Chu Ru', 'Lào', 'La Chí', 'La Ha', 'Phù Lá', 'La Hủ', 'Lự', 'Lô Lô', 'Chứt', 'Mảng', 'Pà Thẻn', 'Cơ Lao', 'Cống', 'Bố Y', 'Si La', 'Pu Péo', 'Brâu', 'Ơ Đu', 'Rơ Măm'];
  var dsDanToc = '<datalist id="dlDanToc">' + DAN_TOC.map(function (x) { return '<option value="' + x + '">'; }).join('') + '</datalist>';
  /** Số điện thoại công dân: KHÔNG bắt buộc, 8–20 ký tự gồm số, +, dấu cách, chấm, gạch nối, ngoặc (giống máy chủ). */
  var loiSDT = function (v) {
    v = String(v || '').trim();
    return !v ? '' : /^[0-9+ .()-]{8,20}$/.test(v) ? '' : 'Số điện thoại chưa đúng (8–20 ký tự, gồm số).';
  };
  /** Dưới 14 tuổi tính đến hôm nay (ngày sinh dạng yyyy-MM-dd); chưa có ngày sinh => false. */
  var duoi14 = function (ns) { ns = String(ns || ''); return /^\d{4}-\d{2}-\d{2}$/.test(ns) && (+ns.slice(0, 4) + 14) + ns.slice(4) > homNay(); };
  var oLoi = function (ten) { return '<p class="hidden text-xs text-rose-ink mt-1" data-loi-o="' + ten + '"></p>'; };

  // Ô chọn cơ sở: ≤ 6 cơ sở thì hiện sẵn các nút; nhiều hơn thì ô tìm + danh sách (chạy tốt trên iPhone, không dùng datalist)
  function oChonCoSo(ds, maHienTai) {
    var hienTai = ds.filter(function (c) { return c.MaCoSo === maHienTai; })[0];
    var nhan = function (c) { return c.TenCoSo + ' – ' + c.DiaChi; };
    if (ds.length <= 6) {
      return '<div class="grid gap-2" id="csNut">' + ds.map(function (c) {
        return '<label><input type="radio" name="csChon" value="' + esc(c.MaCoSo) + '" class="peer sr-only"' + (c.MaCoSo === maHienTai ? ' checked' : '') + '><span class="flex flex-col px-3 py-2 rounded-xl border border-line text-sm cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand peer-focus-visible:ring-4 peer-focus-visible:ring-brand/15">' +
          '<b class="font-medium">' + esc(c.TenCoSo) + '</b><span class="text-xs text-muted">' + esc(c.DiaChi) + '</span></span></label>';
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
        return '<button type="button" data-chon-cs="' + esc(c.MaCoSo) + '" class="text-left px-3 py-2 rounded-lg hover:bg-canvas ' + (i === chiSo ? 'bg-canvas' : '') + '"><b class="block text-sm font-medium truncate">' + esc(c.TenCoSo) + '</b><span class="block text-xs text-muted truncate">' + esc(c.DiaChi + (c.CSKV ? ' · CSKV ' + c.CSKV : '')) + '</span></button>';
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
  // Nút "Khai báo": chọn khai báo 1 người hay nhiều người cùng lúc
  function moKhaiBao(ma) {
    var nut = function (k, bieuTuong, ten, mota) {
      return '<button type="button" data-kb="' + k + '" class="card w-full flex items-center gap-3 px-4 py-4 text-left hover:border-brand active:scale-[.99] transition"><span class="grid place-items-center size-11 shrink-0 rounded-xl bg-brand-50 text-brand-600">' + ic(bieuTuong, 'size-5') + '</span><span class="min-w-0"><b class="block font-medium">' + ten + '</b><span class="block text-[13px] text-muted">' + mota + '</span></span></button>';
    };
    moNganKeo(dauNganKeo('Khai báo cư trú', 'Chọn số người cần khai báo') +
      '<div class="flex-1 overflow-y-auto px-5 sm:px-6 py-5 flex flex-col gap-3">' +
      nut('1', 'plus', 'Khai báo 1 người', 'Nhập đầy đủ thông tin một công dân, có thể quét mã QR trên CCCD') +
      nut('n', 'users', 'Khai báo nhiều người', 'Nhập nhiều người cùng cơ sở, cùng ngày đến (ví dụ cả phòng, cả đoàn)') +
      (duocGhi() ? nut('kt2', 'building', 'Nhập danh sách KT2 đến từ Excel', 'Công dân đang cư trú theo loại hình KT2 đến: nhập cả danh sách bằng tệp Excel (có tệp mẫu)') : '') + '</div>');
    $$('#drawer [data-kb]').forEach(function (b) { b.addEventListener('click', function () { return b.dataset.kb === '1' ? formKhach(null, ma || '') : b.dataset.kb === 'kt2' ? formNhapKT2() : formNhapDS(ma || ''); }); });
  }

  function formKhach(r, maCoSoSan, giu, dx) {
    // dx: khai báo của cộng tác viên đang chờ cán bộ phụ trách duyệt (mở form đã điền sẵn để kiểm tra, bổ sung rồi duyệt)
    var moi = !r || !!dx;
    if (dx) r = Object.assign({ QuocTich: 'Việt Nam' }, dx.khaiBao, { MaCoSo: dx.MaCoSo }, dx.banNhap || {});
    else r = r || (giu ? Object.assign({}, giu.du) : { NgayDen: homNay(), QuocTich: 'Việt Nam', MaCoSo: maCoSoSan || '' });
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
      var loaiChon = r.NhomCoSo !== undefined ? r.NhomCoSo : (csHienTai ? csHienTai.LoaiHinh : '');
      if (loaiChon === 'KT2 đến') loaiChon = '';
      var coTrangThai = !laChuCoSo() && (!!dx || !moi);
      var laThu = !!(csHienTai && csHienTai.DuLieuThu === true);
      var moTaCS = function (c) { return c ? [tenLoaiHinh(c), c.NguoiQuanLy, c.DiaChi, c.CSKV ? 'CSKV ' + c.CSKV : ''].filter(Boolean).join(' · ') : ''; };
      var gt = function (g) { return '<label class="flex-1"><input type="radio" name="GioiTinh" value="' + g + '" class="peer sr-only"' + (r.GioiTinh === g ? ' checked' : '') + '><span class="flex h-10 items-center justify-center rounded-xl border border-line text-sm cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand peer-checked:text-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand/15">' + g + '</span></label>'; };
      var tieuDe = dx ? 'Duyệt & bổ sung khai báo' : moi ? (giu ? 'Thêm người cùng nơi ở' : 'Khai báo công dân cư trú') : 'Sửa thông tin khách';
      var phu = dx ? 'Cộng tác viên đã nhập thông tin cơ bản. Kiểm tra, điền thêm (tiền án, kết quả test, CT10, ghi chú…) rồi bấm Duyệt để đưa vào danh sách công dân.' : laChuCoSo() && moi && !giu ? 'Khai báo sẽ gửi cho cán bộ phụ trách duyệt và điền tiếp thông tin trước khi vào danh sách công dân.' : moi ? (giu ? 'Đã thêm ' + giu.dem + ' người' + (r.SoPhong ? ' vào phòng ' + esc(r.SoPhong) : '') + (csHienTai ? ' · ' + esc(csHienTai.TenCoSo) : '') + '. Cơ sở, phòng và ngày được giữ nguyên.' : 'Các ô có dấu * là bắt buộc') : esc(r.TenCoSo || '');
      moNganKeo(dauNganKeo(tieuDe, phu) +
        '<form id="fKhach" class="flex-1 overflow-y-auto px-5 sm:px-6 py-5 flex flex-col gap-5" novalidate>' +
        (giu ? '<div class="flex gap-2 items-start rounded-xl bg-mint text-mint-ink px-3 py-2 text-sm">' + ic('check', 'size-4 mt-0.5 shrink-0') + '<span>Đã lưu ' + giu.dem + ' người. Nhập người tiếp theo.</span></div>' : '') +
        '<button type="button" id="btnQR" class="btn-soft w-full">' + ic('qr', 'size-5') + 'Quét mã QR trên CCCD để điền nhanh</button>' +
        '<fieldset class="grid grid-cols-2 gap-3"><legend class="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Thông tin cá nhân</legend>' +
        '<div class="col-span-2"><label class="lbl" for="HoTen">Họ và tên *</label><input id="HoTen" name="HoTen" class="inp" required maxlength="100" autocomplete="off" value="' + esc(r.HoTen) + '" autofocus>' + oLoi('HoTen') + '</div>' +
        '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="SoCCCD_Pass">Số CCCD / Hộ chiếu *</label><input id="SoCCCD_Pass" name="SoCCCD_Pass" class="inp tracking-wide" required inputmode="text" autocomplete="off" placeholder="12 số CCCD hoặc số hộ chiếu" value="' + esc(r.SoCCCD_Pass) + '">' + oLoi('SoCCCD_Pass') + '</div>' +
        '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="SoDienThoai">Số điện thoại</label><input id="SoDienThoai" name="SoDienThoai" class="inp tracking-wide" type="tel" inputmode="tel" maxlength="20" autocomplete="off" placeholder="Không bắt buộc" value="' + esc(r.SoDienThoai) + '">' + oLoi('SoDienThoai') + '</div>' +
        '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="NgaySinh_g">Ngày sinh</label>' + oNgay('NgaySinh', r.NgaySinh, { max: homNay(), nhan: 'Ngày sinh' }) + '</div>' +
        '<div class="col-span-2 sm:col-span-1"><span class="lbl">Giới tính</span><div class="flex gap-2">' + gt('Nam') + gt('Nữ') + gt('Khác') + '</div></div>' +
        '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="DanToc">Dân tộc</label><input id="DanToc" name="DanToc" class="inp" list="dlDanToc" autocomplete="off" maxlength="50" placeholder="Để trống = Kinh" value="' + esc(r.DanToc) + '">' + dsDanToc + '</div>' +
        '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="QuocTich">Quốc tịch</label><input id="QuocTich" name="QuocTich" class="inp" value="' + esc(r.QuocTich) + '"></div>' +
        '<div class="col-span-2"><label class="lbl" for="NoiThuongTru">Nơi thường trú</label><input id="NoiThuongTru" name="NoiThuongTru" class="inp" maxlength="300" value="' + esc(r.NoiThuongTru) + '"></div>' +
        '</fieldset>' +
        '<fieldset class="grid grid-cols-2 gap-3"><legend class="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Lưu trú</legend>' +
        (coTrangThai ? '<div class="col-span-2"><span class="lbl">Trạng thái khai báo</span><div class="flex gap-4"><label><input type="radio" name="DaKhaiBao" value="true"' + (daKhaiBao(r) ? ' checked' : '') + '> Đã khai báo</label><label><input type="radio" name="DaKhaiBao" value="false"' + (!daKhaiBao(r) ? ' checked' : '') + '> Chưa khai báo</label></div></div>' : '') +
        (coTrangThai ? '<div id="oHinhThuc" class="col-span-2"><span class="lbl">Hình thức khai báo *</span><div class="grid grid-cols-1 sm:grid-cols-3 gap-2" id="oLoai">' + (S.dm.LoaiKhaiBao || []).map(function (l) {
          return '<label><input type="radio" name="LoaiKhaiBao" value="' + esc(l) + '" class="peer sr-only"' + (r.LoaiKhaiBao === l ? ' checked' : '') + '><span class="flex min-h-10 px-2 py-1.5 items-center justify-center text-center rounded-xl border border-line text-sm cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand peer-checked:text-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand/15">' + esc(l) + '</span></label>';
        }).join('') + '</div>' + oLoi('LoaiKhaiBao') + '</div>' : '') +
        '<div class="col-span-2"><label class="lbl" for="NhomCoSo">Loại hình cơ sở</label><select id="NhomCoSo" name="NhomCoSo" class="inp"><option value="">Hộ KT2 đến (mặc định)</option>' + BON_LOAI.concat(loaiChon && BON_LOAI.indexOf(loaiChon) < 0 ? [loaiChon] : []).map(function (l) { return '<option' + (l === loaiChon ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></div>' +
        '<div id="oKT2" class="col-span-2"><label class="lbl" for="KT2DiaChi">Địa chỉ nơi ở của hộ KT2 đến *</label><input id="KT2DiaChi" name="KT2DiaChi" class="inp" maxlength="300" value="' + esc(r.KT2DiaChi || (laHoKT2(csHienTai) ? csHienTai.DiaChi : '')) + '"><p class="text-xs text-muted">Cùng địa chỉ được gộp vào một hộ.</p>' + oLoi('KT2DiaChi') + '</div>' +
        ('<div id="oDiaBanMoi" class="col-span-2"><label class="lbl" for="ToDanPhoMoi">Tổ dân phố (khi tạo mới)</label><input id="ToDanPhoMoi" class="inp" inputmode="numeric" value="' + esc(r.ToDanPhoMoi || (csHienTai && csHienTai.ToDanPho) || '') + '">' + (laAdmin() ? '<label class="lbl" for="CSKVMoi">CSKV phụ trách (khi tạo mới)</label><input id="CSKVMoi" class="inp" value="' + esc(r.CSKVMoi || (csHienTai && csHienTai.CSKV) || '') + '">' : '') + '</div>') +
        '<div id="oCoSoChon" class="col-span-2"><span class="lbl">Cơ sở *</span><div id="csBoChon">' + oChonCoSo(dangHD, r.MaCoSo) + '</div>' +
        '<p id="csGoiY" class="text-xs text-muted mt-1.5">' + (csHienTai ? esc(moTaCS(csHienTai)) : dangHD.length + ' cơ sở đang hoạt động') + '</p>' + oLoi('MaCoSo') +
        (dx ? '<button type="button" id="csSuaDuyet" class="btn-soft mt-2">Sửa thông tin cơ sở / loại hình</button><p class="text-xs text-muted mt-1">Có thể chọn cơ sở khác. Sửa cơ sở sẽ được lưu riêng và áp dụng cho mọi hồ sơ của cơ sở đó.</p>' : '') +
        (duocDangKy() && !dx ? '<button type="button" id="csMoiNut" class="text-xs text-brand-600 hover:underline mt-1.5">+ Cơ sở chưa có trong danh sách? Thêm cơ sở mới</button>' +
          '<div id="csMoi" class="hidden mt-2 rounded-xl border border-line bg-canvas/60 p-3 grid gap-2">' +
          '<b class="text-sm">Thêm cơ sở mới</b>' +
          '<input id="csMoiTen" class="inp" maxlength="150" placeholder="Tên cơ sở (vd: Nhà trọ Hoa Mai)">' +
          '<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">' + BON_LOAI.map(function (l) {
            return '<label><input type="radio" name="csMoiLoai" value="' + l + '" class="peer sr-only"><span class="flex h-9 items-center justify-center rounded-xl border border-line bg-white text-[13px] cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand peer-checked:text-brand-600">' + l + '</span></label>';
          }).join('') + '</div>' +
          '<input id="csMoiDC" class="inp" maxlength="300" placeholder="Địa chỉ cụ thể: số nhà, ngõ/ngách, đường">' +
          '<p id="csMoiLoi" class="hidden text-xs text-rose-ink"></p>' +
          '<div class="flex justify-end gap-2"><button type="button" id="csMoiHuy" class="btn-ghost btn-sm">Huỷ</button><button type="button" id="csMoiLuu" class="btn-primary btn-sm">Lưu cơ sở</button></div></div>' : '') +
        '</div>' +
        '<div id="oSoPhong"><label class="lbl" for="SoPhong">Số phòng</label><input id="SoPhong" name="SoPhong" class="inp" value="' + esc(r.SoPhong) + '"></div>' +
        '<div><label class="lbl" for="NgayDen_g">Ngày đến *</label>' + oNgay('NgayDen', r.NgayDen, { nhan: 'Ngày đến' }) + '</div>' +
        '<div class="col-span-2"><label class="lbl" for="NgayDiDuKien_g">Ngày đi dự kiến</label><div class="flex flex-col gap-2">' + oNgay('NgayDiDuKien', r.NgayDiDuKien, { cls: 'sm:w-56', nhan: 'Ngày đi dự kiến' }) +
        '<p id="ttXem" class="text-[13px] mt-2"></p></div>' +
        (moi ? '' : '<div class="col-span-2"><label class="lbl" for="NgayDiThucTe_g">Ngày đi thực tế</label>' + oNgay('NgayDiThucTe', r.NgayDiThucTe, { cls: 'sm:w-56', max: homNay(), nhan: 'Ngày đi thực tế' }) + '</div>') +
        '</fieldset>' +
        (laChuCoSo() ? '<p class="text-xs text-muted">Hệ thống không lưu ảnh giấy tờ, chỉ lưu số CCCD/hộ chiếu.</p>' : '<fieldset id="oBoSungKhaiBao" class="grid grid-cols-2 gap-3"><legend class="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Thông tin bổ sung <span class="normal-case font-normal text-muted">(có thể điền sau)</span></legend>' +
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
        '</fieldset>') +
        '<p id="fLoi" class="hidden text-sm bg-rose text-rose-ink rounded-xl px-3 py-2"></p>' +
        '</form><footer class="flex flex-wrap gap-2 px-4 sm:px-6 py-3 border-t border-line"><button data-close class="btn-ghost">' + (giu ? 'Xong' : 'Huỷ') + '</button><span class="flex-1"></span>' +
        (moi && !dx ? '<button id="fLuuThem" type="button" class="btn-soft" title="Lưu người này rồi nhập tiếp người khác cùng cơ sở, phòng, ngày">' + ic('plus') + '<span class="hidden sm:inline">Lưu &amp; thêm người cùng nơi ở</span><span class="sm:hidden">Lưu &amp; thêm</span></button>' : '') +
        '<button id="fLuu" form="fKhach" type="submit" class="btn-primary min-w-24">' + (dx ? ic('check') + 'Duyệt' : moi ? (laChuCoSo() ? 'Gửi khai báo' : 'Đăng ký') : 'Lưu thay đổi') + '</button></footer>');

      var f = $('#fKhach');
      var capNhatKhaiBao = function () {
        var da = coTrangThai && (f.querySelector('[name=DaKhaiBao]:checked') || {}).value === 'true';
        if ($('#oHinhThuc')) $('#oHinhThuc').classList.toggle('hidden', !da);
        if ($('#oBoSungKhaiBao')) $('#oBoSungKhaiBao').classList.toggle('hidden', !da);
      };
      capNhatKhaiBao();
      $$('[name=DaKhaiBao]', f).forEach(function (e) { e.addEventListener('change', capNhatKhaiBao); });
      if (dx) $('#csSuaDuyet').addEventListener('click', function () {
        var ma = f.MaCoSo.value;
        if (!ma) { loiO(f, 'MaCoSo', 'Chọn cơ sở cần chỉnh sửa.'); return; }
        var nhap = {};
        new FormData(f).forEach(function (v, k) { nhap[k] = v; });
        if ($('#ToDanPhoMoi')) nhap.ToDanPhoMoi = $('#ToDanPhoMoi').value;
        if ($('#CSKVMoi')) nhap.CSKVMoi = $('#CSKVMoi').value;
        if (f.DaGuiCT10) nhap.DaGuiCT10 = f.DaGuiCT10.checked;
        nhap.TienAn = (f.querySelector('[name=TienAn]:checked') || {}).value || '';
        nhap.GioiTinh = (f.querySelector('[name=GioiTinh]:checked') || {}).value || '';
        nhap.LoaiKhaiBao = (f.querySelector('[name=LoaiKhaiBao]:checked') || {}).value || '';
        var quayLai = function () { delete nhap.NhomCoSo; formKhach(null, null, null, Object.assign({}, dx, { banNhap: nhap })); };
        var nut = $('#csSuaDuyet'); nut.disabled = true;
        goi('layCoSo', { ma: ma }).then(function (c) { formCoSo(c, false, quayLai); })
          .catch(function (err) { nut.disabled = false; toast(err.message, 'loi'); });
      });
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
          canhBaoTrung();
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
      var chonCoSo = function (c) {
        $('#csGoiY').textContent = c ? moTaCS(c) : 'Chọn một cơ sở trong danh sách';
        if (c) loiO(f, 'MaCoSo', '');
      };
      var doiLoai = function (giuMa) {
        var loai = f.NhomCoSo.value, ma = giuMa ? f.MaCoSo.value : '';
        $('#oKT2').classList.toggle('hidden', !!loai);
        $('#oCoSoChon').classList.toggle('hidden', !loai);
        $('#oSoPhong').classList.toggle('hidden', BON_LOAI.indexOf(loai) < 0);
        var ds = dangHD.filter(function (c) { return c.LoaiHinh === loai; });
        $('#csBoChon').innerHTML = oChonCoSo(ds, ma);
        ganChonCoSo(ds, chonCoSo);
        if (!loai && giuMa) f.MaCoSo.value = ma;
        $$('[name=csMoiLoai]', f).forEach(function (e) { e.checked = e.value === loai; });
      };
      f.NhomCoSo.addEventListener('change', function () { doiLoai(false); });
      doiLoai(true);
      var canhBaoTrung = function () {
        var so = f.SoCCCD_Pass.value.trim();
        if (!laChuCoSo() || !so || loiSoGiayTo(so)) return;
        if (!$('#canhBaoTrung')) f.SoCCCD_Pass.parentNode.insertAdjacentHTML('beforeend', '<p id="canhBaoTrung" role="status" class="text-sm text-butter-ink mt-2"></p>');
        $('#canhBaoTrung').textContent = 'Đang kiểm tra trùng thông tin…';
        API.goi('kiemTraTrungCCCD', { SoCCCD_Pass:so }).then(function (kq) {
          if ($('#fKhach') === f && f.SoCCCD_Pass.value.trim() === so) $('#canhBaoTrung').textContent = kq.thongDiep || '';
        }).catch(function () { if ($('#fKhach') === f && f.SoCCCD_Pass.value.trim() === so) $('#canhBaoTrung').textContent = 'Chưa kiểm tra được trùng thông tin. Hệ thống sẽ kiểm tra lại khi gửi khai báo.'; });
      };
      f.SoCCCD_Pass.addEventListener('blur', canhBaoTrung);
      f.SoCCCD_Pass.addEventListener('input', function () { if ($('#canhBaoTrung')) $('#canhBaoTrung').textContent = ''; });
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
          API.goi('themCoSo', { TenCoSo: ten, LoaiHinh: lh.value, DiaChi: dc, ToDanPho: $('#ToDanPhoMoi') ? $('#ToDanPhoMoi').value : '', CSKV: $('#CSKVMoi') ? $('#CSKVMoi').value : '' }).then(function (c) {
            if (c.DuLieuThu !== true) { vaCoSo(c); sauKhiGhi('coso'); }
            dangHD.push(c); f.NhomCoSo.value = c.LoaiHinh; doiLoai(false);
            $('#MaCoSo').value = c.MaCoSo;
            if ($('#csTim')) $('#csTim').value = c.TenCoSo + ' – ' + c.DiaChi;
            else if ($('#csNut')) {
              $$('[name=csChon]').forEach(function (x) { x.checked = false; });
              $('#csNut').insertAdjacentHTML('beforeend', '<label><input type="radio" name="csChon" value="' + esc(c.MaCoSo) + '" class="peer sr-only" checked><span class="flex flex-col px-3 py-2 rounded-xl border border-line text-sm cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand"><b class="font-medium">' + esc(c.TenCoSo) + '</b><span class="text-xs text-muted">' + esc(c.DiaChi) + '</span></span></label>');
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
      f.addEventListener('input', function (e) { if (e.target.id === 'HoTen' || e.target.id === 'SoCCCD_Pass' || e.target.id === 'SoDienThoai') loiO(f, e.target.id, ''); });
      f.addEventListener('change', function (e) { if (e.target.name === 'LoaiKhaiBao') loiO(f, 'LoaiKhaiBao', ''); if (e.target.name === 'TienAn') $('#oTienAnGC').classList.toggle('hidden', e.target.value !== 'Có'); });
      $('#SoDienThoai').addEventListener('blur', function (e) { if (e.target.value.trim()) loiO(f, 'SoDienThoai', loiSDT(e.target.value)); });
      $('#SoCCCD_Pass').addEventListener('blur', function (e) { if (e.target.value.trim()) loiO(f, 'SoCCCD_Pass', loiSoGiayTo(e.target.value)); });

      var dangLuu = false, kt2DaLuu = '';
      var luu = function (themTiep) {
        if (dangLuu) return;
        var d = {};
        ['HoTen', 'SoCCCD_Pass', 'SoDienThoai', 'NgaySinh', 'DanToc', 'QuocTich', 'NoiThuongTru', 'MaCoSo', 'SoPhong', 'NgayDen', 'NgayDiDuKien', 'NgayDiThucTe', 'GhiChu', 'KetQuaTest'].forEach(function (k) { if (f[k]) d[k] = f[k].value.trim(); });
        var g = f.querySelector('[name=GioiTinh]:checked'); d.GioiTinh = g ? g.value : '';
        d.DaKhaiBao = coTrangThai && (f.querySelector('[name=DaKhaiBao]:checked') || {}).value === 'true';
        var lk = f.querySelector('[name=LoaiKhaiBao]:checked'); d.LoaiKhaiBao = d.DaKhaiBao && lk ? lk.value : '';
        if (BON_LOAI.indexOf(f.NhomCoSo.value) < 0) d.SoPhong = '';
        if (!d.DaKhaiBao) delete d.KetQuaTest;
        if (d.DaKhaiBao && f.DaGuiCT10) {   // cộng tác viên không có các ô này (do cán bộ điền)
          var ta = f.querySelector('[name=TienAn]:checked'); d.TienAn = ta ? ta.value : '';
          d.TienAnGhiChu = d.TienAn === 'Có' ? f.TienAnGhiChu.value.trim() : '';
          d.DaGuiCT10 = f.DaGuiCT10.checked;
        }
        // Kiểm tra từng ô, báo lỗi ngay dưới ô, đưa tới ô sai đầu tiên
        $('#fLoi').classList.add('hidden');
        var loi = [];
        var dat = function (ten, msg) { loiO(f, ten, msg); if (msg) loi.push(ten); };
        dat('HoTen', d.HoTen ? '' : 'Chưa nhập họ tên.');
        dat('SoCCCD_Pass', loiSoGiayTo(d.SoCCCD_Pass));
        dat('SoDienThoai', loiSDT(d.SoDienThoai));
        var loiNgayForm = kiemNgay(f);
        if (!loiNgayForm && !d.NgayDen) { loiNgay(document.querySelector('[data-o-ngay=NgayDen]'), 'Chưa nhập ngày đến.'); loiNgayForm = 'x'; }
        if (!loiNgayForm && d.NgayDiDuKien && d.NgayDiDuKien < d.NgayDen) { loiNgay(document.querySelector('[data-o-ngay=NgayDiDuKien]'), 'Ngày đi dự kiến trước ngày đến.'); loiNgayForm = 'x'; }
        if (d.DaKhaiBao) dat('LoaiKhaiBao', d.LoaiKhaiBao ? '' : 'Chưa chọn hình thức khai báo.');   // cộng tác viên không chọn (máy chủ tự đặt mặc định)
        if (f.NhomCoSo.value) dat('MaCoSo', d.MaCoSo ? '' : 'Chưa chọn cơ sở lưu trú trong danh sách.');
        else dat('KT2DiaChi', f.KT2DiaChi.value.trim() ? '' : 'Chưa nhập địa chỉ nơi ở.');
        if (loi.length || loiNgayForm) {
          var dau = loi.length ? (f.querySelector('#' + loi[0]) || f.querySelector('[name="' + loi[0] + '"]')) : null;
          var oNgaySai = f.querySelector('[data-o-ngay] input.border-rose-ink');
          var den = dau || oNgaySai;
          if (loi[0] === 'MaCoSo') den = $('#csTim') || $('#csNut');
          if (loi[0] === 'LoaiKhaiBao') den = $('#oLoai');
          if (den) { den.scrollIntoView({ block: 'center', behavior: 'smooth' }); if (den.focus && den.tagName === 'INPUT') den.focus({ preventScroll: true }); }
          return;
        }
        var khoaKT2 = [f.KT2DiaChi.value.trim(), $('#ToDanPhoMoi') ? $('#ToDanPhoMoi').value : '', $('#CSKVMoi') ? $('#CSKVMoi').value : ''].join('|');
        if (!f.NhomCoSo.value && kt2DaLuu !== khoaKT2) {
          dangLuu = true; $('#fLuu').disabled = true;
          API.goi('layHoKT2', { DiaChi:f.KT2DiaChi.value.trim(), ToDanPho:$('#ToDanPhoMoi') ? $('#ToDanPhoMoi').value : '', CSKV:$('#CSKVMoi') ? $('#CSKVMoi').value : '' }).then(function (c) {
            kt2DaLuu = khoaKT2; f.MaCoSo.value = c.MaCoSo; sauKhiGhi('coso'); dangLuu = false; $('#fLuu').disabled = false; luu(themTiep);
          }).catch(function (e) { dangLuu = false; $('#fLuu').disabled = false; $('#fLoi').textContent = e.message; $('#fLoi').classList.remove('hidden'); });
          return;
        }
        dangLuu = true;
        var nut = themTiep ? $('#fLuuThem') : $('#fLuu'), chu = nut.innerHTML;
        $('#fLuu').disabled = true; if ($('#fLuuThem')) $('#fLuuThem').disabled = true; nut.textContent = 'Đang lưu…';
        if (!moi) { d.id = r.ID; d._phienBan = r.NgayCapNhat; }
        if (moi && !dx && !laThu) {
          // Lạc quan: đóng form / chuyển sang người kế tiếp ngay, hiện dòng tạm trong danh sách; máy chủ lưu ngầm.
          // Lỗi (trùng giấy tờ, thiếu SĐT…) -> bỏ dòng tạm, mở lại form đúng dữ liệu đã nhập kèm lời báo lỗi.
          var tam = null;
          if (!laChuCoSo() && layDem('dsTamTru')) {
            var csT = (layDem('dsCoSo') || []).filter(function (x) { return x.MaCoSo === d.MaCoSo; })[0] || {};
            tam = Object.assign({ ID: 'TAM-' + Date.now(), TenCoSo: csT.TenCoSo || '', DiaChiCoSo: csT.DiaChi || '', CSKV: csT.CSKV || '' }, d, { TrangThai: tinhTrangThai(d.NgayDiDuKien, d.NgayDiThucTe) });
            vaKhach(tam);
          }
          var boTam = function () { if (tam) vaKhach(null, tam.ID); };
          toast('Đang lưu ' + d.HoTen + '…');
          if (themTiep) {
            formKhach(null, null, { du: { MaCoSo: d.MaCoSo, SoPhong: d.SoPhong, NgayDen: d.NgayDen, NgayDiDuKien: d.NgayDiDuKien, LoaiKhaiBao: d.LoaiKhaiBao, QuocTich: d.QuocTich || 'Việt Nam' }, dem: (giu ? giu.dem : 0) + 1 });
            lamMoiNen();
          } else { dongNganKeo(); lamMoi(); }
          API.goi('themTamTru', d).then(function (kq) {
            boTam();
            if (kq && kq.choDuyet) { delete DEM.dsDeXuat; sauKhiGhi('khach'); toast('Đã gửi khai báo ' + d.HoTen + ' cho cán bộ phụ trách duyệt'); }
            else { vaKhach(kq); sauKhiGhi('khach'); toast('Đã đăng ký ' + kq.HoTen); }
            if (!$('#fKhach')) lamMoiNen();
          }, function (err) {
            boTam();
            toast('Không lưu được ' + d.HoTen + ': ' + (err.message || err), 'loi');
            if ($('#fKhach')) { if (!$('#drawerWrap').hidden) lamMoiNen(); return; }   // đang nhập người khác: chỉ báo lỗi (dữ liệu người này nằm trong thông báo)
            formKhach(null, null, { du: d, dem: 0 }); lamMoiNen();
            setTimeout(function () { var p = $('#fLoi'); if (p) { p.textContent = err.message || String(err); p.classList.remove('hidden'); } }, 600);
          });
          return;
        }
        API.goi(dx ? 'duyetDeXuat' : moi ? 'themTamTru' : 'suaTamTru', dx ? { ma: dx.MaDeXuat, data: d } : d).then(function (kq) {
          if (dx) { delete DEM.dsDeXuatCB; sauKhiGhi('khach'); sauKhiGhi('coso'); toast('Đã duyệt và thêm ' + d.HoTen + ' vào danh sách công dân'); dongNganKeo(); lamMoi(); return; }
          if (kq && kq.choDuyet) { delete DEM.dsDeXuat; sauKhiGhi('khach'); toast('Đã gửi khai báo ' + d.HoTen + ' cho cán bộ phụ trách duyệt'); }
          else {
            if (!laThu) { vaKhach(kq); sauKhiGhi('khach'); }
            toast(moi ? 'Đã đăng ký ' + kq.HoTen : 'Đã lưu thay đổi');
          }
          if (themTiep) {
            formKhach(null, null, { du: { MaCoSo: d.MaCoSo, SoPhong: d.SoPhong, NgayDen: d.NgayDen, NgayDiDuKien: d.NgayDiDuKien, LoaiKhaiBao: d.LoaiKhaiBao, QuocTich: d.QuocTich || 'Việt Nam' }, dem: (giu ? giu.dem : 0) + 1 });
            lamMoiNen();
          } else { dongNganKeo(); lamMoi(); }
        }).catch(function (err) {
          dangLuu = false;
          if (!$('#fKhach')) return;
          // Đưa lỗi máy chủ về đúng ô nếu nhận ra
          var m = err.message || '', o = /giấy tờ|CCCD|hộ chiếu/i.test(m) ? 'SoCCCD_Pass' : /hình thức/i.test(m) ? 'LoaiKhaiBao' : /điện thoại/i.test(m) ? 'SoDienThoai' : /cơ sở/i.test(m) ? 'MaCoSo' : /họ tên/i.test(m) ? 'HoTen' : '';
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
        if (r.DuLieuThu === true) {
          goi('giaHan', { ids: ds.map(function (x) { return x.ID; }), ngay: kq.v }).then(function (kqs) {
            toast((kqs.length > 1 ? kqs.length + ' người phòng ' + r.SoPhong : kqs[0].HoTen) + ' được gia hạn đến ' + vn(kq.v));
            sauXuLyKhach();
          });
          return;
        }
        // Lạc quan: đổi ngày ngay, gửi máy chủ ngầm; lỗi thì hoàn tác
        var gocGH = ds.map(function (x) { return Object.assign({}, x); });
        ds.forEach(function (x) { x.NgayDiDuKien = kq.v; x.TrangThai = tinhTrangThai(kq.v, x.NgayDiThucTe); });
        toast((ds.length > 1 ? ds.length + ' người phòng ' + r.SoPhong : r.HoTen) + ' được gia hạn đến ' + vn(kq.v));
        sauXuLyKhach();
        API.goi('giaHan', { ids: ds.map(function (x) { return x.ID; }), ngay: kq.v }).then(function (kqs) {
          if (kqs[0] && kqs[0].DuLieuThu !== true) { kqs.forEach(function (x) { vaKhach(x); }); sauKhiGhi('khach'); }
        }, function (er) { ds.forEach(function (x, i) { Object.assign(x, gocGH[i]); }); toast('Không lưu được gia hạn: ' + er.message + '. Đã hoàn tác.', 'loi'); lamMoiNen(); });
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
        if (r.DuLieuThu === true) {   // dữ liệu thử: giữ cách chờ máy chủ như cũ
          if (ds.length === 1) goi('xacNhanDi', { id: id, ngay: kq.v }).then(function (x) { xong([x]); });
          else goi('roiDiNhieu', { ids: ds.map(function (x) { return x.ID; }), ngay: kq.v }).then(xong);
          return;
        }
        // Lạc quan: hiện "đã rời đi" ngay, gửi máy chủ ngầm; lỗi thì hoàn tác và báo
        var goc = ds.map(function (x) { return Object.assign({}, x); });
        ds.forEach(function (x) { x.NgayDiThucTe = kq.v; x.TrangThai = 'Đã rời đi'; });
        toast((ds.length > 1 ? ds.length + ' người phòng ' + r.SoPhong : r.HoTen) + ' đã rời đi ngày ' + vn(kq.v));
        sauXuLyKhach();
        var guiDi = ds.length === 1 ? API.goi('xacNhanDi', { id: id, ngay: kq.v }).then(function (x) { return [x]; }) : API.goi('roiDiNhieu', { ids: ds.map(function (x) { return x.ID; }), ngay: kq.v });
        guiDi.then(function (kqs) { if (kqs[0] && kqs[0].DuLieuThu !== true) { kqs.forEach(function (x) { vaKhach(x); }); sauKhiGhi('khach'); } },
          function (er) { ds.forEach(function (x, i) { Object.assign(x, goc[i]); }); toast('Không lưu được xác nhận rời đi: ' + er.message + '. Đã hoàn tác.', 'loi'); lamMoiNen(); });
      });
    });
  }

  /**
   * Nhập nhân khẩu theo danh sách: phần chung (cơ sở, phòng, ngày, hình thức) + bảng nhiều người.
   * Lưu một lần qua themNhieuTamTru; có dòng sai thì máy chủ không ghi dòng nào và tô đỏ dòng đó.
   */
  var TOI_DA_DS = 50, soDongDS = 0;
  function dongNhapDS(x) {
    x = x || {}; var n = ++soDongDS;
    var gt = ['', 'Nam', 'Nữ', 'Khác'].map(function (g) { return '<option value="' + g + '"' + ((x.GioiTinh || '') === g ? ' selected' : '') + '>' + (g || 'Giới tính') + '</option>'; }).join('');
    var o = function (k, cls, them) { return '<input data-k="' + k + '" class="inp ' + (cls || '') + '" autocomplete="off" value="' + esc(x[k] || '') + '"' + (them || '') + '>'; };
    return '<div class="ds-dong relative grid grid-cols-6 gap-2 p-3 pt-2.5 rounded-xl border border-line sm:rounded-none sm:border-0 sm:border-b sm:p-0 sm:py-1.5 sm:items-start" data-dong>' +
      '<span data-stt class="col-span-6 sm:col-span-1 text-xs font-semibold text-muted sm:pt-3 sm:text-center"></span>' +
      '<div class="col-span-6 sm:col-span-1">' + o('HoTen', '', ' maxlength="100" placeholder="Họ và tên *" aria-label="Họ và tên"') + '</div>' +
      '<div class="col-span-3 sm:col-span-1">' + o('SoCCCD_Pass', 'tracking-wide tabular-nums', ' placeholder="Số CCCD / HC *" aria-label="Số CCCD hoặc hộ chiếu"') + '</div>' +
      '<div class="col-span-3 sm:col-span-1">' + o('SoDienThoai', 'tabular-nums', ' type="tel" inputmode="tel" maxlength="20" placeholder="Số điện thoại" aria-label="Số điện thoại (không bắt buộc)"') + '</div>' +
      '<div class="col-span-6 sm:col-span-1">' + oNgay('dsNS' + n, x.NgaySinh || '', { max: homNay(), nhan: 'Ngày sinh' }) + '</div>' +
      '<div class="col-span-2 sm:col-span-1"><select data-k="GioiTinh" class="inp px-2" aria-label="Giới tính">' + gt + '</select></div>' +
      '<div class="col-span-2 sm:col-span-1">' + o('DanToc', 'px-2', ' list="dlDanToc" maxlength="50" placeholder="Dân tộc" aria-label="Dân tộc (trống = Kinh)"') + '</div>' +
      '<div class="col-span-2 sm:col-span-1">' + o('QuocTich', 'px-2', ' placeholder="Quốc tịch" aria-label="Quốc tịch"') + '</div>' +
      '<div class="col-span-2 sm:col-span-1">' + o('SoPhong', 'px-2', ' placeholder="Phòng" aria-label="Phòng riêng (bỏ trống = phòng chung)"') + '</div>' +
      '<div class="col-span-6 sm:col-span-1 sm:order-none">' + o('NoiThuongTru', '', ' maxlength="300" placeholder="Nơi thường trú" aria-label="Nơi thường trú"') + '</div>' +
      '<button type="button" data-xoa-dong class="absolute top-1 right-1 sm:static grid place-items-center size-10 rounded-xl text-muted hover:bg-rose hover:text-rose-ink" aria-label="Xoá dòng">' + ic('x', 'size-4') + '</button>' +
      '<p data-loi-dong class="hidden col-span-6 sm:col-span-11 text-xs text-rose-ink sm:pl-9"></p></div>';
  }
  /** Tách 1 dòng dán (từ Excel, Zalo, hoặc chuỗi QR CCCD) thành các trường. */
  function tachDongDan(s) {
    var q = docQRCCCD(s); if (q) return q;
    var p = s.split(/\t|;|\|/).map(function (x) { return x.trim(); }).filter(String), x = {}, con = [];
    if (p.length < 2) p = s.split(/\s*,\s*/).filter(String);
    p.forEach(function (t) {
      var so = t.replace(/\s+/g, '');
      if (!x.SoCCCD_Pass && /^(\d{9}|\d{12}|[A-Za-z]\d{7,8})$/.test(so)) x.SoCCCD_Pass = so.toUpperCase();
      else if (!x.NgaySinh && docGo(t)) x.NgaySinh = docGo(t);
      else if (!x.NgaySinh && /^\d{4}$/.test(t) && +t > 1900) x.NgaySinh = '';
      else if (!x.GioiTinh && /^(nam|nữ|nu|khác)$/i.test(t)) x.GioiTinh = /^n(ữ|u)$/i.test(t) ? 'Nữ' : /^nam$/i.test(t) ? 'Nam' : 'Khác';
      else if (!/^\d{1,3}$/.test(t)) con.push(t);   // bỏ cột STT
    });
    if (con[0]) x.HoTen = con[0];
    if (con.length > 2 && /^(việt nam|vn|[a-z]{2,}\s?[a-z]*)$/i.test(con[1]) && con[1].length < 20) { x.QuocTich = con[1]; x.NoiThuongTru = con.slice(2).join(', '); }
    else if (con[1]) x.NoiThuongTru = con.slice(1).join(', ');
    return x;
  }
  function formNhapDS(maCoSoSan) {
    napCoSo().then(function (cs) {
      var can = maCoSoSan;
      if (can && !cs.some(function (c) { return c.MaCoSo === can; })) {
        return goi('layCoSo', { ma: can }).then(function (c) { if (c.DuLieuThu === true) c.TenCoSo = c.TenCoSo + ' (DỮ LIỆU THỬ)'; return cs.concat([c]); });
      }
      return cs;
    }).then(function (cs) {
      var dangHD = cs.filter(function (c) { return c.TrangThaiHoatDong !== 'Dừng hoạt động'; });
      var moTaCS = function (c) { return c ? [tenLoaiHinh(c), c.NguoiQuanLy, c.DiaChi, c.CSKV ? 'CSKV ' + c.CSKV : ''].filter(Boolean).join(' · ') : ''; };
      var csSan = dangHD.filter(function (c) { return c.MaCoSo === maCoSoSan; })[0];
      var loaiChon = csSan && csSan.LoaiHinh !== 'KT2 đến' ? csSan.LoaiHinh : '';
      soDongDS = 0;
      moNganKeo(dauNganKeo('Khai báo nhiều người', 'Nhiều người cùng cơ sở, ngày đến. Tối đa ' + TOI_DA_DS + ' người mỗi lần.') +
        '<form id="fDS" class="flex-1 overflow-y-auto px-4 sm:px-6 py-4 flex flex-col gap-4" novalidate>' +
        '<fieldset class="grid grid-cols-2 sm:grid-cols-4 gap-3"><legend class="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Thông tin chung cho cả danh sách</legend>' +
        '<div class="col-span-2 sm:col-span-4"><label class="lbl" for="NhomCoSo">Loại hình cơ sở</label><select id="NhomCoSo" name="NhomCoSo" class="inp"><option value="">Hộ KT2 đến (mặc định)</option>' + BON_LOAI.concat(loaiChon && BON_LOAI.indexOf(loaiChon) < 0 ? [loaiChon] : []).map(function (l) { return '<option' + (l === loaiChon ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></div>' +
        '<div id="oKT2" class="col-span-2 sm:col-span-4"><label class="lbl" for="KT2DiaChi">Địa chỉ nơi ở của hộ KT2 đến *</label><input id="KT2DiaChi" name="KT2DiaChi" class="inp" maxlength="300" value="' + esc((laHoKT2(csSan) ? csSan.DiaChi : '')) + '"><p class="text-xs text-muted">Cùng địa chỉ được gộp vào một hộ.</p>' + oLoi('KT2DiaChi') + '</div>' +
        ('<div id="oDiaBanMoi" class="col-span-2 sm:col-span-4"><label class="lbl" for="ToDanPhoMoi">Tổ dân phố (khi tạo mới)</label><input id="ToDanPhoMoi" class="inp" inputmode="numeric" value="' + esc((csSan && csSan.ToDanPho) || '') + '">' + (laAdmin() ? '<label class="lbl" for="CSKVMoi">CSKV phụ trách (khi tạo mới)</label><input id="CSKVMoi" class="inp" value="' + esc((csSan && csSan.CSKV) || '') + '">' : '') + '</div>') +
        '<div id="oCoSoChon" class="col-span-2 sm:col-span-4"><span class="lbl">Cơ sở *</span><div id="csBoChon">' + oChonCoSo(dangHD, maCoSoSan || '') + '</div>' +
        '<p id="csGoiY" class="text-xs text-muted mt-1.5">' + (csSan ? esc(moTaCS(csSan)) : dangHD.length + ' cơ sở đang hoạt động') + '</p>' + oLoi('MaCoSo') +
        (duocDangKy() ? '<button type="button" id="csMoiNut" class="text-xs text-brand-600 hover:underline mt-1.5">+ Cơ sở chưa có trong danh sách? Thêm cơ sở mới</button>' +
          '<div id="csMoi" class="hidden mt-2 rounded-xl border border-line bg-canvas/60 p-3 grid gap-2">' +
          '<b class="text-sm">Thêm cơ sở mới</b>' +
          '<input id="csMoiTen" class="inp" maxlength="150" placeholder="Tên cơ sở (vd: Nhà trọ Hoa Mai)">' +
          '<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">' + BON_LOAI.map(function (l) {
            return '<label><input type="radio" name="csMoiLoai" value="' + l + '" class="peer sr-only"><span class="flex h-9 items-center justify-center rounded-xl border border-line bg-white text-[13px] cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand peer-checked:text-brand-600">' + l + '</span></label>';
          }).join('') + '</div>' +
          '<input id="csMoiDC" class="inp" maxlength="300" placeholder="Địa chỉ cụ thể: số nhà, ngõ/ngách, đường">' +
          '<p id="csMoiLoi" class="hidden text-xs text-rose-ink"></p>' +
          '<div class="flex justify-end gap-2"><button type="button" id="csMoiHuy" class="btn-ghost btn-sm">Huỷ</button><button type="button" id="csMoiLuu" class="btn-primary btn-sm">Lưu cơ sở</button></div></div>' : '') +
        '</div>' +
        '<div id="oSoPhong"><label class="lbl" for="SoPhong">Phòng chung</label><input id="SoPhong" name="SoPhong" class="inp"></div>' +
        '<div><label class="lbl" for="NgayDen_g">Ngày đến *</label>' + oNgay('NgayDen', homNay(), { nhan: 'Ngày đến' }) + '</div>' +
        '<div class="col-span-2"><label class="lbl" for="NgayDiDuKien_g">Ngày đi dự kiến</label>' + oNgay('NgayDiDuKien', '', { nhan: 'Ngày đi dự kiến' }) + '</div>' +
        '</fieldset>' +
        '<section><div class="flex items-center gap-2 mb-2"><h3 class="text-xs font-semibold uppercase tracking-wide text-muted">Danh sách người</h3><span id="dsDem" class="badge bg-brand-50 text-brand-600"></span></div>' +
        '<div class="grid grid-cols-2 sm:flex gap-2 mb-3">' +
        '<button type="button" id="dsQR" class="btn-soft">' + ic('qr', 'size-5') + 'Quét QR CCCD</button>' +
        '<button type="button" id="dsDanMo" class="btn-soft">' + ic('clip', 'size-5') + 'Dán từ Excel/Zalo</button>' +
        '<button type="button" id="dsFile" class="btn-soft">' + ic('plus', 'size-5') + 'Nhập file Excel</button>' +
        '<button type="button" id="dsMau" class="btn-soft">' + ic('down', 'size-5') + 'Tải mẫu Excel</button>' +
        '<input type="file" id="dsFileO" accept=".xlsx,.xls,.csv" class="hidden"></div>' +
        '<p class="text-xs text-muted -mt-1 mb-3">Có danh sách sẵn? Bấm <b>Tải mẫu Excel</b>, điền rồi bấm <b>Nhập file Excel</b>. Tệp chỉ được đọc ngay trên máy này, không gửi lên máy chủ.</p>' +
        '<div id="dsDan" class="hidden mb-3 rounded-xl border border-line bg-canvas/60 p-3">' +
        '<p class="text-xs text-muted mb-2">Mỗi người một dòng. Các cột cách nhau bằng Tab (dán từ Excel), dấu <b>;</b> hoặc <b>|</b>. Tự nhận ra họ tên, số CCCD, ngày sinh, giới tính, nơi thường trú; cũng nhận chuỗi đọc từ mã QR CCCD.</p>' +
        '<textarea id="dsDanO" rows="4" class="inp h-auto py-2 font-mono text-[13px]" placeholder="Nguyễn Văn A&#9;0010xxxxxxxx&#9;01/02/1990&#9;Nam&#9;Hà Nội"></textarea>' +
        '<div class="flex justify-end gap-2 mt-2"><button type="button" id="dsDanHuy" class="btn-ghost btn-sm">Huỷ</button><button type="button" id="dsDanOK" class="btn-primary btn-sm">Thêm vào bảng</button></div></div>' +
        '<div class="hidden sm:grid ds-cot gap-2 px-0 pb-1.5 border-b border-line text-[11px] font-semibold uppercase tracking-wide text-muted">' +
        '<span class="text-center">#</span><span>Họ và tên *</span><span>Số CCCD / HC *</span><span>Số điện thoại</span><span>Ngày sinh</span><span>Giới tính</span><span>Dân tộc</span><span>Quốc tịch</span><span>Phòng</span><span>Nơi thường trú</span><span></span></div>' +
        '<div id="dsBang" class="flex flex-col gap-2 sm:gap-0"></div>' + dsDanToc +
        '<button type="button" id="dsThem" class="btn-ghost w-full mt-2 border border-dashed border-line">' + ic('plus') + 'Thêm dòng</button>' +
        '<p class="text-xs text-muted mt-3">Số điện thoại không bắt buộc. Để trống Dân tộc = Kinh; để trống Quốc tịch = Việt Nam; để trống Phòng = phòng chung. Dòng trống sẽ được bỏ qua. Hệ thống không lưu ảnh giấy tờ.</p></section>' +
        '<p id="fLoi" class="hidden text-sm bg-rose text-rose-ink rounded-xl px-3 py-2"></p>' +
        '</form><footer class="flex gap-2 px-4 sm:px-6 py-3 border-t border-line"><button data-close class="btn-ghost">Huỷ</button><span class="flex-1"></span>' +
        '<button id="dsLuu" type="button" class="btn-primary min-w-32">Lưu danh sách</button></footer>');
      $('#drawer').classList.add('drawer-rong');

      var f = $('#fDS'), bang = $('#dsBang');
      var cacDong = function () { return $$('[data-dong]', bang); };
      var danhSo = function () {
        var ds = cacDong();
        ds.forEach(function (d, i) { d.querySelector('[data-stt]').textContent = (window.innerWidth < 640 ? 'Người ' : '') + (i + 1); });
        var coND = ds.filter(function (d) { return !dongTrong(d); }).length;
        $('#dsDem').textContent = coND + ' người';
        $('#dsThem').disabled = ds.length >= TOI_DA_DS;
        $('#dsLuu').textContent = coND ? 'Lưu ' + coND + ' người' : 'Lưu danh sách';
      };
      var docDong = function (d) {
        var x = {};
        $$('[data-k]', d).forEach(function (o) { x[o.dataset.k] = o.value.trim(); });
        x.NgaySinh = d.querySelector('[data-o-ngay] input[type=hidden]').value;
        x._goNgay = d.querySelector('[data-o-ngay] input[type=text]').value.trim();
        return x;
      };
      var dongTrong = function (d) { var x = docDong(d); return !['HoTen', 'SoCCCD_Pass', 'SoDienThoai', '_goNgay', 'NoiThuongTru', 'GioiTinh', 'DanToc', 'QuocTich', 'SoPhong'].some(function (k) { return x[k]; }); };
      var themDong = function (x, tuDong) {
        // Điền vào dòng trống cuối cùng (nếu có) thay vì thêm dòng mới
        var trongCuoi = cacDong().filter(dongTrong)[0];
        if (x && trongCuoi) trongCuoi.remove();
        if (cacDong().length >= TOI_DA_DS) { toast('Mỗi lần nhập tối đa ' + TOI_DA_DS + ' người.'); return null; }
        bang.insertAdjacentHTML('beforeend', dongNhapDS(x));
        var d = bang.lastElementChild;
        if (x) d.classList.add('bg-mint/40');
        danhSo();
        var phong=d.querySelector('[data-k=SoPhong]'); if (phong) { phong.disabled=BON_LOAI.indexOf(f.NhomCoSo.value)<0; phong.classList.toggle('invisible',phong.disabled); }
        if (!tuDong && !x) d.querySelector('[data-k=HoTen]').focus();
        return d;
      };
      var baoLoiDong = function (d, msg) {
        var p = d.querySelector('[data-loi-dong]'); p.textContent = msg || ''; p.classList.toggle('hidden', !msg);
        d.classList.toggle('bg-rose/40', !!msg);
      };
      for (var i = 0; i < 3; i++) themDong(null, true);

      var doiLoaiDS = function (giuMa) {
        var loai=f.NhomCoSo.value, ma=giuMa ? f.MaCoSo.value : '';
        $('#oKT2').classList.toggle('hidden',!!loai); $('#oCoSoChon').classList.toggle('hidden',!loai);
        $('#oSoPhong').classList.toggle('hidden',BON_LOAI.indexOf(loai)<0);
        $$('[data-k=SoPhong]',bang).forEach(function (e) { e.disabled=BON_LOAI.indexOf(loai)<0; e.classList.toggle('invisible',e.disabled); });
        var ds=dangHD.filter(function(c){return c.LoaiHinh===loai;});
        $('#csBoChon').innerHTML=oChonCoSo(ds,ma);
        ganChonCoSo(ds,function(c){$('#csGoiY').textContent=c ? moTaCS(c) : 'Chọn cơ sở';if(c)loiO(f,'MaCoSo','');});
        $$('[name=csMoiLoai]',f).forEach(function(e){e.checked=e.value===loai;});
      };
      f.NhomCoSo.addEventListener('change',function(){doiLoaiDS(false);}); doiLoaiDS(true);
      // Thêm nhanh cơ sở mới ngay trong form nhập theo danh sách
      if ($('#csMoiNut')) {
        var moCSMoiDS = function (mo) { $('#csMoi').classList.toggle('hidden', !mo); $('#csMoiNut').classList.toggle('hidden', mo); if (mo) $('#csMoiTen').focus(); };
        $('#csMoiNut').addEventListener('click', function () { moCSMoiDS(true); });
        $('#csMoiHuy').addEventListener('click', function () { moCSMoiDS(false); });
        $('#csMoi').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('#csMoiLuu').click(); } });
        $('#csMoiLuu').addEventListener('click', function () {
          var ten = $('#csMoiTen').value.trim(), dc = $('#csMoiDC').value.trim(), lh = f.querySelector('[name=csMoiLoai]:checked');
          var loi = !ten ? 'Chưa nhập tên cơ sở.' : !lh ? 'Chưa chọn loại hình.' : !dc ? 'Chưa nhập địa chỉ cơ sở.' : '';
          $('#csMoiLoi').textContent = loi; $('#csMoiLoi').classList.toggle('hidden', !loi);
          if (loi) return;
          var nut = $('#csMoiLuu'); nut.disabled = true; nut.textContent = 'Đang lưu…';
          API.goi('themCoSo', { TenCoSo: ten, LoaiHinh: lh.value, DiaChi: dc, ToDanPho:$('#ToDanPhoMoi').value, CSKV:$('#CSKVMoi') ? $('#CSKVMoi').value : '' }).then(function (c) {
            if (c.DuLieuThu !== true) { vaCoSo(c); sauKhiGhi('coso'); }
            dangHD.push(c); f.NhomCoSo.value=c.LoaiHinh; doiLoaiDS(false);
            $('#MaCoSo').value = c.MaCoSo;
            if ($('#csTim')) $('#csTim').value = c.TenCoSo + ' – ' + c.DiaChi;
            else if ($('#csNut')) {
              $$('[name=csChon]').forEach(function (x) { x.checked = false; });
              $('#csNut').insertAdjacentHTML('beforeend', '<label><input type="radio" name="csChon" value="' + esc(c.MaCoSo) + '" class="peer sr-only" checked><span class="flex flex-col px-3 py-2 rounded-xl border border-line text-sm cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand"><b class="font-medium">' + esc(c.TenCoSo) + '</b><span class="text-xs text-muted">' + esc(c.DiaChi) + '</span></span></label>');
              var r2 = $('#csNut').lastElementChild.querySelector('input');
              r2.addEventListener('change', function () { $('#MaCoSo').value = r2.value; $('#csGoiY').textContent = moTaCS(c); });
            }
            $('#csGoiY').textContent = moTaCS(c); loiO(f, 'MaCoSo', '');
            $('#csMoiTen').value = ''; $('#csMoiDC').value = ''; lh.checked = false; moCSMoiDS(false);
            toast('Đã thêm cơ sở ' + c.MaCoSo + ' – ' + c.TenCoSo);
          }).catch(function (err) { $('#csMoiLoi').textContent = err.message; $('#csMoiLoi').classList.remove('hidden'); })
            .then(function () { nut.disabled = false; nut.textContent = 'Lưu cơ sở'; });
        });
      }
      f.addEventListener('change', function (e) { if (e.target.name === 'LoaiKhaiBao') loiO(f, 'LoaiKhaiBao', ''); });
      f.addEventListener('input', function (e) { var d = e.target.closest('[data-dong]'); if (d) { baoLoiDong(d, ''); d.classList.remove('bg-mint/40'); danhSo(); } });
      bang.addEventListener('click', function (e) {
        var b = e.target.closest('[data-xoa-dong]'); if (!b) return;
        b.closest('[data-dong]').remove(); if (!cacDong().length) themDong(null, true); danhSo();
      });
      // Enter ở ô cuối của dòng cuối: thêm dòng mới
      bang.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
        e.preventDefault();
        var d = e.target.closest('[data-dong]');
        if (d === bang.lastElementChild) themDong(); else d.nextElementSibling.querySelector('[data-k=HoTen]').focus();
      });
      $('#dsThem').addEventListener('click', function () { themDong(); });
      $('#dsQR').addEventListener('click', function () {
        moQuetQR(function (q) {
          var trung = cacDong().some(function (d) { return docDong(d).SoCCCD_Pass === q.SoCCCD_Pass; });
          if (trung) { toast('Số CCCD ' + q.SoCCCD_Pass + ' đã có trong bảng.'); return; }
          if (laChuCoSo()) API.goi('kiemTraTrungCCCD',{SoCCCD_Pass:q.SoCCCD_Pass}).then(function(r){if(r.trung)toast(r.thongDiep,'canh');}).catch(function(){toast('Chưa kiểm tra được trùng CCCD; hệ thống sẽ kiểm tra lại khi gửi.','canh');});
          if (themDong(q)) toast('Đã thêm ' + q.HoTen + '. Quét tiếp người khác bằng nút “Quét QR CCCD”.');
        });
      });
      var moDan = function (mo) { $('#dsDan').classList.toggle('hidden', !mo); if (mo) $('#dsDanO').focus(); };
      $('#dsDanMo').addEventListener('click', function () { moDan($('#dsDan').classList.contains('hidden')); });
      $('#dsDanHuy').addEventListener('click', function () { $('#dsDanO').value = ''; moDan(false); });
      $('#dsDanOK').addEventListener('click', function () {
        var dong = $('#dsDanO').value.normalize('NFC').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(String), them = 0, bo = 0;
        dong.forEach(function (s) {
          var x = tachDongDan(s);
          if (!x.HoTen && !x.SoCCCD_Pass) { bo++; return; }
          if (/^(họ\s*(và)?\s*tên|stt)/i.test(x.HoTen || '') && !x.SoCCCD_Pass) { bo++; return; }   // dòng tiêu đề
          if (themDong(x)) them++;
        });
        $('#dsDanO').value = ''; moDan(false);
        toast('Đã thêm ' + them + ' dòng vào bảng' + (bo ? ', bỏ qua ' + bo + ' dòng không đọc được' : '') + '. Kiểm tra lại trước khi lưu.');
      });
      // Nhập từ tệp Excel (mẫu "Mau_khai_bao_danh_sach.xlsx" hoặc bảng có cùng tên cột): đọc ngay trên trình duyệt
      $('#dsMau').addEventListener('click', function () { taiMauKhaiBao(); });
      $('#dsFile').addEventListener('click', function () { $('#dsFileO').click(); });
      $('#dsFileO').addEventListener('change', function () {
        var file = this.files && this.files[0]; this.value = '';
        if (!file) return;
        if (file.size > 3 * 1024 * 1024) { toast('Tệp quá lớn (tối đa 3 MB).', 'loi'); return; }
        var nut = $('#dsFile'), chu = nut.innerHTML; nut.disabled = true; nut.textContent = 'Đang đọc…';
        var xong = function () { nut.disabled = false; nut.innerHTML = chu; };
        Promise.all([napThuVien('XLSX'), file.arrayBuffer()]).then(function (kq) {
          var r = docExcelDS(kq[0], kq[1]);
          if (r.loi) { toast(r.loi, 'loi'); return; }
          var coSan = cacDong().filter(function (d) { return !dongTrong(d); }).length, chua = Math.max(TOI_DA_DS - coSan, 0), them = 0;
          r.ds.slice(0, chua).forEach(function (x) { if (themDong(x, true)) them++; });
          var cauChu = 'Đã nạp ' + them + ' người từ “' + file.name + '”.';
          if (r.ds.length > chua) cauChu += ' Còn ' + (r.ds.length - chua) + ' người chưa nạp (mỗi lần tối đa ' + TOI_DA_DS + '): lưu danh sách này rồi nhập tiếp phần còn lại.';
          if (r.canh.length) cauChu += ' Lưu ý: ' + r.canh.slice(0, 3).join('; ') + (r.canh.length > 3 ? '; …' : '') + '.';
          toast(cauChu + ' Kiểm tra lại các dòng tô xanh trước khi lưu.', r.canh.length || r.ds.length > chua ? 'canh' : undefined);
        }).catch(function (e) { toast('Không đọc được tệp: ' + (e.message || e), 'loi'); }).then(xong, xong);
      });

      var dangLuu = false, kt2DaLuu='';
      $('#dsLuu').addEventListener('click', function () {
        if (dangLuu) return;
        $('#fLoi').classList.add('hidden');
        // Bỏ dòng trống trước khi kiểm tra để số thứ tự khớp với báo lỗi của máy chủ
        cacDong().filter(dongTrong).forEach(function (d) { if (cacDong().length > 1) d.remove(); });
        danhSo();
        var chung = { MaCoSo: f.MaCoSo.value, SoPhong: f.SoPhong.value.trim(), NgayDen: f.NgayDen.value, NgayDiDuKien: f.NgayDiDuKien.value };
        chung.DaKhaiBao=false; chung.LoaiKhaiBao='';
        if (BON_LOAI.indexOf(f.NhomCoSo.value)<0) chung.SoPhong='';
        var loiChung = kiemNgay(f.querySelector('fieldset'));
        if (!loiChung && !chung.NgayDen) { loiNgay(document.querySelector('[data-o-ngay=NgayDen]'), 'Chưa nhập ngày đến.'); loiChung = 'x'; }
        if (!loiChung && chung.NgayDiDuKien && chung.NgayDiDuKien < chung.NgayDen) { loiNgay(document.querySelector('[data-o-ngay=NgayDiDuKien]'), 'Ngày đi dự kiến trước ngày đến.'); loiChung = 'x'; }
        if (f.NhomCoSo.value) loiO(f,'MaCoSo',chung.MaCoSo ? '' : 'Chọn cơ sở.');
        else loiO(f,'KT2DiaChi',f.KT2DiaChi.value.trim() ? '' : 'Nhập địa chỉ nơi ở.');
        if ((f.NhomCoSo.value ? !chung.MaCoSo : !f.KT2DiaChi.value.trim()) || loiChung) return;
        var ds = [], dongs = cacDong().filter(function (d) { return !dongTrong(d); }), coLoi = null, daGap = {};
        dongs.forEach(function (d, i) {
          var x = docDong(d), msg = '';
          if (!x.HoTen) msg = 'Chưa nhập họ tên.';
          else if (loiSoGiayTo(x.SoCCCD_Pass)) msg = loiSoGiayTo(x.SoCCCD_Pass);
          else if (loiSDT(x.SoDienThoai)) msg = loiSDT(x.SoDienThoai);
          else if (x._goNgay && !x.NgaySinh) msg = 'Ngày sinh chưa đúng (dd/mm/yyyy).';
          var so = String(x.SoCCCD_Pass).replace(/\s+/g, '').toUpperCase();
          if (!msg && daGap[so]) msg = 'Trùng số giấy tờ với dòng ' + daGap[so] + '.';
          daGap[so] = daGap[so] || i + 1;
          baoLoiDong(d, msg); if (msg && !coLoi) coLoi = d;
          delete x._goNgay; if (BON_LOAI.indexOf(f.NhomCoSo.value)<0) x.SoPhong=''; ds.push(x);
        });
        if (!ds.length) { var p0 = $('#fLoi'); p0.textContent = 'Danh sách chưa có người nào.'; p0.classList.remove('hidden'); return; }
        if (coLoi) { coLoi.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
        var khoaKT2=[f.KT2DiaChi.value.trim(),$('#ToDanPhoMoi').value,$('#CSKVMoi') ? $('#CSKVMoi').value : ''].join('|');
        if (!f.NhomCoSo.value && kt2DaLuu!==khoaKT2) {
          dangLuu=true; $('#dsLuu').disabled=true;
          API.goi('layHoKT2',{DiaChi:f.KT2DiaChi.value.trim(),ToDanPho:$('#ToDanPhoMoi').value,CSKV:$('#CSKVMoi') ? $('#CSKVMoi').value : ''}).then(function(c){
            kt2DaLuu=khoaKT2; f.MaCoSo.value=c.MaCoSo; sauKhiGhi('coso'); dangLuu=false; $('#dsLuu').disabled=false; $('#dsLuu').click();
          }).catch(function(e){dangLuu=false;$('#dsLuu').disabled=false;$('#fLoi').textContent=e.message;$('#fLoi').classList.remove('hidden');}); return;
        }
        var csDich = dangHD.filter(function (c) { return c.MaCoSo === chung.MaCoSo; })[0], laThu = !!(csDich && csDich.DuLieuThu === true);
        dangLuu = true; var nut = $('#dsLuu'), chu = nut.textContent; nut.disabled = true; nut.textContent = 'Đang lưu…';
        API.goi('themNhieuTamTru', { chung: chung, ds: ds }).then(function (kq) {
          dangLuu = false;
          if (kq.loi && kq.loi.length) {
            kq.loi.forEach(function (l) { if (dongs[l.dong - 1]) baoLoiDong(dongs[l.dong - 1], l.loi); });
            var p = $('#fLoi'); p.textContent = 'Chưa lưu người nào: ' + kq.loi.length + ' dòng cần sửa (tô đỏ).'; p.classList.remove('hidden');
            (dongs[kq.loi[0].dong - 1] || p).scrollIntoView({ block: 'center', behavior: 'smooth' });
            nut.disabled = false; nut.textContent = chu; return;
          }
          if (kq.choDuyet) { delete DEM.dsDeXuat; sauKhiGhi('khach'); toast('Đã gửi ' + kq.choDuyet + ' khai báo cho cán bộ phụ trách duyệt'); }
          else {
            if (!laThu) { kq.daThem.forEach(function (r) { vaKhach(r); }); sauKhiGhi('khach'); }
            toast('Đã đăng ký ' + kq.daThem.length + ' người' + (csDich ? ' tại ' + csDich.TenCoSo : ''));
          }
          dongNganKeo(); lamMoi();
        }).catch(function (err) {
          dangLuu = false;
          if (!$('#fDS')) return;
          var p = $('#fLoi'); p.textContent = err.message; p.classList.remove('hidden'); p.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          nut.disabled = false; nut.textContent = chu;
        });
      });
    });
  }

  function xoaKhach(id) {
    var kh = (layDem('dsTamTru') || []).filter(function (x) { return x.ID === id; })[0], ten = kh ? kh.HoTen : (($('#drawer h2') || {}).textContent || 'khách này');
    hoi('Xoá hồ sơ ' + ten + '?', 'Chỉ dùng khi nhập nhầm. Bản ghi sẽ bị xoá khỏi danh sách (nội dung vẫn lưu trong Lịch sử).', 'Xoá', true).then(function (ok) {
      if (!ok) return;
      if (!kh || kh.DuLieuThu === true) { goi('xoaTamTru', { id: id }).then(function () { vaKhach(null, id); sauKhiGhi('khach'); toast('Đã xoá hồ sơ ' + ten); dongNganKeo(); lamMoi(); }); return; }
      // Lạc quan: biến mất ngay, gửi máy chủ ngầm; lỗi thì đưa lại
      var bk = Object.assign({}, kh);
      vaKhach(null, id); toast('Đã xoá hồ sơ ' + ten); dongNganKeo(); lamMoi();
      API.goi('xoaTamTru', { id: id }).then(function () { sauKhiGhi('khach'); },
        function (er) { vaKhach(bk); toast('Không xoá được ' + ten + ': ' + er.message + '. Đã khôi phục.', 'loi'); lamMoiNen(); });
    });
  }

  // ================= CƠ SỞ LƯU TRÚ =================
  function napCoSo() {
    if (layDem('dsCoSo')) return Promise.resolve(layDem('dsCoSo'));
    return goi('dsCoSo', {}).then(function (ds) { datDem('dsCoSo', ds); return ds; });
  }

  function trangCoSo() {
    var v = $('#view');
    var kt2 = !!S.cheDoKT2;
    if (kt2) S.chonCS = null;
    v.innerHTML = (kt2 ? dauTrang('Hộ KT2 đến', 'Mỗi địa chỉ nơi ở là một hộ · không tính vào cơ sở lưu trú', duocGhi() && !laChuCoSo() ? '<button class="btn-primary" data-nhap-kt2>' + ic('plus') + 'Nhập Excel</button>' : '', nutCongCu('data-xuat-coso', 'down', 'Xuất Excel'))
      : dauTrang('Cơ sở', 'Nhà trọ, nhà nghỉ, nhà cho thuê, khách sạn trên địa bàn', duocGhi() ? '<button class="btn-primary" data-them-coso>' + ic('plus') + 'Thêm cơ sở</button>' : '',
      (duocGhi() ? nutCongCu('data-chon-nhieu aria-pressed="' + !!S.chonCS + '"', 'listcheck', 'Chọn nhiều') : '') + nutCongCu('data-xuat-coso', 'down', 'Xuất Excel'))) +
      '<div class="card px-3 sm:px-4 pt-3 mb-3"><div class="flex gap-2">' +
      '<label class="relative flex-1 min-w-0"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted">' + ic('search') + '</span><input id="cQ" type="search" class="inp pl-9" placeholder="' + (kt2 ? 'Tìm địa chỉ nơi ở, chủ hộ…' : 'Tìm tên, địa chỉ, chủ cơ sở, mã…') + '" value="' + esc(S.locCS.q) + '"></label>' +
      '<button type="button" class="sm:hidden relative grid place-items-center size-11 shrink-0 rounded-xl bg-brand-50 text-brand-600" data-mo-loc aria-label="Bộ lọc">' + ic('loc', 'size-5') +
      '<span id="cSoLoc" hidden class="absolute -top-1.5 -right-1.5 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-brand-600 text-white text-[11px] font-semibold"></span></button>' +
      '<div class="hidden sm:flex gap-2"><select id="cCSKV" class="inp sm:w-40"' + (S.phamVi && !S.phamVi.toanPhuong ? ' hidden' : '') + '></select><select id="cTDP" class="inp sm:w-32"></select></div></div>' +
      (kt2 ? '' : '<div id="cTabs" class="mt-2"></div><div id="cChips" class="flex gap-2 py-2.5 overflow-x-auto scroll-thin -mx-1 px-1"></div>') + '<div class="pb-2.5"></div></div>' +
      '<div id="cBS"></div><div id="cList">' + khungCho(3) + '</div><div id="cThanhChon"></div>';
    docNhanh('dsCoSo', 'dsCoSo', {}).then(function (ds) {
      if (!$('#cList')) return;   // đã chuyển sang trang khác
      var uniq = function (k) { var m = {}; ds.forEach(function (c) { if (c[k] !== '') m[c[k]] = 1; }); return Object.keys(m); };
      $('#cCSKV').innerHTML = '<option value="">Mọi CSKV</option>' + uniq('CSKV').sort(function (a, b) { return a.localeCompare(b, 'vi'); }).map(function (c) { return '<option' + (c === S.locCS.cskv ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
      $('#cTDP').innerHTML = '<option value="">Mọi tổ DP</option>' + uniq('ToDanPho').sort(function (a, b) { return a - b; }).map(function (c) { return '<option value="' + esc(c) + '"' + (String(c) === String(S.locCS.tdp) ? ' selected' : '') + '>Tổ ' + esc(c) + '</option>'; }).join('');
      veDsCoSo();
      if ($('#cBS') && !S.cheDoKT2) $('#cBS').innerHTML = theBoSung();
    }).catch(function () { if ($('#cList')) $('#cList').innerHTML = trong('Không tải được danh sách', 'Thử tải lại trang.'); });
    if (!kt2 && duocGhi()) docNhanh('dsDeXuatCB', 'dsDeXuat', { trangThai: '*' }).then(function (ds) {
      S.dxTheoCoSo = {};
      ds.filter(function (x) { return x.TrangThai === 'Chờ duyệt' && x.MaCoSo; }).forEach(function (x) { (S.dxTheoCoSo[x.MaCoSo] = S.dxTheoCoSo[x.MaCoSo] || []).push(x); });
      if ($('#cList')) veDsCoSo();
    }).catch(function () {});
    $('#cQ').addEventListener('input', debounce(function (e) { S.locCS.q = e.target.value; veDsCoSo(); }, 150));
    $('#cCSKV').addEventListener('change', function (e) { S.locCS.cskv = e.target.value; veDsCoSo(); });
    $('#cTDP').addEventListener('change', function (e) { S.locCS.tdp = e.target.value; veDsCoSo(); });
  }

  function veDsCoSo() {
    var q = boDau(S.locCS.q).trim(), L = S.locCS, kt2 = !!S.cheDoKT2;
    // Hộ KT2 đến và cơ sở lưu trú là hai danh sách riêng
    var nguon = S.coSo.filter(function (c) { return laHoKT2(c) === kt2; });
    var khop = function (c) { return !q || boDau([c.MaCoSo, c.TenCoSo, c.DiaChi, c.NguoiQuanLy, c.SoDienThoai, c.MaSoThue].join(' ')).indexOf(q) >= 0; };
    var ten = kt2 ? 'hộ' : 'cơ sở';
    if (kt2) {
      var dsK = S.coSoDangXem = nguon.filter(function (c) { return (!L.cskv || c.CSKV === L.cskv) && (!L.tdp || String(c.ToDanPho) === String(L.tdp)) && khop(c); });
      var soNguoi = dsK.reduce(function (s, c) { return s + (c.KhachDangO || 0); }, 0);
      if (!dsK.length) { $('#cList').innerHTML = '<div class="card px-6 py-10 text-center text-sm text-muted">Chưa có hộ KT2 đến nào' + (nguon.length ? ' phù hợp bộ lọc' : '') + '.' + (duocGhi() && !laChuCoSo() && !nguon.length ? ' Bấm “Nhập Excel” để thêm.' : '') + '</div>'; return; }
      var soLocK = ['cskv', 'tdp'].filter(function (k) { return L[k]; }).length;
      if ($('#cSoLoc')) { $('#cSoLoc').hidden = !soLocK; $('#cSoLoc').textContent = soLocK; }
      var tk = trangSo('coso', dsK, JSON.stringify([L, 'kt2']), 10);
      $('#cList').innerHTML = '<ul class="card divide-y divide-line overflow-hidden">' + tk.hien.map(dongCoSo).join('') + '</ul>' + nutTrang('coso', tk) +
        '<p class="text-xs text-muted mt-3 px-1">Hộ ' + soVN(tk.bd + 1) + '–' + soVN(tk.bd + tk.hien.length) + ' trong <b>' + soVN(dsK.length) + ' hộ</b> = <b>' + soVN(soNguoi) + ' người đang cư trú</b> · tổng ' + soVN(nguon.length) + ' hộ KT2 đến</p>';
      return;
    }
    var truocKT = nguon.filter(function (c) {
      if (L.cskv && c.CSKV !== L.cskv) return false;
      if (L.tdp && String(c.ToDanPho) !== String(L.tdp)) return false;
      if (L.loaiHinh && c.LoaiHinh !== L.loaiHinh) return false;
      return khop(c);
    });
    var soDa = truocKT.filter(function (c) { return c.DaKiemTraThang; }).length;
    var soChua = truocKT.filter(function (c) { return !c.DaKiemTraThang && c.TrangThaiHoatDong !== 'Dừng hoạt động'; }).length;
    if ($('#cTabs')) $('#cTabs').innerHTML = thanhTab('data-tab-kt', [['', 'Tất cả', truocKT.length], ['chua', 'Chưa KT', soChua], ['da', 'Đã KT', soDa]], L.kt || '');
    var theoLoc = nguon.filter(function (c) {
      if (L.cskv && c.CSKV !== L.cskv) return false;
      if (L.tdp && String(c.ToDanPho) !== String(L.tdp)) return false;
      if (L.kt === 'da' && !c.DaKiemTraThang) return false;
      if (L.kt === 'chua' && (c.DaKiemTraThang || c.TrangThaiHoatDong === 'Dừng hoạt động')) return false;
      return khop(c);
    });
    var dem = { '': theoLoc.length };
    theoLoc.forEach(function (c) { dem[c.LoaiHinh] = (dem[c.LoaiHinh] || 0) + 1; });
    var loai = [''].concat((S.dm ? S.dm.LoaiHinh : []).filter(function (l) { return dem[l]; }));
    $('#cChips').innerHTML = loai.map(function (l) {
      return '<button class="chip chip-nho shrink-0" data-loai="' + esc(l) + '" aria-pressed="' + (L.loaiHinh === l) + '">' + esc(l || 'Mọi loại hình') + '<span class="opacity-60">' + soVN(dem[l] || 0) + '</span></button>';
    }).join('');
    var ds = S.coSoDangXem = theoLoc.filter(function (c) { return !L.loaiHinh || c.LoaiHinh === L.loaiHinh; });
    if (!ds.length) { $('#cList').innerHTML = '<div class="card px-6 py-10 text-center text-sm text-muted">Không có cơ sở phù hợp bộ lọc.</div>'; return; }
    var soLoc = ['cskv', 'tdp', 'loaiHinh'].filter(function (k) { return L[k]; }).length;
    if ($('#cSoLoc')) { $('#cSoLoc').hidden = !soLoc; $('#cSoLoc').textContent = soLoc; }
    veThanhChon();
    var t = trangSo('coso', ds, JSON.stringify(S.locCS), 10);
    $('#cList').innerHTML = '<ul class="card divide-y divide-line overflow-hidden">' + t.hien.map(dongCoSo).join('') + '</ul>' + nutTrang('coso', t) +
      '<p class="text-xs text-muted mt-3 px-1">Cơ sở ' + soVN(t.bd + 1) + '–' + soVN(t.bd + t.hien.length) + ' trong ' + soVN(ds.length) + ' cơ sở phù hợp · tổng ' + soVN(nguon.length) + ' cơ sở · ' +
      soVN(ds.filter(function (c) { return c.DaKiemTraThang; }).length) + ' đã kiểm tra ' + thangVN(homNay()) + '</p>';
  }

  /** Thẻ cơ sở: (1) tên đầy đủ (xuống dòng nếu dài); (2) loại hình · trạng thái kiểm tra; (3) địa chỉ · tổ · CSKV · số người. Nút ⋯ mở thao tác nhanh. */
  function dongCoSo(c) {
    var dung = c.TrangThaiHoatDong === 'Dừng hoạt động';
    var chon = S.chonCS, daChon = chon && S.chonCS[c.MaCoSo];
    var dc = String(c.DiaChi || ''); if (dc.length > 36) dc = dc.slice(0, 35) + '…';
    var phu = '<span class="truncate">' + [dc, c.ToDanPho !== '' ? 'Tổ ' + c.ToDanPho : '', c.CSKV ? 'CSKV ' + c.CSKV : ''].filter(String).map(esc).join(' · ') + '</span>' +
      '<span class="shrink-0 whitespace-nowrap inline-flex items-center gap-0.5">· ' + ic('users', 'size-3.5') + soVN(c.KhachDangO) + '</span>' +
      (c.KhachQuaHan ? '<span class="shrink-0 whitespace-nowrap text-rose-ink">· ' + c.KhachQuaHan + ' quá hạn</span>' : '');
    var dx = (S.dxTheoCoSo && S.dxTheoCoSo[c.MaCoSo]) || [];
    var nhan = c._tam ? '<span class="badge bg-sky text-sky-ink">Đang lưu…</span>' : dung ? '<span class="badge bg-fog text-fog-ink">Dừng HĐ</span>' : laHoKT2(c) ? '' : nhanKiemTra(c);
    if (dx.length) nhan += '<span role="link" tabindex="0" data-cs-xu-ly="' + esc(dx[0].MaDeXuat) + '" class="badge bg-rose text-rose-ink hover:underline" title="Mở đúng đề xuất cần xử lý">' + soVN(dx.length) + ' cần xử lý</span>';
    var than = '<span class="min-w-0 flex-1"><b class="block text-sm font-semibold leading-snug break-words">' + esc(c.TenCoSo) + '</b>' +
      '<span class="flex flex-wrap items-center gap-1.5 mt-1"><span class="inline-flex shrink-0">' + badgeLoai(c.LoaiHinh, tenLoaiHinh(c)) + '</span><span class="shrink-0">' + nhan + '</span></span>' +
      '<span class="flex items-center gap-1 text-xs text-muted mt-1 min-w-0">' + phu + '</span></span>';
    if (chon) {
      var duocChon = !dung && !c.DaKiemTraThang && !c.ChoDuyetKT;
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
      chon('bl-loai', 'Loại hình cơ sở', 'Mọi loại hình', ((S.dm && S.dm.LoaiHinh) || []).map(function (x) { return [x, x]; }), L.loaiHinh),
      '<button type="button" class="btn-ghost h-11 flex-1" data-xoa-loc>Xoá lọc</button><button type="button" class="btn-primary h-11 flex-[2]" data-ap-dung-loc>Áp dụng</button>');
  }
  function apDungLocCoSo(xoa) {
    var g = function (id) { var o = $('#' + id); return o && !xoa ? o.value : ''; };
    S.locCS.cskv = g('bl-cskv'); S.locCS.tdp = g('bl-tdp'); S.locCS.loaiHinh = g('bl-loai');
    ['cCSKV', 'cTDP'].forEach(function (id, i) { var o = $('#' + id); if (o) o.value = [S.locCS.cskv, S.locCS.tdp][i] || ''; });
    dongBangDuoi(); veDsCoSo();
  }

  /** Thao tác nhanh với 1 cơ sở: đánh dấu kiểm tra, gọi cộng tác viên, xem chi tiết, đăng ký khách. */
  function moThaoTacCoSo(ma) {
    var c = (S.coSo || []).filter(function (x) { return x.MaCoSo === ma; })[0]; if (!c) return;
    var dung = c.TrangThaiHoatDong === 'Dừng hoạt động', ghi = duocGhiBanGhi(c);
    var muc = function (attr, icon, nhan, phu, tat, mau) {
      return '<li><' + (attr.indexOf('href=') === 0 ? 'a ' + attr : 'button type="button" ' + attr) + ' class="w-full flex items-center gap-3 px-3 py-3 min-h-14 rounded-xl text-left ' + (tat ? 'opacity-40 pointer-events-none' : 'hover:bg-canvas') + '">' +
        '<span class="grid place-items-center size-10 shrink-0 rounded-xl ' + (mau || 'bg-brand-50 text-brand-600') + '">' + ic(icon, 'size-5') + '</span>' +
        '<span class="min-w-0"><b class="block text-sm font-medium">' + nhan + '</b>' + (phu ? '<span class="block text-xs text-muted">' + phu + '</span>' : '') + '</span></' + (attr.indexOf('href=') === 0 ? 'a' : 'button') + '></li>';
    };
    moBangDuoi(esc(c.TenCoSo), '<p class="text-xs text-muted -mt-1 mb-2">' + esc(c.DiaChi) + '</p><ul class="flex flex-col gap-0.5 -mx-2">' +
      (ghi && !dung ? muc('data-tt-kt="' + esc(ma) + '"', 'check', c.DaKiemTraThang ? 'Bỏ tích đã kiểm tra ' + thangVN(homNay()) : c.ChoDuyetKT ? 'Huỷ đề nghị đã kiểm tra' : (laAdmin() ? 'Đánh dấu đã kiểm tra ' : 'Gửi đề nghị đã kiểm tra ') + thangVN(homNay()),
        c.DaKiemTraThang ? (c.NgayKiemTraThang ? 'Đã tích ngày ' + vn(c.NgayKiemTraThang) : 'Theo phiếu thống kê') : c.ChoDuyetKT ? 'Đang chờ Admin phê duyệt' : laAdmin() ? 'Ghi nhận ngày hôm nay ' + vn(homNay()) : 'Admin phê duyệt mới tính là đã kiểm tra', false, c.DaKiemTraThang ? 'bg-butter text-butter-ink' : c.ChoDuyetKT ? 'bg-sky text-sky-ink' : 'bg-mint text-mint-ink') : '') +
      muc(c.SoDienThoai ? 'href="tel:' + esc(String(c.SoDienThoai).replace(/[^0-9+]/g, '')) + '"' : 'disabled', 'phone', 'Gọi chủ cơ sở', c.SoDienThoai ? esc((c.NguoiQuanLy ? c.NguoiQuanLy + ' · ' : '') + c.SoDienThoai) : 'Chưa có số điện thoại', !c.SoDienThoai) +
      muc('data-tt-xem="' + esc(ma) + '"', 'building', 'Xem chi tiết', 'Thông tin cơ sở và khách đang ở') +
      (ghi && !dung ? muc('data-tt-khach="' + esc(ma) + '"', 'plus', 'Khai báo 1 người tại đây', '') + muc('data-tt-ds="' + esc(ma) + '"', 'users', 'Khai báo nhiều người', 'Nhiều người cùng lúc') : '') +
      (ghi ? muc('data-xoa-coso="' + esc(ma) + '"', 'trash', 'Xoá cơ sở', dung ? 'Cơ sở đã dừng hoạt động: xoá bất kỳ lúc nào (kèm hồ sơ công dân của cơ sở)' : 'Chỉ xoá được khi chưa có bản ghi tạm trú nào', false, 'bg-rose text-rose-ink') : '') + '</ul>');
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
      ds.slice(bd, bd + 10).forEach(function (c) { if (!c.DaKiemTraThang && !c.ChoDuyetKT && c.TrangThaiHoatDong !== 'Dừng hoạt động') S.chonCS[c.MaCoSo] = 1; });
      return veDsCoSo();
    }
    var mas = Object.keys(S.chonCS);
    var canAdmin = !laAdmin();   // cán bộ: chỉ gửi đề nghị, Admin phê duyệt
    hoi(canAdmin ? 'Gửi đề nghị đã kiểm tra?' : 'Đánh dấu đã kiểm tra?', canAdmin ? 'Gửi ' + mas.length + ' cơ sở đã kiểm tra ngày ' + vn(homNay()) + ' để Admin phê duyệt. Chỉ khi Admin duyệt mới tính là đã kiểm tra.' : 'Ghi nhận ' + mas.length + ' cơ sở đã được kiểm tra ngày ' + vn(homNay()) + '.', canAdmin ? 'Gửi đề nghị' : 'Đánh dấu').then(function (ok) {
      if (!ok) return;
      goi('kiemTraNhieu', { mas: mas }).then(function (kq) {
        kq.daGhi.concat(kq.deNghi || []).forEach(function (c) { if (c.DuLieuThu !== true) vaCoSo(c); });
        sauKhiGhi('coso'); delete DEM.dsDeXuatCB;
        toast((kq.deNghi && kq.deNghi.length ? 'Đã gửi đề nghị ' + kq.deNghi.length + ' cơ sở, chờ Admin duyệt' : 'Đã đánh dấu ' + kq.daGhi.length + ' cơ sở') + (kq.boQua.length ? ', bỏ qua ' + kq.boQua.length + ' cơ sở đã kiểm tra trước đó' : '') + '.');
        S.chonCS = null; veDsCoSo();
        var nut = $('[data-chon-nhieu]'); if (nut) nut.setAttribute('aria-pressed', 'false');
      });
    });
  }

  /** Chi tiết kiểm tra trong ngăn kéo cơ sở: ô tích "đã kiểm tra tháng này" (kèm ngày tích) + các lần trước. */
  function oKiemTraChiTiet(c) {
    var da = !!c.DaKiemTraThang, cho = !da && !!c.ChoDuyetKT, thang = homNay().slice(0, 7);
    var duoc = duocGhiBanGhi(c) && (da || cho || c.TrangThaiHoatDong !== 'Dừng hoạt động');
    var truoc = String(c.LichSuKiemTra || '').split(';').filter(function (x) { return /^\d{4}-\d{2}-\d{2}$/.test(x) && x.slice(0, 7) !== thang; }).sort().reverse().slice(0, 6);
    return '<label class="flex items-start gap-3 rounded-xl border px-3 py-2.5 ' + (da ? 'border-mint-ink/30 bg-mint/60' : cho ? 'border-sky-ink/30 bg-sky/60' : 'border-line bg-white') + (duoc ? ' cursor-pointer' : ' opacity-80') + '">' +
      '<input type="checkbox" class="mt-0.5 size-5 shrink-0 accent-[#1F6B4A]" data-kt-hop="' + esc(c.MaCoSo) + '"' + (da || cho ? ' checked' : '') + (duoc ? '' : ' disabled') + '>' +
      '<span class="min-w-0"><b class="block text-sm font-medium">Đã kiểm tra tháng ' + thangVN(homNay()) + '</b>' +
      '<span class="block text-xs ' + (da ? 'text-mint-ink' : cho ? 'text-sky-ink' : 'text-muted') + '">' + (da ? (c.NgayKiemTraThang ? 'Ngày tích: ' + vn(c.NgayKiemTraThang) : 'Theo phiếu thống kê 9/2026') : cho ? 'Đã gửi đề nghị, chờ Admin phê duyệt (bỏ tích để huỷ đề nghị)' : (duoc ? (laAdmin() ? 'Bấm để ghi nhận đã kiểm tra hôm nay' : 'Bấm để gửi đề nghị đã kiểm tra hôm nay (Admin phê duyệt)') : 'Chưa kiểm tra')) + '</span></span></label>' +
      (truoc.length ? '<span class="block text-xs text-muted mt-1.5">Các lần trước: ' + truoc.map(vn).join(', ') + '</span>' : '') +
      '<span class="block text-xs text-muted mt-0.5">Tự chuyển về “chưa kiểm tra” khi sang tháng mới.</span>';
  }
  /** Nhãn trạng thái kiểm tra tháng này trong danh sách cơ sở (không bấm được – tích ở chi tiết cơ sở). */
  function nhanKiemTra(c) {
    if (c.DaKiemTraThang) return '<span class="badge bg-mint text-mint-ink" title="Đã kiểm tra ' + thangVN(homNay()) + (c.NgayKiemTraThang ? ' – ngày ' + vn(c.NgayKiemTraThang) : ' (theo phiếu thống kê)') + '">' + ic('check', 'size-3.5') + 'Đã KT' + (c.NgayKiemTraThang ? ' ' + vn(c.NgayKiemTraThang).slice(0, 5) : '') + '</span>';
    if (c.ChoDuyetKT) return '<span class="badge bg-sky text-sky-ink" title="Đã gửi đề nghị kiểm tra ' + thangVN(homNay()) + ', chờ Admin phê duyệt">' + ic('clock', 'size-3.5') + 'Chờ Admin duyệt</span>';
    if (c.TrangThaiHoatDong === 'Dừng hoạt động') return '';
    return '<span class="badge bg-butter text-butter-ink" title="Chưa kiểm tra ' + thangVN(homNay()) + '">Chưa KT</span>';
  }
  var thangVN = function (iso) { var x = String(iso).split('-'); return (+x[1]) + '/' + x[0]; };

  /** Tích / bỏ tích kiểm tra tháng này cho cơ sở ma. */
  function kiemTraCoSo(ma, khiHuy, muonDa) {
    var c = (S.coSo || []).filter(function (x) { return x.MaCoSo === ma; })[0] || (S.coSoThu || []).filter(function (x) { return x.MaCoSo === ma; })[0];
    var da = muonDa !== undefined ? !muonDa : !!(c && (c.DaKiemTraThang || c.ChoDuyetKT));
    var chay = function () {
      // Lạc quan: Admin tích/bỏ tích; cán bộ gửi hoặc huỷ đề nghị đang chờ -> đổi ô tích ngay, hoàn tác nếu lỗi
      var goc = null, laDeNghi = !laAdmin();
      if (c && c.DuLieuThu !== true && (laAdmin() || !da || (c.ChoDuyetKT && !c.DaKiemTraThang))) {
        goc = Object.assign({}, c);
        if (laDeNghi) c.ChoDuyetKT = !da; else { c.DaKiemTraThang = !da; c.NgayKiemTraThang = !da ? homNay() : ''; c.ChoDuyetKT = false; }
        if ($('#cList')) veDsCoSo();
      }
      goi('kiemTraCoSo', { ma: ma, daKiemTra: !da }).then(function (kq) {
        if (kq.DuLieuThu !== true) { vaCoSo(kq); sauKhiGhi('coso'); delete DEM.dsDeXuatCB; }
        toast(kq.choDuyet || kq.ChoDuyetKT ? 'Đã gửi đề nghị kiểm tra ' + kq.TenCoSo + ', chờ Admin phê duyệt' : kq.DaKiemTraThang ? 'Đã ghi kiểm tra ' + kq.TenCoSo + ' ngày ' + vn(kq.NgayKiemTraThang) : (c && c.ChoDuyetKT ? 'Đã huỷ đề nghị kiểm tra ' : 'Đã bỏ tích kiểm tra ') + kq.TenCoSo);
        if ($('#cList')) veDsCoSo();
        if (!$('#drawerWrap').hidden && $('#drawer').dataset.ma === ma && $('#csKhach')) { if (kq.DuLieuThu === true) veCoSo(kq, null); xemCoSo(ma); }
      }, function () { if (goc) { Object.assign(c, goc); if ($('#cList')) veDsCoSo(); } if (khiHuy) khiHuy(); });
    };
    if (!da) return chay();
    if (c && c.ChoDuyetKT && !c.DaKiemTraThang) return chay();   // huỷ đề nghị đang chờ: không cần hỏi
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
    dkkd: ['Chưa ghi ĐKKD', 'bg-peach text-peach-ink', 'Chưa chọn có/không đăng ký kinh doanh, hoặc thiếu mã số thuế'],
    tt: ['Chưa tuyên truyền', 'bg-mint text-mint-ink', 'Chưa tích đã tuyên truyền, ký cam kết phòng chống tội phạm']
  };
  var chuanDC = function (s) { return boDau(s).replace(/[.,;]/g, ' ').replace(/\s+/g, ' ').trim(); };
  /** Cơ sở đang hoạt động còn thiếu thông tin: [{ c, loi: ['sdt'|'ten'|'diachi'|'phong'], trung: [mã cơ sở cùng địa chỉ] }] */
  function vanDeCoSo(ds) {
    var chung = ((S.dm && S.dm.LoaiHinh) || []).concat(['Phòng trọ', 'Khu trọ', 'Nhà', 'Cơ sở']).map(function (x) { return boDau(x).trim(); });
    var theoDC = {};
    ds.forEach(function (c) { var k = chuanDC(c.DiaChi); if (k) (theoDC[k] = theoDC[k] || []).push(c.MaCoSo); });
    return ds.filter(function (c) { return c.TrangThaiHoatDong !== 'Dừng hoạt động' && !laHoKT2(c); }).map(function (c) {
      var loi = [], trung = (theoDC[chuanDC(c.DiaChi)] || []).filter(function (m) { return m !== c.MaCoSo; });
      if (!String(c.SoDienThoai || '').trim()) loi.push('sdt');
      if (chung.indexOf(boDau(c.TenCoSo).trim()) >= 0) loi.push('ten');
      if (trung.length) loi.push('diachi');
      if (c.SoLuongPhong === '' || c.SoLuongPhong == null) loi.push('phong');
      if (!c.DangKyKinhDoanh || (c.DangKyKinhDoanh === 'Có' && !c.MaSoThue)) loi.push('dkkd');
      if (c.DaTuyenTruyen !== 'Có') loi.push('tt');
      return { c: c, loi: loi, trung: trung };
    }).filter(function (x) { return x.loi.length; });
  }
  /** Thẻ nhắc ở Tổng quan / trang Cơ sở (chỉ người được sửa). */
  function theBoSung() {
    if (!duocGhi() || !S.coSo) return '';
    var n = vanDeCoSo(S.coSo).length;
    if (!n) return '';
    return '<a href="#/bo-sung" class="card flex items-center gap-3 px-4 py-3 mb-3 lg:mb-6 hover:border-[#D6DAF5] transition"><span class="grid place-items-center size-9 shrink-0 rounded-xl bg-butter text-butter-ink">' + ic('alert') + '</span>' +
      '<span class="min-w-0 flex-1 text-sm"><b class="font-medium">' + soVN(n) + ' cơ sở cần bổ sung thông tin</b><span class="block text-xs text-muted">Số điện thoại, số phòng, đăng ký kinh doanh, tên chung chung, trùng địa chỉ</span></span>' + ic('chev', 'size-4 text-muted shrink-0') + '</a>';
  }

  function trangBoSung() {
    S.locBS = S.locBS || { loai: '', q: '' };
    $('#view').innerHTML = dauTrang('Bổ sung dữ liệu cơ sở', 'Cơ sở đang hoạt động còn thiếu thông tin hoặc cần kiểm tra lại. Bấm vào cơ sở để sửa.') +
      '<div class="card px-3 sm:px-4 pt-3 mb-3"><label class="relative block"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted">' + ic('search') + '</span><input id="bsQ" type="search" class="inp pl-9" placeholder="Tìm tên, địa chỉ, mã, cộng tác viên, CSKV…" value="' + esc(S.locBS.q) + '"></label>' +
      '<div id="bsTom" class="flex gap-2 py-2.5 overflow-x-auto scroll-thin -mx-1 px-1"></div><p id="bsMoTa" class="hidden text-xs text-muted pb-2.5 -mt-1"></p></div>' +
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
      return chipNho('data-bs-loai="' + l + '"', L.loai === l, esc(LOAI_VD[l][0]) + ' <b class="font-semibold">' + soVN(dem[l] || 0) + '</b>');
    }).join('');
    $('#bsMoTa').textContent = L.loai ? LOAI_VD[L.loai][2] : ''; $('#bsMoTa').classList.toggle('hidden', !L.loai);
    if (!vd.length) { $('#bsCSKV').innerHTML = ''; $('#bsList').innerHTML = trong('Dữ liệu cơ sở đã đầy đủ', 'Không còn cơ sở đang hoạt động nào thiếu thông tin.'); return; }
    // Admin: tiến độ theo CSKV (bấm để lọc)
    if (laAdmin()) {
      var theo = {};
      vd.forEach(function (x) { var k = x.c.CSKV || '(chưa gán)'; theo[k] = (theo[k] || 0) + 1; });
      var tong = {}; (S.coSo || []).forEach(function (c) { var k = c.CSKV || '(chưa gán)'; tong[k] = (tong[k] || 0) + 1; });
      $('#bsCSKV').innerHTML = '<details class="card mb-3"><summary class="px-4 py-3 min-h-12 cursor-pointer text-sm font-medium">Theo CSKV <span class="text-muted font-normal">(' + Object.keys(theo).length + ' CSKV còn cơ sở cần bổ sung)</span></summary>' +
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

  // Chi tiết cơ sở: hiện ngay từ danh sách đã tải (kèm nút Khai báo), danh sách khách tải bổ sung sau
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
    moNganKeo(dauNganKeo(esc(c.TenCoSo), esc(tenLoaiHinh(c))) +
      '<div class="flex-1 overflow-y-auto px-5 sm:px-6 py-5">' +
      (!laChuCoSo() && c.DuLieuThu !== true ? '<div class="flex justify-end -mt-1 mb-3"><button type="button" class="btn-soft btn-sm" data-xuat-bc-coso>' + ic('down', 'size-4') + 'Xuất Excel báo cáo cơ sở</button></div>' : '') +
      '<div id="csDem" class="grid grid-cols-3 gap-2 mb-4"></div>' +
      '<dl class="card px-4">' + dong('Địa chỉ', esc(c.DiaChi)) + dong('Người quản lý', esc(c.NguoiQuanLy)) + dong('Số điện thoại', c.SoDienThoai ? '<a class="text-brand-600" href="tel:' + esc(c.SoDienThoai) + '">' + esc(c.SoDienThoai) + '</a>' : '') +
      dong('Địa chỉ chủ cơ sở', esc(c.DiaChiNguoiQuanLy)) + dong('Số phòng', c.SoLuongPhong === '' ? '' : soVN(c.SoLuongPhong)) + dong('Nhân khẩu khai báo', c.SoNhanKhauKhaiBao === '' ? '' : soVN(c.SoNhanKhauKhaiBao) + ' <span class="text-xs text-muted">(theo phiếu thống kê' + (c.NgayKhaiBao ? ' ' + vn(c.NgayKhaiBao) : '') + ')</span>') +
      dong('Tổ dân phố', esc(c.ToDanPho)) + dong('CSKV', esc(c.CSKV)) +
      dong('Đăng ký kinh doanh', c.DangKyKinhDoanh === 'Có' ? 'Có' + (c.MaSoThue ? ' · MST <b class="font-medium tracking-wide">' + esc(c.MaSoThue) + '</b>' : ' <span class="text-xs text-rose-ink">(chưa ghi mã số thuế)</span>') : esc(c.DangKyKinhDoanh)) +
      dong('Tuyên truyền, ký cam kết', c.DaTuyenTruyen === 'Có' ? '<span class="text-mint-ink">Đã tuyên truyền, ký cam kết</span>' + (c.NgayKyCamKet ? ' · ' + vn(c.NgayKyCamKet) : '') : c.DaTuyenTruyen === 'Không' ? '<span class="text-rose-ink">Chưa tuyên truyền</span>' : '') +
      dong('Kiểm tra ' + thangVN(homNay()), oKiemTraChiTiet(c)) +
      dong('Hoạt động', esc(c.TrangThaiHoatDong)) + dong('Ghi chú', esc(c.GhiChu)) + (laAdmin() ? dong('Nguồn', '<span class="text-xs text-muted">' + esc(c.NguonDuLieu) + '</span>') : '') +
      (c.DuLieuThu === true ? dong('', '<span class="badge bg-mint text-mint-ink">Dữ liệu thử – không tính vào thống kê</span>') : '') + '</dl>' +
      '<div id="csKhach" class="mt-6"></div>' +
      '</div>' +
      (duocGhiBanGhi(c) ? '<footer class="flex items-center gap-2 px-4 sm:px-6 py-4 border-t border-line">' + '<button class="btn-danger px-3" data-xoa-coso="' + esc(c.MaCoSo) + '" title="Xoá">' + ic('trash') + '<span class="hidden sm:inline">Xoá</span></button>' +
        '<span class="flex-1"></span><button class="btn-soft" data-sua-coso="' + esc(c.MaCoSo) + '">' + ic('edit') + 'Sửa</button>' +
        (c.TrangThaiHoatDong !== 'Dừng hoạt động' ? '<button class="btn-primary" data-them-khach="' + esc(c.MaCoSo) + '">' + ic('plus') + 'Khai báo</button>' : '') + '</footer>' : ''));
    $('#drawer').dataset.ma = c.MaCoSo;
    var nutBC = $('[data-xuat-bc-coso]');
    if (nutBC) nutBC.addEventListener('click', function () { xuatVoiTrangThai(nutBC, function () { return xuatBaoCaoCoSo(c); }); });
    veKhachCoSo(c, khach);
  }

  /** khach = null: đang tải (hiện số đếm từ danh sách, khung chờ cho danh sách khách). */
  function veKhachCoSo(c, khach) {
    if (!$('#csDem')) return;
    var dangO = khach ? khach.filter(function (k) { return k.TrangThai !== 'Đã rời đi'; }) : null;
    $('#csDem').innerHTML = [['Đang ở', dangO ? dangO.length : c.KhachDangO, 'bg-mint text-mint-ink'], ['Sắp hết hạn', c.KhachSapHet, 'bg-butter text-butter-ink'], ['Quá hạn', c.KhachQuaHan, 'bg-rose text-rose-ink']].map(function (x) {
      return '<div class="rounded-xl p-3 ' + x[2] + '"><b class="text-xl leading-none">' + soVN(x[1]) + '</b> <span class="text-xs opacity-80">người</span><span class="block text-xs mt-1">' + x[0] + '</span></div>';
    }).join('');
    $('#csKhach').innerHTML = '<h3 class="font-semibold mb-3">Công dân đang lưu trú' + (dangO ? ' <span class="text-muted font-normal">(' + dangO.length + ' người)</span>' : '') + '</h3>' +
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

  function formCoSo(c, ganDuLieuThu, sauKhiSua) {
    var moi = !c; c = c || {};
    var dm = S.dm || { LoaiHinh: [] };
    var o = function (id, nhan, cls, attr) { return '<div class="' + (cls || '') + '"><label class="lbl" for="' + id + '">' + nhan + '</label><input id="' + id + '" name="' + id + '" class="inp" value="' + esc(c[id]) + '" ' + (attr || '') + '></div>'; };
    moNganKeo(dauNganKeo(moi ? (ganDuLieuThu ? 'Thêm cơ sở thử' : 'Thêm cơ sở lưu trú') : 'Sửa cơ sở', moi ? (ganDuLieuThu ? 'Dữ liệu thử – không tính vào thống kê thật' : 'Mã cơ sở được cấp tự động') : esc(c.TenCoSo)) +
      '<form id="fCS" class="flex-1 overflow-y-auto px-5 sm:px-6 py-5 grid grid-cols-2 gap-3 content-start" novalidate>' +
      (ganDuLieuThu ? '<div class="col-span-2 flex gap-2 items-start rounded-xl bg-mint text-mint-ink px-3 py-2 text-sm">' + ic('check', 'size-4 mt-0.5 shrink-0') + '<span>Cơ sở này chỉ dùng để thử nghiệm, sẽ không xuất hiện trong Tổng quan, Báo cáo hay danh sách cơ sở thật.</span></div>' : '') +
      o('TenCoSo', 'Tên cơ sở *', 'col-span-2', 'required autofocus') +
      '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="LoaiHinh">Loại hình *</label><select id="LoaiHinh" name="LoaiHinh" class="inp"><option value="">— Chọn —</option>' + dm.LoaiHinh.map(function (l) { return '<option' + (l === c.LoaiHinh ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></div>' +
      '<div id="oLoaiKhac" class="col-span-2' + (c.LoaiHinh === 'Khác' ? '' : ' hidden') + '">' + o('LoaiHinhKhac', 'Loại hình cụ thể *', '', 'maxlength="100" placeholder="Ví dụ: Ký túc xá, Homestay, Nhà văn hoá…"') + '</div>' +
      '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="TrangThaiHoatDong">Hoạt động</label><select id="TrangThaiHoatDong" name="TrangThaiHoatDong" class="inp"><option value="">(chưa ghi nhận)</option>' + (dm.TrangThaiHoatDong || []).map(function (l) { return '<option' + (l === c.TrangThaiHoatDong ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></div>' +
      o('DiaChi', 'Địa chỉ cơ sở *', 'col-span-2', 'required') +
      o('NguoiQuanLy', 'Họ tên chủ cơ sở', 'col-span-2 sm:col-span-1') + o('SoDienThoai', 'Số điện thoại chủ cơ sở', 'col-span-2 sm:col-span-1', 'inputmode="tel"') +
      o('DiaChiNguoiQuanLy', 'Địa chỉ thường trú của chủ cơ sở', 'col-span-2') +
      o('SoLuongPhong', 'Số lượng phòng', '', 'inputmode="numeric"') + o('SoNhanKhauKhaiBao', 'Nhân khẩu khai báo', '', 'inputmode="numeric"') +
      o('ToDanPho', 'Tổ dân phố', '', 'inputmode="numeric"') + (laAdmin() || laLanhDao() ? o('CSKV', 'CSKV phụ trách', '', 'list="dsCSKV"') : '<div><label class="lbl" for="CSKV">CSKV phụ trách</label><input id="CSKV" name="CSKV" class="inp bg-canvas text-muted" readonly value="' + esc(moi ? S.user.CSKV : c.CSKV) + '" title="Chỉ Admin được đổi CSKV"></div>') +
      '<datalist id="dsCSKV">' + (S.coSo || []).map(function (x) { return x.CSKV; }).filter(function (x, i, a) { return x && a.indexOf(x) === i; }).map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>' +
      '<div class="col-span-2"><span class="lbl">Đăng ký kinh doanh</span><div class="grid grid-cols-2 gap-2">' + ['Có', 'Không'].map(function (v) {
        return '<label><input type="radio" name="DangKyKinhDoanh" value="' + v + '" class="peer sr-only"' + (c.DangKyKinhDoanh === v ? ' checked' : '') + '><span class="flex h-10 items-center justify-center rounded-xl border border-line text-sm cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand peer-checked:text-brand-600">' + (v === 'Có' ? 'Có đăng ký kinh doanh' : 'Không đăng ký') + '</span></label>';
      }).join('') + '</div></div>' +
      '<div id="oMST" class="col-span-2' + (c.DangKyKinhDoanh === 'Có' ? '' : ' hidden') + '"><label class="lbl" for="MaSoThue">Mã số thuế</label><input id="MaSoThue" name="MaSoThue" class="inp tracking-wide" inputmode="numeric" maxlength="14" placeholder="10 chữ số (chi nhánh: 0101234567-001)" value="' + esc(c.MaSoThue) + '"></div>' +
      '<div class="col-span-2"><span class="lbl">Tuyên truyền, ký cam kết</span><div class="grid grid-cols-2 gap-2">' + ['Có', 'Không'].map(function (v) {
        return '<label><input type="radio" name="DaTuyenTruyen" value="' + v + '" class="peer sr-only"' + (c.DaTuyenTruyen === v ? ' checked' : '') + '><span class="flex h-10 items-center justify-center rounded-xl border border-line text-sm cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand peer-checked:text-brand-600">' + (v === 'Có' ? 'Đã tuyên truyền, ký cam kết' : 'Chưa tuyên truyền') + '</span></label>';
      }).join('') + '</div></div>' +
      '<div id="oNgayTT" class="col-span-2 sm:col-span-1' + (c.DaTuyenTruyen === 'Có' ? '' : ' hidden') + '"><label class="lbl" for="NgayKyCamKet_g">Ngày ký cam kết</label>' + oNgay('NgayKyCamKet', c.NgayKyCamKet, { max: homNay(), nhan: 'Ngày ký cam kết' }) + '</div>' +
      '<div class="col-span-2"><label class="lbl" for="GhiChuCS">Ghi chú</label><textarea id="GhiChuCS" name="GhiChu" rows="2" class="inp h-auto py-2">' + esc(c.GhiChu) + '</textarea></div>' +
      '<p id="fLoi" class="col-span-2 hidden text-sm bg-rose text-rose-ink rounded-xl px-3 py-2"></p></form>' +
      '<footer class="flex gap-2 px-5 sm:px-6 py-4 border-t border-line"><button type="button" ' + (sauKhiSua ? 'id="csVeDuyet"' : 'data-close') + ' class="btn-ghost">' + (sauKhiSua ? 'Quay lại duyệt' : 'Huỷ') + '</button><span class="flex-1"></span><button id="fLuu" form="fCS" class="btn-primary min-w-28">' + (moi ? 'Thêm' : 'Lưu thay đổi') + '</button></footer>');
    var f = $('#fCS');
    f.addEventListener('change', function (e) {
      if (e.target.name === 'DangKyKinhDoanh') $('#oMST').classList.toggle('hidden', e.target.value !== 'Có');
      if (e.target.name === 'DaTuyenTruyen') $('#oNgayTT').classList.toggle('hidden', e.target.value !== 'Có');
      if (e.target.name === 'LoaiHinh') { $('#oLoaiKhac').classList.toggle('hidden', e.target.value !== 'Khác'); if (e.target.value === 'Khác') $('#LoaiHinhKhac').focus(); }
    });
    if (sauKhiSua) $('#csVeDuyet').addEventListener('click', sauKhiSua);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = {};
      ['TenCoSo', 'LoaiHinh', 'LoaiHinhKhac', 'TrangThaiHoatDong', 'DiaChi', 'NguoiQuanLy', 'SoDienThoai', 'DiaChiNguoiQuanLy', 'SoLuongPhong', 'SoNhanKhauKhaiBao', 'ToDanPho', 'CSKV', 'GhiChu'].forEach(function (k) { d[k] = f[k].value.trim(); });
      var dk = f.querySelector('[name=DangKyKinhDoanh]:checked'); d.DangKyKinhDoanh = dk ? dk.value : '';
      d.MaSoThue = d.DangKyKinhDoanh === 'Có' ? f.MaSoThue.value.replace(/\s+/g, '') : '';
      if (d.MaSoThue && !/^\d{10}(-?\d{3})?$/.test(d.MaSoThue)) { $('#fLoi').textContent = 'Mã số thuế gồm 10 chữ số (chi nhánh: 10 số, dấu -, 3 số).'; $('#fLoi').classList.remove('hidden'); return; }
      var tt = f.querySelector('[name=DaTuyenTruyen]:checked'); d.DaTuyenTruyen = tt ? tt.value : '';
      var loiNgayTT = kiemNgay(f);
      if (loiNgayTT) { $('#fLoi').textContent = loiNgayTT; $('#fLoi').classList.remove('hidden'); return; }
      d.NgayKyCamKet = d.DaTuyenTruyen === 'Có' ? f.NgayKyCamKet.value : '';
      if (d.LoaiHinh !== 'Khác') d.LoaiHinhKhac = '';
      var loi = !d.TenCoSo ? 'Chưa nhập tên cơ sở.' : !d.LoaiHinh ? 'Chưa chọn loại hình.' : (d.LoaiHinh === 'Khác' && !d.LoaiHinhKhac && c.LoaiHinh !== 'Khác') ? 'Chọn “Khác” thì cần ghi rõ loại hình cụ thể.' : !d.DiaChi ? 'Chưa nhập địa chỉ.' : '';
      if (loi) { $('#fLoi').textContent = loi; $('#fLoi').classList.remove('hidden'); return; }
      if (!moi) { d.ma = c.MaCoSo; d._phienBan = c.NgayCapNhat; }
      if (moi && ganDuLieuThu) d.duLieuThu = true;
      var nut = $('#fLuu'); nut.disabled = true;
      if (moi && !ganDuLieuThu) {
        // Lạc quan: dòng cơ sở "Đang lưu…" hiện ngay, máy chủ lưu ngầm; lỗi thì bỏ dòng tạm và báo
        var tamCS = Object.assign({}, d, { MaCoSo: 'TAM-' + Date.now(), KhachDangO: 0, KhachSapHet: 0, KhachQuaHan: 0, _tam: true });
        vaCoSo(tamCS); dongNganKeo(); toast('Đang lưu cơ sở ' + d.TenCoSo + '…'); lamMoi();
        API.goi('themCoSo', d).then(function (kq) {
          vaCoSo(null, tamCS.MaCoSo);
          if (kq.DuLieuThu !== true) { vaCoSo(kq); sauKhiGhi('coso'); }
          toast('Đã thêm ' + kq.TenCoSo); lamMoiNen();
        }, function (err) { vaCoSo(null, tamCS.MaCoSo); lamMoiNen(); toast('Không lưu được cơ sở ' + d.TenCoSo + ': ' + (err.message || err) + '. Hãy thêm lại.', 'loi'); });
        return;
      }
      API.goi(moi ? 'themCoSo' : 'suaCoSo', d).then(function (kq) {
        if (kq.DuLieuThu !== true) { vaCoSo(kq); sauKhiGhi('coso'); }
        if (sauKhiSua) { toast('Đã lưu thông tin cơ sở. Tiếp tục duyệt khai báo.'); sauKhiSua(); return; }
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
            '<button type="button" class="btn-soft btn-sm w-full" data-them-kh-thu="' + esc(c.MaCoSo) + '">' + ic('plus') + 'Khai báo thử</button></div>';
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
      var mauQ = { Admin: 'bg-lilac text-lilac-ink', CanBo: 'bg-sky text-sky-ink', Xem: 'bg-fog text-fog-ink', LanhDao: 'bg-mint text-mint-ink', ChuCoSo: 'bg-peach text-peach-ink' };
      var mauT = { 'Hoạt động': 'bg-mint text-mint-ink', 'Chưa kích hoạt': 'bg-butter text-butter-ink', 'Chờ duyệt': 'bg-sky text-sky-ink', 'Từ chối': 'bg-rose text-rose-ink', 'Khoá': 'bg-rose text-rose-ink' };
      var choDuyet = ds.filter(function (x) { return x.TrangThai === 'Chờ duyệt'; });
      S.soChoDuyet = laAdmin() ? choDuyet.length : 0; veNav();
      ds = ds.filter(function (x) { return x.TrangThai !== 'Chờ duyệt' && x.Quyen !== 'ChuCoSo'; });   // cộng tác viên do cán bộ quản lý ở mục Cộng tác viên
      $('#cbList').innerHTML = (laAdmin() && choDuyet.length ? '<section class="mb-5"><h2 class="font-semibold mb-3">Yêu cầu truy cập chờ duyệt <span class="text-muted font-normal">(' + choDuyet.length + ')</span></h2><div class="grid md:grid-cols-2 gap-3">' +
        choDuyet.map(function (x) {
          return '<article class="card p-4 border-sky"><div class="flex items-start gap-3"><span class="grid place-items-center size-10 rounded-full bg-sky text-sky-ink shrink-0">' + ic('user', 'size-5') + '</span>' +
            '<div class="min-w-0 flex-1"><b class="block truncate">' + esc(x.HoTen) + '</b><span class="block text-xs text-muted truncate">' + esc(x.Email) + '</span>' +
            '<span class="block text-xs text-muted mt-1">' + (x.CSKV ? 'Khai CSKV: <b class="text-ink">' + esc(x.CSKV) + '</b> · ' : '') + 'gửi ' + vnTG(x.NgayTao) + '</span>' +
            (x.GhiChu ? '<span class="block text-xs text-muted mt-1 break-words">' + esc(x.GhiChu) + '</span>' : '') + '</div></div>' +
            '<div class="flex gap-2 mt-3 pt-3 border-t border-line"><button class="btn-danger btn-sm" data-tuchoi-cb="' + esc(x.MaCanBo) + '">Từ chối</button><span class="flex-1"></span><button class="btn-primary btn-sm" data-duyet-cb="' + esc(x.MaCanBo) + '">' + ic('check') + 'Xem & duyệt</button></div></article>';
        }).join('') + '</div></section>' : '') +
        (chua ? '<div class="flex gap-2 items-start rounded-2xl bg-butter text-butter-ink px-4 py-3 text-sm mb-4">' + ic('alert', 'size-4 mt-0.5 shrink-0') + '<span>' + chua + ' cán bộ chưa có email nên chưa đăng nhập được. Gửi lời mời ở mục <b>Triển khai tới CSKV</b> bên dưới để họ tự đăng nhập và gửi yêu cầu.</span></div>' : '') +
        '<ul class="card divide-y divide-line overflow-hidden">' +
        ds.map(function (x) {
          var ten = x.HoTen || (x.CSKV ? 'CSKV ' + x.CSKV : '(chưa có họ tên)');
          var diaBan = x.ToPhuTrach ? 'Tổ ' + x.ToPhuTrach.split(';').join(', ') : (x.CSKV ? 'CSKV ' + x.CSKV : '');
          var phu = [x.HoTen && diaBan ? diaBan : '', x.Email || 'chưa có email', x.PhuongXa || ''].filter(Boolean).join(' · ');
          return '<li class="flex items-center gap-2 pl-4 pr-2 py-2.5 min-h-14"><div class="min-w-0 flex-1"><div class="flex items-center gap-1.5 flex-wrap"><b class="text-sm font-medium truncate">' + esc(ten) + '</b>' +
            '<span class="badge ' + (mauQ[x.Quyen] || '') + '">' + esc(x.Quyen) + '</span>' + (x.TrangThai !== 'Hoạt động' ? '<span class="badge ' + (mauT[x.TrangThai] || 'bg-fog text-fog-ink') + '">' + esc(x.TrangThai) + '</span>' : '') + '</div>' +
            '<p class="text-xs text-muted truncate mt-0.5">' + esc(phu) + '</p></div>' +
            (laAdmin() ? '<button type="button" class="grid place-items-center size-11 sm:size-9 shrink-0 rounded-xl text-muted hover:bg-canvas" data-sua-cb="' + esc(x.MaCanBo) + '" aria-label="Sửa ' + esc(ten) + '" title="Sửa">' + ic('edit', 'size-5 sm:size-4') + '</button>' : '') + '</li>';
        }).join('') + '</ul><div id="tkCSKV" class="mt-4 lg:mt-6"></div>';
      dsCB = ds.concat(choDuyet);
      if (laAdmin()) veTrienKhai(ds.concat(choDuyet));
    });
  }

  // ---------- Triển khai tới CSKV: ai đã dùng, ai chưa, sao chép lời mời ----------
  function veTrienKhai(dsCanBo) {
    // Dùng số liệu tổng hợp sẵn của Tổng quan (theo CSKV) thay vì tải toàn bộ danh sách công dân chỉ để đếm — nhanh hơn nhiều
    Promise.all([napCoSo(), layDem('tongQuan') ? Promise.resolve(layDem('tongQuan')) : API.goi('tongQuan', {}).then(function (d) { datDem('tongQuan', d); return d; })]).then(function (kq) {
      var el = $('#tkCSKV'); if (!el) return;
      var coSo = kq[0], tq = kq[1], vd = vanDeCoSo(coSo), m = {};
      var lay = function (ten) { var k = boDau(ten).trim(); if (!m[k]) m[k] = { ten: ten, coSo: 0, khach: 0, boSung: 0, cb: null }; return m[k]; };
      coSo.forEach(function (c) { if (c.CSKV) lay(c.CSKV).coSo++; });
      var theoK = ((tq.coSo || {}).theoCSKV) || {}; Object.keys(theoK).forEach(function (k) { if (k !== '(trống)') lay(k).khach = theoK[k].khachDangO || 0; });
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
        if (x.cb.TrangThai === 'Hoạt động') return '<span class="badge bg-mint text-mint-ink">Đang dùng</span>';
        return '<span class="badge bg-fog text-fog-ink">' + esc(x.cb.TrangThai) + '</span>';
      };
      el.innerHTML = '<section class="card overflow-hidden">' + dauMuc('Triển khai tới CSKV', daDung + '/' + ds.length + ' CSKV đang dùng hệ thống. Sao chép lời mời rồi tự gửi qua Zalo, tin nhắn hoặc email.',
          '<button type="button" class="shrink-0 -my-1 btn-soft btn-sm" data-sao-loi-moi="">' + ic('clip') + '<span class="hidden sm:inline">Lời mời chung</span><span class="sm:hidden">Chung</span></button>') +
        '<ul>' + ds.map(function (x) {
          var dung = x.cb && x.cb.TrangThai === 'Hoạt động';
          return '<li class="flex items-center gap-2 pl-4 sm:pl-5 pr-2 py-2.5 min-h-14 border-t border-line"><div class="min-w-0 flex-1"><div class="flex items-center gap-1.5 flex-wrap"><b class="text-sm font-medium">' + esc(x.ten) + '</b>' + tt(x) + '</div>' +
            '<p class="text-xs text-muted truncate mt-0.5">' + soVN(x.coSo) + ' cơ sở · ' + soVN(x.khach) + ' người đang lưu trú' + (x.boSung ? ' · <span class="text-butter-ink">' + soVN(x.boSung) + ' cần bổ sung</span>' : '') + '</p></div>' +
            (dung ? '' : '<button type="button" class="grid place-items-center size-11 sm:size-9 shrink-0 rounded-xl bg-brand-50 text-brand-600" data-sao-loi-moi="' + esc(x.ten) + '" title="Sao chép lời mời cho CSKV ' + esc(x.ten) + '" aria-label="Sao chép lời mời cho CSKV ' + esc(x.ten) + '">' + ic('clip', 'size-5 sm:size-4') + '</button>') + '</li>';
        }).join('') + '</ul></section>';
      S.trienKhai = m;
    }).catch(function () { if ($('#tkCSKV')) $('#tkCSKV').innerHTML = '<p class="text-sm text-rose-ink">Không tải được số liệu triển khai.</p>'; });
  }

  function saoLoiMoi(cskv) {
    var url = location.origin + location.pathname;
    var x = cskv && S.trienKhai ? S.trienKhai[boDau(cskv).trim()] : null;
    var txt = 'Chào ' + (cskv ? 'đồng chí CSKV ' + cskv : 'các đồng chí') + ',\n' +
      'Phường đang dùng Ứng dụng khai báo cư trú tại cơ sở lưu trú để ghi nhận cư trú' + (x ? ' (địa bàn ' + cskv + ' có ' + x.coSo + ' cơ sở)' : '') + '.\n' +
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
    napCoSo().then(function (cs) { veFormDuyet(x, cs.filter(function (c) { return c.TrangThaiHoatDong !== 'Dừng hoạt động'; })); });
  }
  function veFormDuyet(x, dsCs) {
    var canBoPT = dsCB.filter(function (c) { return c.TrangThai === 'Hoạt động' && c.Email && (c.Quyen === 'CanBo' || c.Quyen === 'Admin'); });
    var trongCho = dsCB.filter(function (c) { return c.TrangThai === 'Chưa kích hoạt' && !c.Email; });
    var khop = trongCho.filter(function (c) { return x.CSKV && boDau(c.CSKV) === boDau(x.CSKV); })[0];
    moNganKeo(dauNganKeo('Duyệt yêu cầu truy cập', esc(x.MaCanBo) + ' · gửi ' + vnTG(x.NgayTao)) +
      '<form id="fDuyet" class="flex-1 overflow-y-auto px-5 sm:px-6 py-5 flex flex-col gap-4" novalidate>' +
      '<dl class="card px-4 text-sm">' +
      [['Email Google', '<b class="font-medium">' + esc(x.Email) + '</b>'], ['CSKV tự khai', esc(x.CSKV) || '—'], ['Ghi chú', esc(x.GhiChu) || '—']].map(function (d) {
        return '<div class="flex gap-4 py-2.5 border-b border-line last:border-0"><dt class="w-28 shrink-0 text-muted text-[13px]">' + d[0] + '</dt><dd class="min-w-0 break-words">' + d[1] + '</dd></div>';
      }).join('') + '</dl>' +
      '<div><label class="lbl" for="dHoTen">Họ và tên</label><input id="dHoTen" name="HoTen" class="inp" maxlength="100" value="' + esc(x.HoTen) + '"><p class="text-xs text-muted mt-1.5">Người gửi tự khai, có thể sửa cho đúng trước khi duyệt.</p></div>' +
      '<div><span class="lbl">Cấp quyền *</span><div class="grid grid-cols-2 sm:grid-cols-5 gap-2">' + [['Xem', 'Chỉ xem'], ['CanBo', 'Cán bộ'], ['ChuCoSo', 'Cộng tác viên'], ['LanhDao', 'Lãnh đạo'], ['Admin', 'Quản trị']].map(function (q) {
        return '<label><input type="radio" name="Quyen" value="' + q[0] + '" class="peer sr-only"' + (q[0] === 'CanBo' ? ' checked' : '') + '><span class="flex h-10 items-center justify-center rounded-xl border border-line text-sm cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand peer-checked:text-brand-600">' + q[1] + '</span></label>';
      }).join('') + '</div><p class="text-xs text-muted mt-1.5">Cán bộ: đăng ký, sửa khách và cơ sở · Cộng tác viên: chủ cơ sở tự đăng ký khách, gửi đề xuất cho cán bộ · Chỉ xem: không sửa được · Quản trị: toàn quyền, duyệt người khác.</p>' +
      '<label id="xnAdmin" class="hidden mt-2 flex gap-2 items-start text-sm bg-rose text-rose-ink rounded-xl px-3 py-2"><input type="checkbox" name="xacNhanAdmin" class="mt-0.5"> Tôi xác nhận cấp toàn quyền quản trị cho tài khoản này.</label></div>' +
      '<div id="vungCT" class="hidden flex flex-col gap-4"><div><label class="lbl" for="dPT">Cán bộ phụ trách</label><select id="dPT" name="NguoiPhuTrach" class="inp"><option value="">— Chưa gán —</option>' +
      canBoPT.map(function (c) { return '<option value="' + esc(c.Email) + '">' + esc(c.HoTen + (c.CSKV ? ' · CSKV ' + c.CSKV : '') + ' · ' + c.Email) + '</option>'; }).join('') +
      '</select><p class="text-xs text-muted mt-1.5">Cán bộ này sẽ duyệt đề xuất của cộng tác viên. Có thể để trống và gán sau.</p></div>' +
      '<div><span class="lbl">Cơ sở được quản lý <span class="text-muted font-normal">(không bắt buộc)</span> <span id="dDem" class="text-muted font-normal"></span></span><label class="relative block mb-2"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted">' + ic('search') + '</span><input id="dTim" type="search" class="inp h-10 pl-9 text-sm" placeholder="Tìm cơ sở…" autocomplete="off"></label>' +
      '<div id="dCs" class="max-h-60 overflow-y-auto card divide-y divide-line">' + dsCs.map(function (c) {
        return '<label class="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-canvas/60" data-ten="' + esc(boDau([c.TenCoSo, c.DiaChi, c.MaCoSo].join(' '))) + '"><input type="checkbox" class="mt-0.5 size-5 shrink-0 accent-[#6C7BF2]" value="' + esc(c.MaCoSo) + '"><span class="min-w-0"><b class="block text-sm font-medium truncate">' + esc(c.TenCoSo) + '</b><span class="block text-xs text-muted truncate">' + esc(c.DiaChi) + '</span></span></label>';
      }).join('') + '</div></div></div>' +
      '<div id="vungGop"><label class="lbl" for="gopVao">Gắn vào dòng CSKV có sẵn</label><select id="gopVao" name="gopVao" class="inp"><option value="">— Không gắn, tạo cán bộ mới —</option>' +
      trongCho.map(function (c) { return '<option value="' + esc(c.MaCanBo) + '"' + (khop && khop.MaCanBo === c.MaCanBo ? ' selected' : '') + '>' + esc(c.MaCanBo + ' · CSKV ' + (c.CSKV || '?')) + '</option>'; }).join('') +
      '</select><p class="text-xs text-muted mt-1.5">' + (khop ? 'Đã tự chọn dòng có tên CSKV trùng với tên người gửi khai. Kiểm tra lại cho đúng người.' : 'Chọn nếu người này là một CSKV đã có sẵn trong danh sách (chưa có email).') + '</p></div>' +
      '<p id="fLoi" class="hidden text-sm bg-rose text-rose-ink rounded-xl px-3 py-2"></p></form>' +
      '<footer class="flex gap-2 px-5 sm:px-6 py-4 border-t border-line"><button class="btn-danger" data-tuchoi-cb="' + esc(x.MaCanBo) + '">Từ chối</button><span class="flex-1"></span><button id="fLuu" form="fDuyet" class="btn-primary min-w-28">' + ic('check') + 'Duyệt</button></footer>');
    var f = $('#fDuyet');
    var doiQuyen = function () {
      var q = f.Quyen.value;
      $('#xnAdmin').classList.toggle('hidden', q !== 'Admin');
      $('#vungCT').classList.toggle('hidden', q !== 'ChuCoSo');
      $('#vungGop').classList.toggle('hidden', q === 'ChuCoSo');
    };
    $$('[name=Quyen]', f).forEach(function (r) { r.addEventListener('change', doiQuyen); });
    doiQuyen();
    var demCs = function () { $('#dDem').textContent = '(đã chọn ' + $$('#dCs input:checked').length + ')'; };
    demCs(); $('#dCs').addEventListener('change', demCs);
    $('#dTim').addEventListener('input', debounce(function (e) { var q = boDau(e.target.value).trim(); $$('#dCs [data-ten]').forEach(function (l) { l.hidden = !!q && l.dataset.ten.indexOf(q) < 0; }); }, 120));
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = { ma: x.MaCanBo, Quyen: f.Quyen.value, HoTen: f.HoTen.value.trim(), gopVao: f.gopVao.value, xacNhanAdmin: f.xacNhanAdmin.checked };
      if (!d.HoTen) { $('#fLoi').textContent = 'Họ tên không được để trống.'; $('#fLoi').classList.remove('hidden'); return; }
      if (d.Quyen === 'ChuCoSo') { d.gopVao = ''; d.NguoiPhuTrach = f.NguoiPhuTrach.value; d.CoSoQuanLy = $$('#dCs input:checked').map(function (i) { return i.value; }); }
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
      '<div class="col-span-2"><label class="lbl" for="ToPhuTrach">Tổ phụ trách <span class="font-normal text-muted normal-case">(để trống nếu phân theo CSKV ở trên)</span></label><input id="ToPhuTrach" name="ToPhuTrach" class="inp tracking-wide" inputmode="numeric" placeholder="Các số Tổ cách nhau bằng dấu ; — vd: 1;2;5" value="' + esc(x.ToPhuTrach) + '"></div>' +
      '<p class="col-span-2 -mt-2 text-xs text-muted">Một cán bộ có thể phụ trách nhiều Tổ. Khi đã điền, địa bàn của cán bộ sẽ tính theo các Tổ này thay vì theo CSKV.</p>' +
      sel('Quyen', dm.Quyen.filter(function (q) { return q !== 'ChuCoSo' || x.Quyen === 'ChuCoSo'; }), 'Quyền') + sel('TrangThai', dm.TrangThaiCanBo, 'Trạng thái') +
      '<div class="col-span-2"><label class="lbl" for="GhiChuCB">Ghi chú</label><input id="GhiChuCB" name="GhiChu" class="inp" value="' + esc(x.GhiChu) + '"></div>' +
      '<p class="col-span-2 text-xs text-muted">Admin: toàn quyền, quản lý cán bộ, xoá bản ghi · CanBo: đăng ký, sửa khách và cơ sở · Xem: chỉ xem.</p>' +
      '<p id="fLoi" class="col-span-2 hidden text-sm bg-rose text-rose-ink rounded-xl px-3 py-2"></p></form>' +
      '<footer class="flex gap-2 px-5 sm:px-6 py-4 border-t border-line">' + (!moi ? '<button class="btn-danger" data-xoa-cb="' + esc(x.MaCanBo) + '">' + ic('trash') + '</button>' : '') + '<button data-close class="btn-ghost">Huỷ</button><span class="flex-1"></span><button id="fLuu" form="fCB" class="btn-primary min-w-28">Lưu</button></footer>');
    var f = $('#fCB');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = {};
      ['HoTen', 'Email', 'CSKV', 'PhuongXa', 'ToPhuTrach', 'Quyen', 'TrangThai', 'GhiChu'].forEach(function (k) { d[k] = f[k].value.trim(); });
      if (d.ToPhuTrach && !/^\d+(\s*;\s*\d+)*$/.test(d.ToPhuTrach)) { $('#fLoi').textContent = 'Tổ phụ trách chỉ gồm số, cách nhau bằng dấu ";" (vd: 1;2;5).'; $('#fLoi').classList.remove('hidden'); return; }
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
      '<details id="csDuLieu" class="group card mb-3 text-sm overflow-hidden"><summary class="flex items-center gap-3 px-4 sm:px-5 py-3 min-h-14 cursor-pointer list-none"><span class="grid place-items-center size-9 shrink-0 rounded-xl bg-mint text-mint-ink">' + ic('shield', 'size-5') + '</span><span class="min-w-0 flex-1"><b class="block font-semibold">Chính sách dữ liệu</b><span id="csTomTat" class="block text-xs text-muted truncate">Đang tải…</span></span>' + ic('chev', 'size-4 text-muted transition group-open:rotate-90') + '</summary><div id="csND" class="px-4 sm:px-5 pb-4"></div></details>' +
      '<section class="card mb-3 lg:mb-5 overflow-hidden">' + dauMuc('Sao lưu', 'Tự động 1 giờ sáng mỗi ngày · giữ 30 bản trong Drive “TamTru – Sao lưu”', '<button id="btnSaoLuu" class="shrink-0 -my-1 btn-soft btn-sm">' + ic('check') + 'Sao lưu ngay</button>') + '<div id="slList" class="px-4 sm:px-5 pb-3 text-sm text-muted">Đang tải danh sách…</div></section>' +
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
      $('#csTomTat').textContent = 'Ẩn danh sau ' + p.soNgayLuu + ' ngày rời đi · đã ẩn ' + soVN(p.daAnDanh) + ' · 30 ngày tới ' + soVN(p.sapAnDanh30Ngay);
      $('#csND').innerHTML = '<ul class="list-disc pl-5 text-muted flex flex-col gap-1">' +
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
      var tenBang = { DanhSachTamTru: 'Công dân', CoSoLuuTru: 'Cơ sở', CanBoQuanLy: 'Cán bộ' };
      $('#lsList').innerHTML = ds.length ? '<ol class="card divide-y divide-line">' + ds.map(function (x) {
        var nd = x.HanhDong === 'Xoá' ? 'Nội dung bản ghi đã lưu' : String(x.NoiDung || '').replace(/:\s*TT-\d+(,\s*TT-\d+)*/g, '');
        return '<li class="px-4 py-3 flex gap-3"><span class="badge shrink-0 ' + (mau[x.HanhDong] || 'bg-fog text-fog-ink') + '">' + esc(x.HanhDong) + '</span><div class="min-w-0 flex-1 text-sm"><b class="font-medium">' + esc((tenBang[x.Bang] || x.Bang) + (x.Bang === 'DanhSachTamTru' || x.Bang === 'TamTru' ? '' : ' ' + x.MaBanGhi)) + '</b>' +
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
    var font = function (them) { var f = { name: 'Times New Roman', sz: 14, color: { rgb: '000000' } }; for (var k in them) f[k] = them[k]; return f; };
    return {
      quocHieu: { font: font({ bold: true }), alignment: { horizontal: 'center', vertical: 'center' } },
      tieuNgu: { font: font({ bold: true, underline: true }), alignment: { horizontal: 'center', vertical: 'center' } },
      tieuDe: { font: font({ sz: 16, bold: true }), alignment: { horizontal: 'center', vertical: 'center', wrapText: true } },
      phu: { font: font({ italic: true }), alignment: { horizontal: 'center', vertical: 'center', wrapText: true } },
      cot: { font: font({ bold: true, color: { rgb: 'FFFFFF' } }), fill: { patternType: 'solid', fgColor: { rgb: '1F4E78' } }, border: vien('1F4E78'),
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
    var n = tieuDeCot.length, DATA_ROW = 7;
    var aoa = [['CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'], ['Độc lập - Tự do - Hạnh phúc'], [''], [tieuDe], [phu], [''], tieuDeCot].concat(dong0);
    var sh = X.utils.aoa_to_sheet(aoa);
    var dat = function (r, c, kieu) { var ref = X.utils.encode_cell({ r: r, c: c }); if (!sh[ref]) sh[ref] = { t: 's', v: '' }; sh[ref].s = kieu; return sh[ref]; };
    dat(0, 0, KIEU_XL.quocHieu); dat(1, 0, KIEU_XL.tieuNgu); dat(3, 0, KIEU_XL.tieuDe); dat(4, 0, KIEU_XL.phu);
    sh['!merges'] = [0, 1, 2, 3, 4, 5].map(function (r) { return { s: { r: r, c: 0 }, e: { r: r, c: Math.max(n - 1, 0) } }; });
    for (var j = 0; j < n; j++) dat(6, j, KIEU_XL.cot);
    for (var i = 0; i < dong0.length; i++) {
      for (var k = 0; k < n; k++) {
        var o = dat(i + DATA_ROW, k, KIEU_XL.o(i % 2 === 1, !cotChu[k] && typeof dong0[i][k] === 'number'));
        if (cotChu[k] && o.v !== '') { o.t = 's'; o.v = String(o.v); o.z = '@'; }
      }
    }
    // Độ rộng cột theo nội dung dài nhất (tối đa 45 ký tự)
    sh['!cols'] = tieuDeCot.map(function (t, c) {
      var m = String(t).length;
      dong0.forEach(function (d) { var v = d[c]; if (v != null) m = Math.max(m, String(v).length); });
      return { wch: Math.min(45, Math.max(8, m + 2)) };
    });
    sh['!rows'] = [{ hpt: 22 }, { hpt: 22 }, { hpt: 8 }, { hpt: 30 }, { hpt: 26 }, { hpt: 8 }, { hpt: 34 }];
    if (dong0.length) sh['!autofilter'] = { ref: X.utils.encode_range({ s: { r: 6, c: 0 }, e: { r: dong0.length + 6, c: n - 1 } }) };
    sh['!pageSetup'] = { orientation: n > 8 ? 'landscape' : 'portrait', fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
    sh['!margins'] = { left: 0.35, right: 0.35, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };
    sh.__dataRow = DATA_ROW;
    return sh;
  }
  /** Khoá nút xuất Excel trong lúc xử lý (tải thư viện + gom dữ liệu có thể mất vài giây, nhất là mạng yếu hoặc lần xuất đầu tiên);
   *  khôi phục khi xong dù thành công hay lỗi, tránh bấm nhiều lần thành nhiều lượt tải trùng. */
  function xuatVoiTrangThai(nut, thucHien) {
    if (!nut || nut.disabled) return;
    var chu = nut.innerHTML;
    nut.disabled = true; nut.innerHTML = ic('down', 'size-5 sm:size-4 animate-pulse') + '<span class="hidden sm:inline">Đang xuất…</span>';
    var khoiPhuc = function () { if (document.body.contains(nut)) { nut.disabled = false; nut.innerHTML = chu; } };
    Promise.resolve(thucHien()).then(khoiPhuc, khoiPhuc);
  }
  /** Báo cáo Excel của MỘT cơ sở: trang thông tin cơ sở + số liệu, danh sách đang lưu trú, toàn bộ hồ sơ (kể cả đã rời đi). */
  function xuatBaoCaoCoSo(c) {
    var lam = function (tat) {
      var ds = (tat || []).filter(function (r) { return r.MaCoSo === c.MaCoSo; });
      var dang = ds.filter(function (r) { return r.TrangThai !== 'Đã rời đi'; });
      var dem = function (tt) { return ds.filter(function (r) { return r.TrangThai === tt; }).length; };
      var cot = COT_KHACH.filter(function (x) { return ['MaCoSo', 'TenCoSo', 'DiaChiCoSo', 'CSKV'].indexOf(x[0]) < 0; });
      var tt = [['Cơ sở', c.TenCoSo], ['Loại hình', tenLoaiHinh(c)], ['Địa chỉ', c.DiaChi], ['Người quản lý', c.NguoiQuanLy], ['Số điện thoại', c.SoDienThoai], ['Số phòng', c.SoLuongPhong === '' ? '' : c.SoLuongPhong],
        ['Tổ dân phố', c.ToDanPho], ['CSKV', c.CSKV], ['Hoạt động', c.TrangThaiHoatDong || ''],
        ['Kiểm tra ' + thangVN(homNay()), c.DaKiemTraThang ? 'Đã kiểm tra' + (c.NgayKiemTraThang ? ' ngày ' + vn(c.NgayKiemTraThang) : '') : 'Chưa kiểm tra'],
        ['Đăng ký kinh doanh', c.DangKyKinhDoanh === 'Có' ? 'Có' + (c.MaSoThue ? ' · MST ' + c.MaSoThue : '') : (c.DangKyKinhDoanh || '')],
        ['Tuyên truyền, ký cam kết', c.DaTuyenTruyen === 'Có' ? 'Đã ký' + (c.NgayKyCamKet ? ' ngày ' + vn(c.NgayKyCamKet) : '') : (c.DaTuyenTruyen || '')],
        ['Đang lưu trú (người)', dang.length], ['— Sắp hết hạn', dem('Sắp hết hạn')], ['— Quá hạn', dem('Quá hạn')], ['Tổng số hồ sơ (kể cả đã rời đi)', ds.length]];
      var ten = boDau(c.TenCoSo || 'coso').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'coso';
      return xuatExcel('TamTru_' + ten + '_' + ngayFile() + '.xlsx', [{ ten: 'Đang lưu trú', dong: dongKhach(dang), cot: cot }, { ten: 'Toàn bộ hồ sơ', dong: dongKhach(ds), cot: cot }], tt,
        { bang: 'TamTru', noiDung: 'Báo cáo cơ sở ' + c.TenCoSo + ': ' + dang.length + ' đang lưu trú / ' + ds.length + ' hồ sơ' });
    };
    if (layDem('dsTamTru')) return lam(layDem('dsTamTru'));
    return goi('dsTamTru', {}).then(function (ds) { datDem('dsTamTru', ds); return lam(ds); });
  }

  // ================= NHẬP DANH SÁCH CÔNG DÂN KT2 ĐẾN TỪ EXCEL (Admin / Cán bộ) =================
  var TOI_DA_KT2 = 300;
  /** Tạo tệp mẫu nhập KT2 đến. */
  function taiMauKT2() {
    return napThuVien('XLSX').then(function (X) {
      var cot = [['STT', 6], ['Họ và tên *', 28], ['Số CCCD / Hộ chiếu *', 22], ['Số điện thoại (không bắt buộc)', 18], ['Ngày sinh (dd/mm/yyyy)', 18], ['Giới tính (Nam/Nữ/Khác)', 16], ['Dân tộc (trống = Kinh)', 16],
        ['Quốc tịch (trống = Việt Nam)', 20], ['Nơi đăng ký thường trú (không bắt buộc)', 36], ['Địa chỉ nơi đang ở (KT2) *', 40], ['Chủ nhà / người cho ở (không bắt buộc)', 28], ['Số phòng', 12],
        ['Ngày đến (dd/mm/yyyy)', 18], ['Ngày đi dự kiến (dd/mm/yyyy)', 18], ['Tổ dân phố', 12], ['CSKV (chỉ Admin)', 16]];
      var sh = {};
      cot.forEach(function (c, j) { sh[X.utils.encode_cell({ r: 0, c: j })] = { t: 's', v: c[0], s: KIEU_XL.cot }; });
      for (var r = 1; r <= 100; r++) cot.forEach(function (c, j) {
        sh[X.utils.encode_cell({ r: r, c: j })] = j === 0 ? { t: 'n', v: r, s: KIEU_XL.o(true, false) } : { t: 's', v: '', z: '@', s: KIEU_XL.o(false, false) };
      });
      sh['!ref'] = 'A1:' + X.utils.encode_cell({ r: 100, c: cot.length - 1 });
      sh['!cols'] = cot.map(function (c) { return { wch: c[1] }; });
      sh['!rows'] = [{ hpt: 48 }];
      var hd = [['HƯỚNG DẪN NHẬP DANH SÁCH CÔNG DÂN KT2 ĐẾN'], [''],
        ['Cách dùng', '1. Điền mỗi người một dòng ở sheet “Danh sách” (tối đa ' + TOI_DA_KT2 + ' dòng mỗi lần; có thể chia nhiều tệp).'],
        ['', '2. Trong ứng dụng: Khai báo → Nhập danh sách KT2 đến từ Excel → chọn tệp → xem kết quả kiểm tra → bấm “Nhập”.'],
        ['Cột bắt buộc', 'Họ và tên; Số CCCD / Hộ chiếu; Địa chỉ nơi đang ở (KT2). Các cột khác không bắt buộc, kể cả Nơi đăng ký thường trú và Số điện thoại.'],
        ['Địa chỉ nơi đang ở', 'Mỗi địa chỉ là một cơ sở loại “KT2 đến”. Những người cùng địa chỉ được xếp vào cùng cơ sở; địa chỉ chưa có trong hệ thống sẽ được tạo mới (tên cơ sở = chủ nhà nếu có, không thì lấy địa chỉ).'],
        ['Ngày đến', 'Để trống thì dùng “Ngày đến mặc định” chọn trên ứng dụng. Gõ dạng dd/mm/yyyy.'],
        ['Tổ dân phố / CSKV', 'Cán bộ: theo địa bàn của mình (cán bộ phụ trách nhiều tổ thì ghi tổ ở cột này hoặc chọn trên ứng dụng). Admin: gán CSKV và Tổ cho cả tệp trên ứng dụng, hoặc ghi riêng từng dòng ở hai cột này.'],
        ['Dân tộc / Quốc tịch', 'Dân tộc để trống = Kinh; Quốc tịch để trống = Việt Nam.'],
        ['Người đã đang cư trú', 'Số giấy tờ đã đang được ghi nhận tạm trú ở nơi khác sẽ được bỏ qua và báo lại để xử lý (xác nhận rời đi nơi cũ trước).'],
        ['Lưu ý', 'Giữ nguyên dòng tiêu đề. Tệp chỉ được đọc ngay trên máy của bạn rồi gửi nội dung từng dòng lên hệ thống để kiểm tra; hãy xoá tệp sau khi dùng vì chứa thông tin cá nhân.']];
      var hs = X.utils.aoa_to_sheet(hd);
      hs['A1'].s = KIEU_XL.tieuDe;
      for (var i = 2; i < hd.length; i++) { var a = hs[X.utils.encode_cell({ r: i, c: 0 })]; if (a) a.s = KIEU_XL.khoa; var o = hs[X.utils.encode_cell({ r: i, c: 1 })]; if (o) o.s = KIEU_XL.o(false, false); }
      hs['!cols'] = [{ wch: 26 }, { wch: 120 }];
      var wb = X.utils.book_new();
      X.utils.book_append_sheet(wb, sh, 'Danh sách');
      X.utils.book_append_sheet(wb, hs, 'Hướng dẫn');
      X.writeFile(wb, 'Mau_nhap_KT2_den.xlsx');
      toast('Đã tải tệp mẫu Mau_nhap_KT2_den.xlsx');
    }).catch(function (e) { toast(e.message, 'loi'); });
  }

  /** Đọc tệp Excel nhập KT2 đến → { ds:[{dong,…}], canh } hoặc { loi }. */
  function docExcelKT2(X, buf) {
    var chuan = function (s) { return boDau(String(s == null ? '' : s)).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
    var CAC_COT = [['HoTen', /^ho (va )?ten/], ['SoCCCD_Pass', /cccd|can cuoc|giay to|ho chieu|cmnd/], ['SoDienThoai', /dien thoai|sdt|so dt/], ['NgaySinh', /ngay sinh|nam sinh/], ['GioiTinh', /gioi tinh|^gioi/],
      ['DanToc', /dan toc/], ['QuocTich', /quoc tich/], ['NoiThuongTru', /thuong tru/], ['DiaChiCuTru', /noi dang o|noi cu tru|dia chi .*(o|cu tru)|dia chi kt2|noi o\b/], ['ChuNha', /chu nha|chu ho|nguoi cho o/],
      ['SoPhong', /phong/], ['NgayDen', /ngay den/], ['NgayDiDuKien', /ngay di/], ['ToDanPho', /^to( dan pho| dp)?$|to dan pho/], ['CSKV', /cskv|canh sat/]];
    var wb = X.read(buf, { type: 'array' });
    var ten = wb.SheetNames.filter(function (n) { return /danh sach/.test(chuan(n)); })[0] || wb.SheetNames[0];
    var dong = X.utils.sheet_to_json(wb.Sheets[ten], { header: 1, raw: true, defval: '' });
    var dau = -1, anh = {};
    for (var i = 0; i < Math.min(dong.length, 15) && dau < 0; i++) {
      var m = {}, dem = 0;
      dong[i].forEach(function (c, j) {
        var k = chuan(c); if (!k) return;
        CAC_COT.some(function (ct) { if (m[ct[0]] === undefined && ct[1].test(k)) { m[ct[0]] = j; dem++; return true; } });
      });
      if (m.HoTen !== undefined && dem >= 3) { dau = i; anh = m; }
    }
    if (dau < 0) return { loi: 'Không nhận ra dòng tiêu đề (cần cột “Họ và tên”, “Số CCCD / Hộ chiếu”, “Địa chỉ nơi đang ở”). Hãy dùng tệp mẫu.' };
    if (anh.DiaChiCuTru === undefined) return { loi: 'Tệp thiếu cột “Địa chỉ nơi đang ở (KT2)”. Hãy dùng tệp mẫu.' };
    var canh = [], ds = [];
    var chu = function (v) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); };
    var ngay = function (v, stt, ten2) {
      if (typeof v === 'number') { var dc = X.SSF.parse_date_code(v); return dc ? isoNgay(new Date(dc.y, dc.m - 1, dc.d)) : ''; }
      var s2 = chu(v); if (!s2) return '';
      var g = /^\d{4}-\d{2}-\d{2}$/.test(s2) ? s2 : docGo(s2);
      if (!g) canh.push('dòng ' + stt + ': ' + ten2 + ' “' + s2 + '” chưa đúng dd/mm/yyyy');
      return g || '';
    };
    for (var r = dau + 1; r < dong.length; r++) {
      var h = dong[r], lay = function (k) { return anh[k] === undefined ? '' : h[anh[k]]; }, stt = r + 1;
      if (!h.some(function (c) { return chu(c) && !/^\d{1,3}$/.test(chu(c)); })) continue;
      if (/^\(?v[ií] d[uụ]/i.test(chu(h.filter(function (c) { return chu(c); })[0]))) continue;
      var x = { dong: stt, HoTen: chu(lay('HoTen')) }, so = lay('SoCCCD_Pass'), sd = lay('SoDienThoai'), gt = chuan(lay('GioiTinh'));
      if (typeof so === 'number') { so = String(Math.round(so)); if (so.length === 11) so = '0' + so; canh.push('dòng ' + stt + ': số CCCD ở dạng số nên có thể mất số 0 đầu, hãy kiểm tra'); }
      x.SoCCCD_Pass = chu(so).replace(/\s+/g, '').toUpperCase();
      if (typeof sd === 'number') { sd = String(Math.round(sd)); if (sd.length === 9) sd = '0' + sd; }
      x.SoDienThoai = chu(sd);
      x.NgaySinh = ngay(lay('NgaySinh'), stt, 'ngày sinh'); x.NgayDen = ngay(lay('NgayDen'), stt, 'ngày đến'); x.NgayDiDuKien = ngay(lay('NgayDiDuKien'), stt, 'ngày đi dự kiến');
      x.GioiTinh = gt === 'nam' ? 'Nam' : gt === 'nu' ? 'Nữ' : gt === 'khac' ? 'Khác' : '';
      if (gt && !x.GioiTinh) canh.push('dòng ' + stt + ': giới tính “' + chu(lay('GioiTinh')) + '” không hợp lệ');
      x.DanToc = chu(lay('DanToc')); x.QuocTich = chu(lay('QuocTich')); x.NoiThuongTru = chu(lay('NoiThuongTru')); x.DiaChiCuTru = chu(lay('DiaChiCuTru')); x.ChuNha = chu(lay('ChuNha'));
      x.SoPhong = chu(lay('SoPhong')); x.ToDanPho = chu(lay('ToDanPho')); x.CSKV = chu(lay('CSKV'));
      ds.push(x);
    }
    if (!ds.length) return { loi: 'Tệp không có dòng nào có dữ liệu.' };
    return { ds: ds, canh: canh };
  }

  function formNhapKT2() {
    var admin = laAdmin();
    napCoSo().then(function (cs) {
      var cskvDs = {}, toTheo = {};
      cs.forEach(function (c) { if (c.CSKV) { cskvDs[c.CSKV] = 1; (toTheo[c.CSKV] = toTheo[c.CSKV] || {})[String(c.ToDanPho || '').trim()] = 1; } });
      var toCB = String((S.user && S.user.ToPhuTrach) || '').split(';').map(function (x) { return x.trim(); }).filter(String);
      var datalist = function (id, ds) { return '<datalist id="' + id + '">' + ds.map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>'; };
      moNganKeo(dauNganKeo('Nhập danh sách KT2 đến', 'Công dân đang cư trú theo loại hình KT2 đến, nhập từ tệp Excel') +
        '<form id="fKT2" class="flex-1 overflow-y-auto px-4 sm:px-6 py-4 flex flex-col gap-4" novalidate>' +
        '<div class="flex flex-wrap gap-2"><button type="button" id="ktMau" class="btn-soft">' + ic('down', 'size-5') + 'Tải mẫu Excel</button>' +
        '<button type="button" id="ktFile" class="btn-primary">' + ic('plus', 'size-5') + 'Chọn tệp Excel</button><input type="file" id="ktFileO" accept=".xlsx,.xls,.csv" class="hidden"></div>' +
        '<p class="text-xs text-muted -mt-2">Mỗi dòng một người, kèm <b>địa chỉ nơi đang ở</b> (mỗi địa chỉ là một cơ sở KT2 đến; chưa có thì hệ thống tạo mới). <b>Nơi đăng ký thường trú không bắt buộc.</b> Tối đa ' + TOI_DA_KT2 + ' dòng mỗi lần. Tệp chỉ được đọc trên máy này.</p>' +
        '<fieldset class="grid grid-cols-2 gap-3"><legend class="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Thông tin chung cho cả tệp</legend>' +
        '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="NgayDen_g">Ngày đến mặc định</label>' + oNgay('NgayDen', homNay(), { nhan: 'Ngày đến' }) + '<p class="text-[11px] text-muted mt-1">Dùng cho dòng không ghi ngày đến.</p></div>' +
        '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="ktLoai">Hình thức khai báo</label><select id="ktLoai" class="inp">' + (S.dm.LoaiKhaiBao || []).map(function (l) { return '<option' + (l === 'Đăng ký tạm trú' ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></div>' +
        (admin ? '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="ktCSKV">Gán CSKV *</label><input id="ktCSKV" class="inp" list="dlKtCskv" autocomplete="off" placeholder="Chọn / gõ tên CSKV">' + datalist('dlKtCskv', Object.keys(cskvDs).sort()) + '</div>' +
          '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="ktTo">Gán Tổ dân phố</label><input id="ktTo" class="inp" list="dlKtTo" autocomplete="off" placeholder="Theo CSKV đã chọn"><datalist id="dlKtTo"></datalist></div>' +
          '<p class="col-span-2 text-[11px] text-muted -mt-1">Áp dụng cho các địa chỉ mới; cột “Tổ dân phố / CSKV” trong tệp (nếu có) được ưu tiên.</p>'
          : '<div class="col-span-2 text-sm rounded-xl bg-canvas px-3 py-2">Địa bàn: <b>' + esc(moTaDiaBanDay(S.phamVi || {})) + '</b>' + (toCB.length > 1 ? '' : '') + '</div>' +
            (toCB.length > 1 ? '<div class="col-span-2 sm:col-span-1"><label class="lbl" for="ktTo">Tổ dân phố (dòng không ghi tổ)</label><select id="ktTo" class="inp"><option value="">— theo cột Tổ trong tệp —</option>' + toCB.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select></div>' : '')) +
        '</fieldset><div id="ktKQ"></div></form>' +
        '<footer class="flex gap-2 px-4 sm:px-6 py-3 border-t border-line"><button data-close class="btn-ghost">Đóng</button><span class="flex-1"></span><button id="ktKiem" type="button" class="btn-ghost hidden">Kiểm tra lại</button><button id="ktGhi" type="button" class="btn-primary min-w-40 hidden">Nhập</button></footer>');
      $('#drawer').classList.add('drawer-rong');
      var f = $('#fKT2'), dsDoc = null, dangXuLy = false;
      if (admin) $('#ktCSKV').addEventListener('input', function () { var l = Object.keys(toTheo[this.value.trim()] || {}).filter(String).sort(function (a, b) { return a - b; }); $('#dlKtTo').innerHTML = l.map(function (x) { return '<option value="' + esc(x) + '">'; }).join(''); });
      var chung = function () {
        var c = { NgayDen: f.NgayDen.value, LoaiKhaiBao: $('#ktLoai').value };
        if (admin) { c.CSKV = $('#ktCSKV').value.trim(); c.ToDanPho = $('#ktTo').value.trim(); } else if ($('#ktTo')) c.ToDanPho = $('#ktTo').value;
        return c;
      };
      var dongLoi = function (arr, k) { return arr.slice(0, 40).map(function (x) { return '<li class="py-1 border-t border-line first:border-0"><b class="font-medium">Dòng ' + x.dong + '</b>' + (x.ten ? ' · ' + esc(x.ten) : '') + ' — <span class="' + k + '">' + esc(x.loi || x.lyDo) + '</span></li>'; }).join('') + (arr.length > 40 ? '<li class="pt-1 text-muted">… và ' + (arr.length - 40) + ' dòng nữa</li>' : ''); };
      var veKQ = function (kq, daGhi) {
        var h = '<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">' +
          [[daGhi ? 'Đã nhập' : 'Hợp lệ', daGhi ? kq.daThem : kq.hopLe, 'bg-mint text-mint-ink'], [daGhi ? 'Cơ sở KT2 mới' : 'Cơ sở KT2 mới', kq.coSoMoi, 'bg-sky text-sky-ink'], ['Bỏ qua (đã cư trú / trùng)', kq.boQua.length, 'bg-butter text-butter-ink'], ['Dòng lỗi', kq.loi.length, 'bg-rose text-rose-ink']].map(function (x) {
            return '<div class="rounded-xl p-3 ' + x[2] + '"><b class="text-xl leading-none">' + soVN(x[1]) + '</b><span class="block text-[11px] mt-1">' + x[0] + '</span></div>'; }).join('') + '</div>' +
          (daGhi ? '<p class="text-sm bg-mint text-mint-ink rounded-xl px-3 py-2 mt-3">Đã nhập ' + soVN(kq.daThem) + ' người' + (kq.coSoMoi ? ', tạo ' + soVN(kq.coSoMoi) + ' cơ sở KT2 mới' : '') + '. Mở “Công dân cư trú” hoặc “Cơ sở” để xem.</p>' : (kq.coSoCo ? '<p class="text-xs text-muted mt-2">' + soVN(kq.coSoCo) + ' địa chỉ đã có cơ sở KT2 trong hệ thống sẽ được dùng lại.</p>' : '')) +
          (kq.loi.length ? '<h3 class="text-xs font-semibold uppercase tracking-wide text-rose-ink mt-4 mb-1">Dòng lỗi (không nhập)</h3><ul class="text-sm">' + dongLoi(kq.loi, 'text-rose-ink') + '</ul>' : '') +
          (kq.boQua.length ? '<h3 class="text-xs font-semibold uppercase tracking-wide text-butter-ink mt-4 mb-1">Bỏ qua</h3><ul class="text-sm">' + dongLoi(kq.boQua, 'text-butter-ink') + '</ul>' : '');
        $('#ktKQ').innerHTML = h;
      };
      var capNhatNut = function (kq) {
        $('#ktKiem').classList.toggle('hidden', !dsDoc); $('#ktGhi').classList.toggle('hidden', !dsDoc || !kq || !kq.hopLe);
        if (kq && kq.hopLe) $('#ktGhi').textContent = 'Nhập ' + soVN(kq.hopLe) + ' người';
      };
      var guiKiem = function () {
        if (!dsDoc || dangXuLy) return;
        var loiNgayForm = kiemNgay(f); if (loiNgayForm) return;
        if (admin && !chung().CSKV && dsDoc.some(function (x) { return !x.CSKV; })) { $('#ktKQ').innerHTML = '<p class="text-sm bg-butter text-butter-ink rounded-xl px-3 py-2">Chọn CSKV để gán cho các địa chỉ mới (hoặc ghi cột CSKV trong tệp), rồi bấm “Kiểm tra lại”.</p>'; capNhatNut(null); return; }
        dangXuLy = true; $('#ktKQ').innerHTML = '<p class="text-sm text-muted">Đang kiểm tra…</p>';
        API.goi('nhapKT2', { chung: chung(), ds: dsDoc }).then(function (kq) { veKQ(kq, false); capNhatNut(kq); }).catch(function (e) { $('#ktKQ').innerHTML = '<p class="text-sm bg-rose text-rose-ink rounded-xl px-3 py-2">' + esc(e.message) + '</p>'; capNhatNut(null); }).then(function () { dangXuLy = false; });
      };
      $('#ktMau').addEventListener('click', function () { taiMauKT2(); });
      $('#ktFile').addEventListener('click', function () { $('#ktFileO').click(); });
      $('#ktFileO').addEventListener('change', function () {
        var file = this.files && this.files[0]; this.value = ''; if (!file) return;
        if (file.size > 3 * 1024 * 1024) { toast('Tệp quá lớn (tối đa 3 MB).', 'loi'); return; }
        $('#ktKQ').innerHTML = '<p class="text-sm text-muted">Đang đọc tệp…</p>';
        Promise.all([napThuVien('XLSX'), file.arrayBuffer()]).then(function (kq) {
          var r = docExcelKT2(kq[0], kq[1]);
          if (r.loi) { dsDoc = null; $('#ktKQ').innerHTML = '<p class="text-sm bg-rose text-rose-ink rounded-xl px-3 py-2">' + esc(r.loi) + '</p>'; capNhatNut(null); return; }
          if (r.ds.length > TOI_DA_KT2) { dsDoc = null; $('#ktKQ').innerHTML = '<p class="text-sm bg-rose text-rose-ink rounded-xl px-3 py-2">Tệp có ' + soVN(r.ds.length) + ' dòng, vượt giới hạn ' + TOI_DA_KT2 + ' dòng mỗi lần. Hãy tách thành nhiều tệp.</p>'; capNhatNut(null); return; }
          dsDoc = r.ds;
          if (r.canh.length) toast('Lưu ý: ' + r.canh.slice(0, 3).join('; ') + (r.canh.length > 3 ? '; …' : ''), 'canh');
          guiKiem();
        }).catch(function (e) { $('#ktKQ').innerHTML = '<p class="text-sm bg-rose text-rose-ink rounded-xl px-3 py-2">Không đọc được tệp: ' + esc(e.message || e) + '</p>'; });
      });
      $('#ktKiem').addEventListener('click', guiKiem);
      $('#ktGhi').addEventListener('click', function () {
        if (!dsDoc || dangXuLy) return;
        dangXuLy = true; var nut = $('#ktGhi'), chuNut = nut.textContent; nut.disabled = true; nut.textContent = 'Đang nhập…'; $('#ktKiem').disabled = true;
        API.goi('nhapKT2', { chung: chung(), ds: dsDoc, xacNhan: true }).then(function (kq) {
          delete DEM.dsCoSo; sauKhiGhi('khach'); sauKhiGhi('coso'); delete DEM.dsTamTru;
          dsDoc = null; veKQ(kq, true); $('#ktGhi').classList.add('hidden'); $('#ktKiem').classList.add('hidden');
          toast('Đã nhập ' + kq.daThem + ' người');
        }).catch(function (e) { toast(e.message, 'loi'); nut.disabled = false; nut.textContent = chuNut; $('#ktKiem').disabled = false; }).then(function () { dangXuLy = false; });
      });
    });
  }

  /** Tạo tệp mẫu khai báo theo danh sách (cột đã định dạng văn bản để giữ số 0 đầu của CCCD / số điện thoại). */
  function taiMauKhaiBao() {
    return napThuVien('XLSX').then(function (X) {
      var cot = [['STT', 6], ['Họ và tên *', 28], ['Số CCCD / Hộ chiếu *', 22], ['Số điện thoại (không bắt buộc)', 18], ['Ngày sinh (dd/mm/yyyy)', 18], ['Giới tính (Nam/Nữ/Khác)', 16], ['Dân tộc (trống = Kinh)', 16], ['Quốc tịch (trống = Việt Nam)', 20], ['Phòng (trống = phòng chung)', 18], ['Nơi thường trú', 42]];
      var sh = {};
      cot.forEach(function (c, j) { sh[X.utils.encode_cell({ r: 0, c: j })] = { t: 's', v: c[0], s: KIEU_XL.cot }; });
      for (var r = 1; r <= TOI_DA_DS; r++) cot.forEach(function (c, j) {
        sh[X.utils.encode_cell({ r: r, c: j })] = j === 0 ? { t: 'n', v: r, s: KIEU_XL.o(true, false) } : { t: 's', v: '', z: '@', s: KIEU_XL.o(false, false) };
      });
      sh['!ref'] = 'A1:' + X.utils.encode_cell({ r: TOI_DA_DS, c: cot.length - 1 });
      sh['!cols'] = cot.map(function (c) { return { wch: c[1] }; });
      sh['!rows'] = [{ hpt: 36 }];
      var hd = [
        ['HƯỚNG DẪN KHAI BÁO THEO DANH SÁCH'],
        [''],
        ['Cách dùng', '1. Điền mỗi người một dòng ở sheet “Danh sách” (tối đa ' + TOI_DA_DS + ' người mỗi lần).'],
        ['', '2. Trong ứng dụng: Khai báo → Khai báo nhiều người → chọn loại hình cơ sở hoặc Hộ KT2 đến, nơi ở và ngày đến.'],
        ['', '3. Bấm “Nhập file Excel”, chọn tệp này → kiểm tra lại các dòng vừa nạp → bấm “Lưu danh sách”.'],
        ['Cột bắt buộc', 'Chỉ cần Họ và tên và Số CCCD / Hộ chiếu. Số điện thoại, ngày sinh, giới tính… không bắt buộc.'],
        ['Số CCCD / Hộ chiếu', 'CCCD 12 chữ số (hoặc CMND 9 số); hộ chiếu 6–15 ký tự gồm chữ và số. Cột đã đặt dạng văn bản nên giữ nguyên số 0 ở đầu.'],
        ['Ngày sinh', 'Gõ dạng dd/mm/yyyy, ví dụ 15/03/1990 (không bắt buộc).'],
        ['Giới tính', 'Nam, Nữ hoặc Khác (để trống được).'],
        ['Dân tộc / Quốc tịch / Phòng', 'Dân tộc để trống = Kinh. Quốc tịch để trống = Việt Nam. Phòng để trống = dùng ô “Phòng chung” trên ứng dụng.'],
        ['Không nhập trong tệp', 'Cơ sở, ngày đến, ngày đi dự kiến, hình thức khai báo: chọn trên ứng dụng, áp dụng cho cả danh sách.'],
        ['Lưu ý', 'Giữ nguyên dòng tiêu đề (dòng 1). Dòng để trống sẽ được bỏ qua. Tệp chỉ được đọc ngay trên máy của bạn, không gửi lên máy chủ; hãy xoá tệp sau khi dùng vì chứa thông tin cá nhân.']
      ];
      var hs = X.utils.aoa_to_sheet(hd);
      hs['A1'].s = KIEU_XL.tieuDe;
      for (var i = 2; i < hd.length; i++) { hs[X.utils.encode_cell({ r: i, c: 0 })] && (hs[X.utils.encode_cell({ r: i, c: 0 })].s = KIEU_XL.khoa); var o = hs[X.utils.encode_cell({ r: i, c: 1 })]; if (o) o.s = KIEU_XL.o(false, false); }
      hs['!cols'] = [{ wch: 24 }, { wch: 110 }];
      var wb = X.utils.book_new();
      X.utils.book_append_sheet(wb, sh, 'Danh sách');
      X.utils.book_append_sheet(wb, hs, 'Hướng dẫn');
      X.writeFile(wb, 'Mau_khai_bao_danh_sach.xlsx');
      toast('Đã tải tệp mẫu Mau_khai_bao_danh_sach.xlsx');
    }).catch(function (e) { toast(e.message, 'loi'); });
  }

  /** Đọc tệp Excel/CSV (ArrayBuffer) thành danh sách người. Trả { ds, canh } hoặc { loi }. */
  function docExcelDS(X, buf) {
    var chuan = function (s) { return boDau(String(s == null ? '' : s)).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
    var CAC_COT = [['HoTen', /^ho (va )?ten/], ['SoCCCD_Pass', /cccd|can cuoc|giay to|ho chieu|cmnd/], ['SoDienThoai', /dien thoai|sdt|so dt/], ['NgaySinh', /sinh/], ['GioiTinh', /gioi tinh|gioi/], ['DanToc', /dan toc/], ['QuocTich', /quoc tich/], ['SoPhong', /phong/], ['NoiThuongTru', /thuong tru|dia chi|noi o/]];
    var wb = X.read(buf, { type: 'array' });
    var ten = wb.SheetNames.filter(function (n) { return /danh sach/.test(chuan(n)); })[0] || wb.SheetNames[0];
    var dong = X.utils.sheet_to_json(wb.Sheets[ten], { header: 1, raw: true, defval: '' });
    var dau = -1, anh = {};
    for (var i = 0; i < Math.min(dong.length, 15) && dau < 0; i++) {
      var m = {}, dem = 0;
      dong[i].forEach(function (c, j) { var k = chuan(c); if (!k) return; CAC_COT.some(function (ct) { if (m[ct[0]] === undefined && ct[1].test(k)) { m[ct[0]] = j; dem++; return true; } }); });
      if (m.HoTen !== undefined && dem >= 2) { dau = i; anh = m; }
    }
    if (dau < 0) return { loi: 'Không nhận ra dòng tiêu đề (cần có cột “Họ và tên” và “Số CCCD / Hộ chiếu”). Hãy dùng tệp mẫu.' };
    var canh = [], ds = [];
    var chu = function (v) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); };
    for (var r = dau + 1; r < dong.length; r++) {
      var h = dong[r], lay = function (k) { return anh[k] === undefined ? '' : h[anh[k]]; };
      if (!h.some(function (c) { return chu(c) && !/^\d{1,3}$/.test(chu(c)); })) continue;   // dòng trống (chỉ có STT)
      if (/^\(?v[ií] d[uụ]/i.test(chu(h.filter(function (c) { return chu(c); })[0]))) continue;   // dòng ví dụ
      var x = { HoTen: chu(lay('HoTen')) }, so = lay('SoCCCD_Pass'), sd = lay('SoDienThoai'), ns = lay('NgaySinh'), gt = chuan(lay('GioiTinh')), stt = r + 1;
      if (typeof so === 'number') { so = String(Math.round(so)); if (so.length === 11) so = '0' + so; canh.push('dòng ' + stt + ': số CCCD ở dạng số nên có thể mất số 0 đầu, hãy kiểm tra'); }
      x.SoCCCD_Pass = chu(so).replace(/\s+/g, '').toUpperCase();
      if (typeof sd === 'number') { sd = String(Math.round(sd)); if (sd.length === 9) sd = '0' + sd; }
      x.SoDienThoai = chu(sd);
      if (typeof ns === 'number') { var dc = X.SSF.parse_date_code(ns); x.NgaySinh = dc ? isoNgay(new Date(dc.y, dc.m - 1, dc.d)) : ''; }
      else if (chu(ns)) { x.NgaySinh = /^\d{4}-\d{2}-\d{2}$/.test(chu(ns)) ? chu(ns) : (docGo(chu(ns)) || ''); if (!x.NgaySinh) canh.push('dòng ' + stt + ': ngày sinh “' + chu(ns) + '” chưa đúng dd/mm/yyyy'); }
      x.GioiTinh = gt === 'nam' ? 'Nam' : (gt === 'nu') ? 'Nữ' : gt === 'khac' ? 'Khác' : '';
      if (gt && !x.GioiTinh) canh.push('dòng ' + stt + ': giới tính “' + chu(lay('GioiTinh')) + '” không hợp lệ');
      x.DanToc = chu(lay('DanToc')); x.QuocTich = chu(lay('QuocTich')); x.SoPhong = chu(lay('SoPhong')); x.NoiThuongTru = chu(lay('NoiThuongTru'));
      ds.push(x);
    }
    if (!ds.length) return { loi: 'Tệp không có dòng nào có dữ liệu.' };
    return { ds: ds, canh: canh };
  }

  function xuatExcel(tenFile, bang, thongTin, nhatKy) {
    return napThuVien('XLSX').then(function (X) {
      var wb = X.utils.book_new(), luc = new Date().toLocaleString('vi-VN');
      var phamVi = moTaDiaBanDay(S.phamVi);
      var tt = [['Hệ thống', 'Ứng dụng khai báo cư trú'], ['Người xuất', (S.user.HoTen || '') + ' <' + S.user.Email + '>'], ['Thời điểm', luc], ['Phạm vi', phamVi]]
        .concat(thongTin || []).concat(bang.map(function (b) { return ['Trang “' + b.ten + '”', b.dong.length + ' dòng']; }));
      var sh0 = trangTinh(X, 'THÔNG TIN BÁO CÁO', 'Tệp ' + tenFile, ['Mục', 'Nội dung'], tt.map(function (x) { return [x[0], x[1] == null ? '' : x[1]]; }), [true, true]);
      for (var i = 0; i < tt.length; i++) sh0[X.utils.encode_cell({ r: i + sh0.__dataRow, c: 0 })].s = KIEU_XL.khoa;
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
            sh[X.utils.encode_cell({ r: r + sh.__dataRow, c: 0 })].s = KIEU_XL.khoa;
            if (/^—/.test(String(dong0[r][0]))) sh[X.utils.encode_cell({ r: r + sh.__dataRow, c: 0 })].s = KIEU_XL.o(false, false);
            var o1 = sh[X.utils.encode_cell({ r: r + sh.__dataRow, c: 1 })]; if (o1 && typeof o1.v === 'number') o1.s = KIEU_XL.tong;
          }
        }
        if (coTong) for (var t2 = 0; t2 < b.cot.length; t2++) sh[X.utils.encode_cell({ r: dong0.length + sh.__dataRow - 1, c: t2 })].s = t2 === 0 ? KIEU_XL.khoa : KIEU_XL.tong;
        X.utils.book_append_sheet(wb, sh, b.ten.slice(0, 31));
      });
      X.writeFile(wb, tenFile);
      API.goi('ghiNhatKy', { loai: 'Xuất Excel', bang: nhatKy.bang, noiDung: nhatKy.noiDung }).then(function () { sauKhiGhi('nhatky'); }).catch(function () {});
      toast('Đã xuất ' + tenFile);
    }).catch(function (e) { toast(e.message, 'loi'); });
  }
  var ngayFile = function () { return homNay().replace(/-/g, ''); };
  var tenPhamVi = function () { return S.phamVi && !S.phamVi.toanPhuong ? boDau(S.phamVi.to && S.phamVi.to.length ? 'To' + S.phamVi.to.join('-') : S.phamVi.cskv).replace(/[^a-z0-9]+/g, '') : 'toanphuong'; };

  function xuatKhach() {
    var ds = S.khachDangXem || [];
    if (!ds.length) return toast('Không có dòng nào để xuất.', 'canh');
    var boLoc = [S.loc.trangThai === '*' ? 'Tất cả trạng thái' : (S.loc.trangThai || 'Đang lưu trú'), S.loc.maCoSo ? 'cơ sở ' + S.loc.maCoSo : '', S.loc.loai ? 'hình thức ' + S.loc.loai : '',
      S.loc.tu ? 'đến từ ' + vn(S.loc.tu) : '', S.loc.den ? 'đến trước ' + vn(S.loc.den) : '', S.loc.q ? 'tìm "' + S.loc.q + '"' : ''].filter(String).join(', ');
    return xuatExcel('TamTru_khach_' + tenPhamVi() + '_' + ngayFile() + '.xlsx', [{ ten: 'Công dân cư trú', dong: dongKhach(ds), cot: COT_KHACH }],
      [['Bộ lọc', boLoc], ['Số dòng', ds.length]], { bang: 'TamTru', noiDung: ds.length + ' khách · ' + boLoc });
  }

  // Báo cáo Excel đầy đủ cho trang Tổng quan: số liệu tổng hợp + mọi danh sách đang hiển thị (không cắt bớt).
  var COT_KHACH = [['HoTen', 'Họ tên', 1], ['SoCCCD_Pass', 'Số CCCD/Hộ chiếu', 1], ['SoDienThoai', 'Số điện thoại', 1], ['NgaySinh', 'Ngày sinh', 1], ['GioiTinh', 'Giới tính', 1], ['DanToc', 'Dân tộc', 1], ['QuocTich', 'Quốc tịch', 1],
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
    return Promise.all([napKh, napCoSo()]).then(function (kq) {
      var kh = kq[0], csTat = kq[1], cs = csTat.filter(function (c) { return !laHoKT2(c); }), hoKT2 = csTat.filter(laHoKT2), hn = homNay(), thang = thangVN(t.coSo.thangKiemTra || hn);
      var dangO = kh.filter(function (r) { return r.TrangThai !== 'Đã rời đi'; });
      var homNayDK = kh.filter(function (r) { return String(r.NgayTao || '').slice(0, 10) === hn; });
      var canXuLy = kh.filter(function (r) { return r.TrangThai === 'Quá hạn' || r.TrangThai === 'Sắp hết hạn' || (r.TrangThai !== 'Đã rời đi' && r.DaGuiCT10 !== true); });   // gồm cả người chưa gửi CT10
      var ct10 = dangO.filter(function (r) { return r.DaGuiCT10 !== true; });
      var csHD = cs.filter(function (c) { return c.TrangThaiHoatDong !== 'Dừng hoạt động'; });
      var daKT = cs.filter(function (c) { return c.DaKiemTraThang; }), chuaKT = csHD.filter(function (c) { return !c.DaKiemTraThang; });
      var k = t.khach.theoTrangThai, dk = (t.dangKyHomNay || {}).theoTrangThai || {};
      var tongHop = [
        ['Công dân đang lưu trú', t.khach.dangLuuTru, 'người'], ['— Còn hạn (Đang ở)', k['Đang ở'], 'người'], ['— Sắp hết hạn', k['Sắp hết hạn'], 'người'], ['— Quá hạn', k['Quá hạn'], 'người'],
        ['Đã rời đi (còn lưu hồ sơ)', k['Đã rời đi'], 'người'], ['Cần gửi phiếu CT10', t.soCanGuiCT10 || 0, 'người'],
        ['Đăng ký trong ngày ' + vn(hn), (t.dangKyHomNay || {}).tong || 0, 'người'], ['— Đang ở', dk['Đang ở'] || 0, 'người'], ['— Sắp hết hạn', dk['Sắp hết hạn'] || 0, 'người'], ['— Quá hạn', dk['Quá hạn'] || 0, 'người'], ['— Đã rời đi', dk['Đã rời đi'] || 0, 'người'],
        ['Cơ sở', t.coSo.tong, 'cơ sở'], ['— Dừng hoạt động', t.coSo.dungHoatDong, 'cơ sở'], ['— Đã kiểm tra ' + thang, t.coSo.daKiemTra, 'cơ sở'], ['— Đang hoạt động chưa kiểm tra ' + thang, chuaKT.length, 'cơ sở'],
        ['Hộ KT2 đến', (t.coSo.kt2 || {}).ho || 0, 'hộ'], ['— Người đang cư trú tại các hộ KT2 đến', (t.coSo.kt2 || {}).nguoi || 0, 'người']
      ].map(function (x) { return { k: x[0], v: x[1], dv: x[2] }; });
      var cotCS = [['MaCoSo', 'Mã', 1], ['TenCoSo', 'Tên cơ sở', 1], ['LoaiHinh', 'Loại hình', 1], ['LoaiHinhKhac', 'Loại hình cụ thể', 1], ['DiaChi', 'Địa chỉ', 1], ['NguoiQuanLy', 'Người quản lý', 1], ['SoDienThoai', 'Số điện thoại', 1],
        ['ToDanPho', 'Tổ', 1], ['CSKV', 'CSKV', 1], ['DangKyKinhDoanh', 'Đăng ký KD', 1], ['MaSoThue', 'Mã số thuế', 1], ['DaTuyenTruyen', 'Tuyên truyền, ký cam kết', 1], ['NgayKT', 'Ngày kiểm tra', 1], ['KhachDangO', 'Khách đang ở']];
      var dongCS = function (ds) { return ds.map(function (c) { var o = {}; for (var x in c) o[x] = c[x]; o.NgayKT = c.NgayKiemTraThang ? vn(c.NgayKiemTraThang) : (c.KiemTraTheoPhieu ? 'Theo phiếu thống kê' : ''); if (c.NgayKyCamKet) o.NgayKyCamKet = vn(c.NgayKyCamKet); return o; }); };
      var bang = [
        { ten: 'Tổng hợp', cot: [['k', 'Chỉ tiêu'], ['v', 'Số lượng'], ['dv', 'Đơn vị']], dong: tongHop },
        { ten: 'Đăng ký hôm nay', cot: COT_KHACH, dong: dongKhach(homNayDK) },
        { ten: 'Cần xử lý', cot: COT_KHACH, dong: dongKhach(canXuLy) },
        { ten: 'Đang cư trú', cot: COT_KHACH, dong: dongKhach(dangO) },
        { ten: 'Theo loại hình', cot: [['k', 'Loại hình', 1], ['v', 'Số cơ sở'], ['ng', 'Người đang cư trú']], dong: Object.keys(t.coSo.theoLoaiHinh).map(function (x) { return { k: x, v: t.coSo.theoLoaiHinh[x], ng: (t.coSo.nguoiTheoLoaiHinh || {})[x] || 0 }; }) }
      ];
      if (S.phamVi && S.phamVi.toanPhuong !== false) bang.push({ ten: 'Theo CSKV', cot: [['k', 'CSKV', 1], ['cs', 'Số cơ sở'], ['kh', 'Khách đang ở']],
        dong: Object.keys(t.coSo.theoCSKV).map(function (x) { return { k: x, cs: t.coSo.theoCSKV[x].coSo, kh: t.coSo.theoCSKV[x].khachDangO }; }) });
      bang.push({ ten: 'Hộ KT2 đến', cot: cotCS, dong: dongCS(hoKT2) });
      bang.push({ ten: 'Đã KT ' + thang.replace('/', '-'), cot: cotCS, dong: dongCS(daKT) });
      bang.push({ ten: 'Chưa KT ' + thang.replace('/', '-'), cot: cotCS, dong: dongCS(chuaKT) });
      return xuatExcel('TamTru_tongquan_' + tenPhamVi() + '_' + ngayFile() + '.xlsx', bang, [['Báo cáo', 'Tổng quan – số liệu đến ngày ' + vn(t.homNay)]],
        { bang: 'TongQuan', noiDung: 'Báo cáo tổng quan ' + vn(t.homNay) + ': ' + dangO.length + ' khách đang lưu trú, ' + cs.length + ' cơ sở' });
    });
  }

  function xuatCoSo() {
    var ds = S.coSoDangXem || [];
    if (!ds.length) return toast('Không có dòng nào để xuất.', 'canh');
    var L = S.locCS;
    var boLoc = [S.cheDoKT2 ? 'Hộ KT2 đến' : (L.loaiHinh || 'Mọi loại hình'), L.cskv ? 'CSKV ' + L.cskv : '', L.tdp ? 'tổ ' + L.tdp : '', L.kt ? (L.kt === 'da' ? 'đã' : 'chưa') + ' kiểm tra ' + thangVN(homNay()) : '', L.q ? 'tìm "' + L.q + '"' : ''].filter(String).join(', ');
    var dong = ds.map(function (c) { var o = {}; for (var k in c) o[k] = c[k]; o.KTThang = c.DaKiemTraThang ? 'Đã kiểm tra' : 'Chưa'; o.NgayKT = c.NgayKiemTraThang ? vn(c.NgayKiemTraThang) : (c.KiemTraTheoPhieu ? 'Theo phiếu thống kê' : ''); if (c.NgayKyCamKet) o.NgayKyCamKet = vn(c.NgayKyCamKet); return o; });
    return xuatExcel((S.cheDoKT2 ? 'TamTru_hoKT2_' : 'TamTru_coso_') + tenPhamVi() + '_' + ngayFile() + '.xlsx', [{ ten: S.cheDoKT2 ? 'Hộ KT2 đến' : 'Cơ sở', dong: dong, cot: [
      ['MaCoSo', 'Mã', 1], ['TenCoSo', 'Tên cơ sở', 1], ['LoaiHinh', 'Loại hình', 1], ['LoaiHinhKhac', 'Loại hình cụ thể', 1], ['DiaChi', 'Địa chỉ', 1], ['NguoiQuanLy', 'Người quản lý', 1], ['SoDienThoai', 'Số điện thoại', 1],
      ['DiaChiNguoiQuanLy', 'Địa chỉ chủ cơ sở', 1], ['SoLuongPhong', 'Số phòng'], ['SoNhanKhauKhaiBao', 'Nhân khẩu khai báo'], ['ToDanPho', 'Tổ dân phố', 1], ['CSKV', 'CSKV', 1],
      ['DangKyKinhDoanh', 'Đăng ký kinh doanh', 1], ['MaSoThue', 'Mã số thuế', 1], ['DaTuyenTruyen', 'Tuyên truyền, ký cam kết', 1], ['NgayKyCamKet', 'Ngày ký cam kết', 1],
      ['KTThang', 'Kiểm tra ' + thangVN(homNay()), 1], ['NgayKT', 'Ngày kiểm tra', 1], ['TrangThaiHoatDong', 'Hoạt động', 1], ['KhachDangO', 'Khách đang ở'], ['KhachSapHet', 'Sắp hết hạn'], ['KhachQuaHan', 'Quá hạn'], ['GhiChu', 'Ghi chú', 1]] }],
      [['Bộ lọc', boLoc], ['Số dòng', ds.length]], { bang: 'CoSo', noiDung: ds.length + ' cơ sở · ' + boLoc });
  }

  // ================= TRA CỨU THEO CCCD =================
  function traCuuCCCD(soSan) {
    var pv = S.phamVi || { toanPhuong: true };
    moNganKeo(dauNganKeo('Tra cứu lịch sử tạm trú', pv.toanPhuong ? 'Toàn phường · mỗi lần tra cứu được ghi nhật ký' : 'Trong ' + esc(moTaDiaBanDay(pv)).replace('Địa bàn ', 'địa bàn ') + ' · mỗi lần tra cứu được ghi nhật ký') +
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
              '<span class="block text-xs text-muted">' + esc(r.DiaChiCoSo + (r.CSKV ? ' · CSKV ' + r.CSKV : '')) + '</span></button></li>';
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
    v.innerHTML = dauTrang('Báo cáo tháng', esc(moTaDiaBanDay(S.phamVi)) + ' · lượt khách, cơ sở, việc cần kiểm tra', '', nutCongCu('id="bcXuat" disabled', 'down', 'Xuất Excel')) +
      '<div class="card px-3 sm:px-4 py-2.5 mb-3 flex items-center gap-2"><label class="text-sm text-muted shrink-0" for="bcThang_g">Tháng</label>' + oNgay('bcThang', thang, { thang: true, max: homNay().slice(0, 7), cls: 'w-36', nhan: 'Tháng báo cáo' }) +
      '<span id="bcKhoang" class="ml-auto text-xs text-muted text-right"></span></div><div id="bcND">' + khungCho(4) + '</div>';
    $('#bcThang').addEventListener('change', function (e) { if (e.target.value) { S.thangBC = e.target.value; trangBaoCao(); } });
    docNhanh('bc:' + thang, 'baoCaoThang', { thang: thang }).then(function (b) {
      if (luot !== S.luot || !$('#bcND')) return;
      var bang = function (tieuDe, obj, cot1) {
        var ks = Object.keys(obj || {}).sort(function (a, c) { return obj[c] - obj[a]; });
        return '<section class="card overflow-hidden self-start">' + dauMuc(tieuDe, cot1 + ' · lượt đến') +
          (ks.length ? '<ul>' + ks.map(function (k) { return '<li class="flex items-center gap-3 px-4 sm:px-5 py-2.5 border-t border-line text-sm"><span class="flex-1 min-w-0 truncate">' + esc(k) + '</span><b class="font-semibold tabular-nums">' + soVN(obj[k]) + '</b></li>'; }).join('') + '</ul>' :
            '<p class="px-4 sm:px-5 pb-4 text-sm text-muted">Không có lượt khách đến trong tháng.</p>') + '</section>';
      };
      var the = function (nhan, so, donVi, mau) { return '<div class="flex items-center gap-3 p-3 sm:p-4"><span class="w-1 self-stretch rounded-full ' + mau + '"></span><span class="min-w-0"><b class="block text-xl lg:text-2xl font-semibold leading-none">' + soVN(so) + '</b><span class="block text-xs lg:text-[13px] text-muted mt-1">' + nhan + ' <span class="opacity-70">(' + donVi + ')</span></span></span></div>'; };
      if ($('#bcKhoang')) $('#bcKhoang').textContent = vn(b.tuNgay) + ' – ' + vn(b.denNgay);
      $('#bcND').innerHTML = '<p class="text-xs text-muted mb-2">Lập lúc ' + vnTG(b.lapLuc) + '</p>' +
        '<div class="card grid grid-cols-2 lg:grid-cols-4 overflow-hidden mb-3 lg:mb-6 [&>div]:border-line [&>div:nth-child(odd)]:border-r [&>div:nth-child(-n+2)]:border-b lg:[&>div]:border-b-0 lg:[&>div]:border-r lg:[&>div:last-child]:border-r-0">' + the('Lượt khách đến', b.khach.luotDen, 'lượt', 'bg-[#8EC5F5]') + the('Lượt rời đi', b.khach.luotDi, 'lượt', 'bg-[#C5C9D3]') +
        the('Đang lưu trú cuối tháng', b.khach.dangOCuoiThang, 'người', 'bg-[#8FD6B5]') + the('Người nước ngoài đến', b.khach.nuocNgoai, 'lượt', 'bg-[#B9A6E8]') + '</div>' +
        (b.khach.quaHanHienTai ? '<div class="flex gap-2 items-start rounded-2xl bg-rose text-rose-ink px-4 py-3 text-sm mb-3">' + ic('alert', 'size-4 mt-0.5 shrink-0') + '<span>Hiện có <b>' + b.khach.quaHanHienTai + '</b> khách quá hạn chưa xác nhận rời đi. <a href="#/tam-tru/Quá hạn" class="underline">Xem danh sách</a></span></div>' : '') +
        '<div class="grid lg:grid-cols-2 gap-3 lg:gap-4 mb-3 lg:mb-5">' + bang('Theo hình thức khai báo', b.theoLoaiKhaiBao, 'Hình thức') + bang('Theo loại hình', (function (o) { var r = {}; Object.keys(o || {}).forEach(function (k) { r[k === 'KT2 đến' ? 'Hộ KT2 đến' : k] = o[k]; }); return r; })(b.theoLoaiHinh), 'Loại hình') + bang('Theo quốc tịch', b.theoQuocTich, 'Quốc tịch') +
        (b.theoCSKV ? bang('Theo cảnh sát khu vực', b.theoCSKV, 'CSKV') : '') +
        '<section class="card overflow-hidden self-start">' + dauMuc('Cơ sở có nhiều lượt đến nhất') +
        (b.topCoSo.length ? '<ul>' + b.topCoSo.map(function (c) { return '<li><button type="button" data-xem-coso="' + esc(c.MaCoSo) + '" class="w-full flex items-center gap-3 px-4 sm:px-5 py-2.5 min-h-14 border-t border-line text-left hover:bg-canvas/60"><span class="min-w-0 flex-1"><b class="block text-sm font-medium truncate">' + esc(c.TenCoSo) + '</b><span class="block text-xs text-muted truncate">' + esc(c.DiaChi) + '</span></span><b class="text-sm font-semibold whitespace-nowrap">' + soVN(c.luot) + ' <span class="font-normal text-muted text-xs">lượt</span></b></button></li>'; }).join('') + '</ul>' : '<p class="px-4 sm:px-5 pb-4 text-sm text-muted">Không có.</p>') + '</section></div>' +
        (b.hoKT2 ? '<section class="card overflow-hidden mb-3 lg:mb-5">' + dauMuc('Hộ KT2 đến', 'Thống kê riêng, không tính vào cơ sở') + '<div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 px-4 sm:px-5 pb-4 text-sm">' +
          [['Số hộ', b.hoKT2.tong], ['Hộ có người trong tháng', b.hoKT2.coNguoiTrongThang], ['Người đang cư trú cuối tháng', b.hoKT2.nguoiODauCuoiThang], ['Lượt đến trong tháng', b.hoKT2.luotDen]].map(function (x) { return '<div class="rounded-xl bg-canvas px-3 py-2"><b class="block text-lg leading-tight">' + soVN(x[1]) + '</b><span class="text-xs text-muted">' + x[0] + '</span></div>'; }).join('') + '</div></section>' : '') +
        '<section class="card overflow-hidden">' + dauMuc('Cơ sở') + '<div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 px-4 sm:px-5 pb-3 text-sm">' +
        [['Tổng số', b.coSo.tong], ['Có khách trong tháng', b.coSo.coKhachTrongThang], ['Đã kiểm tra ' + thangVN(b.thang), b.coSo.daKiemTra], ['Dừng hoạt động', b.coSo.dungHoatDong]].map(function (x) { return '<div class="rounded-xl bg-canvas px-3 py-2"><b class="block text-lg leading-tight">' + soVN(x[1]) + '</b><span class="text-muted text-[11px]">' + x[0] + '</span></div>'; }).join('') + '</div>' +
        '<details class="group border-t border-line"><summary class="flex items-center gap-2 cursor-pointer px-4 sm:px-5 py-3 min-h-12 text-sm font-medium text-brand-600 list-none">Chưa kiểm tra ' + thangVN(b.thang) + ' · ' + b.coSo.chuaKiemTra.length + ' cơ sở' + ic('chev', 'size-4 ml-auto transition group-open:rotate-90') + '</summary>' +
        '<ul>' + b.coSo.chuaKiemTra.map(function (c) { return '<li><button type="button" data-xem-coso="' + esc(c.MaCoSo) + '" class="w-full flex items-center gap-3 px-4 sm:px-5 py-2.5 min-h-14 border-t border-line text-left hover:bg-canvas/60"><span class="min-w-0 flex-1"><b class="block text-sm font-medium truncate">' + esc(c.TenCoSo) + '</b><span class="block text-xs text-muted truncate">' + esc([c.LoaiHinh, c.DiaChi, c.ToDanPho ? 'Tổ ' + c.ToDanPho : '', c.CSKV ? 'CSKV ' + c.CSKV : ''].filter(Boolean).join(' · ')) + '</span></span>' + ic('chev', 'size-4 text-muted shrink-0') + '</button></li>'; }).join('') +
        '</ul></details></section>';
      var nut = $('#bcXuat'); nut.disabled = false;
      nut.onclick = function () { xuatVoiTrangThai(nut, function () { return xuatBaoCao(b); }); };
    }).catch(function () { if ($('#bcND')) $('#bcND').innerHTML = trong('Không lập được báo cáo', 'Thử lại sau.'); });
  }

  function xuatBaoCao(b) {
    var doiBang = function (obj, ten) { return Object.keys(obj || {}).sort(function (a, c) { return obj[c] - obj[a]; }).map(function (k) { var o = {}; o.k = k; o.v = obj[k]; return o; }); };
    var bang = [
      { ten: 'Tổng hợp', cot: [['k', 'Chỉ tiêu', 1], ['v', 'Số lượng'], ['dv', 'Đơn vị', 1]], dong: [
        { k: 'Lượt khách đến', v: b.khach.luotDen, dv: 'lượt' }, { k: 'Lượt rời đi', v: b.khach.luotDi, dv: 'lượt' }, { k: 'Đang lưu trú cuối tháng', v: b.khach.dangOCuoiThang, dv: 'người' },
        { k: 'Người nước ngoài đến', v: b.khach.nuocNgoai, dv: 'lượt' }, { k: 'Khách quá hạn (tại thời điểm lập)', v: b.khach.quaHanHienTai, dv: 'người' },
        { k: 'Cơ sở', v: b.coSo.tong, dv: 'cơ sở' }, { k: 'Cơ sở có khách trong tháng', v: b.coSo.coKhachTrongThang, dv: 'cơ sở' },
        { k: 'Cơ sở đã kiểm tra ' + thangVN(b.thang), v: b.coSo.daKiemTra, dv: 'cơ sở' }, { k: 'Cơ sở dừng hoạt động', v: b.coSo.dungHoatDong, dv: 'cơ sở' },
        { k: 'Cơ sở đang hoạt động chưa kiểm tra ' + thangVN(b.thang), v: b.coSo.chuaKiemTra.length, dv: 'cơ sở' }].concat(b.hoKT2 ? [
        { k: 'Hộ KT2 đến', v: b.hoKT2.tong, dv: 'hộ' }, { k: '— Hộ có người trong tháng', v: b.hoKT2.coNguoiTrongThang, dv: 'hộ' }, { k: '— Người đang cư trú cuối tháng', v: b.hoKT2.nguoiODauCuoiThang, dv: 'người' },
        { k: '— Lượt đến trong tháng', v: b.hoKT2.luotDen, dv: 'lượt' }, { k: '— Lượt rời đi trong tháng', v: b.hoKT2.luotDi, dv: 'lượt' }] : []) },
      { ten: 'Theo hình thức', cot: [['k', 'Hình thức khai báo', 1], ['v', 'Lượt đến']], dong: doiBang(b.theoLoaiKhaiBao) },
      { ten: 'Theo loại hình', cot: [['k', 'Loại hình', 1], ['v', 'Lượt đến']], dong: doiBang(b.theoLoaiHinh).map(function (x) { if (x.k === 'KT2 đến') x.k = 'Hộ KT2 đến'; return x; }) },
      { ten: 'Theo quốc tịch', cot: [['k', 'Quốc tịch', 1], ['v', 'Lượt đến']], dong: doiBang(b.theoQuocTich) }
    ];
    if (b.theoCSKV) bang.push({ ten: 'Theo CSKV', cot: [['k', 'CSKV', 1], ['v', 'Lượt đến']], dong: doiBang(b.theoCSKV) });
    bang.push({ ten: 'Top cơ sở', cot: [['MaCoSo', 'Mã', 1], ['TenCoSo', 'Tên cơ sở', 1], ['DiaChi', 'Địa chỉ', 1], ['CSKV', 'CSKV', 1], ['luot', 'Lượt đến']], dong: b.topCoSo });
    bang.push({ ten: 'Chưa kiểm tra ' + thangVN(b.thang).replace('/', '-'), cot: [['MaCoSo', 'Mã', 1], ['TenCoSo', 'Tên cơ sở', 1], ['LoaiHinh', 'Loại hình', 1], ['LoaiHinhKhac', 'Loại hình cụ thể', 1], ['DiaChi', 'Địa chỉ', 1], ['ToDanPho', 'Tổ', 1], ['CSKV', 'CSKV', 1]], dong: b.coSo.chuaKiemTra });
    return xuatExcel('TamTru_baocao_' + b.thang.replace('-', '') + '_' + tenPhamVi() + '.xlsx', bang, [['Tháng', b.thang], ['Khoảng ngày', vn(b.tuNgay) + ' – ' + vn(b.denNgay)]], { bang: 'BaoCao', noiDung: 'Báo cáo tháng ' + b.thang });
  }

  // ================= CHỦ CƠ SỞ (CỘNG TÁC VIÊN CỦA CÁN BỘ) =================
  var MAU_DX = { 'Chờ duyệt': 'bg-butter text-butter-ink', 'Đã duyệt': 'bg-mint text-mint-ink', 'Từ chối': 'bg-rose text-rose-ink', 'Đã huỷ': 'bg-fog text-fog-ink' };
  var TEN_TRUONG = { HoTen: 'Họ tên', SoCCCD_Pass: 'Số CCCD/Hộ chiếu', SoDienThoai: 'Số điện thoại', NgaySinh: 'Ngày sinh', GioiTinh: 'Giới tính', DanToc: 'Dân tộc', QuocTich: 'Quốc tịch', NoiThuongTru: 'Nơi thường trú',
    SoPhong: 'Số phòng', NgayDen: 'Ngày đến', NgayDiDuKien: 'Ngày đi dự kiến', LoaiKhaiBao: 'Hình thức khai báo' };
  var TRUONG_NGAY_DX = ['NgaySinh', 'NgayDen', 'NgayDiDuKien'];
  var badgeDX = function (tt) { return '<span class="badge ' + (MAU_DX[tt] || 'bg-fog text-fog-ink') + '">' + esc(tt) + '</span>'; };
  var giaTriDX = function (k, v) { return v === '' || v == null ? '<span class="text-muted">(trống)</span>' : esc(TRUONG_NGAY_DX.indexOf(k) >= 0 ? vn(v) : v); };
  var demDeXuatCho = function (ds) { return (ds || []).filter(function (x) { return x.TrangThai === 'Chờ duyệt'; }).length; };
  var TEN_LOAI_DX = { 'Sửa': 'Đề xuất sửa thông tin', 'Xoá': 'Đề xuất xoá hồ sơ', 'Rời đi': 'Đề xuất xác nhận rời đi', 'Khai báo': 'Khai báo mới', 'Kiểm tra': 'Đề nghị ghi nhận đã kiểm tra cơ sở' };

  /** Nội dung một đề xuất (dùng cho cả cộng tác viên lẫn cán bộ): thay đổi cũ → mới, ngày rời đi, lý do, kết quả duyệt. */
  function noiDungDeXuat(x) {
    var s = '';
    if (x.Loai === 'Sửa') {
      s += '<ul class="mt-2 rounded-xl bg-canvas px-3 py-2 text-[13px] flex flex-col gap-1">' + x.thayDoi.map(function (t) {
        return '<li><span class="text-muted">' + esc(TEN_TRUONG[t.truong] || t.truong) + ':</span> ' + (t.cu !== '' || x.TrangThai === 'Chờ duyệt' ? giaTriDX(t.truong, t.cu) + ' <span class="text-muted">→</span> ' : '') + '<b class="font-medium">' + giaTriDX(t.truong, t.moi) + '</b></li>';
      }).join('') + '</ul>';
    } else if (x.Loai === 'Khai báo' && x.khaiBao) {
      var kb = x.khaiBao;
      s += '<ul class="mt-2 rounded-xl bg-canvas px-3 py-2 text-[13px] flex flex-col gap-1">' + [['Số CCCD / Hộ chiếu', kb.SoCCCD_Pass], ['Số điện thoại', kb.SoDienThoai], ['Ngày sinh', kb.NgaySinh ? vn(kb.NgaySinh) : ''], ['Giới tính', kb.GioiTinh], ['Quốc tịch', kb.QuocTich], ['Nơi thường trú', kb.NoiThuongTru], ['Cơ sở', x.TenCoSo + (kb.SoPhong ? ' · P.' + kb.SoPhong : '')], ['Ngày đến', kb.NgayDen ? vn(kb.NgayDen) : '']]
        .filter(function (a) { return a[1]; }).map(function (a) { return '<li><span class="text-muted">' + a[0] + ':</span> <b class="font-medium">' + esc(a[1]) + '</b></li>'; }).join('') + '</ul>';
    } else if (x.Loai === 'Kiểm tra') s += '<p class="mt-1.5 text-[13px]"><span class="text-muted">Cán bộ tích đã kiểm tra ngày:</span> <b class="font-medium">' + vn(x.ngay) + '</b>' + (x.TenCoSo ? ' <span class="text-muted">· ' + esc(x.TenCoSo) + '</span>' : '') + '</p>';
    else if (x.Loai === 'Rời đi') s += '<p class="mt-1.5 text-[13px]"><span class="text-muted">Ngày rời đi:</span> <b class="font-medium">' + vn(x.ngay) + '</b></p>';
    if (x.LyDo) s += '<p class="mt-1.5 text-[13px]"><span class="text-muted">Lý do:</span> ' + esc(x.LyDo) + '</p>';
    if (x.TrangThai !== 'Chờ duyệt' && x.TrangThai !== 'Đã huỷ') s += '<p class="mt-1.5 text-xs text-muted">' + esc(x.TrangThai) + (x.NgayDuyet ? ' lúc ' + vnTG(x.NgayDuyet) : '') + (x.GhiChuDuyet ? ' · ' + esc(x.GhiChuDuyet) : '') + '</p>';
    return s;
  }

  // ---------- Cộng tác viên: trang chính ----------
  function trangCCTongQuan() {
    var v = $('#view'), luot = S.luot;
    v.innerHTML = dauTrang('Tổng quan', 'Số liệu cơ bản trên địa bàn cán bộ phụ trách') + '<div id="ccTQ">' + khungCho(3) + '</div>';
    docNhanh('tongQuanCongTacVien', 'tongQuanCongTacVien', {}).then(function (x) {
      if (luot !== S.luot || !$('#ccTQ')) return;
      var o = function (ten, so, icon, mau) { return '<article class="card p-3 sm:p-4 text-center"><span class="grid place-items-center size-8 sm:size-10 rounded-xl mx-auto ' + mau + '">' + ic(icon) + '</span><b class="block text-lg sm:text-2xl mt-2">' + soVN(so) + '</b><span class="block text-[10px] sm:text-sm leading-tight text-muted">' + ten + '</span></article>'; };
      $('#ccTQ').innerHTML = '<div class="grid grid-cols-3 gap-2 sm:gap-3">' + o('Hộ KT2 đến', x.ho, 'home', 'bg-butter text-butter-ink') + o('Cơ sở lưu trú', x.coSo, 'building', 'bg-sky text-sky-ink') + o('Người đang cư trú', x.nguoiDangCuTru, 'users', 'bg-mint text-mint-ink') + '</div>' +
        '<div class="card p-4 mt-3 flex flex-wrap gap-2"><a class="btn-soft" href="#/tam-tru">' + ic('users') + 'Xem công dân</a><a class="btn-soft" href="#/co-so">' + ic('building') + 'Cơ sở được giao</a></div>';
    }).catch(function (e) { if ($('#ccTQ')) $('#ccTQ').innerHTML = '<div class="card p-5 text-rose-ink">' + esc(e.message) + '</div>'; });
  }

  function trangCCCoSo() {
    var v = $('#view'), luot = S.luot;
    v.innerHTML = dauTrang('Cơ sở của tôi', 'Khai báo cư trú và theo dõi người đang lưu trú', '<button class="btn-primary" data-them-khach>' + ic('plus') + '<span>Khai báo</span></button>',
      nutCongCu('data-nhap-ds', 'users', 'Khai báo nhiều người') + nutCongCu('data-them-cs-cc', 'building', 'Thêm cơ sở')) + '<div id="ccND">' + khungCho(3) + '</div>';
    var ve = function () {
      if (luot !== S.luot || !$('#ccND')) return;
      var cs = S.coSo || [], cho = demDeXuatCho(layDem('dsDeXuat'));
      $('#ccND').innerHTML =
        '<div class="flex gap-2 items-start rounded-2xl bg-sky text-sky-ink px-4 py-3 text-sm mb-3">' + ic('idcard', 'size-4 mt-0.5 shrink-0') + '<span>Bạn là <b>cộng tác viên</b>: tự đăng ký khách đến ở và xem thông tin cơ bản của khách. Muốn <b>sửa, xoá hồ sơ hoặc xác nhận khách rời đi</b>, hãy gửi <b>đề xuất</b> để cán bộ phụ trách duyệt.</span></div>' +
        (cho ? '<a href="#/de-xuat" class="card flex items-center gap-3 px-4 py-3 mb-3 hover:border-[#D6DAF5]"><span class="grid place-items-center size-9 shrink-0 rounded-xl bg-butter text-butter-ink">' + ic('clock') + '</span><span class="min-w-0 flex-1 text-sm"><b class="font-medium">' + cho + ' đề xuất đang chờ cán bộ duyệt</b></span>' + ic('chev', 'size-4 text-muted') + '</a>' : '') +
        (cs.length ? cs.map(function (c) {
          var dung = c.TrangThaiHoatDong === 'Dừng hoạt động', o = function (nhan, so, mau) { return '<div class="rounded-xl px-2 py-2 text-center ' + mau + '"><b class="block text-lg leading-none">' + soVN(so || 0) + '</b><span class="block text-[11px] mt-1">' + nhan + '</span></div>'; };
          return '<section class="card mb-3 overflow-hidden"><div class="px-4 sm:px-5 pt-3.5 pb-2.5"><h2 class="font-semibold text-[15px] leading-tight">' + esc(c.TenCoSo) + (dung ? ' <span class="badge bg-fog text-fog-ink align-middle">Dừng hoạt động</span>' : '') + '</h2><p class="text-xs text-muted mt-0.5">' + esc([c.LoaiHinh, c.DiaChi].filter(String).join(' · ')) + '</p></div>' +
            '<div class="grid grid-cols-3 gap-1.5 px-4 sm:px-5 pb-3">' + o('Đang ở', c.KhachDangO, 'bg-mint text-mint-ink') + o('Sắp hết hạn', c.KhachSapHet, 'bg-butter text-butter-ink') + o('Quá hạn', c.KhachQuaHan, 'bg-rose text-rose-ink') + '</div>' +
            '<div class="flex flex-wrap gap-2 px-4 sm:px-5 pb-4">' + (dung ? '' : '<button type="button" class="btn-primary flex-1 min-w-[9rem]" data-them-khach="' + esc(c.MaCoSo) + '">' + ic('plus') + 'Khai báo</button><button type="button" class="btn-soft" data-tt-ds="' + esc(c.MaCoSo) + '">' + ic('users') + 'Nhập danh sách</button>') +
            '<button type="button" class="btn-ghost" data-cc-xem="' + esc(c.MaCoSo) + '">Xem khách</button></div></section>';
        }).join('') : trong('Chưa có cơ sở nào', 'Bấm “Thêm cơ sở” để tạo cơ sở của bạn, hoặc nhờ cán bộ phụ trách địa bàn gán cơ sở có sẵn. Khi có cơ sở, bạn đăng ký khách được ngay tại đây.', '<button class="btn-primary" data-them-cs-cc>' + ic('plus') + 'Thêm cơ sở</button>'));
    };
    docNhanh('dsCoSo', 'dsCoSo', {}).then(ve);
    docNhanh('dsDeXuat', 'dsDeXuat', {}).then(ve);
  }

  /** Cộng tác viên tự thêm cơ sở mới (thông tin cơ bản); cơ sở tự được gán cho chính họ. */
  function formCoSoMoiCC() {
    moNganKeo(dauNganKeo('Thêm cơ sở mới', 'Cơ sở sẽ được gán cho bạn và thuộc địa bàn của cán bộ phụ trách') +
      '<form id="fCsCc" class="flex-1 overflow-y-auto px-5 sm:px-6 py-5 flex flex-col gap-4" novalidate>' +
      '<div><label class="lbl" for="cccTen">Tên cơ sở *</label><input id="cccTen" class="inp" maxlength="150" placeholder="Ví dụ: Nhà trọ Hoa Mai" autofocus></div>' +
      '<div><span class="lbl">Loại hình *</span><div class="grid grid-cols-2 gap-2">' + ['Nhà trọ', 'Nhà nghỉ', 'Khách sạn', 'Nhà cho thuê', 'KT2 đến', 'Khác'].map(function (l) {
        return '<label><input type="radio" name="cccLoai" value="' + l + '" class="peer sr-only"><span class="flex h-10 items-center justify-center rounded-xl border border-line text-sm cursor-pointer peer-checked:bg-brand-50 peer-checked:border-brand peer-checked:text-brand-600">' + l + '</span></label>';
      }).join('') + '</div><div id="cccKhacO" class="hidden mt-2"><input id="cccKhac" class="inp" maxlength="100" placeholder="Loại hình cụ thể * (ví dụ: Ký túc xá, Homestay)" aria-label="Loại hình cụ thể"></div></div>' +
      '<div><label class="lbl" for="cccDC">Địa chỉ cụ thể *</label><input id="cccDC" class="inp" maxlength="300" placeholder="Số nhà, ngõ/ngách, đường"></div>' +
      '<div class="grid grid-cols-2 gap-3"><div><label class="lbl" for="cccSdt">Số điện thoại</label><input id="cccSdt" class="inp" inputmode="tel" maxlength="20"></div><div><label class="lbl" for="cccPhong">Số phòng</label><input id="cccPhong" class="inp" inputmode="numeric" maxlength="4"></div></div>' +
      '<p id="cccLoi" class="hidden text-sm bg-rose text-rose-ink rounded-xl px-3 py-2"></p></form>' +
      '<footer class="flex gap-2 px-4 sm:px-6 py-3 border-t border-line"><button data-close class="btn-ghost">Huỷ</button><span class="flex-1"></span><button id="cccLuu" type="submit" form="fCsCc" class="btn-primary min-w-28">Lưu cơ sở</button></footer>');
    $('#fCsCc').addEventListener('change', function (e) { if (e.target.name === 'cccLoai') { $('#cccKhacO').classList.toggle('hidden', e.target.value !== 'Khác'); if (e.target.value === 'Khác') $('#cccKhac').focus(); } });
    $('#fCsCc').addEventListener('submit', function (e) {
      e.preventDefault();
      var lh = $('#fCsCc [name=cccLoai]:checked'), d = { TenCoSo: $('#cccTen').value.trim(), DiaChi: $('#cccDC').value.trim(), SoDienThoai: $('#cccSdt').value.trim(), SoLuongPhong: $('#cccPhong').value.trim(), LoaiHinh: lh ? lh.value : '', LoaiHinhKhac: lh && lh.value === 'Khác' ? $('#cccKhac').value.trim() : '' };
      var loi = function (m) { var p = $('#cccLoi'); p.textContent = m; p.classList.toggle('hidden', !m); return true; };
      if (!d.TenCoSo) return loi('Chưa nhập tên cơ sở.'); if (!d.LoaiHinh) return loi('Chưa chọn loại hình.'); if (d.LoaiHinh === 'Khác' && !d.LoaiHinhKhac) return loi('Chọn “Khác” thì cần ghi rõ loại hình cụ thể.'); if (!d.DiaChi) return loi('Chưa nhập địa chỉ.'); loi('');
      var nut = $('#cccLuu'), chu = nut.innerHTML; nut.disabled = true; nut.textContent = 'Đang lưu…';
      // Lạc quan: hiện cơ sở "Đang lưu…" ngay, máy chủ lưu ngầm
      var tamCS = Object.assign({}, d, { MaCoSo: 'TAM-' + Date.now(), KhachDangO: 0, KhachSapHet: 0, KhachQuaHan: 0, _tam: true });
      vaCoSo(tamCS); dongNganKeo(); toast('Đang lưu cơ sở ' + d.TenCoSo + '…'); lamMoi();
      API.goi('themCoSo', d).then(function (c) {
        vaCoSo(null, tamCS.MaCoSo); vaCoSo(c); toast('Đã thêm cơ sở ' + c.TenCoSo); lamMoiNen();
      }).catch(function (er) { vaCoSo(null, tamCS.MaCoSo); lamMoiNen(); toast('Không lưu được cơ sở ' + d.TenCoSo + ': ' + (er.message || er) + '. Hãy thêm lại.', 'loi'); });
    });
  }

  // ---------- Cộng tác viên: danh sách khách ----------
  function trangCCKhach() {
    var v = $('#view'), luot = S.luot;
    S.ccLoc = S.ccLoc || { q: '', tt: 'dang', ma: '' };
    v.innerHTML = dauTrang('Công dân cư trú', 'Tất cả công dân trên địa bàn cán bộ phụ trách', '<button class="btn-primary" data-them-khach>' + ic('plus') + '<span>Khai báo</span></button>', nutCongCu('data-nhap-ds', 'users', 'Khai báo nhiều người')) +
      '<div class="card px-3 sm:px-4 pt-3 mb-3"><label class="relative block"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted">' + ic('search') + '</span>' +
      '<input id="ccQ" type="search" class="inp pl-9" placeholder="Tìm họ tên, CCCD, phòng…" value="' + esc(S.ccLoc.q) + '"></label><div id="ccTabs" class="mt-2"></div><div id="ccCoSoLoc" class="flex gap-2 py-2.5 overflow-x-auto scroll-thin -mx-1 px-1"></div></div><div id="ccKList">' + khungCho(3) + '</div>';
    $('#ccQ').addEventListener('input', debounce(function (e) { S.ccLoc.q = e.target.value; veCCKhach(); }, 150));
    var ve = function () { if (luot === S.luot && $('#ccKList')) veCCKhach(); };
    docNhanh('dsTamTru', 'dsTamTru', {}).then(ve);
    docNhanh('dsCoSo', 'dsCoSo', {}).then(ve);
    docNhanh('dsDeXuat', 'dsDeXuat', {}).then(ve);
  }
  function veCCKhach() {
    var L = S.ccLoc, q = boDau(L.q).trim(), ds = dsKhach || [];
    var theoLoc = ds.filter(function (r) { return (!L.ma || r.MaCoSo === L.ma) && (!q || boDau([r.HoTen, r.SoCCCD_Pass, r.SoPhong, r.TenCoSo].join(' ')).indexOf(q) >= 0); });
    var dang = theoLoc.filter(function (r) { return r.TrangThai !== 'Đã rời đi'; });
    $('#ccTabs').innerHTML = thanhTab('data-cc-tab', [['dang', 'Đang ở', dang.length], ['tat', 'Tất cả', theoLoc.length]], L.tt);
    var csMap = {}, cs = [];
    ds.forEach(function (r) { if (r.MaCoSo && !csMap[r.MaCoSo]) { csMap[r.MaCoSo] = 1; cs.push({ MaCoSo: r.MaCoSo, TenCoSo: r.TenCoSo || r.DiaChiCoSo || r.MaCoSo }); } });
    cs.sort(function (a, b) { return String(a.TenCoSo).localeCompare(String(b.TenCoSo), 'vi'); });
    $('#ccCoSoLoc').innerHTML = cs.length > 1 ? chipNho('data-cc-co=""', !L.ma, 'Mọi cơ sở') + cs.map(function (c) { return chipNho('data-cc-co="' + esc(c.MaCoSo) + '"', L.ma === c.MaCoSo, esc(c.TenCoSo)); }).join('') : '';
    var hien = L.tt === 'dang' ? dang : theoLoc, cho = {};
    (layDem('dsDeXuat') || []).forEach(function (x) { if (x.TrangThai === 'Chờ duyệt') cho[x.MaBanGhi] = 1; });
    if (!ds.length) { $('#ccKList').innerHTML = trong('Chưa có công dân cư trú', 'Bấm “Khai báo” để nhập người đến lưu trú tại cơ sở của bạn.', '<button class="btn-primary" data-them-khach>' + ic('plus') + 'Khai báo</button>'); return; }
    if (!hien.length) { $('#ccKList').innerHTML = '<div class="card px-6 py-10 text-center text-sm text-muted">Không có khách phù hợp.</div>'; return; }
    var trang = phanTrang('ccKhach', hien, JSON.stringify(L));
    $('#ccKList').innerHTML = '<ul class="card divide-y divide-line overflow-hidden">' + trang.map(function (r) {
      return '<li><button type="button" data-xem-khach="' + esc(r.ID) + '" class="w-full text-left px-4 py-2.5 min-h-14 hover:bg-canvas/60">' +
        '<span class="flex items-center gap-2"><b class="min-w-0 flex-1 truncate text-sm font-semibold">' + esc(r.HoTen) + '</b>' + (cho[r.ID] ? '<span class="badge bg-butter text-butter-ink">Có đề xuất</span>' : '') + badgeTT(r.TrangThai) + '</span>' +
        '<span class="block text-xs text-muted truncate mt-0.5">' + esc([r.SoCCCD_Pass, r.SoPhong ? 'P.' + r.SoPhong : '', cs.length > 1 ? r.TenCoSo : ''].filter(String).join(' · ')) + '</span>' +
        '<span class="block text-xs text-muted">' + vn(r.NgayDen).slice(0, 5) + ' → ' + (r.NgayDiDuKien ? vn(r.NgayDiDuKien).slice(0, 5) : '—') + ' · ' + conLaiTxt(r) + '</span></button></li>';
    }).join('') + '</ul>' + nutXemThem('ccKhach', trang.length, hien.length);
  }
  /** Chi tiết khách (chỉ thông tin cơ bản) + gửi đề xuất. */
  function xemKhachCC(id) {
    var r = (dsKhach || []).filter(function (x) { return x.ID === id; })[0]; if (!r) return;
    var dong = function (nhan, gt) { return '<div class="flex gap-4 py-2.5 border-b border-line last:border-0"><dt class="w-36 shrink-0 text-[13px] text-muted">' + nhan + '</dt><dd class="text-sm min-w-0 break-words">' + (gt || '<span class="text-muted">—</span>') + '</dd></div>'; };
    var cho = (layDem('dsDeXuat') || []).filter(function (x) { return x.MaBanGhi === id && x.TrangThai === 'Chờ duyệt'; });
    moNganKeo(dauNganKeo(esc(r.HoTen), esc(r.TenCoSo)) + '<div class="flex-1 overflow-y-auto px-5 sm:px-6 py-5">' +
      '<div class="flex flex-wrap items-center gap-2 mb-4">' + badgeTT(r.TrangThai) + '<span class="text-sm text-muted">' + conLaiTxt(r) + '</span></div>' +
      (cho.length ? '<div class="rounded-xl bg-butter text-butter-ink px-3 py-2 text-sm mb-4">Đang có đề xuất chờ cán bộ duyệt:' + cho.map(function (x) { return '<div class="mt-1 text-[13px]">• ' + esc(TEN_LOAI_DX[x.Loai]) + '</div>'; }).join('') + '</div>' : '') +
      '<dl class="card px-4">' + dong('Số CCCD / Hộ chiếu', '<b class="font-medium tracking-wide">' + esc(r.SoCCCD_Pass) + '</b>') + dong('Số điện thoại', esc(r.SoDienThoai)) + dong('Ngày sinh', vn(r.NgaySinh)) + dong('Giới tính', esc(r.GioiTinh)) + dong('Dân tộc', esc(r.DanToc)) + dong('Quốc tịch', esc(r.QuocTich)) + dong('Nơi thường trú', esc(r.NoiThuongTru)) + '</dl>' +
      '<dl class="card px-4 mt-3">' + dong('Cơ sở', esc(r.TenCoSo)) + dong('Hình thức khai báo', esc(r.LoaiKhaiBao)) + dong('Số phòng', esc(r.SoPhong)) + dong('Ngày đến', vn(r.NgayDen)) + dong('Ngày đi dự kiến', vn(r.NgayDiDuKien)) + dong('Ngày đi thực tế', vn(r.NgayDiThucTe)) + '</dl>' +
      '<p class="text-xs text-muted mt-3">Sửa, xoá hồ sơ hoặc xác nhận rời đi sẽ được gửi thành đề xuất và chỉ có hiệu lực sau khi cán bộ phụ trách duyệt.</p></div>' +
      '<footer class="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-4 border-t border-line"><button class="btn-danger px-3" data-cc-xoa="' + esc(id) + '" title="Đề xuất xoá">' + ic('trash') + '<span class="hidden sm:inline">Đề xuất xoá</span></button><span class="flex-1"></span>' +
      '<button class="btn-soft" data-cc-sua="' + esc(id) + '">' + ic('edit') + 'Đề xuất sửa</button>' + (r.TrangThai !== 'Đã rời đi' ? '<button class="btn-primary" data-cc-di="' + esc(id) + '">' + ic('out') + 'Đề xuất rời đi</button>' : '') + '</footer>');
    $('#drawer').dataset.kh = id;
  }
  function guiDeXuat(nut, data, thanhCong) {
    var chu = nut.innerHTML; nut.disabled = true; nut.textContent = 'Đang gửi…';
    return API.goi('deXuatTamTru', data).then(function () {
      DEM.dsDeXuat = null; delete DEM.dsDeXuat; toast('Đã gửi đề xuất. Cán bộ phụ trách sẽ xem xét.'); dongNganKeo(); lamMoi();
    }).catch(function (e) {
      nut.disabled = false; nut.innerHTML = chu;
      var p = $('#dxLoi'); if (p) { p.textContent = e.message; p.classList.remove('hidden'); p.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } else toast(e.message, 'loi');
    });
  }
  function formDeXuatSua(id) {
    var r = (dsKhach || []).filter(function (x) { return x.ID === id; })[0]; if (!r) return;
    var o = function (k, nhan, cls, them) { return '<div class="' + (cls || 'col-span-2 sm:col-span-1') + '"><label class="lbl" for="dx_' + k + '">' + nhan + '</label><input id="dx_' + k + '" name="' + k + '" class="inp" ' + (them || '') + ' value="' + esc(r[k]) + '"></div>'; };
    moNganKeo(dauNganKeo('Đề xuất sửa thông tin', esc(r.HoTen)) +
      '<form id="fDx" class="flex-1 overflow-y-auto px-5 sm:px-6 py-5 flex flex-col gap-4" novalidate><p class="text-[13px] text-muted">Sửa các ô cần thay đổi rồi bấm Gửi đề xuất. Hồ sơ chỉ đổi sau khi cán bộ phụ trách duyệt.</p>' +
      '<div class="grid grid-cols-2 gap-3">' + o('HoTen', 'Họ và tên', 'col-span-2', 'maxlength="100"') + o('SoCCCD_Pass', 'Số CCCD / Hộ chiếu') + o('SoDienThoai', 'Số điện thoại', '', 'maxlength="20" inputmode="tel"') +
      '<div class="col-span-2 sm:col-span-1"><span class="lbl">Ngày sinh</span>' + oNgay('NgaySinh', r.NgaySinh, { max: homNay(), nhan: 'Ngày sinh' }) + '</div>' +
      '<div class="col-span-2 sm:col-span-1"><span class="lbl">Giới tính</span><select name="GioiTinh" class="inp"><option value=""></option>' + ['Nam', 'Nữ', 'Khác'].map(function (g) { return '<option' + (r.GioiTinh === g ? ' selected' : '') + '>' + g + '</option>'; }).join('') + '</select></div>' +
      o('DanToc', 'Dân tộc', '', 'maxlength="50" list="dlDanToc"') + o('QuocTich', 'Quốc tịch') + o('SoPhong', 'Số phòng') + o('NoiThuongTru', 'Nơi thường trú', 'col-span-2', 'maxlength="300"') +
      '<div class="col-span-2 sm:col-span-1"><span class="lbl">Ngày đến</span>' + oNgay('NgayDen', r.NgayDen, { nhan: 'Ngày đến' }) + '</div>' +
      '<div class="col-span-2 sm:col-span-1"><span class="lbl">Ngày đi dự kiến</span>' + oNgay('NgayDiDuKien', r.NgayDiDuKien, { nhan: 'Ngày đi dự kiến' }) + '</div>' +
      '<div class="col-span-2"><span class="lbl">Hình thức khai báo</span><select name="LoaiKhaiBao" class="inp">' + (S.dm.LoaiKhaiBao || []).map(function (l) { return '<option' + (r.LoaiKhaiBao === l ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></div></div>' +
      '<div><label class="lbl" for="dx_lyDo">Lý do sửa (không bắt buộc)</label><textarea id="dx_lyDo" rows="2" maxlength="300" class="inp h-auto py-2" placeholder="Ví dụ: nhập nhầm tên"></textarea></div>' +
      '<p id="dxLoi" class="hidden text-sm bg-rose text-rose-ink rounded-xl px-3 py-2"></p></form>' +
      '<footer class="flex gap-2 px-4 sm:px-6 py-3 border-t border-line"><button data-close class="btn-ghost">Huỷ</button><span class="flex-1"></span><button id="dxGui" type="submit" form="fDx" class="btn-primary min-w-32">Gửi đề xuất</button></footer>');
    var f = $('#fDx');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var loiN = kiemNgay(f); if (loiN) return;
      var patch = {};
      ['HoTen', 'SoCCCD_Pass', 'SoDienThoai', 'GioiTinh', 'DanToc', 'QuocTich', 'SoPhong', 'NoiThuongTru', 'LoaiKhaiBao'].forEach(function (k) { var gt = f[k].value.trim(); if (gt !== String(r[k] == null ? '' : r[k])) patch[k] = gt; });
      TRUONG_NGAY_DX.forEach(function (k) { var gt = f[k].value; if (gt !== String(r[k] || '')) patch[k] = gt; });
      var p = $('#dxLoi');
      if (!Object.keys(patch).length) { p.textContent = 'Chưa có thông tin nào được sửa.'; p.classList.remove('hidden'); return; }
      p.classList.add('hidden');
      guiDeXuat($('#dxGui'), { loai: 'Sửa', id: id, patch: patch, lyDo: $('#dx_lyDo').value.trim() });
    });
  }
  function formDeXuatDi(id) {
    var r = (dsKhach || []).filter(function (x) { return x.ID === id; })[0]; if (!r) return;
    moNganKeo(dauNganKeo('Đề xuất xác nhận rời đi', esc(r.HoTen)) +
      '<form id="fDx" class="flex-1 overflow-y-auto px-5 sm:px-6 py-5 flex flex-col gap-4" novalidate><p class="text-[13px] text-muted">Khách chỉ được ghi nhận là đã rời đi sau khi cán bộ phụ trách duyệt.</p>' +
      '<div><span class="lbl">Ngày rời đi thực tế *</span>' + oNgay('NgayDiThucTe', homNay(), { cls: 'sm:w-56', min: r.NgayDen, max: homNay(), nhan: 'Ngày rời đi' }) + '</div>' +
      '<div><label class="lbl" for="dx_lyDo">Ghi chú (không bắt buộc)</label><textarea id="dx_lyDo" rows="2" maxlength="300" class="inp h-auto py-2"></textarea></div>' +
      '<p id="dxLoi" class="hidden text-sm bg-rose text-rose-ink rounded-xl px-3 py-2"></p></form>' +
      '<footer class="flex gap-2 px-4 sm:px-6 py-3 border-t border-line"><button data-close class="btn-ghost">Huỷ</button><span class="flex-1"></span><button id="dxGui" type="submit" form="fDx" class="btn-primary min-w-32">Gửi đề xuất</button></footer>');
    $('#fDx').addEventListener('submit', function (e) {
      e.preventDefault();
      if (kiemNgay($('#fDx'))) return;
      guiDeXuat($('#dxGui'), { loai: 'Rời đi', id: id, ngay: $('#NgayDiThucTe').value, lyDo: $('#dx_lyDo').value.trim() });
    });
  }
  function deXuatXoa(id) {
    var r = (dsKhach || []).filter(function (x) { return x.ID === id; })[0]; if (!r) return;
    hoi('Đề xuất xoá hồ sơ ' + r.HoTen + '?', 'Chỉ dùng khi nhập nhầm. Hồ sơ chỉ bị xoá sau khi cán bộ phụ trách duyệt. Ghi rõ lý do để cán bộ xem xét.', 'Gửi đề xuất', true, '<input class="inp mt-3" maxlength="300" placeholder="Lý do (bắt buộc)" aria-label="Lý do xoá">')
      .then(function (kq) {
        if (!kq) return;
        API.goi('deXuatTamTru', { loai: 'Xoá', id: id, lyDo: (kq.v || '').trim() }).then(function () {
          delete DEM.dsDeXuat; toast('Đã gửi đề xuất xoá. Cán bộ phụ trách sẽ xem xét.'); dongNganKeo(); lamMoi();
        }).catch(function (e) { toast(e.message, 'loi'); });
      });
  }

  // ---------- Cộng tác viên: đề xuất của tôi ----------
  function trangCCDeXuat() {
    var v = $('#view'), luot = S.luot;
    v.innerHTML = dauTrang('Khai báo & đề xuất của tôi', 'Khai báo mới, sửa, xoá hồ sơ, xác nhận rời đi đã gửi cho cán bộ phụ trách') + '<div id="dxList">' + khungCho(3) + '</div>';
    docNhanh('dsDeXuat', 'dsDeXuat', {}).then(function (ds) {
      if (luot !== S.luot || !$('#dxList')) return;
      $('#dxList').innerHTML = ds.length ? '<ul class="card divide-y divide-line overflow-hidden">' + ds.map(function (x) {
        return '<li class="px-4 py-3"><div class="flex items-start gap-2"><div class="min-w-0 flex-1"><b class="block text-sm font-semibold truncate">' + esc(x.TenKhach) + '</b><span class="block text-xs text-muted truncate">' + esc(TEN_LOAI_DX[x.Loai]) + ' · ' + esc(x.TenCoSo) + ' · ' + vnTG(x.NgayTao) + '</span></div>' + badgeDX(x.TrangThai) + '</div>' + noiDungDeXuat(x) +
          (x.TrangThai === 'Chờ duyệt' ? '<div class="mt-2"><button type="button" class="btn-ghost btn-sm" data-dx-huy="' + esc(x.MaDeXuat) + '">Huỷ đề xuất</button></div>' : '') + '</li>';
      }).join('') + '</ul>' : trong('Chưa có khai báo hay đề xuất nào', 'Khai báo mới sẽ chờ cán bộ phụ trách duyệt ở đây. Khi cần sửa, xoá hồ sơ hoặc xác nhận khách rời đi, mở khách trong mục Khách rồi bấm nút đề xuất.');
    });
  }

  // ---------- Cán bộ: duyệt đề xuất ----------
  function trangDeXuatCB() {
    var v = $('#view'), luot = S.luot;
    var maCanMo = decodeURIComponent((location.hash.replace('#/', '').split('/')[1] || ''));
    S.dxTab = S.dxTab || 'cho';
    v.innerHTML = dauTrang('Đề xuất chờ duyệt', laAdmin() ? 'Khai báo, đề xuất của cộng tác viên và đề nghị ghi nhận đã kiểm tra cơ sở của cán bộ' : 'Duyệt khai báo, đề xuất của cộng tác viên do bạn phụ trách; theo dõi đề nghị kiểm tra cơ sở bạn đã gửi Admin') + '<div class="card px-3 sm:px-4 mb-3"><div id="dxTabs"></div></div><div id="dxList">' + khungCho(3) + '</div>';
    docNhanh('dsDeXuatCB', 'dsDeXuat', { trangThai: '*' }).then(function (ds) {
      if (luot !== S.luot || !$('#dxList')) return;
      var cho = ds.filter(function (x) { return x.TrangThai === 'Chờ duyệt'; }), xong = ds.filter(function (x) { return x.TrangThai !== 'Chờ duyệt'; });
      $('#dxTabs').innerHTML = thanhTab('data-dx-tab', [['cho', 'Chờ duyệt', cho.length], ['xong', 'Đã xử lý', xong.length]], S.dxTab);
      var hien = S.dxTab === 'cho' ? cho : xong;
      if (maCanMo) { var dung = ds.filter(function (x) { return x.MaDeXuat === maCanMo; }); if (dung.length) { hien = dung; S.dxTab = dung[0].TrangThai === 'Chờ duyệt' ? 'cho' : 'xong'; } }
      var dsKT = cho.filter(function (x) { return x.Loai === 'Kiểm tra'; });
      var duyetHet = S.dxTab === 'cho' && laAdmin() && dsKT.length > 1 ? '<div class="card flex items-center gap-3 px-4 py-3 mb-3"><span class="grid place-items-center size-9 shrink-0 rounded-xl bg-sky text-sky-ink">' + ic('check') + '</span><span class="min-w-0 flex-1 text-sm"><b class="font-medium">' + soVN(dsKT.length) + ' cơ sở chờ phê duyệt kiểm tra</b></span><button type="button" class="btn-primary btn-sm" data-dx-kt-all>Duyệt tất cả</button></div>' : '';
      $('#dxList').innerHTML = duyetHet + (hien.length ? hien.map(function (x) {
        var canhBao = x.daMat ? '<div class="mt-2 rounded-xl bg-rose text-rose-ink px-3 py-2 text-[13px]">Hồ sơ này không còn (đã xoá / đã rời đi / ẩn danh). Nên bấm Từ chối.</div>' : '';
        return '<section id="dx-' + esc(x.MaDeXuat) + '" class="card mb-3 p-4 ' + (x.MaDeXuat === maCanMo ? 'ring-2 ring-brand bg-brand-50/40' : '') + '"><div class="flex items-start gap-2"><div class="min-w-0 flex-1"><b class="block text-sm font-semibold">' + esc(x.TenKhach) + '</b><span class="block text-xs text-muted">' + esc(TEN_LOAI_DX[x.Loai]) + ' · ' + esc(x.TenCoSo) + '</span><span class="block text-xs text-muted">Gửi bởi ' + esc(x.NguoiTao) + ' · ' + vnTG(x.NgayTao) + '</span></div>' + badgeDX(x.TrangThai) + '</div>' +
          noiDungDeXuat(x) + canhBao +
          (x.TrangThai === 'Chờ duyệt' && (x.Loai !== 'Kiểm tra' || laAdmin()) ? '<div class="flex gap-2 mt-3 pt-3 border-t border-line"><button type="button" class="btn-danger btn-sm" data-dx-tuchoi="' + esc(x.MaDeXuat) + '">Từ chối</button><span class="flex-1"></span><button type="button" class="btn-primary btn-sm" ' + (x.Loai === 'Khai báo' ? 'data-dx-kb' : 'data-dx-duyet') + '="' + esc(x.MaDeXuat) + '">' + ic('check') + (x.Loai === 'Khai báo' ? 'Duyệt &amp; bổ sung' : 'Duyệt') + '</button></div>' : '') + '</section>';
      }).join('') : (S.dxTab === 'cho' ? trong('Không có đề xuất nào chờ duyệt', 'Khai báo, đề xuất của cộng tác viên và đề nghị kiểm tra cơ sở của cán bộ sẽ hiện ở đây.') : trong('Chưa có đề xuất nào đã xử lý', '')));
      if (maCanMo && $('#dx-' + CSS.escape(maCanMo))) $('#dx-' + CSS.escape(maCanMo)).scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }
  function xuLyDeXuat(ma, duyet) {
    var x = (layDem('dsDeXuatCB') || []).filter(function (y) { return y.MaDeXuat === ma; })[0]; if (!x) return;
    var tom = (TEN_LOAI_DX[x.Loai] || x.Loai) + ' – ' + x.TenKhach;
    var xong = function (kq) {
      delete DEM.dsDeXuatCB; sauKhiGhi('khach'); sauKhiGhi('coso'); var tq = layDem('tongQuan'); if (tq && tq.deXuatChoDuyet) tq.deXuatChoDuyet--; toast(kq); lamMoi();
    };
    if (duyet) {
      hoi('Duyệt đề xuất?', tom + '. Thay đổi sẽ được áp dụng vào hồ sơ ngay.', 'Duyệt', x.Loai === 'Xoá').then(function (ok) {
        if (ok) goi('duyetDeXuat', { ma: ma }).then(function () { xong('Đã duyệt và áp dụng đề xuất'); });
      });
    } else {
      hoi('Từ chối đề xuất?', tom, 'Từ chối', true, '<input class="inp mt-3" maxlength="300" placeholder="Lý do từ chối (không bắt buộc)" aria-label="Lý do từ chối">').then(function (kq) {
        if (kq) goi('tuChoiDeXuat', { ma: ma, ghiChu: (kq.v || '').trim() }).then(function () { xong('Đã từ chối đề xuất'); });
      });
    }
  }
  function huyDeXuatCC(ma) {
    hoi('Huỷ đề xuất này?', 'Cán bộ sẽ không còn thấy đề xuất này.', 'Huỷ đề xuất', true).then(function (ok) {
      if (ok) goi('huyDeXuat', { ma: ma }).then(function () { delete DEM.dsDeXuat; toast('Đã huỷ đề xuất'); lamMoi(); });
    });
  }

  // ---------- Cán bộ: quản lý tài khoản cộng tác viên ----------
  var dsChuCoSo = [];
  /** Cảnh báo (trước khi ghi) khi cán bộ phụ trách không có địa bàn chứa cơ sở của cộng tác viên: hỏi lại Admin, đồng ý thì gửi lại kèm xacNhan. */
  function hoiNgoaiDiaBan(canhBao, guiLai) {
    var dong = canhBao.map(function (x) { return '• ' + x.HoTen + ': ' + x.coSo.slice(0, 3).join(', ') + (x.coSo.length > 3 ? ' (+' + (x.coSo.length - 3) + ' cơ sở nữa)' : ''); }).join('\n');
    return hoi('Cơ sở ngoài địa bàn của cán bộ', 'Cán bộ này KHÔNG có địa bàn chứa các cơ sở sau, nên khi duyệt khai báo / đề xuất sẽ báo lỗi ngoài phạm vi (Admin phải duyệt thay):\n' + dong + '\n\nVẫn gán?', 'Vẫn gán', true).then(function (ok) { if (ok) return guiLai(); });
  }
  /** Các <option> cán bộ (đang hoạt động, có email) để chọn cán bộ phụ trách cộng tác viên. chon = email đang được chọn. */
  function optCanBo(dsCB, chon) {
    return '<option value="">— Chưa gán cán bộ —</option>' + (dsCB || []).filter(function (c) { return c.Email && c.TrangThai === 'Hoạt động' && (c.Quyen === 'CanBo' || c.Quyen === 'Admin'); })
      .sort(function (a, b) { return String(a.HoTen || a.CSKV || '').localeCompare(String(b.HoTen || b.CSKV || ''), 'vi'); })
      .map(function (c) { var e = String(c.Email).toLowerCase(); return '<option value="' + esc(e) + '"' + (e === chon ? ' selected' : '') + '>' + esc((c.HoTen || '(chưa có họ tên)') + (c.CSKV ? ' · CSKV ' + c.CSKV : '') + (c.Quyen === 'Admin' ? ' · Admin' : '')) + '</option>'; }).join('');
  }
  function trangChuCoSo() {
    var v = $('#view'), luot = S.luot;
    v.innerHTML = dauTrang('Cộng tác viên', 'Tài khoản chủ nhà trọ, khách sạn… hỗ trợ đăng ký khách cho địa bàn của bạn', '<button class="btn-primary" data-them-ccs>' + ic('plus') + '<span>Thêm cộng tác viên</span></button>') +
      '<div class="flex gap-2 items-start rounded-2xl bg-sky text-sky-ink px-4 py-3 text-sm mb-3">' + ic('idcard', 'size-4 mt-0.5 shrink-0') + '<span>Cộng tác viên đăng nhập bằng Gmail bạn nhập, chỉ thấy <b>thông tin cơ bản</b> của khách tại cơ sở được gán (không thấy tiền án, kết quả test, ghi chú nội bộ), tự đăng ký khách; sửa/xoá/rời đi phải gửi đề xuất cho cán bộ duyệt.</span></div><div id="ccsList">' + khungCho(3) + '</div>';
    // Danh sách cộng tác viên và danh sách cán bộ tải SONG SONG (dùng bộ đệm nếu có) — không chờ nối đuôi nhau
    var dsCBs = layDem('dsCanBo') || [];
    if (laAdmin()) docNhanh('dsCanBo', 'dsCanBo', {}).then(function (x) {
      dsCBs = x; var s = $('#ccsGanPT'); if (s) { var cu = s.value; s.innerHTML = optCanBo(x, cu); s.value = cu; }
    });
    docNhanh('dsChuCoSo', 'dsChuCoSo', {}).then(function (ds) {
      if (luot !== S.luot || !$('#ccsList')) return;
      dsChuCoSo = ds;
      var ganNhieu = laAdmin() && ds.length ? '<div class="card flex flex-wrap items-center gap-2 px-3 py-2.5 mb-3"><span class="text-sm font-medium">Gán các mục đã chọn cho:</span><select id="ccsGanPT" class="inp h-10 flex-1 min-w-[12rem] text-sm">' + optCanBo(dsCBs, '') + '</select><button type="button" class="btn-primary btn-sm" data-gan-ccs>' + ic('check') + 'Gán</button></div>' : '';
      $('#ccsList').innerHTML = ganNhieu + (ds.length ? '<ul class="card divide-y divide-line overflow-hidden">' + ds.map(function (x) {
        return '<li class="flex items-center gap-2 pl-4 pr-2 py-3">' + (laAdmin() ? '<input type="checkbox" class="size-5 shrink-0 accent-[#6C7BF2] -ml-1 mr-1" data-chon-ccs value="' + esc(x.MaCanBo) + '" aria-label="Chọn ' + esc(x.HoTen) + '">' : '') + '<div class="min-w-0 flex-1"><div class="flex items-center gap-1.5 flex-wrap"><b class="text-sm font-medium">' + esc(x.HoTen) + '</b>' + (x.TrangThai !== 'Hoạt động' ? '<span class="badge bg-rose text-rose-ink">' + esc(x.TrangThai) + '</span>' : '') + '</div>' +
          '<p class="text-xs text-muted truncate">' + esc(x.Email) + '</p><p class="text-xs mt-0.5">' + (x.NguoiPhuTrach ? '<span class="text-muted">Cán bộ phụ trách:</span> <b class="font-medium">' + esc(x.TenPhuTrach) + '</b>' : '<span class="text-butter-ink">Chưa gán cán bộ phụ trách</span>') + '</p><p class="text-xs text-muted mt-0.5">' + (x.coSo.length ? x.coSo.map(function (c) { return esc(c.TenCoSo); }).join(' · ') : '<span class="text-butter-ink">Chưa gán cơ sở</span>') + '</p>' + (x.sua ? '' : '<p class="text-xs text-butter-ink mt-0.5">Còn quản lý cơ sở ngoài địa bàn của bạn nên chỉ được xem.</p>') + '</div>' +
          '<button type="button" class="grid place-items-center size-11 sm:size-9 shrink-0 rounded-xl bg-brand-50 text-brand-600" data-moi-ccs="' + esc(x.MaCanBo) + '" title="Sao chép lời mời" aria-label="Sao chép lời mời">' + ic('clip', 'size-5 sm:size-4') + '</button>' +
          (x.sua ? '<button type="button" class="grid place-items-center size-11 sm:size-9 shrink-0 rounded-xl text-muted hover:bg-canvas" data-sua-ccs="' + esc(x.MaCanBo) + '" aria-label="Sửa ' + esc(x.HoTen) + '" title="Sửa">' + ic('edit', 'size-5 sm:size-4') + '</button>' : '') + '</li>';
      }).join('') + '</ul>' : trong('Chưa có cộng tác viên nào', 'Bấm “Thêm cộng tác viên” để tạo tài khoản cho chủ nhà trọ, khách sạn… trong địa bàn của bạn.', '<button class="btn-primary" data-them-ccs>' + ic('plus') + 'Thêm cộng tác viên</button>'));
    });
  }
  function formChuCoSo(x) {
    var moi = !x;
    var dsCBs = layDem('dsCanBo') || [];
    if (laAdmin()) docNhanh('dsCanBo', 'dsCanBo', {}).then(function (d) { dsCBs = d; var s = $('#ccsPT'); if (s) { var cu = s.value; s.innerHTML = optCanBo(d, cu || (x ? x.NguoiPhuTrach : '')); s.value = cu || (x ? x.NguoiPhuTrach : ''); } });
    napCoSo().then(function (cs) {
      var chon = {}; (x ? x.coSo : []).forEach(function (c) { chon[c.MaCoSo] = 1; });
      var dsCs = cs.filter(function (c) { return c.TrangThaiHoatDong !== 'Dừng hoạt động' || chon[c.MaCoSo]; });
      moNganKeo(dauNganKeo(moi ? 'Thêm cộng tác viên' : 'Sửa cộng tác viên', moi ? 'Tài khoản Gmail đăng nhập; cơ sở có thể gán ngay hoặc sau' : esc(x.Email)) +
        '<form id="fCcs" class="flex-1 overflow-y-auto px-5 sm:px-6 py-5 flex flex-col gap-4" novalidate>' +
        '<div><label class="lbl" for="ccsTen">Họ và tên cộng tác viên *</label><input id="ccsTen" class="inp" maxlength="100" value="' + esc(x ? x.HoTen : '') + '" autofocus></div>' +
        '<div><label class="lbl" for="ccsEmail">Gmail đăng nhập *</label><input id="ccsEmail" type="email" class="inp" maxlength="120" placeholder="ten@gmail.com" value="' + esc(x ? x.Email : '') + '"></div>' +
        (laAdmin() ? '<div><label class="lbl" for="ccsPT">Cán bộ phụ trách</label><select id="ccsPT" class="inp">' + optCanBo(dsCBs, x ? x.NguoiPhuTrach : '') + '</select><p class="text-xs text-muted mt-1.5">Chỉ cán bộ này (và Admin) xem và duyệt khai báo, đề xuất của cộng tác viên. Để trống: cán bộ nào có địa bàn chứa cơ sở đều thấy.</p></div>' : '') +
        '<div><span class="lbl">Cơ sở được quản lý <span class="text-muted font-normal">(không bắt buộc, có thể gán sau)</span> <span id="ccsDem" class="text-muted font-normal"></span></span><label class="relative block mb-2"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted">' + ic('search') + '</span><input id="ccsTim" type="search" class="inp h-10 pl-9 text-sm" placeholder="Tìm cơ sở…" autocomplete="off"></label>' +
        '<div id="ccsDs" class="max-h-72 overflow-y-auto card divide-y divide-line">' + dsCs.map(function (c) {
          return '<label class="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-canvas/60" data-ten="' + esc(boDau([c.TenCoSo, c.DiaChi, c.MaCoSo].join(' '))) + '"><input type="checkbox" class="mt-0.5 size-5 shrink-0 accent-[#6C7BF2]" value="' + esc(c.MaCoSo) + '"' + (chon[c.MaCoSo] ? ' checked' : '') + '><span class="min-w-0"><b class="block text-sm font-medium truncate">' + esc(c.TenCoSo) + '</b><span class="block text-xs text-muted truncate">' + esc(c.DiaChi) + '</span></span></label>';
        }).join('') + '</div></div>' +
        (moi ? '' : '<label class="flex items-center gap-2 text-sm"><input type="checkbox" id="ccsKhoa" class="size-4 accent-[#6C7BF2]"' + (x.TrangThai === 'Khoá' ? ' checked' : '') + '> Khoá tài khoản (không đăng nhập được)</label>') +
        '<div><label class="lbl" for="ccsGhi">Ghi chú</label><input id="ccsGhi" class="inp" maxlength="200" value="' + esc(x ? x.GhiChu : '') + '"></div>' +
        '<p id="ccsLoi" class="hidden text-sm bg-rose text-rose-ink rounded-xl px-3 py-2"></p></form>' +
        '<footer class="flex gap-2 px-4 sm:px-6 py-3 border-t border-line">' + (moi ? '' : '<button type="button" id="ccsXoa" class="btn-danger px-3">' + ic('trash') + '<span class="hidden sm:inline">Xoá</span></button>') + '<span class="flex-1"></span><button data-close class="btn-ghost">Huỷ</button><button id="ccsLuu" type="submit" form="fCcs" class="btn-primary min-w-24">' + (moi ? 'Tạo tài khoản' : 'Lưu') + '</button></footer>');
      var demChon = function () { $('#ccsDem').textContent = '(đã chọn ' + $$('#ccsDs input:checked').length + ')'; };
      demChon();
      $('#ccsDs').addEventListener('change', demChon);
      $('#ccsTim').addEventListener('input', debounce(function (e) { var q = boDau(e.target.value).trim(); $$('#ccsDs [data-ten]').forEach(function (l) { l.hidden = !!q && l.dataset.ten.indexOf(q) < 0; }); }, 120));
      var loi = function (m) { var p = $('#ccsLoi'); p.textContent = m; p.classList.toggle('hidden', !m); };
      $('#fCcs').addEventListener('submit', function (e) {
        e.preventDefault();
        var d = { HoTen: $('#ccsTen').value.trim(), Email: $('#ccsEmail').value.trim(), GhiChu: $('#ccsGhi').value.trim(), CoSoQuanLy: $$('#ccsDs input:checked').map(function (i) { return i.value; }) };
        if (laAdmin() && $('#ccsPT')) d.NguoiPhuTrach = $('#ccsPT').value;
        if (!d.HoTen) return loi('Chưa nhập họ tên.');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.Email)) return loi('Gmail chưa đúng.');
        loi('');
        if (!moi) { d.ma = x.MaCanBo; d.TrangThai = $('#ccsKhoa').checked ? 'Khoá' : 'Hoạt động'; }
        var nut = $('#ccsLuu'), chu = nut.innerHTML; nut.disabled = true; nut.textContent = 'Đang lưu…';
        var guiForm = function (xn) {
          d.xacNhan = xn;
          return API.goi(moi ? 'themChuCoSo' : 'suaChuCoSo', d).then(function (r) {
            if (r && r.canhBao) { nut.disabled = false; nut.innerHTML = chu; return hoiNgoaiDiaBan(r.canhBao, function () { nut.disabled = true; nut.textContent = 'Đang lưu…'; return guiForm(true); }); }
            delete DEM.dsChuCoSo; dongNganKeo(); toast(moi ? 'Đã tạo tài khoản. Bấm biểu tượng sao chép để gửi lời mời cho cộng tác viên.' : 'Đã lưu'); lamMoi();
          }).catch(function (er) { nut.disabled = false; nut.innerHTML = chu; loi(er.message); });
        };
        guiForm(false);
      });
      if (!moi) $('#ccsXoa').addEventListener('click', function () {
        hoi('Xoá tài khoản cộng tác viên ' + x.HoTen + '?', 'Cộng tác viên sẽ không đăng nhập được nữa. Khách đã đăng ký vẫn được giữ.', 'Xoá', true).then(function (ok) {
          if (ok) goi('xoaChuCoSo', { ma: x.MaCanBo }).then(function () { delete DEM.dsChuCoSo; dongNganKeo(); toast('Đã xoá tài khoản'); lamMoi(); });
        });
      });
    });
  }
  function saoLoiMoiChuCoSo(x) {
    var url = location.origin + location.pathname;
    var txt = 'Chào ' + x.HoTen + ',\nPhường mời anh/chị dùng Ứng dụng khai báo cư trú để tự khai báo người đến ở tại ' + (x.coSo.length ? x.coSo.map(function (c) { return c.TenCoSo; }).join(', ') : 'cơ sở được cán bộ gán cho anh/chị') + '.\n' +
      '1. Mở ' + url + ' (trên điện thoại hoặc máy tính)\n2. Bấm "Đăng nhập bằng Google" bằng đúng Gmail: ' + x.Email + '\n3. Vào mục "Cơ sở của tôi" → "Khai báo" để nhập khách mới.\n' +
      'Cần sửa, xoá hồ sơ hoặc xác nhận khách rời đi thì gửi "đề xuất" trong ứng dụng, cán bộ phụ trách sẽ duyệt.\nHướng dẫn: ' + url.replace(/index\.html$/, '') + 'huongdan.html';
    var xong = function () { toast('Đã sao chép lời mời. Dán vào Zalo / tin nhắn để gửi cho cộng tác viên.'); };
    var duPhong = function () {
      var t = document.createElement('textarea'); t.value = txt; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); xong(); } catch (e) { toast('Không sao chép được, hãy chép tay.', 'loi'); }
      t.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(xong, duPhong); else duPhong();
  }

  // ---------- Điều hướng & sự kiện chung ----------
  function lamMoi() { route(); }
  function lamMoiToanBo(nut) {
    if (nut && nut.disabled) return;
    var cacNut = $$('[data-lam-moi]'), cu = nut ? nut.innerHTML : '';
    cacNut.forEach(function (b) { b.disabled = true; });
    if (nut) nut.innerHTML = ic('refresh', 'size-[18px] shrink-0 animate-spin') + '<span class="side-nav-label">Đang làm mới…</span>';
    DEM = {}; DANG_TAI = {}; S.luot = (S.luot || 0) + 1;
    return vaoHeThong().then(function () { toast('Dữ liệu đã được làm mới.'); }).finally(function () {
      $$('[data-lam-moi]').forEach(function (b) { b.disabled = false; });
      if (nut && document.body.contains(nut)) nut.innerHTML = cu;
    });
  }
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
  var thongBaoDangTai = false, thongBaoDaBiet = null;
  function capNhatThongBao() {
    if (!duocGhi() || document.hidden || thongBaoDangTai || !$('#view')) return;
    thongBaoDangTai = true;
    API.goi('dsThongBao', {}).then(function (ds) {
      if (!duocGhi()) return;
      var moi = ds.filter(function (r) { return !r.DaDoc; });
      if (!$('#thongBaoNoiO')) $('#view').insertAdjacentHTML('beforebegin', '<div id="thongBaoNoiO" class="px-4 py-2"></div>');
      $('#thongBaoNoiO').innerHTML = '<button id="moThongBaoNoiO" class="btn-soft">Thông báo chuyển nơi ở' + (moi.length ? ' (' + moi.length + ' chưa đọc)' : '') + '</button>';
      $('#moThongBaoNoiO').addEventListener('click', function () {
        moNganKeo(dauNganKeo('Thông báo chuyển nơi ở', 'Chỉ hiển thị hồ sơ thuộc phạm vi của bạn') + '<div class="flex-1 overflow-y-auto p-5">' + (ds.length ? ds.map(function (r) {
          return '<article class="border-b border-line py-3"><b>' + esc(r.HoTen || 'Hồ sơ công dân') + '</b><p class="text-sm">' + esc(r.noiDung) + '</p><p class="text-xs text-muted">' + vnTG(r.NgayTao) + '</p>' + (!r.DaDoc ? '<button class="btn-soft mt-2" data-doc-thong-bao="' + esc(r.MaThongBao) + '">Đánh dấu đã đọc</button>' : '<span class="text-xs text-muted">Đã đọc</span>') + '</article>';
        }).join('') : '<p>Chưa có thông báo.</p>') + '</div>');
        $$('[data-doc-thong-bao]').forEach(function (b) { b.addEventListener('click', function () { b.disabled=true; API.goi('docThongBao',{ma:b.dataset.docThongBao}).then(function () { b.textContent='Đã đọc'; capNhatThongBao(); }).catch(function (e) { b.disabled=false; toast(e.message,'loi'); }); }); });
      });
      if (thongBaoDaBiet && moi.some(function (r) { return thongBaoDaBiet.indexOf(r.MaThongBao) < 0; })) { sauKhiGhi('khach'); toast('Có công dân đã chuyển nơi ở. Xem thông báo chuyển nơi ở.'); }
      thongBaoDaBiet = ds.map(function (r) { return r.MaThongBao; });
    }).catch(function () {}).then(function () { thongBaoDangTai = false; });
  }
  setInterval(capNhatThongBao, 30000);
  document.addEventListener('visibilitychange', capNhatThongBao);
  function route() {
    var h = location.hash || '#/tong-quan';
    if ($('#dauMobi')) $('#dauMobi').classList.remove('an-di');
    S.chonCS = null; document.body.classList.remove('dang-chon'); dongBangDuoi();
    if (LICH_SU_TRANG[LICH_SU_TRANG.length - 1] !== h) LICH_SU_TRANG.push(h);
    if (LICH_SU_TRANG.length > 50) LICH_SU_TRANG.shift();
    dangLui = false;
    S.luot = (S.luot || 0) + 1;
    veNav();
    capNhatThongBao();
    if (!$('#drawerWrap').hidden) dongNganKeo();
    window.scrollTo(0, 0);
    veTrang();
  }
  function veTrang() {
    var h = decodeURIComponent(location.hash.replace('#/', '')).split('/');
    if (laChuCoSo()) {
      if (h[0] === 'tong-quan' || !h[0]) return trangCCTongQuan();
      if (h[0] === 'co-so') return trangCCCoSo();
      if (h[0] === 'tam-tru') return trangCCKhach();
      if (h[0] === 'de-xuat') return trangCCDeXuat();
      if (h[0] === 'quan-tri' || h[0] === 'tai-khoan') return trangTaiKhoan();
      return trangCCTongQuan();
    }
    if (h[0] === 'de-xuat' && duocGhi()) return trangDeXuatCB();
    if (h[0] === 'chu-co-so' && duocGhi()) return trangChuCoSo();
    if (h[0] === 'tam-tru') return trangTamTru(h[1] !== undefined ? h[1] : undefined);
    if (h[0] === 'co-so') { S.cheDoKT2 = false; return trangCoSo(); }
    if (h[0] === 'ho-kt2') { S.cheDoKT2 = true; return trangCoSo(); }
    if (h[0] === 'bao-cao') return trangBaoCao();
    if (h[0] === 'can-bo' && laAdmin()) return trangCanBo();
    if (h[0] === 'lich-su') return trangLichSu();
    if (h[0] === 'quan-tri' || h[0] === 'tai-khoan') return trangTaiKhoan();
    if (h[0] === 'bo-sung') return trangBoSung();
    if (h[0] === 'du-lieu-thu') return trangDuLieuThu();
    return trangTongQuan();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-cs-xu-ly],[data-them-khach],[data-xem-khach],[data-sua-khach],[data-di],[data-xoa-khach],[data-tt],[data-loai],[data-them-coso],[data-xem-coso],[data-sua-coso],[data-xoa-coso],[data-loc-loai],[data-loc-cskv],[data-them-cb],[data-sua-cb],[data-xoa-cb],[data-duyet-cb],[data-tuchoi-cb],[data-tra-cuu],[data-xuat-khach],[data-xuat-coso],[data-gia-han],[data-xem-them],[data-bs-loai],[data-bs-cskv],[data-sao-loi-moi],[data-toggle-ct10],[data-ct10-chip],[data-them-cs-thu],[data-them-kh-thu],[data-kt-coso],[data-trang],[data-homnay-chip],[data-xem-ds],[data-xuat-tq],[data-mo-loc],[data-xoa-loc],[data-ap-dung-loc],[data-loc-khach],[data-xoa-loc-khach],[data-ap-loc-khach],[data-bo-loc-khach],[data-thao-tac-kh],[data-tk-gh],[data-tk-di],[data-tk-ct10],[data-tk-sua],[data-tk-xem],[data-tab-kt],[data-thao-tac-cs],[data-tt-kt],[data-tt-xem],[data-tt-khach],[data-chon-nhieu],[data-tich-cs],[data-bulk],[data-nhap-ds],[data-tt-ds],[data-cc-xem],[data-cc-tab],[data-cc-co],[data-cc-sua],[data-cc-di],[data-cc-xoa],[data-dx-tab],[data-dx-duyet],[data-dx-kb],[data-dx-kt-all],[data-dx-tuchoi],[data-dx-huy],[data-them-ccs],[data-gan-ccs],[data-sua-ccs],[data-moi-ccs],[data-them-cs-cc],[data-nhap-kt2]');
    if (!t) return;
    var d = t.dataset;
    // Mỗi nút của cộng tác viên chỉ chạy trong đúng mục đang hiển thị.
    if (laChuCoSo()) {
      var muc = decodeURIComponent(location.hash.replace('#/', '') || 'tong-quan').split('/')[0];
      var dung = ('themKhach' in d || 'nhapDs' in d) ? (muc === 'co-so' || muc === 'tam-tru') :
        ('themCsCc' in d || 'ccXem' in d) ? muc === 'co-so' :
        ('xemKhach' in d || 'ccTab' in d || 'ccCo' in d || 'ccSua' in d || 'ccDi' in d || 'ccXoa' in d || 'xemThem' in d) ? muc === 'tam-tru' :
        ('dxHuy' in d) ? muc === 'de-xuat' : false;
      if (!dung) return;
    }
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
    if ('csXuLy' in d) { location.hash = '#/de-xuat/' + encodeURIComponent(d.csXuLy); return; }
    if ('themKhach' in d) return moKhaiBao(d.themKhach);
    if ('ccXem' in d) { S.ccLoc = S.ccLoc || { q: '', tt: 'dang', ma: '' }; S.ccLoc.ma = d.ccXem; location.hash = '#/tam-tru'; return; }
    if ('ccTab' in d) { S.ccLoc.tt = d.ccTab; return veCCKhach(); }
    if ('ccCo' in d) { S.ccLoc.ma = d.ccCo; return veCCKhach(); }
    if ('ccSua' in d) return formDeXuatSua(d.ccSua);
    if ('ccDi' in d) return formDeXuatDi(d.ccDi);
    if ('ccXoa' in d) return deXuatXoa(d.ccXoa);
    if ('dxTab' in d) { S.dxTab = d.dxTab; return trangDeXuatCB(); }
    if ('dxDuyet' in d) return xuLyDeXuat(d.dxDuyet, true);
    if ('dxKtAll' in d) {
      var maKT = (layDem('dsDeXuatCB') || []).filter(function (y) { return y.Loai === 'Kiểm tra' && y.TrangThai === 'Chờ duyệt'; }).map(function (y) { return y.MaDeXuat; });
      return hoi('Duyệt tất cả?', 'Ghi nhận đã kiểm tra cho ' + maKT.length + ' cơ sở cán bộ đã gửi đề nghị.', 'Duyệt tất cả').then(function (ok) {
        if (ok) goi('duyetNhieuKiemTra', { mas: maKT }).then(function (kq) { delete DEM.dsDeXuatCB; sauKhiGhi('coso'); toast('Đã duyệt ' + kq.daDuyet + ' cơ sở' + (kq.loi.length ? ', ' + kq.loi.length + ' đề nghị lỗi (xem từng dòng)' : '')); lamMoi(); });
      });
    }
    if ('dxKb' in d) { var xk = (layDem('dsDeXuatCB') || []).filter(function (y) { return y.MaDeXuat === d.dxKb; })[0]; return xk ? formKhach(null, null, null, xk) : undefined; }
    if ('dxTuchoi' in d) return xuLyDeXuat(d.dxTuchoi, false);
    if ('dxHuy' in d) return huyDeXuatCC(d.dxHuy);
    if ('themCsCc' in d) return formCoSoMoiCC();
    if ('themCcs' in d) return formChuCoSo(null);
    if ('ganCcs' in d) {
      var mas = $$('[data-chon-ccs]:checked').map(function (i) { return i.value; }), pt = $('#ccsGanPT').value;
      if (!mas.length) return toast('Chưa chọn cộng tác viên nào (tích ô vuông đầu dòng).', 'canh');
      var tenPT = pt ? $('#ccsGanPT').selectedOptions[0].textContent : 'không cán bộ nào (gỡ gán)';
      return hoi('Gán cán bộ phụ trách?', mas.length + ' cộng tác viên sẽ do ' + tenPT + ' phụ trách. Khai báo và đề xuất của họ chỉ cán bộ này (và Admin) duyệt được.', 'Gán').then(function (ok) {
        var gui = function (xn) { return goi('ganChuCoSo', { mas: mas, NguoiPhuTrach: pt, xacNhan: xn }).then(function (kq) {
          if (kq.canhBao) return hoiNgoaiDiaBan(kq.canhBao, function () { return gui(true); });
          delete DEM.dsChuCoSo; delete DEM.dsDeXuatCB; toast('Đã gán ' + kq.daGan + ' cộng tác viên'); lamMoi();
        }); };
        if (ok) gui(false);
      });
    }
    if ('suaCcs' in d) return formChuCoSo(dsChuCoSo.filter(function (x) { return x.MaCanBo === d.suaCcs; })[0]);
    if ('moiCcs' in d) return saoLoiMoiChuCoSo(dsChuCoSo.filter(function (x) { return x.MaCanBo === d.moiCcs; })[0]);
    if ('suaKhach' in d) {
      var sanK = (layDem('dsTamTru') || []).filter(function (x) { return x.ID === d.suaKhach; })[0];
      return sanK ? formKhach(sanK) : goi('layTamTru', { id: d.suaKhach }).then(function (r) { formKhach(r); });
    }
    if ('di' in d) return xacNhanDi(d.di, 'caPhong' in d);
    if ('giaHan' in d) return giaHan(d.giaHan, 'caPhong' in d);
    if ('xemThem' in d) { S.phanTrang[d.xemThem].so += MOI_TRANG; return ({ khach: veDsKhach, coso: veDsCoSo, bosung: veBoSung, ccKhach: veCCKhach })[d.xemThem](); }
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
    if ('locKhach' in d) return moBoLocKhach();
    if ('xoaLocKhach' in d) return apDungLocKhach(true);
    if ('apLocKhach' in d) return apDungLocKhach(false);
    if ('boLocKhach' in d) { S.loc[d.boLocKhach] = ''; return veDsKhach(); }
    if ('thaoTacKh' in d) return moThaoTacKhach(d.thaoTacKh);
    if ('tkGh' in d) { dongBangDuoi(); return giaHan(d.tkGh, false); }
    if ('tkDi' in d) { dongBangDuoi(); return xacNhanDi(d.tkDi, false); }
    if ('tkSua' in d) { dongBangDuoi(); var rk = dsKhach.filter(function (x) { return x.ID === d.tkSua; })[0]; return rk ? formKhach(rk) : null; }
    if ('tkXem' in d) { dongBangDuoi(); return xemKhach(d.tkXem); }
    if ('tkCt10' in d) { dongBangDuoi(); return doiCT10(d.tkCt10); }
    if ('tabKt' in d) { S.locCS.kt = d.tabKt; return veDsCoSo(); }
    if ('xoaLoc' in d) return apDungLocCoSo(true);
    if ('apDungLoc' in d) return apDungLocCoSo(false);
    if ('thaoTacCs' in d) return moThaoTacCoSo(d.thaoTacCs);
    if ('ttKt' in d) { dongBangDuoi(); return kiemTraCoSo(d.ttKt); }
    if ('ttXem' in d) { dongBangDuoi(); return xemCoSo(d.ttXem); }
    if ('ttKhach' in d) { dongBangDuoi(); return formKhach(null, d.ttKhach); }
    if ('ttDs' in d) { dongBangDuoi(); return formNhapDS(d.ttDs); }
    if ('nhapDs' in d) return moKhaiBao('');
    if ('chonNhieu' in d) { S.chonCS = S.chonCS ? null : {}; $$('[data-chon-nhieu]').forEach(function (b) { b.setAttribute('aria-pressed', String(!!S.chonCS)); }); return veDsCoSo(); }
    if ('tichCs' in d) { if (S.chonCS[d.tichCs]) delete S.chonCS[d.tichCs]; else S.chonCS[d.tichCs] = 1; return veDsCoSo(); }
    if ('bulk' in d) return bulkCoSo(d.bulk);
    if ('xuatTq' in d) return xuatVoiTrangThai(t, xuatTongQuan);
    if ('xemDs' in d) {
      var locMoi = { q: '', trangThai: '', maCoSo: '', tu: '', den: '', loai: '' };
      if (d.xemDs === 'chuakhaibao') { locMoi.chuaKhaiBao = true; S.loc = locMoi; location.hash = '#/tam-tru'; }
      else if (d.xemDs === 'ct10') { locMoi.ct10 = true; S.loc = locMoi; location.hash = '#/tam-tru'; }
      else if (d.xemDs === 'homnay') { locMoi.homNay = true; locMoi.trangThai = '*'; S.loc = locMoi; location.hash = '#/tam-tru'; }
      else { S.locCS = { q: '', loaiHinh: '', cskv: '', tdp: '', kt: d.xemDs.slice(3) }; location.hash = '#/co-so'; }
      return;
    }
    if ('toggleCt10' in d) return doiCT10(d.toggleCt10);
    if ('xoaCoso' in d) {
      dongBangDuoi();
      var csXoa = (S.coSo || []).filter(function (x) { return x.MaCoSo === d.xoaCoso; })[0];
      var dungHD = !!(csXoa && csXoa.TrangThaiHoatDong === 'Dừng hoạt động');
      return hoi('Xoá cơ sở ' + (csXoa ? esc(csXoa.TenCoSo) : d.xoaCoso) + '?', dungHD ? 'Cơ sở đã dừng hoạt động nên xoá được bất kỳ lúc nào. TOÀN BỘ hồ sơ công dân của cơ sở này cũng bị xoá (nhật ký vẫn lưu bản sao), đồng thời gỡ khỏi cộng tác viên đang phụ trách. Cơ sở này đã không còn được thống kê.' : 'Chỉ xoá được cơ sở chưa có bản ghi tạm trú nào. Nếu cơ sở ngừng kinh doanh, hãy sửa "Hoạt động" thành "Dừng hoạt động" (khi đó xoá được bất kỳ lúc nào và không còn được thống kê).', 'Xoá', true)
        .then(function (ok) { if (ok) goi('xoaCoSo', { ma: d.xoaCoso }).then(function (kq) { vaCoSo(null, d.xoaCoso); sauKhiGhi('coso'); sauKhiGhi('khach'); toast('Đã xoá cơ sở' + (kq && kq.daXoaHoSo ? ' và ' + kq.daXoaHoSo + ' hồ sơ công dân' : '')); dongNganKeo(); lamMoi(); }); });
    }
    if ('xemCoso' in d) return xemCoSo(d.xemCoso);
    if ('nhapKt2' in d) return formNhapKT2();
    if ('locLoai' in d) { if (d.locLoai === 'KT2 đến') { S.locCS = { q: '', loaiHinh: '', cskv: '', tdp: '' }; location.hash = '#/ho-kt2'; return; } S.locCS = { q: '', loaiHinh: d.locLoai, cskv: '', tdp: '' }; location.hash = '#/co-so'; return; }
    if ('locCskv' in d) { S.locCS = { q: '', loaiHinh: '', cskv: d.locCskv, tdp: '' }; location.hash = '#/co-so'; return; }
    if ('traCuu' in d) return traCuuCCCD(d.traCuu);
    if ('xuatKhach' in d) return xuatVoiTrangThai(t, xuatKhach);
    if ('xuatCoso' in d) return xuatVoiTrangThai(t, xuatCoSo);
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
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-lam-moi]'); if (b) { e.preventDefault(); lamMoiToanBo(b); } });
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
    return taoPhien().then(function () { return API.goi('batDau', { kem: ['tongQuan', 'dsCoSo', 'dsTamTru'] }); }).then(function (kq) {
      ['tongQuan', 'dsCoSo', 'dsTamTru'].forEach(function (k) { if (kq[k]) datDem(k, kq[k]); });
      S.user = kq.toi; S.dm = kq.danhMuc; S.soChoDuyet = kq.soChoDuyet || 0; S.phamVi = kq.phamVi || { toanPhuong: true };
      $('#loginWrap').hidden = true;
      veUser();
      if (!daGanRoute) { window.addEventListener('hashchange', route); daGanRoute = true; }
      route();
      // Chỉ tải ngầm dữ liệu nhẹ khi trình duyệt rảnh. Lịch sử, báo cáo và sao lưu
      // được tải đúng lúc mở trang để không tranh băng thông với thao tác đầu phiên.
      var taiNen = function () {
        if (laChuCoSo()) return;   // cộng tác viên không dùng lịch sử/báo cáo
        var viec = [];
        if (duocGhi()) viec.push(['dsChuCoSo', 'dsChuCoSo', {}], ['dsDeXuat', 'dsDeXuat', {}]);
        if (laAdmin()) viec.push(['dsCanBo', 'dsCanBo', {}]);
        viec.reduce(function (chuoi, v) {
          return chuoi.then(function () { if (!DEM[v[0]]) return goiChung(v[0], v[1], v[2]).then(function (d) { if (!DEM[v[0]]) datDem(v[0], d); }).catch(function () {}); });
        }, Promise.resolve());
      };
      if ('requestIdleCallback' in window) requestIdleCallback(taiNen, { timeout: 4000 });
      else setTimeout(taiNen, 2500);
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
  var PB_GIAO_DIEN = '2.26.0';
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
