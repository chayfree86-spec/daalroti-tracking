/**
 * Auto Cache Manager
 * ------------------
 * Detects new app deployments by comparing build versions.
 * When a new version is detected:
 *   1. Unregisters all Service Workers
 *   2. Clears all CacheStorage entries
 *   3. Stores the new version
 *   4. Hard-reloads the page so fresh assets load
 *
 * On first visit (no stored version), simply stores the current version.
 */

const VERSION_KEY = 'daalroti_app_version';

/**
 * Call this BEFORE mounting React.
 * Returns `true` if the app should proceed to render.
 * Returns `false` if a reload was triggered (page will navigate away).
 */
export async function checkAndClearCache() {
  try {
    // __APP_VERSION__ is injected by Vite at build time (see vite.config.js)
    const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null;

    // Dev mode or missing version — skip cache management
    if (!currentVersion) return true;

    const storedVersion = localStorage.getItem(VERSION_KEY);

    // First visit ever — just store version and continue
    if (!storedVersion) {
      localStorage.setItem(VERSION_KEY, currentVersion);
      return true;
    }

    // Same version — nothing to do
    if (storedVersion === currentVersion) return true;

    // ─── NEW VERSION DETECTED — NUKE OLD CACHES ───
    console.log(`[CacheManager] New version detected: ${storedVersion} → ${currentVersion}`);

    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
      console.log(`[CacheManager] Unregistered ${registrations.length} service worker(s)`);
    }

    // 2. Clear all CacheStorage entries
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log(`[CacheManager] Cleared ${cacheNames.length} cache(s)`);
    }

    // 3. Store new version
    localStorage.setItem(VERSION_KEY, currentVersion);

    // 4. Hard reload to fetch fresh assets
    console.log('[CacheManager] Reloading with fresh assets...');
    window.location.reload();
    return false; // Render will not proceed — page is reloading

  } catch (err) {
    console.warn('[CacheManager] Error during cache check:', err);
    return true; // On error, proceed normally
  }
}
