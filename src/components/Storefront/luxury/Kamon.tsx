/**
 * Kamon — the Tachibana family crest. Five-petal mandarin orange flower.
 *
 * The maison has no logo, only this kamon. Used in the header, in plate
 * captions, on the Bantō card, in the digital product passport, and as a
 * section divider. Inherits color from `currentColor`.
 */
type Props = {
  className?: string;
  /** Default 24. Used as both width and height. */
  size?: number | string;
  /** Stroke width — defaults to 0.6 in viewBox units (very fine). */
  strokeWidth?: number;
  /** Decorative; defaults to true so screen readers skip it. */
  ariaHidden?: boolean;
};

export const Kamon: React.FC<Props> = ({
  className,
  size = 24,
  strokeWidth = 0.6,
  ariaHidden = true,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    aria-hidden={ariaHidden}
  >
    {/* Five petals arranged at 0°, 72°, 144°, 216°, 288°. Each petal is an
        almond shape pointing outward. */}
    <g transform="translate(50 50)">
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="0"
          cy="-22"
          rx="11"
          ry="22"
          transform={`rotate(${angle})`}
        />
      ))}
      {/* Center pistil */}
      <circle cx="0" cy="0" r="4.5" />
    </g>
    {/* Outer enclosing ring (typical of Japanese kamon) */}
    <circle cx="50" cy="50" r="46" />
  </svg>
);
