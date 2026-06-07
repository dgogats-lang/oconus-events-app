// Travel Ops — Service Worker
// Strategy:
//   /_next/static/* → cache-first (fingerprinted assets never change)
//   everything else  → network-first with cache fallback (pages get cached on visit)

const STATIC_CACHE = "ops-static-v1";
const PAGE_CACHE   = "ops-pages-v1";

// ─── install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", () => {
  self.skipWaiting();
});

// ─── activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  const keep = new Set([STATIC_CACHE, PAGE_CACHE]);
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ─── fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Skip auth callbacks, API routes, and Next.js internals (except static)
  const skip =
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.includes("/__nextjs") ||
    url.searchParams.has("callbackUrl") ||
    url.pathname.startsWith("/login");
  if (skip) return;

  // ── Cache-first: fingerprinted static assets ────────────────────────────────
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })
    );
    return;
  }

  // ── Network-first: pages and other public assets ────────────────────────────
  e.respondWith(
    caches.open(PAGE_CACHE).then(async (cache) => {
      try {
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        // Fallback for uncached navigation
        return new Response(
          "<!doctype html><html><head><meta charset=utf-8><meta name=viewport content='width=device-width'><title>Ops — Offline</title><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100dvh;margin:0;background:#f9fafb;color:#374151}.card{background:#fff;border-radius:16px;padding:32px 28px;max-width:320px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.08)}h2{margin:0 0 8px;font-size:18px;color:#0c2340}p{margin:0;font-size:14px;color:#9ca3af;line-height:1.5}</style></head><body><div class=card><h2>You're offline</h2><p>Open the pages you need while you have a connection and they'll be available here.</p></div></body></html>",
          { headers: { "Content-Type": "text/html" } }
        );
      }
    })
  );
});
