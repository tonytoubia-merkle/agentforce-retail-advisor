import { motion } from 'framer-motion';
import { ProductHero } from './ProductHero';
import { ProductGrid } from './ProductGrid';
import type { Product } from '@/types/product';
import type { SceneLayout } from '@/types/scene';

interface ProductShowcaseProps {
  products: Product[];
  layout: SceneLayout;
}

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({
  products,
  layout,
}) => {
  if (products.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="flex items-center justify-center py-4 px-2"
    >
      {layout === 'product-hero' && products.length === 1 ? (
        <ProductHero product={products[0]} />
      ) : (
        <ProductGrid products={products} />
      )}
    </motion.div>
  );
};
