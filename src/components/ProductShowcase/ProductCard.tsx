import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useScene } from '@/contexts/SceneContext';
import { Badge } from '@/components/ui/Badge';
import type { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { openCheckout, openRetailerHandoff } = useScene();
  const location = useLocation();
  const isSkinConcierge = location.pathname.includes('skin-advisor');

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.03 }}
      transition={{ duration: 0.2 }}
      className="w-36 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 cursor-pointer"
      onClick={isSkinConcierge ? () => openRetailerHandoff([product]) : undefined}
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
          {isSkinConcierge ? (
            <span className="text-[9px] text-white/70 flex items-center gap-1">
              <span className="relative flex items-center justify-center w-3 h-3">
                <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                <svg className="relative w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </span>
              Where to buy
            </span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); openCheckout(); }}
              className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded-full text-[10px] transition-colors"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
