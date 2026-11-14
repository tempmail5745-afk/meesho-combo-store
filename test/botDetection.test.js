import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOT_UA,
  PREVIEW_UA,
  AUTOMATION_UA,
  REAL_BROWSER_UA,
  ipToBigInt,
  inCidr,
  inAnyCidr
} from '../lib/cloak.js';

describe('Bot Detection & Cloaking Engine Verification', () => {
  test('BOT_UA correctly flags search engine and ad review crawlers', () => {
    const bots = [
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)',
      'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      'TikTokBot/1.0',
      'Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)',
      'GPTBot/1.0'
    ];

    for (const b of bots) {
      assert.equal(BOT_UA.test(b), true, `Failed to flag bot UA: ${b}`);
    }
  });

  test('PREVIEW_UA flags messaging app link previewers', () => {
    const previews = [
      'WhatsApp/2.21.10.15 i',
      'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
      'TelegramBot (like TwitterBot)',
      'Twitterbot/1.0'
    ];

    for (const p of previews) {
      assert.equal(PREVIEW_UA.test(p), true, `Failed to flag preview UA: ${p}`);
    }
  });

  test('AUTOMATION_UA flags headless automation libraries', () => {
    const automations = [
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/112.0.5615.49 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36 Playwright/1.22.0',
      'Selenium-Webdriver',
      'Puppeteer'
    ];

    for (const a of automations) {
      assert.equal(AUTOMATION_UA.test(a), true, `Failed to flag automation UA: ${a}`);
    }
  });

  test('REAL_BROWSER_UA identifies standard desktop & mobile browsers', () => {
    const browsers = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
    ];

    for (const br of browsers) {
      assert.equal(REAL_BROWSER_UA.test(br), true, `Failed to identify real browser: ${br}`);
    }
  });

  test('IPv4 and IPv6 CIDR parsing and matching', () => {
    assert.equal(inCidr('66.249.66.1', '66.249.64.0/19'), true);
    assert.equal(inCidr('1.1.1.1', '66.249.64.0/19'), false);
    assert.equal(inCidr('2a03:2880:f003:c07:face:b00c:0:2', '2a03:2880::/32'), true);
    assert.equal(inCidr('2001:db8::1', '2a03:2880::/32'), false);
  });

  test('inAnyCidr verifies against list of network blocks', () => {
    const crawlerRanges = ['66.249.64.0/19', '31.13.24.0/21', '2a03:2880::/32'];
    assert.equal(inAnyCidr('66.249.66.50', crawlerRanges), true);
    assert.equal(inAnyCidr('31.13.25.10', crawlerRanges), true);
    assert.equal(inAnyCidr('192.168.1.1', crawlerRanges), false);
  });
});

