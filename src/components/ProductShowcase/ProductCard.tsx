import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useScene } from '@/contexts/SceneContext';
import { useDemo } from '@/contexts/DemoContext';
import { Badge } from '@/components/ui/Badge';
import type { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

/** Pick a short, vertical-appropriate badge for a product. Returns null if none applies. */
function getVerticalBadge(product: Product, vertical: string) {
  const a = product.attributes || {};

  if (vertical === 'travel') {
    const cabin = a.travel?.cabinClass;
    if (cabin === 'business') return { label: 'Business', cls: 'bg-indigo-600' };
    if (cabin === 'first') return { label: 'First', cls: 'bg-amber-600' };
    if (cabin === 'premium-economy') return { label: 'Premium', cls: 'bg-sky-600' };
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

  // Beauty (default) — keep legacy Travel badge
  if (a.isTravel) return { label: 'Travel', cls: 'bg-blue-500' };
  return null;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { openCheckout, openRetailerHandoff } = useScene();
  const { config } = useDemo();
  const location = useLocation();
  const isSkinConcierge = location.pathname.includes('skin-advisor');
  const badge = getVerticalBadge(product, config.vertical);

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
          className="w-full h-full object-contain product-blend p-4"
        />
        {badge && (
          <Badge className={`absolute top-1.5 left-1.5 ${badge.cls} text-[9px] px-1.5 py-0.5`}>
            {badge.label}
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

        {/* Vertical-specific subtitle row — one short fact, not a laundry list */}
        {config.vertical === 'travel' && product.attributes?.travel && (
          <div className="text-[9px] text-white/50 truncate">
            {[product.attributes.travel.origin, product.attributes.travel.destination].filter(Boolean).join(' → ')}
            {product.attributes.travel.durationMinutes
              ? ` · ${Math.floor(product.attributes.travel.durationMinutes / 60)}h ${product.attributes.travel.durationMinutes % 60}m`
              : ''}
          </div>
        )}
        {config.vertical === 'fashion' && product.attributes?.fashion?.color?.length && (
          <div className="text-[9px] text-white/50 truncate">
            {product.attributes.fashion.color.slice(0, 3).join(' · ')}
          </div>
        )}
        {config.vertical === 'wellness' && product.attributes?.wellness?.benefits?.length && (
          <div className="text-[9px] text-white/50 truncate">
            {product.attributes.wellness.benefits.slice(0, 2).join(' · ')}
          </div>
        )}

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
