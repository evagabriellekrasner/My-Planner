// My Planner service worker: shows reminders, including ones pushed while the planner is closed.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: 'My Planner', body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(data.title || 'My Planner', {
    body: data.body || '',
    tag: data.tag || undefined,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: { page: data.page || 'today' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const page = (event.notification.data && event.notification.data.page) || 'today';
  const url = new URL('./#' + page, self.registration.scope).href;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if (c.url.startsWith(self.registration.scope)) { await c.focus(); c.postMessage({ goPage: page }); return; } }
    await self.clients.openWindow(url);
  })());
});
