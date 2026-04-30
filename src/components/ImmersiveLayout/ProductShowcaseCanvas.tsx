import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useDemo } from '@/contexts/DemoContext';
import { useSelection } from '@/contexts/SelectionContext';
import { Badge } from '@/components/ui/Badge';
import type { Product } from '@/types/product';

interface ProductShowcaseCanvasProps {
  products: Product[];
  title?: string;
}

/** Pick a short, vertical-appropriate badge. Mirrors the logic in ProductCard. */
function getVerticalBadge(product: Product, vertical: string) {
  const a = product.attributes || {};
  if (vertical === 'travel') {
    if (a.travel?.cabinClass === 'business') return { label: 'Business', cls: 'bg-indigo-600' };
    if (a.travel?.cabinClass === 'first') return { label: 'First', cls: 'bg-amber-600' };
    if (a.travel?.cabinClass === 'premium-economy') return { label: 'Premium', cls: 'bg-sky-600' };
    if (a.travel?.stops === 0) return { label: 'Nonstop', cls: 'bg-emerald-600' };
    return null;
  }
  if (vertical === 'fashion') {
    const season = a.fashion?.season?.[0];
    if (season) return { label: season[0].toUpperCase() + season.slice(1), cls: 'bg-stone-700' };
    return null;
  }
  if (vertical === 'wellness') {
    const benefit = a.wellness?.benefits?.[0];
    if (benefit) return { label: benefit, cls: 'bg-emerald-600' };
    return null;
  }
  if (a.isTravel) return { label: 'Travel', cls: 'bg-blue-500' };
  return null;
}

/** One-line subtitle appropriate for the vertical (route+duration, colors, benefits). */
function getVerticalSubtitle(product: Product, vertical: string): string | null {
  const a = product.attributes || {};
  if (vertical === 'travel' && a.travel) {
    const route = [a.travel.origin, a.travel.destination].filter(Boolean).join(' → ');
    const duration = a.travel.durationMinutes
      ? `${Math.floor(a.travel.durationMinutes / 60)}h ${a.travel.durationMinutes % 60}m`
      : '';
    return [route, duration].filter(Boolean).join(' · ') || null;
  }
  if (vertical === 'fashion' && a.fashion?.color?.length) {
    return a.fashion.color.slice(0, 3).join(' · ');
  }
  if (vertical === 'wellness' && a.wellness?.benefits?.length) {
    return a.wellness.benefits.slice(0, 2).join(' · ');
  }
  return null;
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
  const { config, copy } = useDemo();
  const { activeProductId, toggleActiveProduct } = useSelection();
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-scroll the active card into view when selection changes from elsewhere (e.g., chat list click)
  useEffect(() => {
    if (!activeProductId) return;
    const el = cardRefs.current[activeProductId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeProductId]);

  if (products.length === 1) {
    return <SingleProductHero product={products[0]} title={title} />;
  }

  return (
    <div className="w-full h-full flex flex-col items-center px-8 py-12 overflow-y-auto">
      {title && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center max-w-2xl"
        >
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
            {products.length >= 5 ? 'Showing' : 'Curated for you'}
          </div>
          <h2 className="text-white text-2xl md:text-3xl font-light leading-tight">{title}</h2>
        </motion.div>
      )}

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
        {products.map((product, idx) => {
          const badge = getVerticalBadge(product, config.vertical);
          const subtitle = getVerticalSubtitle(product, config.vertical);
          const isActive = activeProductId === product.id;
          return (
            <motion.div
              key={product.id}
              ref={(el) => { cardRefs.current[product.id] = el; }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
              whileHover={{ y: -6 }}
              onClick={() => toggleActiveProduct(product.id)}
              className={`relative backdrop-blur-sm border rounded-2xl overflow-hidden group cursor-pointer transition-colors ${
                isActive
                  ? 'bg-white/15 border-white/40 ring-2 ring-white/30'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="aspect-square relative bg-black/20 flex items-center justify-center p-12">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain drop-shadow-2xl product-blend transition-transform duration-300 group-hover:scale-105"
                />
                {badge && (
                  <Badge className={`absolute top-3 left-3 ${badge.cls} text-[10px] px-2`}>
                    {badge.label}
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
                {subtitle && (
                  <div className="text-white/50 text-[11px] mb-1 truncate">{subtitle}</div>
                )}
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
          );
        })}
      </div>
    </div>
  );
};

// ── Single-product hero variant ──────────────────────────────────────

const SingleProductHero: React.FC<{ product: Product; title?: string }> = ({ product, title }) => {
  const { addItem, isInCart } = useCart();
  const { config, copy } = useDemo();
  const subtitle = getVerticalSubtitle(product, config.vertical);

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
            className="relative w-full h-full object-contain drop-shadow-2xl product-blend p-12"
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
          {subtitle && (
            <div className="text-white/60 text-sm mb-3">{subtitle}</div>
          )}
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
