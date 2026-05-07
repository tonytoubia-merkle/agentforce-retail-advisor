import { Kamon } from './Kamon';

export type PlateColor = 'kuwa-cha' | 'sumi' | 'kinari' | 'akakuchiba' | 'aijiro';
export type PlateShape = 'portrait' | 'square';

interface Props {
  /** Material gradient — used as fallback when no `imageUrl` is supplied
   *  AND as the background under transparent PNG product shots. */
  color: PlateColor;
  /** Default `portrait` (3:4). `square` (1:1) is used in journal grids. */
  shape?: PlateShape;
  /** Real product / scene photograph. When present, renders edge-to-edge
   *  and the kamon watermark hides itself. */
  imageUrl?: string;
  /** Editorial small-caps text bottom-left of the plate. */
  caption?: string;
  /** Alt text for the image. Required when `imageUrl` is present. */
  alt?: string;
  /** Extra classes forwarded to the outer plate wrapper. Used by
   *  `tk-product-card__plate`, etc. */
  className?: string;
  /** Inline style override (e.g. for a custom aspect-ratio override). */
  style?: React.CSSProperties;
}

/**
 * The signature luxury surface. Renders either a hand-tuned material
 * gradient (with the kamon as an editorial watermark) or a real
 * photograph plus a thin scrim and caption. The two states are visually
 * coherent so a half-imagery / half-gradient catalog still feels like one
 * collection — important during the staged Imagen / Firefly rollout.
 */
export const LuxuryPlate: React.FC<Props> = ({
  color,
  shape = 'portrait',
  imageUrl,
  caption,
  alt,
  className,
  style,
}) => {
  const hasImage = Boolean(imageUrl);
  const classes = [
    'tk-plate',
    `tk-plate--${color}`,
    `tk-plate--${shape}`,
    hasImage ? 'tk-plate--has-image' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={style}>
      {hasImage && (
        <img className="tk-plate__image" src={imageUrl} alt={alt || ''} loading="lazy" />
      )}
      <Kamon className="tk-plate__mark" />
      {caption && <span className="tk-plate__caption">{caption}</span>}
    </div>
  );
};
