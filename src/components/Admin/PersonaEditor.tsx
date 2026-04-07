import { useEffect, useState, useCallback } from 'react';
import type { DemoPersona, DemoPersonaInput } from '@/types/demo';
import { getDemoPersonas, upsertDemoPersonas } from '@/services/supabase/demoService';

interface Props {
  demoId: string;
  brandName: string;
}

export function PersonaEditor({ demoId, brandName }: Props) {
  const [personas, setPersonas] = useState<DemoPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadPersonas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDemoPersonas(demoId);
      setPersonas(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load personas');
    } finally {
      setLoading(false);
    }
  }, [demoId]);

  useEffect(() => { loadPersonas(); }, [loadPersonas]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const inputs: DemoPersonaInput[] = personas.map((p) => ({
        personaKey: p.personaKey,
        label: p.label,
        subtitle: p.subtitle,
        traits: p.traits,
        profile: p.profile,
        sortOrder: p.sortOrder,
      }));
      await upsertDemoPersonas(demoId, inputs);
      setSuccessMsg('Personas saved');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function addPersona() {
    const key = `persona-${Date.now()}`;
    const newPersona: DemoPersona = {
      id: key,
      demoId,
      personaKey: key,
      label: '',
      subtitle: '',
      traits: [],
      profile: {
        id: key,
        name: '',
        email: '',
        beautyProfile: {
          skinType: 'normal',
          concerns: [],
          allergies: [],
          preferredBrands: [brandName],
          ageRange: '30-40',
        },
        orders: [],
        chatSummaries: [],
        meaningfulEvents: [],
        agentCapturedProfile: {},
      },
      sortOrder: personas.length,
    };
    setPersonas([...personas, newPersona]);
    setEditingId(newPersona.id);
  }

  function removePersona(id: string) {
    setPersonas(personas.filter((p) => p.id !== id));
  }

  function updatePersona(id: string, field: string, value: unknown) {
    setPersonas(personas.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  }

  function updateProfile(id: string, path: string, value: unknown) {
    setPersonas(personas.map((p) => {
      if (p.id !== id) return p;
      const profile = { ...p.profile } as Record<string, unknown>;
      const parts = path.split('.');
      let current = profile;
      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = { ...(current[parts[i]] as Record<string, unknown> || {}) };
        current = current[parts[i]] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = value;
      return { ...p, profile };
    }));
  }

  async function importFromTemplate() {
    setLoading(true);
    try {
      const { PERSONAS: templatePersonas } = await import('@/mocks/customerPersonas');
      const imported: DemoPersona[] = templatePersonas.map((tp, i) => ({
        id: `tmpl-${tp.id}`,
        demoId,
        personaKey: tp.id,
        label: tp.label,
        subtitle: tp.subtitle,
        traits: tp.traits,
        profile: {
          ...tp.profile,
          beautyProfile: {
            ...(tp.profile.beautyProfile || {}),
            preferredBrands: [brandName],
          },
        } as Record<string, unknown>,
        sortOrder: i,
      }));
      setPersonas(imported);
    } catch {
      setError('Failed to import template personas');
    } finally {
      setLoading(false);
    }
  }

  async function aiGeneratePersonas() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/brand-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName, vertical: 'beauty' }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      const generated: DemoPersona[] = (data.personaSuggestions || []).map((p: DemoPersonaInput, i: number) => ({
        id: `ai-${i}`,
        demoId,
        ...p,
        sortOrder: i,
      }));
      setPersonas(generated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI generation failed');
    } finally {
      setLoading(false);
    }
  }

  if (loading && personas.length === 0) {
    return <div className="text-gray-500 text-sm p-4">Loading personas...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{personas.length} personas</span>
        <div className="flex gap-2">
          <button onClick={importFromTemplate} className="btn-secondary text-xs">
            Import from Template
          </button>
          <button onClick={aiGeneratePersonas} className="btn-secondary text-xs">
            AI Generate
          </button>
          <button onClick={addPersona} className="btn-secondary text-xs">
            + Add Persona
          </button>
        </div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm">{error}</div>}
      {successMsg && <div className="bg-emerald-900/30 border border-emerald-800 rounded-lg p-3 text-emerald-300 text-sm">{successMsg}</div>}

      {/* Persona list */}
      <div className="space-y-2">
        {personas.map((persona) => {
          const bp = (persona.profile as Record<string, unknown>)?.beautyProfile as Record<string, unknown> | undefined;
          return (
            <div
              key={persona.id}
              className="border border-gray-800 rounded-lg bg-gray-900/30 overflow-hidden"
            >
              {/* Collapsed row */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800/30"
                onClick={() => setEditingId(editingId === persona.id ? null : persona.id)}
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                  {(persona.label || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-200 truncate">
                    {persona.label || 'Unnamed Persona'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {persona.subtitle || persona.personaKey} · {persona.traits.slice(0, 3).join(', ')}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removePersona(persona.id); }}
                  className="text-xs text-red-400 hover:text-red-300 px-2"
                >
                  Remove
                </button>
              </div>

              {/* Expanded editor */}
              {editingId === persona.id && (
                <div className="border-t border-gray-800 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <MiniField label="Full Name" value={persona.label} onChange={(v) => updatePersona(persona.id, 'label', v)} />
                    <MiniField label="Key" value={persona.personaKey} onChange={(v) => updatePersona(persona.id, 'personaKey', v)} />
                    <MiniField label="Subtitle" value={persona.subtitle || ''} onChange={(v) => updatePersona(persona.id, 'subtitle', v)} />
                    <MiniField label="Email" value={(persona.profile as Record<string, unknown>)?.email as string || ''} onChange={(v) => updateProfile(persona.id, 'email', v)} />
                  </div>
                  <MiniField
                    label="Traits (comma-separated)"
                    value={persona.traits.join(', ')}
                    onChange={(v) => updatePersona(persona.id, 'traits', v.split(',').map((t) => t.trim()).filter(Boolean))}
                  />
                  {bp && (
                    <div className="grid grid-cols-2 gap-3">
                      <MiniField label="Skin Type" value={(bp.skinType as string) || ''} onChange={(v) => updateProfile(persona.id, 'beautyProfile.skinType', v)} />
                      <MiniField label="Age Range" value={(bp.ageRange as string) || ''} onChange={(v) => updateProfile(persona.id, 'beautyProfile.ageRange', v)} />
                      <MiniField
                        label="Concerns"
                        value={((bp.concerns as string[]) || []).join(', ')}
                        onChange={(v) => updateProfile(persona.id, 'beautyProfile.concerns', v.split(',').map((t) => t.trim()).filter(Boolean))}
                      />
                      <MiniField
                        label="Preferred Brands"
                        value={((bp.preferredBrands as string[]) || []).join(', ')}
                        onChange={(v) => updateProfile(persona.id, 'beautyProfile.preferredBrands', v.split(',').map((t) => t.trim()).filter(Boolean))}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save */}
      {personas.length > 0 && (
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save All Personas'}
        </button>
      )}
    </div>
  );
}

function MiniField({ label, value, onChange, type = 'text' }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="input mt-1" />
    </label>
  );
}
