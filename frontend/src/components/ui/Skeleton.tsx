/**
 * Skeleton primitive — CSS-only shimmer, no JS animation (GPU-cheap).
 * Variants: `text` (1em height), `rect` (configurable), `circle` (50%).
 * Per Phase 32 brief: aria-busy=true, aria-live=polite, tabIndex=-1, peer-events: none.
 */

import type { CSSProperties } from 'react';

export type SkeletonVariant = 'text' | 'rect' | 'circle';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  /** Border-radius override (rect only). */
  radius?: number;
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  radius,
  className,
  style,
}: SkeletonProps) {
  const dim = (v: number | string | undefined): string | undefined =>
    typeof v === 'number' ? `${v}px` : v;

  const inline: CSSProperties = {
    width: dim(width),
    height: dim(height),
    borderRadius:
      variant === 'circle'
        ? '50%'
        : variant === 'rect'
          ? radius ?? 12
          : 4,
    ...style,
  };

  return (
    <span
      className={`skel skel--${variant}${className ? ` ${className}` : ''}`}
      style={inline}
      aria-busy="true"
      aria-live="polite"
      tabIndex={-1}
      data-testid="skel"
      data-variant={variant}
    />
  );
}

/** Multiple stacked text lines — paragraph placeholder. */
export function SkeletonLine({
  count = 3,
  width = '100%',
  lastWidth = '70%',
  gap = 8,
}: {
  count?: number;
  width?: number | string;
  /** Width of the LAST line (typically shorter for realism). */
  lastWidth?: number | string;
  gap?: number;
}) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === count - 1 ? lastWidth : width}
          height={12}
        />
      ))}
    </span>
  );
}
