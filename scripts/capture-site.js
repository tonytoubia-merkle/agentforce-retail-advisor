#!/usr/bin/env node
/**
 * capture-site.js — High-fidelity headless site capture using MHTML + screenshots.
 *
 * Uses Chrome DevTools Protocol to save pages as MHTML (single-file web archive)
 * which preserves the EXACT rendered appearance — CSS, images, fonts, everything.
 * Also captures full-page screenshots as a visual fallback.
 *
 * Usage:
 *   node scripts/capture-site.js --url https://www.gucci.com/us/en --slug gucci-us --pages 8
 *
 * Output:
 *   .captures/{slug}/
 *     index.mhtml          — MHTML archive of homepage (pixel-perfect)
 *     index.png            — Full-page screenshot of homepage
 *     index.html           — Wrapper page that serves the MHTML via iframe + demo overlay
 *     pages/               — Subpage captures (MHTML + screenshots)
 *     manifest.json        — Metadata
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

// ─── CLI args ───────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { url: '', slug: '', maxPages: 8, viewport: { width: 1440, height: 900 } };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) opts.url = args[++i];
    else if (args[i] === '--slug' && args[i + 1]) opts.slug = args[++i];
    else if (args[i] === '--pages' && args[i + 1]) opts.maxPages = parseInt(args[++i]) || 8;
  }
  if (!opts.url) {
    console.error('Usage: node capture-site.js --url <URL> [--slug <slug>] [--pages <N>]');
    process.exit(1);
  }
  if (!opts.slug) {
    opts.slug = new URL(opts.url).hostname.replace(/^www\./, '').replace(/\./g, '-');
  }
  return opts;
}

// ─── MHTML capture via CDP (with fallback) ──────────────────────────

async function captureMhtml(page) {
  try {
    const cdp = await page.createCDPSession();
    const { data } = await cdp.send('Page.captureSnapshot', { format: 'mhtml' });
    await cdp.detach();
    return data;
  } catch (err) {
    console.warn(`[capture]   MHTML capture failed: ${err.message} — skipping`);
    return null;
  }
}

// ─── Scroll to trigger lazy content ─────────────────────────────────

async function scrollPage(page) {
  await page.evaluate(async () => {
    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    const height = document.body.scrollHeight;
    const step = window.innerHeight;
    for (let y = 0; y < height; y += step) {
      window.scrollTo(0, y);
      await delay(300);
    }
    window.scrollTo(0, 0);
    await delay(500);
  });
}

// ─── Page capture ───────────────────────────────────────────────────

async function capturePage(page, url, label) {
  console.log(`[capture] Navigating: ${url} (${label})`);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  } catch {
    console.warn(`[capture]   Timeout — using partial render`);
  }

  // Wait for dynamic content + scroll to trigger lazy images
  await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));
  await scrollPage(page);

  // Dismiss cookie banners / popups
  await page.evaluate(() => {
    const selectors = [
      '[class*="cookie"] button', '[class*="Cookie"] button',
      '[class*="consent"] button', '[class*="Consent"] button',
      '[id*="cookie"] button', '[id*="consent"] button',
      'button[class*="accept"]', 'button[class*="Accept"]',
      '[class*="modal"] [class*="close"]', '[class*="popup"] [class*="close"]',
    ];
    for (const sel of selectors) {
      const btns = document.querySelectorAll(sel);
      btns.forEach(b => { try { b.click(); } catch {} });
    }
  });
  await page.evaluate(() => new Promise(r => setTimeout(r, 500)));

  // Capture MHTML (full page archive with all resources embedded)
  console.log(`[capture]   Saving MHTML snapshot...`);
  const mhtml = await captureMhtml(page);

  // Full-page screenshot
  console.log(`[capture]   Taking screenshot...`);
  const screenshot = await page.screenshot({ fullPage: true, type: 'png' });

  // Viewport screenshot (above-the-fold)
  const viewportShot = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 90 });

  // Extract page metadata
  const meta = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || '',
    ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
  }));

  // Extract links for further crawling
  const links = await page.evaluate((origin) => {
    return [...new Set(
      [...document.querySelectorAll('a[href]')]
        .map(a => a.href)
        .filter(h => h.startsWith(origin) && !h.match(/\.(pdf|zip|xml|json)$/i))
    )];
  }, new URL(url).origin);

  return { mhtml, screenshot, viewportShot, meta, links };
}

// ─── Wrapper HTML (serves MHTML via iframe + demo overlay) ──────────

function buildWrapperHtml(slug, title, screenshotPath, mhtmlPath, pages, hasMhtml) {
  const navLinks = pages.map(p =>
    `<a href="${p.wrapperFile}" class="nav-link">${p.title || p.slug}</a>`
  ).join('\n          ');

  const topOffset = pages.length > 0 ? 76 : 40;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Demo Capture</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Inter, system-ui, sans-serif; background: #0a0a0a; color: #fff; overflow: hidden; height: 100vh; }

    .demo-banner {
      position: fixed; top: 0; left: 0; right: 0; z-index: 10000;
      background: linear-gradient(90deg, #1e1b4b, #312e81);
      padding: 8px 20px; font-size: 13px; height: 40px;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 2px 12px rgba(0,0,0,0.5);
    }
    .demo-banner a { color: #a5b4fc; text-decoration: none; }
    .demo-banner a:hover { text-decoration: underline; }
    .demo-badge { background: rgba(255,255,255,0.15); padding: 2px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
    .demo-btn { background: rgba(255,255,255,0.12); color: #c7d2fe; border: none; padding: 4px 12px; border-radius: 5px; font-size: 11px; cursor: pointer; transition: background 0.2s; }
    .demo-btn:hover { background: rgba(255,255,255,0.2); color: #fff; }

    .demo-nav {
      position: fixed; top: 40px; left: 0; right: 0; z-index: 9999;
      background: rgba(15, 15, 35, 0.95); backdrop-filter: blur(8px);
      padding: 6px 20px; height: 36px; display: flex; gap: 8px; align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      overflow-x: auto; white-space: nowrap;
    }
    .nav-link {
      color: #9ca3af; text-decoration: none; font-size: 12px;
      padding: 4px 12px; border-radius: 6px; transition: all 0.2s;
    }
    .nav-link:hover { color: #fff; background: rgba(255,255,255,0.1); }
    .nav-label { color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

    .site-frame {
      position: fixed; top: ${topOffset}px; left: 0; right: 0; bottom: 0;
      overflow-y: auto; background: #fff;
      display: flex; justify-content: center;
    }
    .site-frame img {
      width: 100%; max-width: 1440px; height: auto; display: block;
    }

    .chat-trigger {
      position: fixed; bottom: 24px; right: 24px; z-index: 10001;
      width: 60px; height: 60px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s;
    }
    .chat-trigger:hover { transform: scale(1.08); }
    .chat-trigger svg { width: 28px; height: 28px; fill: white; }
  </style>
</head>
<body>
  <div class="demo-banner">
    <div>
      <span class="demo-badge">DEMO</span>
      &nbsp; ${title}
    </div>
    <div style="display:flex;gap:16px;align-items:center;">
      ${hasMhtml ? `<button class="demo-btn" onclick="window.open('${mhtmlPath}','_blank')">Open Interactive Version</button>` : ''}
      <a href="/admin">Admin</a>
      <a href="/advisor">Open Advisor &rarr;</a>
    </div>
  </div>

  ${pages.length > 0 ? `
  <div class="demo-nav">
    <span class="nav-label">Pages:</span>
    <a href="/captured/${slug}/" class="nav-link">Home</a>
    ${navLinks}
  </div>
  ` : ''}

  <div class="site-frame">
    <img src="${screenshotPath}" alt="${title}" />
  </div>

  <button class="chat-trigger" onclick="window.location.href='/advisor'" title="Open Advisor">
    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
  </button>
</body>
</html>`;
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();
  const captureDir = resolve(PROJECT_ROOT, '.captures', opts.slug);
  const pagesDir = resolve(captureDir, 'pages');

  await mkdir(pagesDir, { recursive: true });

  console.log(`[capture] Starting capture of ${opts.url}`);
  console.log(`[capture] Output: ${captureDir}`);
  console.log(`[capture] Max pages: ${opts.maxPages}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-web-security'],
  });

  const page = await browser.newPage();
  await page.setViewport(opts.viewport);
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Block analytics/tracking but allow everything visual
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.match(/google-analytics|gtag\/js|facebook.*\/tr|doubleclick|hotjar|segment\.com|newrelic|datadome|sentry/i)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  // ── Capture homepage ──────────────────────────────────────────────
  const homeCap = await capturePage(page, opts.url, 'homepage');
  if (homeCap.mhtml) {
    await writeFile(resolve(captureDir, 'index.mhtml'), homeCap.mhtml, 'utf-8');
    console.log(`[capture] Homepage: MHTML ${(homeCap.mhtml.length / 1024).toFixed(0)}KB`);
  }
  await writeFile(resolve(captureDir, 'screenshot-full.png'), homeCap.screenshot);
  await writeFile(resolve(captureDir, 'screenshot-viewport.jpg'), homeCap.viewportShot);
  console.log(`[capture] Homepage: screenshot saved`);

  // ── Discover and capture subpages ─────────────────────────────────
  const allLinks = homeCap.links;
  const productLinks = allLinks.filter(u =>
    u.match(/\/(product|item|p\/|detail)/i) ||
    (u.split('/').length > 5 && u.match(/[A-Z0-9]{5,}/))
  );
  const categoryLinks = allLinks.filter(u =>
    u.match(/\/(shop|collection|categor|c\/|new|sale|women|men|bag|shoe|fragrance|beauty)/i)
  );

  const pagesToCapture = [
    ...categoryLinks.slice(0, 3),
    ...productLinks.slice(0, Math.max(3, opts.maxPages - 3)),
  ].slice(0, opts.maxPages);

  console.log(`[capture] Found ${allLinks.length} links, capturing ${pagesToCapture.length} subpages`);

  const capturedPages = [];
  for (let i = 0; i < pagesToCapture.length; i++) {
    const pUrl = pagesToCapture[i];
    const pageSlug = new URL(pUrl).pathname
      .replace(/^\//, '').replace(/\//g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '') || `page-${i}`;

    try {
      const pageCap = await capturePage(page, pUrl, `page ${i + 1}/${pagesToCapture.length}`);

      if (pageCap.mhtml) {
        await writeFile(resolve(pagesDir, `${pageSlug}.mhtml`), pageCap.mhtml, 'utf-8');
      }
      await writeFile(resolve(pagesDir, `${pageSlug}.png`), pageCap.screenshot);
      await writeFile(resolve(pagesDir, `${pageSlug}.jpg`), pageCap.viewportShot);

      const pageTitle = pageCap.meta.title || pageSlug.replace(/_/g, ' ');
      capturedPages.push({
        url: pUrl,
        slug: pageSlug,
        title: pageTitle,
        hasMhtml: !!pageCap.mhtml,
        mhtmlFile: `pages/${pageSlug}.mhtml`,
        screenshotFile: `pages/${pageSlug}.png`,
        viewportFile: `pages/${pageSlug}.jpg`,
        wrapperFile: `/captured/${opts.slug}/pages/${pageSlug}.html`,
      });

      console.log(`[capture]   ✓ ${pageSlug} (${pageCap.mhtml ? 'MHTML ' + (pageCap.mhtml.length / 1024).toFixed(0) + 'KB + ' : ''}screenshot)`);
    } catch (err) {
      console.warn(`[capture]   ✗ ${pUrl} — ${err.message}`);
    }
  }

  await browser.close();

  // ── Generate wrapper HTML pages ───────────────────────────────────
  const homeTitle = homeCap.meta.title || opts.slug;

  // Homepage wrapper
  const homeWrapper = buildWrapperHtml(opts.slug, homeTitle, 'screenshot-full.png', 'index.mhtml', capturedPages, !!homeCap.mhtml);
  await writeFile(resolve(captureDir, 'index.html'), homeWrapper, 'utf-8');

  // Subpage wrappers
  for (const cp of capturedPages) {
    const pageWrapper = buildWrapperHtml(opts.slug, cp.title, cp.screenshotFile.replace('pages/', ''), cp.mhtmlFile.replace('pages/', ''), capturedPages, cp.hasMhtml);
    await writeFile(resolve(pagesDir, `${cp.slug}.html`), pageWrapper, 'utf-8');
  }

  // ── Write manifest ────────────────────────────────────────────────
  const manifest = {
    slug: opts.slug,
    sourceUrl: opts.url,
    capturedAt: new Date().toISOString(),
    title: homeTitle,
    homepage: 'index.html',
    homeMhtml: 'index.mhtml',
    homeScreenshot: 'screenshot-full.png',
    pages: capturedPages,
    viewport: opts.viewport,
  };
  await writeFile(resolve(captureDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`\n[capture] Done!`);
  console.log(`[capture]   Homepage: ${captureDir}/index.html`);
  console.log(`[capture]   Pages: ${capturedPages.length}`);
  console.log(`[capture]   Manifest: ${captureDir}/manifest.json`);
}

main().catch(err => {
  console.error('[capture] Fatal:', err);
  process.exit(1);
});
