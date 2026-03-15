import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScene } from '@/contexts/SceneContext';
import { getRetailersForProducts } from '@/data/retailerCatalog';
import type { ProductRetailer } from '@/types/product';

type ShopMode = 'all' | 'in-store' | 'online';

const RETAILER_COLORS: Record<string, string> = {
  'Sephora':      'bg-black text-white',
  'Ulta Beauty':  'bg-red-600 text-white',
  'Target':       'bg-red-500 text-white',
  'Walgreens':    'bg-red-700 text-white',
  'CVS':          'bg-red-600 text-white',
  'Amazon':       'bg-amber-400 text-gray-900',
  'Nordstrom':    'bg-gray-900 text-white',
};

function RetailerBadge({ name }: { name: string }) {
  const cls = RETAILER_COLORS[name] ?? 'bg-gray-700 text-white';
  return (
    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-[10px] font-bold ${cls} flex-shrink-0`}>
      {name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
    </span>
  );
}

export const RetailerHandoff: React.FC = () => {
  const { scene, closeRetailerHandoff } = useScene();
  const [shopMode, setShopMode] = useState<ShopMode>('all');

  const products = scene.products;
  const allRetailers = getRetailersForProducts(products);

  const filtered: ProductRetailer[] = allRetailers.filter((r) => {
    if (shopMode === 'in-store') return r.inStore;
    if (shopMode === 'online') return r.online;
    return true;
  });

  const handleRetailerClick = (retailer: ProductRetailer) => {
    window.open(retailer.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={closeRetailerHandoff}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

        {/* Header */}
        <div className="px-5 pt-3 pb-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Where to Buy</h2>
              {products.length > 0 && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {products.length === 1
                    ? products[0].name
                    : `${products.length} recommended products`}
                </p>
              )}
            </div>
            <button
              onClick={closeRetailerHandoff}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors mt-0.5"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1.5 mt-3 p-1 bg-gray-100 rounded-xl w-fit">
            {(['all', 'in-store', 'online'] as ShopMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setShopMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                  shopMode === mode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {mode === 'all' ? 'All Options' : mode === 'in-store' ? 'In Store' : 'Online'}
              </button>
            ))}
          </div>
        </div>

        {/* Product summary strip */}
        {products.length > 1 && (
          <div className="px-5 pb-3 flex-shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {products.map((p) => (
                <div key={p.id} className="flex-shrink-0 flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                  <img src={p.imageUrl} alt={p.name} className="w-6 h-6 object-contain" />
                  <span className="text-xs text-gray-700 font-medium whitespace-nowrap max-w-[120px] truncate">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Retailer list */}
        <div className="overflow-y-auto flex-1 px-5 pb-6">
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center text-gray-400 text-sm py-8"
              >
                No {shopMode} options available for the current selection.
              </motion.p>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2.5">
                {filtered.map((retailer) => (
                  <motion.button
                    key={retailer.name}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleRetailerClick(retailer)}
                    className="w-full flex items-center gap-3 p-3.5 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors text-left border border-gray-100 hover:border-gray-200"
                  >
                    <RetailerBadge name={retailer.name} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">{retailer.name}</span>
                        <div className="flex gap-1">
                          {retailer.inStore && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-medium rounded">
                              In Store
                            </span>
                          )}
                          {retailer.online && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-medium rounded">
                              Online
                            </span>
                          )}
                        </div>
                      </div>
                      {retailer.promo && (
                        <p className="text-xs text-amber-600 font-medium mt-0.5">{retailer.promo}</p>
                      )}
                    </div>

                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-gray-400 mt-4">
            Links open the retailer's search for your recommended products.
            Prices and availability may vary.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
