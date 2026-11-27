const C = "festas-v3";
try {
  importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js", "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");
  firebase.initializeApp({
    apiKey: "AIzaSyB5u5rwmE2-r8ScCWPCEalHZ_4bylYeheE",
    authDomain: "natal-familia-2026.firebaseapp.com",
    projectId: "natal-familia-2026",
    storageBucket: "natal-familia-2026.firebasestorage.app",
    messagingSenderId: "531914304620",
    appId: "1:531914304620:web:c4ce8c1870860f3e227c49"
  });
  firebase.messaging().onBackgroundMessage(p => {
    const d = p.data || {};
    return self.registration.showNotification(d.title || "Festas em Família", {body: d.body || "", icon: "icon-192.png", badge: "icon-192.png", tag: d.tag});
  });
} catch (e) {}

self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(["./", "./index.html", "./manifest.webmanifest", "./icon-192.png"])));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone(); caches.open(C).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request)));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({type: "window", includeUncontrolled: true}).then(l => l.length ? l[0].focus() : clients.openWindow("./")));
});
