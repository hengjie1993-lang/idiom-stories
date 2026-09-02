// 透明网络穿透版 Service Worker。
// 设计目标：彻底消除「升级后仍显示旧版」这类缓存陷阱。
//  - 不缓存 index.html / stories.json 等任何资源（全部走网络），保证内容永远最新。
//  - 激活后立即 claim 所有页面，并强制刷新每一个已打开的页面，
//    把手机端可能滞留的旧 HTML 一次性甩掉。
//  - 保留 SW 以支持「添加到主屏幕」，但不再承担缓存职责。
//  - 微信内置浏览器禁用了 SW（见 index.html 的 UA 判定），此处逻辑对微信不生效。

const APP_VERSION = '13';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
      const clients = await self.clients.matchAll({ includeUncontrolled: true });
      clients.forEach((c) => {
        try { c.navigate(c.url); } catch (e) { /* 忽略个别客户端导航失败 */ }
      });
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // 完全穿透：直接请求网络，不做任何缓存。
  event.respondWith(fetch(event.request));
});
