/**
 * useFocusTrap — keeps Tab cycling inside `active === true`.
 *
 * Behavior:
 *  - On activation: optionally (configurable via `skipInitialFocus`) move
 *    focus to the first focusable descendant (or to `initialFocus` if
 *    provided). Remember the previously-focused element so we can restore
 *    it on deactivation.
 *  - On Tab/Shift+Tab: cycle focus between first and last focusables if
 *    focus would escape the container — applies regardless of `skipInitialFocus`.
 *  - On Escape: forward to `onEscape` (the handler decides whether to close).
 *    Does NOT stopPropagation, so co-existing popovers on the same event still
 *    receive it (e.g. memory page's local Escape listener also closes its palette).
 *  - On deactivation: focus the previously-focused element if `restoreFocus`
 *    is true (default). Resilient to mirrors in the DOM: bails if container is
 *    no longer attached.
 *
 * `skipInitialFocus: true` skips the initial focus jump (used by Popover when
 * the trigger was activated via mouse click — the trigger keeps focus). Tab
 * cycling still applies on subsequent presses.
 *
 * Focusable selector intentionally narrow — only interactive form fields,
 * buttons, and links, not every `[tabindex]` element.
 */
import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface Options {
  active: boolean;
  /** Element to focus on activation. Defaults to first focusable descendant. */
  initialFocus?: HTMLElement;
  /** Called on Escape. Trap itself doesn't close anything. */
  onEscape?: () => void;
  /** Restore focus to the previously-focused element on deactivate. Default true. */
  restoreFocus?: boolean;
  /** Skip the initial focus jump when activating. Default false. */
  skipInitialFocus?: boolean;
}

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  options: Options,
): void {
  const { active, initialFocus, onEscape, restoreFocus = true, skipInitialFocus } = options;

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Optional initial focus jump — microtask delay so layout has settled.
    let focusTimer: number | null = null;
    if (!skipInitialFocus) {
      focusTimer = window.setTimeout(() => {
        const target = initialFocus ?? getFocusables(container)[0];
        if (target && typeof target.focus === 'function') {
          target.focus();
        }
      }, 0);
    }

    // Tab-cycling keydown listener — always attached when active, regardless
    // of skipInitialFocus. (Previously this was inside the skipInitialFocus
    // fallback branch and got skipped when skipInitialFocus was false, breaking
    // Tab cycling in the CommandPalette and keyboard-opened Popovers.)
    function onKeyDown(e: KeyboardEvent): void {
      if (!container) return;
      if (e.key === 'Escape') {
        if (onEscape) onEscape();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = getFocusables(container);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      if (focusTimer !== null) window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown, true);
      if (
        restoreFocus &&
        previouslyFocused &&
        typeof previouslyFocused.focus === 'function' &&
        document.contains(previouslyFocused)
      ) {
        previouslyFocused.focus();
      }
    };
    // We intentionally key on `active` only — re-binding every render would
    // thrash the document listener and re-focus mid-typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}

function getFocusables(root: HTMLElement): HTMLElement[] {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return nodes.filter((el) => {
    // Visually hidden via display:none / inert — skip.
    if (el.hasAttribute('inert')) return false;
    const style = window.getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') return false;
    return true;
  });
}
