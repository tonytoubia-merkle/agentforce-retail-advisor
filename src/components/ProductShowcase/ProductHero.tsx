import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScene } from '@/contexts/SceneContext';
import { useProductStaging } from '@/hooks/useProductStaging';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductDetails } from './ProductDetails';
import type { Product } from '@/types/product';

interface ProductHeroProps {
  product: Product;
}

export const ProductHero: React.FC<ProductHeroProps> = ({ product }) => {
  const { scene, openCheckout } = useScene();
  const [showDetails, setShowDetails] = useState(false);
  const { imageUrl, isStaging, isStaged } = useProductStaging(
    product.id,
    product.imageUrl,
    scene.setting,
    product.name
  );

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative"
      >
        <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-xl relative">
          {isStaging && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          <img
            src={imageUrl}
            alt={product.name}
            className={`w-full h-full relative z-10 transition-opacity duration-500 object-contain product-blend ${
              isStaging ? 'opacity-50' : 'opacity-100'
            }`}
          />
        </div>
        {product.personalizationScore && product.personalizationScore > 0.8 && (
          <Badge className="absolute -top-2 -right-2 bg-green-500">
            Perfect Match
          </Badge>
        )}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="absolute bottom-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          aria-label="Product details"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-4 text-white max-w-md"
      >
        <span className="text-white/60 uppercase tracking-wider text-xs">
          {product.brand}
        </span>
        <h2 className="text-xl font-semibold">
          {product.name}
        </h2>
        <p className="text-white/80 text-sm leading-relaxed">
          {product.description}
        </p>

        <div className="flex flex-wrap gap-2 mt-2">
          {product.attributes?.skinType?.map((type) => (
            <span
              key={type}
              className="px-3 py-1 bg-white/20 rounded-full text-sm"
            >
              {type} skin
            </span>
          ))}
        </div>

        <div className="flex items-center gap-6 mt-4">
          <span className="text-xl font-light">
            ${(product.price ?? 0).toFixed(2)}
          </span>
          <Button
            onClick={() => openCheckout()}
            size="lg"
            className="bg-white text-purple-900 hover:bg-white/90"
          >
            Add to Bag
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetails && (
          <ProductDetails product={product} onClose={() => setShowDetails(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};
