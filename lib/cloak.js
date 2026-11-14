/**
 * Cloaking & Bot Detection Logic for Next.js
 * Evaluates visitors against:
 * - Query param overrides (?cl=bot / ?cl=human) with sessionStorage persistence
 * - Verified crawler IP ranges (Meta, Google, Bing, Social Previewers)
 * - Known automated reviewer / crawler user-agents
 * - Headless browser automation fingerprints (webdriver, puppeteer, selenium, playwright)
 * - Cloud datacenter proxy signatures & headless WebGL fingerprints
 */

export const BOT_UA =
  /googlebot|google-inspectiontool|googleother|google-extended|storebot-google|bingbot|bingpreview|slurp|duckduckbot|baiduspider|yandex|sogou|applebot|facebookexternalhit|facebookcatalog|meta-externalagent|meta-externalfetcher|twitterbot|linkedinbot|tiktokbot|bytespider|ia_archiver|archive\.org_bot|adsbot-google|mediapartners-google|apis-google|feedfetcher-google|pinterest|redditbot|quora link preview|embedly|bitlybot|vkshare|skypeuripreview|chrome-lighthouse|petalbot|semrushbot|ahrefsbot|gptbot|claudebot|perplexitybot|oai-searchbot|ccbot/i;

export const PREVIEW_UA =
  /whatsapp|slackbot|discordbot|twitterbot|facebookexternalhit|linkedinbot|telegrambot|skypeuripreview|embedly|redditbot|imessage|pinterest/i;

export const AUTOMATION_UA =
  /headlesschrome|phantomjs|selenium|puppeteer|playwright|electron/i;

export const REAL_BROWSER_UA =
  /(Chrome\/\d+.*Safari|Firefox\/\d+|Version\/\d+.*Safari|Mobile\/[A-Z0-9]+.*Safari)/i;

/**
 * Fast client-side classification
 */
export function classifyClient() {
  if (typeof window === 'undefined') {
    return { isBot: false, score: 0, reasons: [] };
  }

  const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
  const reasons = [];
  let score = 0;

  // 1. URL Parameter Overrides (e.g. ?cl=bot or ?cl=human)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const force = urlParams.get('cl');
    if (force === 'bot') {
      sessionStorage.setItem('cloak_force', 'bot');
      return { isBot: true, score: 100, reasons: ['force:bot'] };
    }
    if (force === 'human') {
      sessionStorage.setItem('cloak_force', 'human');
      return { isBot: false, score: -100, reasons: ['force:human'] };
    }

    const savedForce = sessionStorage.getItem('cloak_force');
    if (savedForce === 'bot') return { isBot: true, score: 100, reasons: ['session:bot'] };
    if (savedForce === 'human' && !BOT_UA.test(ua)) {
      return { isBot: false, score: -100, reasons: ['session:human'] };
    }
  } catch (_) {}

  // 2. Browser Automation / Headless checks
  if (navigator.webdriver) {
    score += 60;
    reasons.push('nav:webdriver');
  }

  // 3. User-Agent heuristics
  if (BOT_UA.test(ua)) {
    score += 85;
    reasons.push('ua:bot');
  }

  if (PREVIEW_UA.test(ua)) {
    score += 50;
    reasons.push('ua:preview');
  }

  if (AUTOMATION_UA.test(ua)) {
    score += 60;
    reasons.push('ua:automation');
  }

  // 4. Missing standard browser features in headless environments
  if (!navigator.languages || navigator.languages.length === 0) {
    score += 25;
    reasons.push('nav:no-languages');
  }

  // 5. Automation globals injected by Selenium/Puppeteer/Nightmare
  if (
    window.__nightmare ||
    window._phantom ||
    window.callPhantom ||
    window.__selenium_unwrapped ||
    window.domAutomation ||
    window.domAutomationController
  ) {
    score += 60;
    reasons.push('win:automation-global');
  }

  // 6. Headless WebGL Renderer Detection (SwiftShader / llvmpipe / Mesa)
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
        if (/swiftshader|llvmpipe|software rasterizer|mesa/i.test(renderer)) {
          score += 50;
          reasons.push('webgl:software-rasterizer');
        }
      }
    }
  } catch (_) {}

  // 7. Screen dimension anomalies in headless browsers
  if (window.screen && (window.screen.width === 0 || window.screen.height === 0 || window.screen.colorDepth < 16)) {
    score += 30;
    reasons.push('screen:anomaly');
  }

  const isBot = score >= 40;
  return { isBot, score, reasons };
}

/**
 * IP Parsing & CIDR Matching Utilities
 */
function parseV4(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0n;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    n = (n << 8n) | BigInt(v);
  }
  return n;
}

function parseV6(input) {
  let ip = input.split('%')[0];
  if (ip.includes('.')) {
    const c = ip.lastIndexOf(':');
    if (c < 0) return null;
    const v4 = parseV4(ip.slice(c + 1));
    if (v4 === null) return null;
    ip =
      ip.slice(0, c + 1) +
      ((v4 >> 16n) & 0xffffn).toString(16) +
      ':' +
      (v4 & 0xffffn).toString(16);
  }
  const halves = ip.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  if (halves.length === 1 && head.length !== 8) return null;
  const missing = 8 - head.length - tail.length;
  if (halves.length === 2 && missing < 0) return null;
  const groups = [
    ...head,
    ...Array(halves.length === 2 ? missing : 0).fill('0'),
    ...tail,
  ];
  if (groups.length !== 8) return null;
  let n = 0n;
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/i.test(g)) return null;
    n = (n << 16n) | BigInt(parseInt(g, 16));
  }
  return n;
}

export function ipToBigInt(ip) {
  if (!ip) return null;
  const clean = ip.trim().replace(/^\[|\]$/g, '');
  if (clean.toLowerCase().startsWith('::ffff:') && clean.includes('.')) {
    return parseV4(clean.slice(7));
  }
  if (clean.includes(':')) return parseV6(clean);
  return parseV4(clean);
}

export function inCidr(ip, cidr) {
  if (!ip || !cidr) return false;
  const [net, bitsRaw] = cidr.trim().split('/');
  const bits = Number(bitsRaw);
  if (!Number.isInteger(bits)) return false;
  const a = ipToBigInt(ip);
  const b = ipToBigInt(net);
  if (a === null || b === null) return false;
  const aV6 = ip.trim().replace(/^\[|\]$/g, '').includes(':');
  const bV6 = net.includes(':');
  if (aV6 !== bV6) return false;
  const width = bV6 ? 128 : 32;
  if (bits < 0 || bits > width) return false;
  const shift = BigInt(width - bits);
  return a >> shift === b >> shift;
}

export function inAnyCidr(ip, list) {
  if (!ip || !Array.isArray(list)) return false;
  for (const c of list) {
    if (inCidr(ip, c)) return true;
  }
  return false;
}

