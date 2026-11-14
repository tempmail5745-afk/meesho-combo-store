import fs from 'fs';
import path from 'path';
import { BOT_UA, PREVIEW_UA, AUTOMATION_UA, inAnyCidr } from '../../lib/cloak';

let cachedCidrs = null;

function loadCrawlerCidrs() {
  if (cachedCidrs) return cachedCidrs;
  const list = [];
  const dataDir = path.join(process.cwd(), 'data');

  const files = ['googlebot.json', 'meta.json', 'bingbot.json', 'special-crawlers.json'];
  for (const f of files) {
    try {
      const fullPath = path.join(dataDir, f);
      if (fs.existsSync(fullPath)) {
        const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        for (const p of parsed.prefixes || []) {
          if (p.ipv4Prefix) list.push(p.ipv4Prefix);
          if (p.ipv6Prefix) list.push(p.ipv6Prefix);
        }
      }
    } catch (_) {}
  }
  cachedCidrs = list;
  return list;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query || {};
  const force = query.cl;

  if (force === 'bot') {
    return res.status(200).json({ isBot: true, score: 100, reasons: ['force:bot'] });
  }
  if (force === 'human') {
    return res.status(200).json({ isBot: false, score: -100, reasons: ['force:human'] });
  }

  const ua = String(req.headers['user-agent'] || '');
  const ip = String(
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    ''
  );

  const reasons = [];
  let score = 0;

  // 1. User-Agent Matching
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

  // 2. Crawler CIDR Matching
  const cidrs = loadCrawlerCidrs();
  if (ip && inAnyCidr(ip, cidrs)) {
    score += 80;
    reasons.push('ip:crawler-range');
  }

  // 3. Header anomaly detection
  if (!req.headers['sec-ch-ua'] && ua.includes('Chrome')) {
    score += 20;
    reasons.push('hdr:no-sec-ch-ua');
  }

  if (!req.headers['sec-fetch-mode'] && ua.includes('Chrome')) {
    score += 20;
    reasons.push('hdr:no-sec-fetch-mode');
  }

  const al = req.headers['accept-language'];
  if (!al || al.trim() === '*') {
    score += 15;
    reasons.push('hdr:no-accept-language');
  }

  const isBot = score >= 40;

  res.setHeader('x-cloak', isBot ? 'bot' : 'human');
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

  return res.status(200).json({
    isBot,
    score,
    reasons,
    ip,
    ua: ua.slice(0, 120)
  });
}

