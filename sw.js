// ===== SERVICE WORKER - Program Tinggi Badan =====
const CACHE_NAME = 'tinggi-badan-v1';
const ASSETS = ['/', '/index.html', '/manifest.json'];

// Install: cache assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// ===== ALARM SCHEDULING =====
// Listen for messages from main app
self.addEventListener('message', e => {
  if (e.data.type === 'SET_ALARMS') {
    scheduleAlarms(e.data.alarms);
  }
});

let alarmCheckInterval = null;

function scheduleAlarms(alarms) {
  if (alarmCheckInterval) clearInterval(alarmCheckInterval);

  // Check every 30 seconds
  alarmCheckInterval = setInterval(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();

    // Only fire in the first 30 seconds of the target minute
    if (s > 30) return;

    const notifications = {
      morning: {
        hour: 6, minute: 0,
        title: '☀️ Bangun Pagi!',
        body: 'Mulai hari dengan stretching pagi & sarapan bergizi. Semangat!',
        tag: 'alarm-morning'
      },
      stretch: {
        hour: 21, minute: 0,
        title: '🧘 Stretching Malam!',
        body: 'Saatnya 15-20 menit stretching. Cobra pose, cat-cow, child\'s pose!',
        tag: 'alarm-stretch'
      },
      sleep: {
        hour: 22, minute: 0,
        title: '😴 Waktunya Tidur!',
        body: 'Matikan HP & tidur sekarang. HGH diproduksi maksimal saat tidur malam!',
        tag: 'alarm-sleep'
      }
    };

    Object.entries(notifications).forEach(([type, cfg]) => {
      if (alarms[type] && h === cfg.hour && m === cfg.minute) {
        self.registration.showNotification(cfg.title, {
          body: cfg.body,
          icon: '/icon-192.png',
          badge: '/icon-72.png',
          tag: cfg.tag,
          renotify: false,
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200],
          actions: [
            { action: 'ok', title: '✅ Siap!' },
            { action: 'snooze', title: '⏰ 5 menit lagi' }
          ]
        });
      }
    });
  }, 30000);
}

// Handle notification click
self.addEventListener('notificationclick', e => {
  e.notification.close();

  if (e.action === 'snooze') {
    // Snooze 5 minutes
    setTimeout(() => {
      self.registration.showNotification('⏰ Pengingat!', {
        body: e.notification.body,
        icon: '/icon-192.png',
        tag: e.notification.tag + '-snooze',
        requireInteraction: true,
        vibrate: [200, 100, 200]
      });
    }, 5 * 60 * 1000);
    return;
  }

  // Open app on click
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('/');
    })
  );
});
