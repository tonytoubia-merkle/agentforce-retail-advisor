import { motion } from 'framer-motion';
import { useScene } from '@/contexts/SceneContext';
import { useProductStaging } from '@/hooks/useProductStaging';
import { Badge } from '@/components/ui/Badge';
import type { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { scene, openCheckout } = useScene();
  const { imageUrl, isStaging, isStaged } = useProductStaging(
    product.id,
    product.imageUrl,
    scene.setting,
    product.name
  );

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl overflow-hidden cursor-pointer group"
    >
      <div className="relative aspect-square">
        {isStaging && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <img
          src={imageUrl}
          alt={product.name}
          className={`w-full h-full transition-opacity duration-500 object-contain product-blend ${
            isStaging ? 'opacity-50' : 'opacity-100'
          }`}
        />
        {product.attributes?.isTravel && (
          <Badge className="absolute top-3 left-3 bg-blue-500">
            Travel Size
          </Badge>
        )}
      </div>

      <div className="p-3 text-white">
        <span className="text-white/60 text-[10px] uppercase tracking-wider">
          {product.brand}
        </span>
        <h3 className="font-medium text-sm mt-0.5 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-white/70 text-xs mt-1 line-clamp-2">
          {product.shortDescription}
        </p>

        <div className="flex items-center justify-between mt-2">
          <span className="text-base font-light">
            ${(product.price ?? 0).toFixed(2)}
          </span>
          <button
            onClick={() => openCheckout()}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </motion.div>
  );
};
