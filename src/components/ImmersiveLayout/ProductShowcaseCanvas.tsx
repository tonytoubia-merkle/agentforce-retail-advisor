import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useDemo } from '@/contexts/DemoContext';
import { Badge } from '@/components/ui/Badge';
import type { Product } from '@/types/product';

interface ProductShowcaseCanvasProps {
  products: Product[];
  title?: string;
}

/**
 * Editorial showcase for single or small multi-product recommendations.
 *
 * - Single product: large hero with generous whitespace
 * - 2-4 products: row of editorial cards with soft stagger-in
 *
 * Reference: Adobe Experience Concierge "curated picks" pattern.
 */
export const ProductShowcaseCanvas: React.FC<ProductShowcaseCanvasProps> = ({ products, title }) => {
  const { addItem, isInCart } = useCart();
  const { copy } = useDemo();

  if (products.length === 1) {
    return <SingleProductHero product={products[0]} title={title} />;
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-8 py-12 overflow-y-auto">
      {title && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center max-w-2xl"
        >
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
            Curated for you
          </div>
          <h2 className="text-white text-2xl md:text-3xl font-light leading-tight">{title}</h2>
        </motion.div>
      )}

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, idx) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
            whileHover={{ y: -6 }}
            className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden group"
          >
            <div className="aspect-square relative bg-black/20 flex items-center justify-center p-8">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain drop-shadow-2xl product-blend transition-transform duration-300 group-hover:scale-105"
              />
              {product.attributes?.isTravel && (
                <Badge className="absolute top-3 left-3 bg-blue-500/80 text-[10px] px-2">
                  Travel
                </Badge>
              )}
            </div>

            <div className="p-5 text-white">
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                {product.brand}
              </div>
              <h3 className="font-medium text-base leading-tight mb-1 line-clamp-2">
                {product.name}
              </h3>
              <p className="text-white/60 text-xs leading-relaxed mb-4 line-clamp-2">
                {product.shortDescription || product.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">
                  ${product.price.toFixed(2)}
                  {copy.priceUnit && <span className="text-xs text-white/50">{copy.priceUnit}</span>}
                </span>
                <button
                  onClick={() => addItem(product)}
                  disabled={isInCart(product.id)}
                  className="px-4 py-1.5 text-xs font-medium bg-white text-black rounded-full hover:bg-white/90 disabled:bg-white/20 disabled:text-white/50 transition-colors"
                >
                  {isInCart(product.id) ? 'In cart' : 'Add'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ── Single-product hero variant ──────────────────────────────────────

const SingleProductHero: React.FC<{ product: Product; title?: string }> = ({ product, title }) => {
  const { addItem, isInCart } = useCart();
  const { copy } = useDemo();

  return (
    <div className="w-full h-full flex items-center justify-center px-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl w-full items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative aspect-square flex items-center justify-center"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 65%)',
            }}
          />
          <img
            src={product.imageUrl}
            alt={product.name}
            className="relative w-full h-full object-contain drop-shadow-2xl product-blend"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-white"
        >
          {title && (
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-4">
              {title}
            </div>
          )}
          <div className="text-xs uppercase tracking-widest text-white/50 mb-2">
            {product.brand}
          </div>
          <h1 className="text-3xl md:text-4xl font-light leading-tight mb-4">{product.name}</h1>
          <p className="text-white/70 text-base leading-relaxed mb-6 max-w-md">
            {product.description || product.shortDescription}
          </p>

          <div className="flex items-baseline gap-3 mb-8">
            <span className="text-3xl font-light">${product.price.toFixed(2)}</span>
            {copy.priceUnit && <span className="text-sm text-white/50">{copy.priceUnit}</span>}
          </div>

          <button
            onClick={() => addItem(product)}
            disabled={isInCart(product.id)}
            className="px-8 py-3 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 disabled:bg-white/30 disabled:text-white/50 transition-colors"
          >
            {isInCart(product.id) ? 'In cart' : copy.primaryCTA}
          </button>
        </motion.div>
      </div>
    </div>
  );
};
