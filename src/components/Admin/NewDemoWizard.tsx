import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DemoVertical, CreateDemoInput, DemoTheme, BrandResearchResult } from '@/types/demo';
import { createDemo, updateDemo, upsertDemoProducts, upsertDemoPersonas } from '@/services/supabase/demoService';

type WizardStep = 'brand' | 'research' | 'theme' | 'review';

const VERTICALS: { value: DemoVertical; label: string; description: string }[] = [
  { value: 'beauty', label: 'Beauty', description: 'Skincare, cosmetics, fragrance' },
  { value: 'fashion', label: 'Fashion / Luxury', description: 'Apparel, accessories, luxury goods' },
  { value: 'wellness', label: 'Wellness', description: 'Health, supplements, wellness products' },
  { value: 'cpg', label: 'CPG / Grocery', description: 'Consumer packaged goods, food & beverage' },
];

const DEFAULT_THEME: DemoTheme = {
  primaryColor: '#1a1a2e',
  accentColor: '#e94560',
  backgroundColor: '#0f0f23',
  textColor: '#ffffff',
  fontFamily: 'Inter, system-ui, sans-serif',
};

export function NewDemoWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>('brand');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [brandName, setBrandName] = useState('');
  const [brandTagline, setBrandTagline] = useState('');
  const [vertical, setVertical] = useState<DemoVertical>('beauty');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [brandUrl, setBrandUrl] = useState('');
  const [theme, setTheme] = useState<DemoTheme>(DEFAULT_THEME);

  // AI research state
  const [researching, setResearching] = useState(false);
  const [research, setResearch] = useState<BrandResearchResult | null>(null);
  const [researchError, setResearchError] = useState<string | null>(null);

  const slug = brandName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  type ResearchMode = 'capture' | 'scrape' | 'ai-generate';
  const [researchMode, setResearchMode] = useState<ResearchMode>('capture');
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [capturePreviewUrl, setCapturePreviewUrl] = useState<string | null>(null);
  const [createdDemoId, setCreatedDemoId] = useState<string | null>(null);

  /** Auto-create the demo in Supabase so progress is saved immediately */
  async function ensureDemoCreated(): Promise<string> {
    if (createdDemoId) return createdDemoId;
    const input: CreateDemoInput = {
      slug,
      name: `${brandName} Demo`,
      vertical,
      ownerEmail,
      brandName,
      brandTagline: brandTagline || undefined,
      theme,
    };
    const demo = await createDemo(input);
    setCreatedDemoId(demo.id);
    return demo.id;
  }

  async function runResearch() {
    setResearching(true);
    setResearchError(null);
    try {
      // Auto-create the demo first so it appears in the dashboard immediately
      const demoId = await ensureDemoCreated();

      if (researchMode === 'capture' && brandUrl) {
        // Full headless capture — fire-and-forget, then poll for completion
        setCaptureStatus('running');

        // 1. Kick off capture (returns immediately with 202)
        const startRes = await fetch('/api/site-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: brandUrl, slug, maxPages: 8 }),
        });
        const startText = await startRes.text();
        let startData: Record<string, unknown>;
        try {
          startData = JSON.parse(startText);
        } catch {
          throw new Error(`Server returned invalid response (${startRes.status}): ${startText.substring(0, 200)}`);
        }
        if (startRes.status >= 400) {
          throw new Error((startData.error as string) || 'Capture failed to start');
        }

        const statusUrl = (startData.statusUrl as string) || `/api/site-capture/status/${slug}`;
        const previewUrl = (startData.previewUrl as string) || `/captured/${slug}/`;

        // Save the capture URL on the demo record
        await updateDemo(demoId, { vercel_domain: previewUrl, status: 'draft' });

        // 2. Poll for completion (manifest.json appears when done)
        let attempts = 0;
        const maxAttempts = 120; // 10 minutes at 5s intervals
        while (attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 5000));
          attempts++;
          try {
            const pollRes = await fetch(statusUrl);
            if (pollRes.ok) {
              const pollData = await pollRes.json();
              if (pollData.exists) {
                console.log('[capture] Complete after', attempts * 5, 'seconds');
                break;
              }
            }
          } catch {
            // polling error — keep trying
          }
        }

        if (attempts >= maxAttempts) {
          throw new Error('Capture timed out after 10 minutes');
        }

        setCaptureStatus('done');
        setCapturePreviewUrl(previewUrl);

        // 3. Also run a lightweight scrape for product data + theme
        try {
          const scrapeRes = await fetch('/api/site-scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: brandUrl, maxPages: 6 }),
          });
          if (scrapeRes.ok) {
            const scrapeData = await scrapeRes.json();
            const result: BrandResearchResult = {
              suggestedTheme: scrapeData.suggestedTheme,
              suggestedTagline: scrapeData.suggestedTagline || '',
              productSuggestions: scrapeData.productSuggestions || [],
              personaSuggestions: scrapeData.personaSuggestions || [],
              brandVoiceNotes: scrapeData.brandVoiceNotes || '',
            };
            setResearch(result);
            if (scrapeData.suggestedTheme) setTheme(scrapeData.suggestedTheme);
            if (scrapeData.suggestedTagline && !brandTagline) setBrandTagline(scrapeData.suggestedTagline);

            // Save products to Supabase immediately
            if (result.productSuggestions?.length) {
              await upsertDemoProducts(demoId, result.productSuggestions.map((p, i) => ({
                ...p, brand: brandName, sortOrder: i,
              })));
            }
            if (result.personaSuggestions?.length) {
              await upsertDemoPersonas(demoId, result.personaSuggestions.map((p, i) => ({
                ...p, sortOrder: i,
              })));
            }
          }
        } catch {
          // scrape is best-effort
        }
        return; // done — don't fall through
      }

      if (researchMode === 'scrape' && brandUrl) {
        // Scrape the actual website
        const res = await fetch('/api/site-scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: brandUrl, maxPages: 10 }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Scrape failed');
        }
        const data = await res.json();
        const result: BrandResearchResult = {
          suggestedTheme: data.suggestedTheme,
          suggestedTagline: data.suggestedTagline || '',
          productSuggestions: data.productSuggestions || [],
          personaSuggestions: data.personaSuggestions || [],
          brandVoiceNotes: data.brandVoiceNotes || '',
        };
        setResearch(result);
        if (data.suggestedTheme) setTheme(data.suggestedTheme);
        if (data.suggestedTagline && !brandTagline) setBrandTagline(data.suggestedTagline);

        // Auto-save products
        if (result.productSuggestions?.length) {
          await upsertDemoProducts(demoId, result.productSuggestions.map((p, i) => ({
            ...p, brand: brandName, sortOrder: i,
          })));
        }
      } else {
        // AI-generate from brand knowledge
        const res = await fetch('/api/brand-research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandName, brandUrl, vertical }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Research failed');
        }
        const data: BrandResearchResult = await res.json();
        setResearch(data);
        if (data.suggestedTheme) setTheme(data.suggestedTheme);
        if (data.suggestedTagline && !brandTagline) setBrandTagline(data.suggestedTagline);

        // Auto-save products + personas
        if (data.productSuggestions?.length) {
          await upsertDemoProducts(demoId, data.productSuggestions.map((p, i) => ({
            ...p, brand: brandName, sortOrder: i,
          })));
        }
        if (data.personaSuggestions?.length) {
          await upsertDemoPersonas(demoId, data.personaSuggestions.map((p, i) => ({
            ...p, sortOrder: i,
          })));
        }
      }
    } catch (err) {
      setResearchError(err instanceof Error ? err.message : 'Research failed');
    } finally {
      setResearching(false);
    }
  }

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      // If demo was already created during research, just update and navigate
      if (createdDemoId) {
        await updateDemo(createdDemoId, {
          brand_tagline: brandTagline,
          theme,
        });
        navigate(`/admin/demo/${createdDemoId}`);
        return;
      }

      // Otherwise create fresh (user skipped research)
      const input: CreateDemoInput = {
        slug,
        name: `${brandName} Demo`,
        vertical,
        ownerEmail,
        brandName,
        brandTagline: brandTagline || undefined,
        theme,
      };
      const demo = await createDemo(input);
      navigate(`/admin/demo/${demo.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create demo');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold mb-2">New Demo</h2>
      <p className="text-gray-500 text-sm mb-8">
        Configure a new demo instance based on the golden template.
      </p>

      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        {(['brand', 'research', 'theme', 'review'] as WizardStep[]).map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              step === s
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-300'
            }`}
          >
            {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Step: Brand */}
      {step === 'brand' && (
        <div className="space-y-5">
          <Field label="Brand Name" required>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g., Gucci, Lush, Glossier"
              className="input"
            />
            {slug && (
              <p className="text-xs text-gray-600 mt-1">
                URL: <span className="text-gray-400">{slug}.demo-combobulator.com</span>
              </p>
            )}
          </Field>

          <Field label="Tagline">
            <input
              type="text"
              value={brandTagline}
              onChange={(e) => setBrandTagline(e.target.value)}
              placeholder="e.g., Your Personal Style Advisor"
              className="input"
            />
          </Field>

          <Field label="Brand Website" hint="Optional — used for AI research to auto-generate products & theme">
            <input
              type="url"
              value={brandUrl}
              onChange={(e) => setBrandUrl(e.target.value)}
              placeholder="https://www.gucci.com"
              className="input"
            />
          </Field>

          <Field label="Vertical" required>
            <div className="grid grid-cols-2 gap-2">
              {VERTICALS.map((v) => (
                <button
                  key={v.value}
                  onClick={() => setVertical(v.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    vertical === v.value
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-sm font-medium">{v.label}</div>
                  <div className="text-xs text-gray-500">{v.description}</div>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Your Email" required>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="your.name@dentsu.com"
              className="input"
            />
          </Field>

          <div className="pt-4 flex gap-3">
            <button
              onClick={() => setStep('research')}
              disabled={!brandName || !ownerEmail}
              className="btn-primary"
            >
              Next: AI Research →
            </button>
            <button
              onClick={() => setStep('theme')}
              disabled={!brandName || !ownerEmail}
              className="btn-secondary"
            >
              Skip to Theme →
            </button>
          </div>
        </div>
      )}

      {/* Step: Research */}
      {step === 'research' && (
        <div className="space-y-5">
          <p className="text-sm text-gray-400">
            Populate your demo with real data from <strong className="text-white">{brandName}</strong>.
          </p>

          {/* Mode selector */}
          {!research && !researching && captureStatus !== 'done' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setResearchMode('capture')}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    researchMode === 'capture'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-sm font-medium">Clone Website</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Full headless capture — renders the real site, downloads all assets, creates a static mirror
                  </div>
                </button>
                <button
                  onClick={() => setResearchMode('scrape')}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    researchMode === 'scrape'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-sm font-medium">Scrape Data Only</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Extract products, images, and colors — plug into the advisor template
                  </div>
                </button>
                <button
                  onClick={() => setResearchMode('ai-generate')}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    researchMode === 'ai-generate'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-sm font-medium">AI Generate</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Claude generates products and personas from brand knowledge
                  </div>
                </button>
              </div>

              <div className="border border-dashed border-gray-700 rounded-xl p-6 text-center">
                {(researchMode === 'capture' || researchMode === 'scrape') && !brandUrl && (
                  <p className="text-yellow-400 text-sm mb-3">
                    Go back and enter a brand website URL first.
                  </p>
                )}
                {researchMode === 'capture' && brandUrl && (
                  <p className="text-gray-500 text-sm mb-3">
                    Will launch a headless browser, render <span className="text-gray-300">{brandUrl}</span>, and capture the full site with all CSS, images, and layout.
                  </p>
                )}
                {researchMode === 'scrape' && brandUrl && (
                  <p className="text-gray-500 text-sm mb-3">
                    Will crawl <span className="text-gray-300">{brandUrl}</span> and extract product data.
                  </p>
                )}
                {researchMode === 'ai-generate' && (
                  <p className="text-gray-500 text-sm mb-3">
                    Claude will generate products, personas, and theme for {brandName}.
                  </p>
                )}
                <button
                  onClick={runResearch}
                  disabled={(researchMode === 'capture' || researchMode === 'scrape') && !brandUrl}
                  className="btn-primary"
                >
                  {researchMode === 'capture' ? 'Clone Website' : researchMode === 'scrape' ? 'Scrape Data' : 'Run AI Research'}
                </button>
              </div>
            </>
          )}

          {researching && (
            <div className="border border-gray-700 rounded-xl p-8 text-center">
              <div className="animate-pulse text-indigo-400 text-sm mb-2">
                {researchMode === 'capture' ? `Cloning ${brandUrl}...` : researchMode === 'scrape' ? `Scraping ${brandUrl}...` : `Researching ${brandName}...`}
              </div>
              <p className="text-xs text-gray-500">
                {researchMode === 'capture'
                  ? 'Headless browser is rendering pages, capturing screenshots, and downloading assets. Check the terminal for live progress.'
                  : researchMode === 'scrape'
                    ? 'Crawling product pages, extracting data, and enriching with AI. This takes 30-90 seconds.'
                    : 'Generating theme, products, and personas. This takes 30-60 seconds.'}
              </p>
              {captureStatus === 'running' && (
                <div className="mt-4 space-y-2">
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div className="bg-indigo-500 h-1.5 rounded-full animate-[pulse_2s_ease-in-out_infinite]" style={{ width: '75%' }} />
                  </div>
                  <p className="text-xs text-gray-600">Polling for completion every 5 seconds...</p>
                </div>
              )}
            </div>
          )}

          {/* Capture complete — show preview */}
          {captureStatus === 'done' && capturePreviewUrl && (
            <div className="space-y-4">
              <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-emerald-300">Site Captured Successfully</div>
                    <p className="text-xs text-gray-400 mt-1">Full static snapshot with all CSS, images, and layout.</p>
                  </div>
                  <a
                    href={capturePreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs"
                  >
                    Preview Captured Site ↗
                  </a>
                </div>
              </div>
              {/* Show iframe preview */}
              <div className="border border-gray-700 rounded-xl overflow-hidden">
                <div className="bg-gray-800 px-3 py-2 flex items-center gap-2 text-xs text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="ml-2 flex-1 bg-gray-700 rounded px-2 py-0.5">{capturePreviewUrl}</span>
                </div>
                <iframe
                  src={capturePreviewUrl}
                  className="w-full border-0"
                  style={{ height: '400px' }}
                  title="Captured site preview"
                />
              </div>
            </div>
          )}

          {researchError && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-300 text-sm">
              {researchError}
              <button onClick={runResearch} className="block mt-2 text-red-400 hover:text-red-300 text-xs underline">
                Retry
              </button>
            </div>
          )}

          {research && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-4">
                <div className="text-sm font-medium text-emerald-300 mb-2">Research Complete</div>
                <div className="grid grid-cols-3 gap-4 text-xs text-gray-400">
                  <div>
                    <span className="text-gray-300 font-medium">{research.productSuggestions.length}</span> products generated
                  </div>
                  <div>
                    <span className="text-gray-300 font-medium">{research.personaSuggestions.length}</span> personas generated
                  </div>
                  <div>
                    Theme <span className="inline-block w-3 h-3 rounded" style={{ background: research.suggestedTheme.accentColor }} /> applied
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <Field label="Suggested Tagline">
                <input
                  type="text"
                  value={brandTagline}
                  onChange={(e) => setBrandTagline(e.target.value)}
                  className="input"
                />
              </Field>

              {/* Brand voice preview */}
              {research.brandVoiceNotes && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <div className="text-xs font-medium text-gray-400 mb-2">Brand Voice Notes</div>
                  <p className="text-sm text-gray-300">{research.brandVoiceNotes}</p>
                </div>
              )}

              {/* Product preview */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="text-xs font-medium text-gray-400 mb-2">
                  Generated Products ({research.productSuggestions.length})
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {research.productSuggestions.slice(0, 10).map((p, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-400">
                      <span className="text-gray-300">{p.name}</span>
                      <span>${p.price}</span>
                    </div>
                  ))}
                  {research.productSuggestions.length > 10 && (
                    <div className="text-xs text-gray-600">+ {research.productSuggestions.length - 10} more</div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button onClick={() => setStep('brand')} className="btn-secondary">
              ← Back
            </button>
            <button onClick={() => setStep('theme')} className="btn-primary">
              Next: Theme →
            </button>
          </div>
        </div>
      )}

      {/* Step: Theme */}
      {step === 'theme' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <ColorField
              label="Primary Color"
              value={theme.primaryColor}
              onChange={(v) => setTheme({ ...theme, primaryColor: v })}
            />
            <ColorField
              label="Accent Color"
              value={theme.accentColor}
              onChange={(v) => setTheme({ ...theme, accentColor: v })}
            />
            <ColorField
              label="Background"
              value={theme.backgroundColor}
              onChange={(v) => setTheme({ ...theme, backgroundColor: v })}
            />
            <ColorField
              label="Text Color"
              value={theme.textColor}
              onChange={(v) => setTheme({ ...theme, textColor: v })}
            />
          </div>

          <Field label="Font Family">
            <input
              type="text"
              value={theme.fontFamily}
              onChange={(e) => setTheme({ ...theme, fontFamily: e.target.value })}
              className="input"
            />
          </Field>

          {/* Theme preview */}
          <div
            className="rounded-xl p-6 border border-gray-700"
            style={{
              background: theme.backgroundColor,
              color: theme.textColor,
              fontFamily: theme.fontFamily,
            }}
          >
            <div className="text-xs text-gray-500 mb-3">Preview</div>
            <h3 className="text-lg font-bold mb-1" style={{ color: theme.textColor }}>
              {brandName || 'Brand Name'}
            </h3>
            <p className="text-sm opacity-70 mb-4">
              {brandTagline || 'Your tagline here'}
            </p>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: theme.accentColor }}
            >
              Shop Now
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={() => setStep('research')} className="btn-secondary">
              ← Back
            </button>
            <button onClick={() => setStep('review')} className="btn-primary">
              Next: Review →
            </button>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div className="space-y-5">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            <ReviewRow label="Brand" value={brandName} />
            <ReviewRow label="Tagline" value={brandTagline || '—'} />
            <ReviewRow label="Vertical" value={vertical} />
            <ReviewRow label="Slug" value={`${slug}.demo-combobulator.com`} />
            <ReviewRow label="Owner" value={ownerEmail} />
            <ReviewRow label="Primary" value={theme.primaryColor}>
              <span className="inline-block w-4 h-4 rounded" style={{ background: theme.primaryColor }} />
            </ReviewRow>
            <ReviewRow label="Accent" value={theme.accentColor}>
              <span className="inline-block w-4 h-4 rounded" style={{ background: theme.accentColor }} />
            </ReviewRow>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button onClick={() => setStep('theme')} className="btn-secondary">
              ← Back
            </button>
            <button onClick={handleCreate} disabled={saving} className="btn-primary">
              {saving ? 'Creating...' : 'Create Demo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared field components ────────────────────────────────────────

function Field({ label, hint, required, children }: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      {hint && <span className="block text-xs text-gray-600 mt-0.5">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function ColorField({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input flex-1"
        />
      </div>
    </Field>
  );
}

function ReviewRow({ label, value, children }: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="flex items-center gap-2 text-gray-200">
        {children}
        {value}
      </span>
    </div>
  );
}
