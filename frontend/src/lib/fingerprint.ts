/*
  Hardware-based device fingerprint for anti-abuse protection.
  
  Unlike a random ID in localStorage, this generates a COMPOSITE fingerprint
  from hardware/software signals that produce the SAME hash across different
  browsers on the same device (Chrome, Firefox, Edge, Incognito — all identical).

  Layers:
  1. Canvas fingerprint — GPU/driver/OS-specific rendering
  2. Screen signature — resolution, color depth, pixel ratio
  3. WebGL renderer — GPU vendor + model string
  4. Timezone + platform + language
  
  The combined hash is deterministic per device, making it much harder
  to vote twice by switching browsers.
*/

const FINGERPRINT_KEY = 'pulsepoll_device_fp';

/**
 * Generate a canvas-based fingerprint.
 * The same text rendered on the same GPU/driver/OS produces identical pixel data,
 * but differs across devices due to font rendering, anti-aliasing, and GPU differences.
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    // Use a mix of rendering techniques to maximize uniqueness
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(100, 1, 62, 20);

    ctx.fillStyle = '#069';
    ctx.font = '14px Arial';
    ctx.fillText('PulsePoll 🎯', 2, 15);

    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.font = '18px Georgia';
    ctx.fillText('Fingerprint', 4, 45);

    // Arc + stroke to vary by anti-aliasing engine
    ctx.beginPath();
    ctx.arc(50, 50, 10, 0, Math.PI * 2);
    ctx.strokeStyle = '#3c3';
    ctx.stroke();

    return canvas.toDataURL();
  } catch {
    return 'canvas-error';
  }
}

/**
 * Get WebGL renderer info — same GPU = same string across all browsers.
 */
function getWebGLRenderer(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl || !(gl instanceof WebGLRenderingContext)) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'no-debug-info';

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    return `${vendor}~${renderer}`;
  } catch {
    return 'webgl-error';
  }
}

/**
 * Get screen-based signals — identical across browsers on same display.
 */
function getScreenSignature(): string {
  return [
    screen.width,
    screen.height,
    screen.colorDepth,
    window.devicePixelRatio || 1,
    screen.availWidth,
    screen.availHeight,
  ].join('x');
}

/**
 * Get platform/timezone signals.
 */
function getPlatformSignature(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const platform = navigator.platform || '';
  const lang = navigator.language || '';
  const cores = navigator.hardwareConcurrency || 0;
  const touchPoints = navigator.maxTouchPoints || 0;
  return `${tz}|${platform}|${lang}|${cores}|${touchPoints}`;
}

/**
 * Pure-JS fallback hash (FNV-1a variant, 128-bit) for non-secure contexts.
 * crypto.subtle is ONLY available in secure contexts (HTTPS or localhost).
 * Network IPs like http://192.168.x.x will NOT have it.
 */
function fallbackHash(message: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < message.length; i++) {
    const ch = message.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hash = (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  // Double-hash for longer output
  let h3 = 0x12345678;
  let h4 = 0x9abcdef0;
  for (let i = 0; i < message.length; i++) {
    const ch = message.charCodeAt(i);
    h3 = Math.imul(h3 ^ ch, 1540483477);
    h4 = Math.imul(h4 ^ ch, 0x27d4eb2d);
  }
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
  return hash + (h4 >>> 0).toString(16).padStart(8, '0') + (h3 >>> 0).toString(16).padStart(8, '0');
}

/**
 * Hash a string — uses SHA-256 in secure contexts, falls back to FNV-1a otherwise.
 */
async function hashString(message: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return fallbackHash(message);
}

/**
 * Safe localStorage helpers — storage throws in non-secure contexts.
 */
function safeGetItem(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSetItem(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* noop */ }
}
function safeRemoveItem(key: string): void {
  try { localStorage.removeItem(key); } catch { /* noop */ }
}

/**
 * Generate a hardware-based device fingerprint.
 * This produces the SAME hash across Chrome, Firefox, Edge, and Incognito
 * on the same physical device.
 * 
 * Cached in localStorage for performance (avoids re-computing canvas every time).
 */
export async function getDeviceFingerprint(): Promise<string> {
  // Check cache first
  const cached = safeGetItem(FINGERPRINT_KEY);
  if (cached) return cached;

  // Compose from all hardware signals
  const components = [
    getCanvasFingerprint(),
    getWebGLRenderer(),
    getScreenSignature(),
    getPlatformSignature(),
  ].join('|||');

  const hash = await hashString(components);

  // Cache the result
  safeSetItem(FINGERPRINT_KEY, hash);

  return hash;
}

/**
 * Force regenerate the fingerprint (clear cache and recompute).
 * Call this if you suspect the cached value is stale.
 */
export async function regenerateFingerprint(): Promise<string> {
  safeRemoveItem(FINGERPRINT_KEY);
  return getDeviceFingerprint();
}

/*
  Check if user has voted on a specific poll locally.
  This provides immediate UI feedback before hitting the server.
*/
export function hasVotedLocally(pollId: string): boolean {
  const votedPolls = JSON.parse(safeGetItem('voted_polls') || '[]');
  return votedPolls.includes(pollId);
}

/*
  Mark a poll as voted locally.
*/
export function markPollAsVoted(pollId: string): void {
  const votedPolls = JSON.parse(safeGetItem('voted_polls') || '[]');
  if (!votedPolls.includes(pollId)) {
    votedPolls.push(pollId);
    safeSetItem('voted_polls', JSON.stringify(votedPolls));
  }
}

