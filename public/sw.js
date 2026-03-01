/* ============================================================
   Service Worker — Import Export BF
   Version : 2
   Stratégies : Cache First (statique), Network First (pages),
                Network Only (API), Background Sync, Push
   ============================================================ */

const CACHE_VERSION = 'v2';
const CACHES = {
  static:  `iebf-static-${CACHE_VERSION}`,
  dynamic: `iebf-dynamic-${CACHE_VERSION}`,
  images:  `iebf-images-${CACHE_VERSION}`,
};

const MAX_DYNAMIC = 40;
const MAX_IMAGES  = 80;

/* Assets à pré-cacher à l'installation */
const PRECACHE_ASSETS = [
  '/offline.html',
  '/logo_short.png',
  '/logo_short-96x96.png',
  '/logo_short-144x144.png',
];

/* ── Install ───────────────────────────────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHES.static)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate ──────────────────────────────────────────────── */
self.addEventListener('activate', (event) => {
  const current = Object.values(CACHES);
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !current.includes(k)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

/* ── Fetch ─────────────────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Ignorer les requêtes non-GET */
  if (request.method !== 'GET') return;

  /* Ignorer les requêtes non HTTP(S) */
  if (!url.protocol.startsWith('http')) return;

  /* Ignorer les extensions navigateur */
  if (url.origin.startsWith('chrome-extension')) return;

  /* ── API : Network Only ── */
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    event.respondWith(networkOnly(request));
    return;
  }

  /* ── Assets Next.js (immutables, hash dans le nom) ── */
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, CACHES.static));
    return;
  }

  /* ── Images optimisées Next.js ── */
  if (url.pathname.startsWith('/_next/image')) {
    event.respondWith(cacheFirst(request, CACHES.images, MAX_IMAGES));
    return;
  }

  /* ── Images & fonts statiques ── */
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    /\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|otf)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, CACHES.images, MAX_IMAGES));
    return;
  }

  /* ── Google Fonts ── */
  if (
    url.origin.includes('fonts.googleapis.com') ||
    url.origin.includes('fonts.gstatic.com')
  ) {
    event.respondWith(cacheFirst(request, CACHES.static));
    return;
  }

  /* ── Pages : Network First avec fallback offline ── */
  event.respondWith(networkFirst(request));
});

/* ── Stratégies ────────────────────────────────────────────── */

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Hors ligne — requête non disponible' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function cacheFirst(request, cacheName, maxEntries = null) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      if (maxEntries) trimCache(cacheName, maxEntries);
    }
    return response;
  } catch {
    return new Response('', { status: 504, statusText: 'Gateway Timeout' });
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHES.dynamic);

  try {
    const response = await fetch(request);
    /* Mettre en cache uniquement les navigations réussies */
    if (response.ok && request.mode === 'navigate') {
      await cache.put(request, response.clone());
      trimCache(CACHES.dynamic, MAX_DYNAMIC);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    /* Fallback offline pour les navigations */
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) return offlinePage;
    }

    return new Response('', { status: 504, statusText: 'Gateway Timeout' });
  }
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys  = await cache.keys();
  if (keys.length > maxEntries) {
    await Promise.all(
      keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k))
    );
  }
}

/* ── Push Notifications ────────────────────────────────────── */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Import Export BF', body: event.data.text() };
  }

  const options = {
    body:               data.body || '',
    icon:               '/logo_short-96x96.png',
    badge:              '/logo_short-96x96.png',
    image:              data.image   || undefined,
    vibrate:            [200, 100, 200, 100, 200],
    tag:                data.tag     || 'iebf-notif',
    renotify:           data.renotify       || false,
    requireInteraction: data.requireInteraction || false,
    silent:             data.silent  || false,
    actions:            data.actions || [],
    data: {
      url:            data.url || '/',
      notificationId: data.id,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Import Export BF', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) return client.focus();
      }
      return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('notificationclose', () => {
  /* Analytics : notification fermée sans clic */
});

/* ── Background Sync ───────────────────────────────────────── */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-orders') {
    event.waitUntil(syncPendingRequests('sync-pending-orders'));
  }
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingRequests('sync-pending-actions'));
  }
});

async function syncPendingRequests(storeTag) {
  try {
    const db       = await openIDB();
    const pending  = await idbGetAll(db, 'pending-requests');
    const filtered = pending.filter((r) => r.tag === storeTag);

    for (const item of filtered) {
      try {
        const response = await fetch(item.url, {
          method:  item.method,
          headers: item.headers,
          body:    item.body,
        });
        if (response.ok) {
          await idbDelete(db, 'pending-requests', item.id);
          const allClients = await clients.matchAll({ includeUncontrolled: true });
          allClients.forEach((c) =>
            c.postMessage({ type: 'SYNC_SUCCESS', id: item.id, tag: storeTag })
          );
        }
      } catch {
        /* Réessai au prochain sync */
      }
    }
  } catch {
    /* IndexedDB indisponible */
  }
}

/* ── Periodic Background Sync ──────────────────────────────── */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-data') {
    event.waitUntil(refreshCriticalData());
  }
});

async function refreshCriticalData() {
  /* Pré-charger les pages critiques en arrière-plan */
  const urlsToRefresh = ['/admin/caisse'];
  const cache = await caches.open(CACHES.dynamic);
  await Promise.allSettled(
    urlsToRefresh.map((url) =>
      fetch(url).then((res) => { if (res.ok) cache.put(url, res); }).catch(() => {})
    )
  );
}

/* ── Messages depuis les clients ───────────────────────────── */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_URLS':
      if (Array.isArray(payload?.urls)) {
        caches.open(CACHES.dynamic)
          .then((cache) => cache.addAll(payload.urls))
          .catch(() => {});
      }
      break;

    case 'CLEAR_ALL_CACHES':
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
      break;

    case 'GET_CACHE_SIZE': {
      getCacheSize().then((size) => {
        event.source?.postMessage({ type: 'CACHE_SIZE', size });
      });
      break;
    }

    case 'QUEUE_REQUEST':
      if (payload) queueRequest(payload).catch(() => {});
      break;

    default:
      break;
  }
});

/* ── IndexedDB helpers ─────────────────────────────────────── */
function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('iebf-sw-db', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pending-requests')) {
        db.createObjectStore('pending-requests', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess  = () => resolve(req.result);
    req.onerror    = () => reject(req.error);
  });
}

function idbGetAll(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function idbDelete(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function queueRequest(payload) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('pending-requests', 'readwrite');
    const req = tx.objectStore('pending-requests').add(payload);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function getCacheSize() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const { usage, quota } = await navigator.storage.estimate();
    return { usage, quota };
  }
  return { usage: 0, quota: 0 };
}
