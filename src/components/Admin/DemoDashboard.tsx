import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { DemoSummary, DemoStatus } from '@/types/demo';
import { listDemos } from '@/services/supabase/demoService';

const STATUS_COLORS: Record<DemoStatus, string> = {
  draft: 'bg-gray-600',
  deploying: 'bg-yellow-500 animate-pulse',
  live: 'bg-emerald-500',
  archived: 'bg-gray-500',
  error: 'bg-red-500',
};

export function DemoDashboard() {
  const [demos, setDemos] = useState<DemoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDemos()
      .then(setDemos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Demos</h2>
          <p className="text-gray-500 text-sm mt-1">
            {demos.length} demo{demos.length !== 1 ? 's' : ''} created
          </p>
        </div>
        <Link
          to="/admin/new"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
        >
          + New Demo
        </Link>
      </div>

      {/* Loading / Error states */}
      {loading && (
        <div className="text-gray-500 text-sm">Loading demos...</div>
      )}
      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && demos.length === 0 && (
        <div className="text-center py-20 border border-dashed border-gray-700 rounded-xl">
          <p className="text-gray-500 mb-4">No demos yet.</p>
          <Link
            to="/admin/new"
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
          >
            Create your first demo →
          </Link>
        </div>
      )}

      {/* Demo cards grid */}
      {demos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {demos.map((demo) => (
            <Link
              key={demo.id}
              to={`/admin/demo/${demo.id}`}
              className="block border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors bg-gray-900/30"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{demo.name}</h3>
                  <p className="text-xs text-gray-500">{demo.brandName}</p>
                </div>
                <span className={`inline-block w-2 h-2 rounded-full mt-1.5 ${STATUS_COLORS[demo.status]}`} />
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="capitalize">{demo.vertical}</span>
                <span>·</span>
                <span>{demo.slug}.demo-combobulator.com</span>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                {demo.ownerEmail} · {new Date(demo.createdAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
