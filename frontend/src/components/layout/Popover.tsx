/**
 * Popover — click-to-open dropdown with focus trap + Escape close + click-outside close.
 * Used by the TopBar sync indicator and the quick-settings menu.
 * Anchor alignment is right-anchored to its host button by default.
 *
 * Focus handling:
 *  - Mouse click on the trigger (event.detail > 0) skips initial focus jump;
 *    the trigger keeps visual focus so the user doesn't lose their cursor context.
 *  - Keyboard activation (Enter/Space, event.detail = 0) moves focus into the
 *    popover (first focusable) so screen-reader and keyboard users can arrow-tab
 *    through menu items without re-traversing the trigger.
 *  - On close, focus restores to the trigger element.
 */
import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface Props {
  /** A single React element to use as the trigger button. */
  trigger: ReactElement;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: 'left' | 'right';
  label?: string;
  testId?: string;
}

export default function Popover({
  trigger,
  children,
  align = 'right',
  label,
  testId,
}: Props) {
  const [open, setOpen] = useState(false);
  const hostRef = useRef<HTMLSpanElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  // True when the trigger was opened via mouse click (event.detail > 0).
  // Keyboard activations (Enter/Space) leave this false so the popover
  // focuses its first focusable when activated.
  const skipInitialFocus = useRef(true);

  // Close on Escape, mousedown outside, or "close()" prop callback. The
  // focus trap handles Escape via onEscape; mousedown is handled below.
  useFocusTrap(popoverRef, {
    active: open,
    onEscape: () => setOpen(false),
    restoreFocus: true,
    skipInitialFocus: skipInitialFocus.current,
  });

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent): void {
      if (hostRef.current && !hostRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  // Decorate the trigger so clicks toggle us. We override onClick to capture
  // the original event and decide pointer vs keyboard from event.detail.
  const triggerEl = isValidElement(trigger)
    ? cloneElement(
        trigger as ReactElement<{
          onClick?: (e: ReactMouseEvent) => void;
          'aria-haspopup'?: 'menu' | 'dialog';
          'aria-expanded'?: boolean;
          'aria-label'?: string;
        }>,
        {
          onClick: (e: ReactMouseEvent<HTMLElement>) => {
            // event.detail > 0 → mouse click; === 0 → keyboard or programmatic.
            // Mouse users keep focus on the trigger (no focus jump).
            // Keyboard users get focus moved into the popover (better SR UX).
            skipInitialFocus.current = e.detail > 0;
            setOpen((o) => !o);
          },
          'aria-haspopup': 'menu' as const,
          'aria-expanded': open,
          'aria-label': label ?? (trigger.props as { 'aria-label'?: string })['aria-label'],
        },
      )
    : trigger;

  return (
    <span ref={hostRef} style={{ position: 'relative', display: 'inline-block' }}>
      {triggerEl}
      {open && (
        <div
          ref={popoverRef}
          className="popover"
          role="group"
          aria-label={label ?? 'Popover'}
          data-testid={testId}
          style={{
            top: 'calc(100% + 4px)',
            left: align === 'right' ? 'auto' : 0,
            right: align === 'right' ? 0 : 'auto',
          }}
        >
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </span>
  );
}
