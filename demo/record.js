#!/usr/bin/env node
/**
 * Agentforce Retail Advisor — Personalization Demo Recorder
 *
 * Records a click-through demo of the identity + personalization story
 * with an AI-generated voiceover narration synced to the video.
 *
 * ── TTS providers (pick one) ───────────────────────────────────────────────
 *   Google Gemini (default if GOOGLE_API_KEY or VITE_IMAGEN_API_KEY set):
 *     export GOOGLE_API_KEY=...   OR   export VITE_IMAGEN_API_KEY=...
 *     node record.js --tts google
 *
 *   OpenAI:
 *     export OPENAI_API_KEY=sk-...
 *     node record.js --tts openai
 *
 * ── Setup ──────────────────────────────────────────────────────────────────
 *   1. Install ffmpeg:
 *        Windows: winget install ffmpeg   OR   choco install ffmpeg
 *        Mac:     brew install ffmpeg
 *        Linux:   sudo apt install ffmpeg
 *
 *   2. Install dependencies:
 *        cd demo && npm install && npx playwright install chromium
 *
 * ── Usage ──────────────────────────────────────────────────────────────────
 *   node record.js              — generate TTS + record video + mix
 *   node record.js --skip-tts   — reuse cached audio, re-record video
 *   node record.js --audio-only — regenerate TTS only (no browser)
 *
 * Output: demo/output/demo.mp4
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = 'https://agentforce-retail-advisor.vercel.app';

const TIKTOK_UTM_PARAMS = new URLSearchParams({
  utm_source: 'tiktok',
  utm_medium: 'paid_social',
  utm_campaign: 'glow-up-challenge-2026',
  utm_content: 'ugc-before-after',
  utm_term: 'gen_z_beauty_18_25',
}).toString();

// Matches the session key in useExitIntent.ts
const EXIT_INTENT_SESSION_KEY = 'beaute-exit-intent-shown';

const VIEWPORT = { width: 1440, height: 900 };

const OUT_DIR   = path.join(__dirname, 'output');
const AUDIO_DIR = path.join(OUT_DIR, 'audio');
const VIDEO_DIR = path.join(OUT_DIR, 'video');

const SKIP_TTS   = process.argv.includes('--skip-tts');
const AUDIO_ONLY = process.argv.includes('--audio-only');

// TTS provider: google (Gemini 2.5 Flash) or openai
// Auto-detects based on available env vars; override with --tts google / --tts openai
const TTS_ARG = process.argv.find(a => a.startsWith('--tts='))?.split('=')[1]
  || (process.argv.includes('--tts') ? process.argv[process.argv.indexOf('--tts') + 1] : null);
const GOOGLE_KEY = process.env.GOOGLE_API_KEY || process.env.VITE_IMAGEN_API_KEY;
const TTS_PROVIDER = TTS_ARG || (GOOGLE_KEY ? 'google' : 'openai');

// Known winget install path for ffmpeg on Windows
const WINGET_FFMPEG = (() => {
  const base = path.join(
    process.env.LOCALAPPDATA || '',
    'Microsoft', 'WinGet', 'Packages',
    'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe'
  );
  if (!fs.existsSync(base)) return null;
  const builds = fs.readdirSync(base).filter(d => d.startsWith('ffmpeg'));
  if (!builds.length) return null;
  const bin = path.join(base, builds[0], 'bin', 'ffmpeg.exe');
  return fs.existsSync(bin) ? bin : null;
})();

const FFMPEG_BIN = WINGET_FFMPEG ? `"${WINGET_FFMPEG}"` : 'ffmpeg';
const FFPROBE_BIN = WINGET_FFMPEG
  ? `"${WINGET_FFMPEG.replace('ffmpeg.exe', 'ffprobe.exe')}"`
  : 'ffprobe';

// ─── Narration script ─────────────────────────────────────────────────────────
//
// Each segment fires at a specific moment in the flow. The Playwright script
// pauses for exactly `duration + buffer` so the video stays in sync.

const SEGMENTS = [
  {
    id: '01-default-homepage',
    text: "What you're looking at is the default state — an anonymous, unrecognized visitor seeing a completely generic homepage experience. No personalization. The brand knows nothing about who this person is, where they came from, or what they care about. The hero, the product recommendations, the promotions — identical for every single visitor.",
  },
  {
    id: '02-exit-intent-anonymous',
    text: "As our visitor starts to leave — notice this exit-intent capture moment. Standard. Non-personalized. This is the brand's baseline — doing its best with zero context. Now let's look behind the scenes at the media campaigns driving traffic to this storefront.",
  },
  {
    id: '03-media-wall-intro',
    text: "This is the Merkury Media Wall — a live view of the brand's cross-channel campaign portfolio. TikTok, Instagram, YouTube, Connected TV, Display, Email. Every ad card carries full targeting context: the audience segment, the match type — person-level, household-level, or modeled lookalike — and the UTM attribution that will power the personalized experience the moment someone clicks through.",
  },
  {
    id: '04-media-wall-scroll',
    text: "Look at the range of targeting strategies at play here. Lookalike audiences for anti-aging seekers. First-party CRM activation for Gold loyalty members. Retargeting for cart abandoners. Household-level Connected TV. Each campaign is reaching a different person, on a different channel, with a different message. But they all share one capability: the ability to carry rich attribution context back to the storefront.",
  },
  {
    id: '05-cache-clear',
    text: "Now — we're resetting completely. Clearing all cached state to simulate a fresh browser session. Exactly what a real visitor experiences after seeing this brand's creative on their TikTok For You page.",
  },
  {
    id: '06-tiktok-click',
    text: "We're clicking through the Glow Up Challenge TikTok ad — targeting five-point-two million Gen Z beauty households. This is the exact journey a real viewer takes: scrolling their feed, engaging with the creative, arriving at the storefront. Watch what happens the moment that URL resolves.",
  },
  {
    id: '07-personalized-homepage',
    text: "Same URL. Completely different experience. The hero message has shifted — it's speaking directly to someone who just clicked through from TikTok's Glow Up Challenge. Attribution recognized. Experience adapted. In real time. No login required. No form fill. Just attribution-powered personalization from the first pixel load.",
  },
  {
    id: '08-exit-intent-personalized',
    text: "And when our visitor tries to leave again — the exit-intent capture is also personalized. The messaging reflects the campaign, the channel, the creative theme. The brand is telling a consistent, threaded story from the first ad impression all the way through the off-ramp experience.",
  },
  {
    id: '09-closing',
    text: "This is threaded storytelling. Rich context from every media channel, flowing seamlessly into personalized moments — all configured by non-technical marketing teams, at the speed of a campaign launch. No engineering tickets. No developer handoffs. Just intelligent, connected experiences that meet the customer exactly where they are.",
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function ensureDirs() {
  [OUT_DIR, AUDIO_DIR, VIDEO_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));
}

function checkFfmpeg() {
  if (WINGET_FFMPEG) {
    console.log(`  ✓ ffmpeg found via winget: ${WINGET_FFMPEG}`);
    return;
  }
  const result = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  if (result.error) {
    console.error('\n❌  ffmpeg not found.');
    console.error('   Install it:');
    console.error('     Windows: winget install ffmpeg  OR  choco install ffmpeg');
    console.error('     Mac:     brew install ffmpeg');
    console.error('     Linux:   sudo apt install ffmpeg\n');
    process.exit(1);
  }
}

// ── Google Gemini TTS ─────────────────────────────────────────────────────────
// Uses gemini-2.5-flash-preview-tts — returns raw PCM (s16le, 24kHz, mono).
// We write a WAV header + PCM to disk, then convert to MP3 via ffmpeg.

async function generateTTSGoogle(segments) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(GOOGLE_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-tts' });

  console.log('\n🎙  Generating TTS narration (Gemini 2.5 Flash, voice: Charon)...');

  for (const seg of segments) {
    const mp3Path = path.join(AUDIO_DIR, `${seg.id}.mp3`);
    if (fs.existsSync(mp3Path)) {
      console.log(`  ✓ ${seg.id} (cached)`);
      continue;
    }
    process.stdout.write(`  ↗ ${seg.id} ...`);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: seg.text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },  // deep, authoritative
          },
        },
      },
    });

    const part = result.response.candidates?.[0]?.content?.parts?.[0];
    if (!part?.inlineData?.data) throw new Error(`No audio data returned for ${seg.id}`);

    const pcmBuffer = Buffer.from(part.inlineData.data, 'base64');

    // Write raw PCM as WAV (s16le, 24kHz, mono) then convert to MP3
    const wavPath = path.join(AUDIO_DIR, `${seg.id}.wav`);
    const wavHeader = buildWavHeader(pcmBuffer.length, 24000, 1, 16);
    fs.writeFileSync(wavPath, Buffer.concat([wavHeader, pcmBuffer]));

    execSync(`${FFMPEG_BIN} -y -i "${wavPath}" -ar 44100 -ab 192k "${mp3Path}"`, { stdio: 'pipe' });
    fs.unlinkSync(wavPath);

    console.log(` done (${(pcmBuffer.length / 1024).toFixed(0)} KB PCM → MP3)`);
  }
}

function buildWavHeader(dataLength, sampleRate, channels, bitDepth) {
  const byteRate = sampleRate * channels * (bitDepth / 8);
  const blockAlign = channels * (bitDepth / 8);
  const buf = Buffer.alloc(44);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataLength, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);          // PCM chunk size
  buf.writeUInt16LE(1, 20);           // PCM format
  buf.writeUInt16LE(channels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(bitDepth, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataLength, 40);
  return buf;
}

// ── OpenAI TTS ────────────────────────────────────────────────────────────────

async function generateTTSOpenAI(segments) {
  const OpenAI = require('openai').default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  console.log('\n🎙  Generating TTS narration (OpenAI tts-1-hd, voice: onyx)...');
  for (const seg of segments) {
    const filePath = path.join(AUDIO_DIR, `${seg.id}.mp3`);
    if (fs.existsSync(filePath)) {
      console.log(`  ✓ ${seg.id} (cached)`);
      continue;
    }
    process.stdout.write(`  ↗ ${seg.id} ...`);
    const response = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: 'onyx',
      input: seg.text,
      speed: 0.92,
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    console.log(` done (${(buffer.length / 1024).toFixed(0)} KB)`);
  }
}

async function generateTTS() {
  if (TTS_PROVIDER === 'google') {
    if (!GOOGLE_KEY) {
      console.error('❌  No Google API key found. Set GOOGLE_API_KEY or VITE_IMAGEN_API_KEY.');
      process.exit(1);
    }
    await generateTTSGoogle(SEGMENTS);
  } else {
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌  OPENAI_API_KEY not set. Run: export OPENAI_API_KEY=sk-...');
      process.exit(1);
    }
    await generateTTSOpenAI(SEGMENTS);
  }
}

function getAudioDurationMs(filePath) {
  const out = execSync(
    `${FFPROBE_BIN} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
  ).toString().trim();
  return Math.round(parseFloat(out) * 1000);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Smoothly scroll the page to a target Y position
async function smoothScrollTo(page, targetY, stepPx = 40, stepMs = 50) {
  const currentY = await page.evaluate(() => window.scrollY);
  const steps = Math.ceil(Math.abs(targetY - currentY) / stepPx);
  const delta = (targetY - currentY) / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(currentY + delta * (i + 1)));
    await sleep(stepMs);
  }
}

// Fire the exit intent by dispatching mouseleave on documentElement with clientY <= 0
// Clears the session flag first so it can fire even after a previous trigger.
async function triggerExitIntent(page) {
  await page.evaluate((key) => {
    sessionStorage.removeItem(key);
  }, EXIT_INTENT_SESSION_KEY);

  // Move mouse toward the top edge
  await page.mouse.move(VIEWPORT.width / 2, 5);
  await sleep(300);
  await page.mouse.move(VIEWPORT.width / 2, 2);
  await sleep(200);

  // Dispatch the native mouseleave on the root element that the hook listens to
  await page.evaluate(() => {
    const evt = new MouseEvent('mouseleave', {
      bubbles: true,
      cancelable: true,
      clientX: 720,
      clientY: -1,   // must be <= 0 per useExitIntent.ts check
    });
    document.documentElement.dispatchEvent(evt);
  });
}

async function dismissOverlay(page) {
  // Try Escape first, then click outside if there's a backdrop
  await page.keyboard.press('Escape').catch(() => {});
  await sleep(400);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  ensureDirs();
  checkFfmpeg();

  console.log(`\n🎤  TTS provider: ${TTS_PROVIDER.toUpperCase()}`);

  // ── Step 1: Generate TTS ───────────────────────────────────────────────────

  if (!SKIP_TTS) {
    await generateTTS();
  } else {
    console.log('\n⏭  Skipping TTS generation (--skip-tts)');
  }

  if (AUDIO_ONLY) {
    console.log('\n✅  Audio-only mode — done.');
    return;
  }

  // ── Step 2: Measure durations ─────────────────────────────────────────────

  console.log('\n⏱  Measuring audio durations...');
  const durations = {};
  for (const seg of SEGMENTS) {
    durations[seg.id] = getAudioDurationMs(path.join(AUDIO_DIR, `${seg.id}.mp3`));
    console.log(`   ${seg.id}: ${(durations[seg.id] / 1000).toFixed(1)}s`);
  }

  // ── Step 3: Record browser session ────────────────────────────────────────

  console.log('\n🎬  Launching browser...');
  const browser = await chromium.launch({
    headless: false,
    args: [
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
      '--disable-infobars',
    ],
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: {
      dir: VIDEO_DIR,
      size: VIEWPORT,
    },
  });

  const page = await context.newPage();

  // Timeline: track when each narration segment starts (offset from t0 in ms)
  const timeline = [];
  const t0 = Date.now();

  function mark(id) {
    const startMs = Date.now() - t0;
    timeline.push({ id, startMs });
    console.log(`  📍 [${(startMs / 1000).toFixed(1)}s] ${id}`);
    return startMs;
  }

  // Helper: mark + wait for the full narration duration
  async function narrate(id, bufferMs = 600) {
    mark(id);
    await sleep(durations[id] + bufferMs);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SCENE 1 — Anonymous homepage
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n▶  Scene 1 — Default, anonymous homepage');

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(2500);  // let hero animation settle

  await narrate('01-default-homepage');

  // Simulate "browsing" — slow mouse drift across the page
  await page.mouse.move(400, 400);
  await sleep(1000);
  await page.mouse.move(800, 500);
  await sleep(1500);
  await page.mouse.move(1100, 300);
  await sleep(1500);

  // Exit intent must be armed (3s delay in useExitIntent) — we've been on page long enough
  await triggerExitIntent(page);
  await sleep(2500);  // give overlay time to animate in

  await narrate('02-exit-intent-anonymous');
  await dismissOverlay(page);
  await sleep(800);

  // ────────────────────────────────────────────────────────────────────────────
  // SCENE 2 — Media wall
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n▶  Scene 2 — Media wall');

  await page.goto(`${BASE_URL}/media-wall`, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(1500);

  await narrate('03-media-wall-intro');

  // Slow scroll down through the ad grid
  await smoothScrollTo(page, 900,  35, 55);
  await sleep(400);
  await smoothScrollTo(page, 1800, 35, 55);
  await sleep(400);

  await narrate('04-media-wall-scroll');

  // Scroll back to top so the TikTok card is visible
  await smoothScrollTo(page, 0, 60, 40);
  await sleep(800);

  // ────────────────────────────────────────────────────────────────────────────
  // SCENE 3 — Cache clear (reset to anonymous state)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n▶  Scene 3 — Hard reset / cache clear');

  await narrate('05-cache-clear', 400);

  // Clear all state (cookies, localStorage, sessionStorage)
  await context.clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await sleep(600);

  // ────────────────────────────────────────────────────────────────────────────
  // SCENE 4 — TikTok ad click-through
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n▶  Scene 4 — TikTok ad click');

  // Locate the "#GlowUpChallenge" card (TikTok / Glow Up Challenge)
  const tiktokCard = page.locator('button').filter({ hasText: '#GlowUpChallenge' }).first();
  await tiktokCard.scrollIntoViewIfNeeded();
  await sleep(600);

  // Hover for a beat so the scale animation plays on camera
  await tiktokCard.hover();
  await sleep(800);

  await narrate('06-tiktok-click', 400);

  await tiktokCard.click();

  // The MediaWallPage calls navigate(`/?${utmParams}`) — wait for storefront to load
  await page.waitForURL(/utm_source=tiktok/, { timeout: 10000 });
  await sleep(2500);  // let hero personalization animate in

  // ────────────────────────────────────────────────────────────────────────────
  // SCENE 5 — Personalized homepage
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n▶  Scene 5 — Personalized homepage');

  await narrate('07-personalized-homepage');

  // Slow mouse drift so the viewer can take in the page
  await page.mouse.move(500, 350);
  await sleep(1200);
  await page.mouse.move(900, 450);
  await sleep(1200);
  await page.mouse.move(1200, 250);
  await sleep(2000);

  // Exit intent (second time — session was cleared so it can fire again)
  await triggerExitIntent(page);
  await sleep(2500);

  await narrate('08-exit-intent-personalized');
  await dismissOverlay(page);
  await sleep(600);

  // ────────────────────────────────────────────────────────────────────────────
  // SCENE 6 — Closing
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n▶  Scene 6 — Closing narration');

  await narrate('09-closing', 1200);

  // ── Stop recording ─────────────────────────────────────────────────────────

  console.log('\n⏹  Stopping recording...');
  const videoPath = await page.video().path();
  await context.close();
  await browser.close();

  const totalDurationMs = Date.now() - t0;
  console.log(`\n📹  Raw video: ${videoPath}`);
  console.log(`    Total duration: ${(totalDurationMs / 1000).toFixed(0)}s`);

  // ── Step 4: Build audio mix ────────────────────────────────────────────────

  console.log('\n🎛  Building synchronized audio mix...');

  // Print timeline for reference
  console.log('\n   Narration timeline:');
  timeline.forEach(({ id, startMs }) => {
    console.log(`     ${(startMs / 1000).toFixed(1).padStart(6)}s  ${id}`);
  });

  // Build ffmpeg filter_complex:
  //   Each segment gets an adelay filter to position it at the right timestamp.
  //   All segments are then amixed together into a single stereo track.

  const audioInputArgs = SEGMENTS.map(seg =>
    `-i "${path.join(AUDIO_DIR, `${seg.id}.mp3`)}"`
  ).join(' ');

  const filterParts = SEGMENTS.map((seg, i) => {
    const entry = timeline.find(t => t.id === seg.id);
    const delayMs = entry ? entry.startMs : 0;
    // adelay takes delay in ms, applied to both channels: "delay|delay"
    return `[${i + 1}:a]adelay=${delayMs}|${delayMs}[a${i}]`;
  });

  const mixLabels = SEGMENTS.map((_, i) => `[a${i}]`).join('');
  const filterComplex =
    filterParts.join('; ') +
    `; ${mixLabels}amix=inputs=${SEGMENTS.length}:normalize=0[aout]`;

  const outputPath = path.join(OUT_DIR, 'demo.mp4');

  const ffmpegCmd = [
    `${FFMPEG_BIN} -y`,
    `-i "${videoPath}"`,
    audioInputArgs,
    `-filter_complex "${filterComplex}"`,
    '-map 0:v',
    '-map "[aout]"',
    '-c:v libx264 -crf 18 -preset fast',
    '-c:a aac -b:a 192k',
    `-t ${Math.ceil(totalDurationMs / 1000)}`,
    `"${outputPath}"`,
  ].join(' ');

  console.log('\n🔧  Running ffmpeg...');
  execSync(ffmpegCmd, { stdio: 'inherit' });

  console.log(`\n✅  Demo video ready: ${outputPath}`);
  console.log(`    Size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(1)} MB`);
  console.log(`    Duration: ~${(totalDurationMs / 1000).toFixed(0)}s`);
  console.log('\n   To play: open output/demo.mp4');
})().catch(err => {
  console.error('\n💥  Fatal error:', err.message);
  process.exit(1);
});
