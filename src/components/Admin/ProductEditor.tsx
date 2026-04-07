import { useEffect, useState, useCallback } from 'react';
import type { DemoProduct, DemoProductInput } from '@/types/demo';
import { getDemoProducts, upsertDemoProducts } from '@/services/supabase/demoService';

interface Props {
  demoId: string;
  brandName: string;
}

export function ProductEditor({ demoId, brandName }: Props) {
  const [products, setProducts] = useState<DemoProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDemoProducts(demoId);
      setProducts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [demoId]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const inputs: DemoProductInput[] = products.map((p) => ({
        externalId: p.externalId,
        name: p.name,
        brand: p.brand,
        category: p.category,
        price: p.price,
        currency: p.currency,
        description: p.description,
        shortDescription: p.shortDescription,
        imageUrl: p.imageUrl,
        images: p.images,
        rating: p.rating,
        reviewCount: p.reviewCount,
        inStock: p.inStock,
        attributes: p.attributes,
        retailers: p.retailers,
        sortOrder: p.sortOrder,
      }));
      await upsertDemoProducts(demoId, inputs);
      setSuccessMsg('Products saved');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function addProduct() {
    const newProduct: DemoProduct = {
      id: `new-${Date.now()}`,
      demoId,
      name: '',
      brand: brandName,
      category: 'moisturizer',
      price: 0,
      currency: 'USD',
      description: '',
      shortDescription: '',
      imageUrl: '',
      images: [],
      rating: 4.5,
      reviewCount: 0,
      inStock: true,
      attributes: {},
      retailers: [],
      sortOrder: products.length,
    };
    setProducts([...products, newProduct]);
    setEditingId(newProduct.id);
  }

  function removeProduct(id: string) {
    setProducts(products.filter((p) => p.id !== id));
  }

  function updateProduct(id: string, field: string, value: unknown) {
    setProducts(products.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  }

  async function importFromTemplate() {
    setLoading(true);
    try {
      const { MOCK_PRODUCTS } = await import('@/mocks/products');
      const templateProducts: DemoProduct[] = MOCK_PRODUCTS.slice(0, 30).map((mp, i) => ({
        id: `tmpl-${i}`,
        demoId,
        externalId: mp.id,
        name: mp.name,
        brand: brandName, // Use the demo's brand name
        category: mp.category,
        price: mp.price,
        currency: mp.currency,
        description: mp.description,
        shortDescription: mp.shortDescription,
        imageUrl: mp.imageUrl,
        images: mp.images,
        rating: mp.rating,
        reviewCount: mp.reviewCount,
        inStock: mp.inStock,
        attributes: mp.attributes as Record<string, unknown>,
        retailers: mp.retailers || [],
        sortOrder: i,
      }));
      setProducts(templateProducts);
    } catch (e) {
      setError('Failed to import template products');
    } finally {
      setLoading(false);
    }
  }

  async function aiGenerateProducts() {
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

      const generated: DemoProduct[] = (data.productSuggestions || []).map((p: DemoProductInput, i: number) => ({
        id: `ai-${i}`,
        demoId,
        ...p,
        brand: brandName,
        sortOrder: i,
      }));
      setProducts(generated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI generation failed');
    } finally {
      setLoading(false);
    }
  }

  if (loading && products.length === 0) {
    return <div className="text-gray-500 text-sm p-4">Loading products...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{products.length} products</span>
        <div className="flex gap-2">
          <button onClick={importFromTemplate} className="btn-secondary text-xs">
            Import from Template
          </button>
          <button onClick={aiGenerateProducts} className="btn-secondary text-xs">
            AI Generate
          </button>
          <button onClick={addProduct} className="btn-secondary text-xs">
            + Add Product
          </button>
        </div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm">{error}</div>}
      {successMsg && <div className="bg-emerald-900/30 border border-emerald-800 rounded-lg p-3 text-emerald-300 text-sm">{successMsg}</div>}

      {/* Product list */}
      <div className="space-y-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="border border-gray-800 rounded-lg bg-gray-900/30 overflow-hidden"
          >
            {/* Collapsed row */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800/30"
              onClick={() => setEditingId(editingId === product.id ? null : product.id)}
            >
              {product.imageUrl && (
                <img src={product.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-200 truncate">
                  {product.name || 'Untitled Product'}
                </div>
                <div className="text-xs text-gray-500">
                  {product.category} · ${product.price} · {product.brand}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeProduct(product.id); }}
                className="text-xs text-red-400 hover:text-red-300 px-2"
              >
                Remove
              </button>
            </div>

            {/* Expanded editor */}
            {editingId === product.id && (
              <div className="border-t border-gray-800 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <MiniField label="Name" value={product.name} onChange={(v) => updateProduct(product.id, 'name', v)} />
                  <MiniField label="Brand" value={product.brand} onChange={(v) => updateProduct(product.id, 'brand', v)} />
                  <MiniField label="Category" value={product.category} onChange={(v) => updateProduct(product.id, 'category', v)} />
                  <MiniField label="Price" value={String(product.price)} onChange={(v) => updateProduct(product.id, 'price', parseFloat(v) || 0)} type="number" />
                  <MiniField label="Rating" value={String(product.rating)} onChange={(v) => updateProduct(product.id, 'rating', parseFloat(v) || 0)} type="number" />
                  <MiniField label="Image URL" value={product.imageUrl || ''} onChange={(v) => updateProduct(product.id, 'imageUrl', v)} />
                </div>
                <MiniField label="Short Description" value={product.shortDescription || ''} onChange={(v) => updateProduct(product.id, 'shortDescription', v)} />
                <label className="block">
                  <span className="text-xs text-gray-500">Description</span>
                  <textarea
                    value={product.description || ''}
                    onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                    rows={3}
                    className="input mt-1 resize-y"
                  />
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save */}
      {products.length > 0 && (
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save All Products'}
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
