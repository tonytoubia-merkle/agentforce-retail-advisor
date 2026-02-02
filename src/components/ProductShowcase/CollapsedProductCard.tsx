import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductShowcase } from './ProductShowcase';
import type { Product } from '@/types/product';
import type { SceneLayout } from '@/types/scene';

interface CollapsedProductCardProps {
  products: Product[];
  layout: SceneLayout;
}

export const CollapsedProductCard: React.FC<CollapsedProductCardProps> = ({ products, layout }) => {
  const [expanded, setExpanded] = useState(false);

  if (products.length === 0) return null;

  return (
    <div className="my-1">
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProductShowcase products={products} layout={layout} />
            <button
              onClick={() => setExpanded(false)}
              className="text-white/50 hover:text-white/70 text-[11px] ml-1 mt-1 transition-colors"
            >
              ▲ Collapse
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors w-fit max-w-[80%]"
          >
            {products.slice(0, 3).map((p) => (
              <img
                key={p.id}
                src={p.imageUrl}
                alt={p.name}
                className="w-8 h-8 rounded-lg object-contain bg-white/10"
              />
            ))}
            <span className="text-white/60 text-xs truncate">
              {products.length === 1
                ? products[0].name
                : `${products.length} products`}
            </span>
            <span className="text-white/40 text-[10px]">▼</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
