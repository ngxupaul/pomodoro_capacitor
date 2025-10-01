// Simple service worker for PWA functionality
const CACHE_NAME = 'pomodoro-timer-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache install failed:', error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, return offline page
        return caches.match('/');
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for timer (basic implementation)
self.addEventListener('sync', (event) => {
  if (event.tag === 'pomodoro-timer-sync') {
    event.waitUntil(
      // Handle background timer sync if needed
      console.log('Background sync triggered')
    );
  }
});

// Handle background messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TIMER_UPDATE') {
    // Handle timer updates from main thread
    console.log('Timer update received:', event.data);
  }
});


