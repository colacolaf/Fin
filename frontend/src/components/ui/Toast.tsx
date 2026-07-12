/**
 * Toast viewport — fixed top-right stack of toast cards.
 * One instance is mounted globally (in App.tsx); consumers call `toast.*` from `useToast`.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, useToasts, type ToastItem, type ToastTone } from '../../hooks/useToast';

const GLYPH: Record<ToastTone, string> = {
  success: '\u2713', // ✓
  error: '\u26A0',   // ⚠
  info: '\u24D8',    // ⓘ
  warn: '\u26A0',    // ⚠
};

/**
 * Live subscription to prefers-reduced-motion so the Toast viewport
 * respects preference changes done mid-session (e.g. Settings → Motion).
 */
function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent): void => setReduce(e.matches);
    if ('addEventListener' in mql) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    // Safari < 14 fallback
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);
  return reduce;
}

export default function ToastViewport() {
  const items = useToasts();
  return (
    <div
      className="toast-viewport"
      role="region"
      aria-label="Notifications"
      data-testid="toast-viewport"
    >
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ item }: { item: ToastItem }) {
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<number | null>(null);
  const reduced = usePrefersReducedMotion();

  // Auto-dismiss timer — pause while hovered, skip when duration is infinite (loading).
  useEffect(() => {
    if (!Number.isFinite(item.duration) || hovered) return;
    timerRef.current = window.setTimeout(() => toast.dismiss(item.id), item.duration);
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [item.id, item.duration, hovered]);

  const isError = item.tone === 'error' || item.tone === 'warn';

  const motionProps = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
    : {
        initial: { opacity: 0, x: 16 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 16 },
        transition: { duration: 0.18, ease: 'easeOut' as const },
      };

  return (
    <motion.div
      layout
      {...motionProps}
      className={`toast toast--${item.tone}`}
      data-testid={`toast-${item.tone}`}
      data-toast-id={item.id}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="toast-glyph" aria-hidden>
        {GLYPH[item.tone]}
      </span>
      <div className="toast-body">
        <span className="toast-message">{item.message}</span>
        {item.action && (
          <button
            type="button"
            className="toast-action"
            data-testid={`toast-action-${item.id}`}
            onClick={() => {
              item.action?.onClick();
              toast.dismiss(item.id);
            }}
          >
            {item.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        className="toast-close"
        aria-label="Dismiss notification"
        onClick={() => toast.dismiss(item.id)}
      >
        {'\u00D7'}
      </button>
    </motion.div>
  );
}
