import { NextResponse } from 'next/server';

export const BOT_UA =
  /googlebot|google-inspectiontool|googleother|google-extended|storebot-google|bingbot|bingpreview|slurp|duckduckbot|baiduspider|yandex|sogou|applebot|facebot|facebookexternalhit|facebookcatalog|meta-externalagent|meta-externalfetcher|facebook|meta-|fban|fbav|twitterbot|linkedinbot|tiktokbot|bytespider|ia_archiver|archive\.org_bot|adsbot-google|mediapartners-google|apis-google|feedfetcher-google|pinterest|redditbot|quora link preview|embedly|bitlybot|vkshare|skypeuripreview|chrome-lighthouse|petalbot|semrushbot|ahrefsbot|gptbot|claudebot|perplexitybot|oai-searchbot|ccbot/i;

export const PREVIEW_UA =
  /whatsapp|slackbot|discordbot|twitterbot|facebookexternalhit|linkedinbot|telegrambot|skypeuripreview|embedly|redditbot|imessage|pinterest/i;

export const AUTOMATION_UA =
  /headlesschrome|phantomjs|selenium|puppeteer|playwright|electron/i;

export function middleware(req) {
  const url = req.nextUrl;
  const path = url.pathname;

  // Don't intercept static assets or API routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/static') ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp|json|css|js)$/i.test(path)
  ) {
    return NextResponse.next();
  }

  // Explicit human override (?cl=human)
  if (url.searchParams.get('cl') === 'human') {
    return NextResponse.next();
  }

  // Explicit bot override (?cl=bot)
  if (url.searchParams.get('cl') === 'bot') {
    url.pathname = '/lp';
    const res = NextResponse.rewrite(url);
    res.headers.set('x-cloak', 'bot');
    return res;
  }

  const ua = req.headers.get('user-agent') || '';

  // Intercept known bots, social previewers, and headless automation tools
  if (BOT_UA.test(ua) || PREVIEW_UA.test(ua) || AUTOMATION_UA.test(ua)) {
    url.pathname = '/lp';
    const res = NextResponse.rewrite(url);
    res.headers.set('x-cloak', 'bot');
    return res;
  }

  // Geolocation Shield: Meta Ad Review bots and crawlers predominantly operate from US/EU/IE datacenters.
  // Genuine buyers for this INR/UPI store are in India ('IN').
  const country = req.geo?.country || req.headers.get('x-vercel-ip-country');
  if (country && country !== 'IN') {
    url.pathname = '/lp';
    const res = NextResponse.rewrite(url);
    res.headers.set('x-cloak', 'geo-non-in');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

