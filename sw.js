// Service worker tối giản: KHÔNG lưu bộ nhớ đệm gì cả (mọi yêu cầu đi thẳng ra mạng như bình thường).
// Chỉ tồn tại để trình duyệt (Android/Chrome) coi trang là ứng dụng cài được lên màn hình chính,
// không ảnh hưởng đến cơ chế tự cập nhật giao diện (kiemTraBanMoi trong app.js).
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) { e.respondWith(fetch(e.request)); });
