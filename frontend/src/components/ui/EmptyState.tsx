/**
 * EmptyState — single reusable empty-state card.
 * Phase 38a primitive consumed by Phase 38b (Portfolio/Backtest/Memory)
 * and Phase 38c (Debt/Retirement/Execution/Recommendations/Community/MultiAgent).
 *
 * Props mirror the spec: icon, title, description, primary cta, optional secondary,
 * optional dismissable, optional slug for testid.
 * Slug regex /^[a-z0-9-]+$/ — invalid slugs console.warn and produce no testid.
 * ARIA mirrors the spec: `role="status"` when non-actionable, `role="group"` when actionable.
 * Reduced-motion honored via fade only — no rise.
 */
import { motion } from 'framer-motion';

export interface EmptyStateCta {
  label: string;
  onClick: () => void;
  href?: string;
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  cta?: EmptyStateCta;
  secondaryAction?: EmptyStateCta;
  dismissable?: boolean;
  slug?: string;
  onDismiss?: () => void;
}

const SLUG_RE = /^[a-z0-9-]+$/;

function validSlug(slug: string | undefined): boolean {
  return !!slug && SLUG_RE.test(slug);
}

export default function EmptyState({
  icon,
  title,
  description,
  cta,
  secondaryAction,
  dismissable,
  slug,
  onDismiss,
}: EmptyStateProps) {
  const actionable = !!(cta || secondaryAction);
  const role = actionable ? 'group' : 'status';
  const ariaLabel = actionable ? `${title} — empty state with actions` : `${title} — empty state`;

  if (slug !== undefined && !validSlug(slug)) {
    // ponytail: surface to the dev (the caller is the bug), don't crash render.
    // eslint-disable-next-line no-console
    console.warn(`[EmptyState] slug "${slug}" must match ${SLUG_RE}`);
  }

  const testIdAttr = validSlug(slug) ? { 'data-testid': `empty-state-${slug}` } : {};

  return (
    <motion.section
      role={role}
      aria-label={ariaLabel}
      className="empty-state"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      {...testIdAttr}
    >
      {icon && (
        <div className="empty-state-icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <h2 className="empty-state-title">{title}</h2>
      <p className="empty-state-desc">{description}</p>
      <div className="empty-state-actions">
        {cta?.href ? (
          <a className="empty-state-cta-primary" href={cta.href} onClick={cta.onClick}>
            {cta.label}
          </a>
        ) : cta ? (
          <button type="button" className="empty-state-cta-primary" onClick={cta.onClick}>
            {cta.label}
          </button>
        ) : null}
        {secondaryAction && (
          <button
            type="button"
            className="empty-state-cta-secondary"
            onClick={secondaryAction.onClick}
          >
            {secondaryAction.label}
          </button>
        )}
        {dismissable && onDismiss && (
          <button
            type="button"
            className="empty-state-dismiss"
            aria-label="Dismiss empty state"
            onClick={onDismiss}
          >
            ×
          </button>
        )}
      </div>
    </motion.section>
  );
}
