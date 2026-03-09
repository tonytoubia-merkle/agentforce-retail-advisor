import { motion } from 'framer-motion';
import { useScene } from '@/contexts/SceneContext';
import { Badge } from '@/components/ui/Badge';
import type { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { openCheckout } = useScene();

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.03 }}
      transition={{ duration: 0.2 }}
      className="w-36 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 cursor-pointer"
    >
      <div className="relative w-full h-28">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-contain product-blend p-2"
        />
        {product.attributes?.isTravel && (
          <Badge className="absolute top-1.5 left-1.5 bg-blue-500 text-[9px] px-1.5 py-0.5">
            Travel
          </Badge>
        )}
      </div>

      <div className="px-2.5 pb-2.5 pt-1 text-white">
        <span className="text-white/50 text-[9px] uppercase tracking-wider block truncate">
          {product.brand}
        </span>
        <h3 className="font-medium text-[11px] mt-0.5 line-clamp-2 leading-tight min-h-[2.25rem]">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs font-medium">
            ${(product.price ?? 0).toFixed(2)}
          </span>
          <button
            onClick={() => openCheckout()}
            className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded-full text-[10px] transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </motion.div>
  );
};
