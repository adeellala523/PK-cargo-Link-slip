/**
 * subdomain.ts — Yango-style two-app split.
 *
 * Same codebase serves two experiences:
 *   pkcargolink.com          → ADDA MANAGER side (post loads, like Yango passenger app)
 *   driver.pkcargolink.com    → DRIVER side (find & accept loads, like Yango Pro driver app)
 *
 * Detection is purely hostname-based so the same build works on both domains.
 */

export type AppMode = 'adda' | 'driver';

/** True when running on driver.pkcargolink.com (or any *.driver.* / localhost driver preview) */
export function isDriverSubdomain(): boolean {
  try {
    const host = (window.location.hostname || '').toLowerCase();
    if (host.startsWith('driver.')) return true;
    // Local dev preview: ?app=driver or #driver-app
    const q = new URLSearchParams(window.location.search);
    if (q.get('app') === 'driver') return true;
    if (window.location.hash === '#driver-app') return true;
    return false;
  } catch {
    return false;
  }
}

export function getAppMode(): AppMode {
  return isDriverSubdomain() ? 'driver' : 'adda';
}

/** Canonical URL of the other side, for cross-links (login pages, footers) */
export function getOtherSideUrl(): string {
  try {
    const { protocol, hostname, port } = window.location;
    const portPart = port ? `:${port}` : '';
    if (isDriverSubdomain()) {
      const main = hostname.replace(/^driver\./i, '');
      return `${protocol}//${main}${portPart}/`;
    }
    // On localhost keep same host, use ?app=driver for preview
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}${portPart}/?app=driver`;
    }
    return `${protocol}//driver.${hostname}${portPart}/`;
  } catch {
    return 'https://driver.pkcargolink.com/';
  }
}

export const DRIVER_SUBDOMAIN_HOST = 'driver.pkcargolink.com';
