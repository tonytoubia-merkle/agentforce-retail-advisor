import { motion } from 'framer-motion';
import { ProductCard } from './ProductCard';
import type { Product } from '@/types/product';

interface ProductGridProps {
  products: Product[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
};

export const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
    >
      {products.map((product) => (
        <motion.div key={product.id} variants={itemVariants} className="snap-start">
          <ProductCard product={product} />
        </motion.div>
      ))}
    </motion.div>
  );
};
