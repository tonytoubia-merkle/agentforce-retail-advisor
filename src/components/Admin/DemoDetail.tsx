import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { DemoConfig, DeployStep } from '@/types/demo';
import { getDemo, updateDemo, deleteDemo, getDeploySteps, createDemo } from '@/services/supabase/demoService';
import { ProductEditor } from './ProductEditor';
import { PersonaEditor } from './PersonaEditor';

type Tab = 'overview' | 'salesforce' | 'products' | 'personas' | 'deploy';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'salesforce', label: 'Salesforce' },
  { key: 'products', label: 'Products' },
  { key: 'personas', label: 'Personas' },
  { key: 'deploy', label: 'Deploy' },
];

export function DemoDetail() {
  const { demoId } = useParams<{ demoId: string }>();
  const navigate = useNavigate();
  const [demo, setDemo] = useState<DemoConfig | null>(null);
  const [deploySteps, setDeploySteps] = useState<DeployStep[]>([]);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!demoId) return;
    Promise.all([getDemo(demoId), getDeploySteps(demoId)])
      .then(([d, steps]) => {
        setDemo(d);
        setDeploySteps(steps);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [demoId]);

  async function handleSave(updates: Record<string, unknown>) {
    if (!demo) return;
    setSaving(true);
    try {
      const updated = await updateDemo(demo.id, updates);
      setDemo(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!demo || !confirm(`Delete "${demo.name}"? This cannot be undone.`)) return;
    await deleteDemo(demo.id);
    navigate('/admin');
  }

  async function handleDeploy() {
    if (!demo) return;
    setTab('deploy');
    setError(null);
    try {
      const res = await fetch('/api/demo-deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoId: demo.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Deploy failed');
      }
      // Refresh demo + deploy steps
      const [updated, steps] = await Promise.all([getDemo(demo.id), getDeploySteps(demo.id)]);
      if (updated) setDemo(updated);
      setDeploySteps(steps);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deploy failed');
    }
  }

  async function handleClone() {
    if (!demo) return;
    const newSlug = `${demo.slug}-copy-${Date.now().toString(36)}`;
    try {
      const cloned = await createDemo({
        slug: newSlug,
        name: `${demo.name} (Copy)`,
        vertical: demo.vertical,
        ownerEmail: demo.ownerEmail,
        brandName: demo.brandName,
        brandTagline: demo.brandTagline,
        theme: demo.theme,
        featureFlags: demo.featureFlags,
      });
      navigate(`/admin/demo/${cloned.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Clone failed');
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!demo) return <div className="p-8 text-red-400">Demo not found</div>;

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{demo.name}</h2>
            <StatusBadge status={demo.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {demo.slug}.demo-combobulator.com · {demo.brandName} · {demo.vertical}
          </p>
        </div>
        <div className="flex gap-2">
          {demo.status === 'draft' && (
            <button onClick={handleDeploy} className="btn-primary text-sm">
              Deploy
            </button>
          )}
          {demo.status === 'live' && (
            <a
              href={`https://${demo.slug}.demo-combobulator.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm"
            >
              Open Demo ↗
            </a>
          )}
          <button onClick={handleClone} className="btn-secondary text-sm">
            Clone
          </button>
          <button onClick={handleDelete} className="btn-danger text-sm">
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && <OverviewTab demo={demo} onSave={handleSave} saving={saving} />}
      {tab === 'salesforce' && <SalesforceTab demo={demo} onSave={handleSave} saving={saving} />}
      {tab === 'products' && <ProductsTab demoId={demo.id} brandName={demo.brandName} />}
      {tab === 'personas' && <PersonasTab demoId={demo.id} brandName={demo.brandName} />}
      {tab === 'deploy' && <DeployTab demo={demo} steps={deploySteps} />}
    </div>
  );
}

// ─── Tab: Overview ──────────────────────────────────────────────────

function OverviewTab({ demo, onSave, saving }: { demo: DemoConfig; onSave: (u: Record<string, unknown>) => void; saving: boolean }) {
  const [brandName, setBrandName] = useState(demo.brandName);
  const [brandTagline, setBrandTagline] = useState(demo.brandTagline || '');
  const [theme, setTheme] = useState(demo.theme);

  return (
    <div className="space-y-6">
      <Section title="Brand Identity">
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Brand Name" value={brandName} onChange={setBrandName} />
          <InputField label="Tagline" value={brandTagline} onChange={setBrandTagline} />
        </div>
      </Section>

      <Section title="Theme">
        <div className="grid grid-cols-2 gap-4">
          <ColorInput label="Primary" value={theme.primaryColor} onChange={(v) => setTheme({ ...theme, primaryColor: v })} />
          <ColorInput label="Accent" value={theme.accentColor} onChange={(v) => setTheme({ ...theme, accentColor: v })} />
          <ColorInput label="Background" value={theme.backgroundColor} onChange={(v) => setTheme({ ...theme, backgroundColor: v })} />
          <ColorInput label="Text" value={theme.textColor} onChange={(v) => setTheme({ ...theme, textColor: v })} />
        </div>
        <InputField label="Font Family" value={theme.fontFamily} onChange={(v) => setTheme({ ...theme, fontFamily: v })} />
      </Section>

      <Section title="Feature Flags">
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(demo.featureFlags).map(([key, val]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={val as boolean}
                onChange={() => onSave({ feature_flags: { ...demo.featureFlags, [key]: !val } })}
                className="rounded"
              />
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
            </label>
          ))}
        </div>
      </Section>

      <button
        onClick={() => onSave({ brand_name: brandName, brand_tagline: brandTagline, theme })}
        disabled={saving}
        className="btn-primary"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

// ─── Tab: Salesforce ────────────────────────────────────────────────

function SalesforceTab({ demo, onSave, saving }: { demo: DemoConfig; onSave: (u: Record<string, unknown>) => void; saving: boolean }) {
  const [sf, setSf] = useState(demo.salesforce);

  function save() {
    onSave({
      sf_instance_url: sf.instanceUrl,
      sf_org_id: sf.orgId,
      sf_client_id: sf.clientId,
      sf_client_secret: sf.clientSecret,
      sf_agent_id: sf.agentId,
      sf_skin_agent_id: sf.skinAgentId,
    });
  }

  return (
    <div className="space-y-6">
      <Section title="Salesforce Org Connection">
        <div className="space-y-4">
          <InputField label="Instance URL" value={sf.instanceUrl || ''} onChange={(v) => setSf({ ...sf, instanceUrl: v })} placeholder="https://xxx.my.salesforce.com" />
          <InputField label="Org ID" value={sf.orgId || ''} onChange={(v) => setSf({ ...sf, orgId: v })} />
          <InputField label="Connected App Client ID" value={sf.clientId || ''} onChange={(v) => setSf({ ...sf, clientId: v })} />
          <InputField label="Connected App Client Secret" value={sf.clientSecret || ''} onChange={(v) => setSf({ ...sf, clientSecret: v })} type="password" />
        </div>
      </Section>

      <Section title="Agent IDs">
        <div className="space-y-4">
          <InputField label="Beauty Concierge Agent ID" value={sf.agentId || ''} onChange={(v) => setSf({ ...sf, agentId: v })} />
          <InputField label="Skin Concierge Agent ID" value={sf.skinAgentId || ''} onChange={(v) => setSf({ ...sf, skinAgentId: v })} />
        </div>
      </Section>

      <div className="flex gap-3">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save SF Config'}
        </button>
        <button className="btn-secondary" title="Coming in Phase 3">
          Provision Scratch Org
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Products ──────────────────────────────────────────────────

function ProductsTab({ demoId, brandName }: { demoId: string; brandName: string }) {
  return (
    <div className="space-y-4">
      <Section title="Product Catalog">
        <p className="text-sm text-gray-500 mb-4">
          Manage the products that appear in this demo's advisor experience.
        </p>
        <ProductEditor demoId={demoId} brandName={brandName} />
      </Section>
    </div>
  );
}

// ─── Tab: Personas ──────────────────────────────────────────────────

function PersonasTab({ demoId, brandName }: { demoId: string; brandName: string }) {
  return (
    <div className="space-y-4">
      <Section title="Customer Personas">
        <p className="text-sm text-gray-500 mb-4">
          Customer personas used in the persona selector during demos.
        </p>
        <PersonaEditor demoId={demoId} brandName={brandName} />
      </Section>
    </div>
  );
}

// ─── Tab: Deploy ────────────────────────────────────────────────────

function DeployTab({ demo, steps }: { demo: DemoConfig; steps: DeployStep[] }) {
  const PIPELINE: { action: string; label: string }[] = [
    { action: 'create_org', label: 'Provision Salesforce Scratch Org' },
    { action: 'deploy_metadata', label: 'Deploy Customized Metadata' },
    { action: 'seed_data', label: 'Seed Product & Customer Data' },
    { action: 'configure_vercel', label: 'Configure Vercel Domain' },
  ];

  return (
    <div className="space-y-6">
      <Section title="Deployment Pipeline">
        <div className="space-y-3">
          {PIPELINE.map((p) => {
            const step = steps.find((s) => s.action === p.action);
            return (
              <div key={p.action} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg p-4">
                <StepIcon status={step?.status} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{p.label}</div>
                  {step?.error && <div className="text-xs text-red-400 mt-1">{step.error}</div>}
                  {step?.log && <div className="text-xs text-gray-500 mt-1 font-mono whitespace-pre-wrap">{step.log}</div>}
                </div>
                {step?.completedAt && (
                  <span className="text-xs text-gray-600">
                    {new Date(step.completedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {demo.status === 'live' && (
        <Section title="Quick Actions">
          <div className="flex gap-3">
            <button className="btn-secondary text-sm">Re-deploy Metadata</button>
            <button className="btn-secondary text-sm">Re-seed Data</button>
            <button className="btn-secondary text-sm">Clone Demo</button>
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Shared components ──────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input mt-1"
      />
    </label>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-2 mt-1">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="input flex-1" />
      </div>
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-gray-700 text-gray-300',
    deploying: 'bg-yellow-700 text-yellow-200',
    live: 'bg-emerald-700 text-emerald-200',
    archived: 'bg-gray-700 text-gray-400',
    error: 'bg-red-700 text-red-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.draft}`}>
      {status}
    </span>
  );
}

function StepIcon({ status }: { status?: string }) {
  if (status === 'success') return <span className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-xs">✓</span>;
  if (status === 'running') return <span className="w-6 h-6 rounded-full bg-yellow-600 animate-pulse flex items-center justify-center text-xs">⟳</span>;
  if (status === 'failed') return <span className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-xs">✕</span>;
  return <span className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-500">○</span>;
}
