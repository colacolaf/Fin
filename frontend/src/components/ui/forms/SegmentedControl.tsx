/**
 * SegmentedControl — mutually-exclusive button group with arrow-key cycling.
 * Used by Settings (Theme, Alpaca environment, Cadence) and by TopBar's
 * QuickSettings popover. Mirrors the native role="radiogroup" semantic so
 * screen readers hear "dark, selected, 1 of 3".
 *
 * Each option is rendered as `role="radio"` with aria-checked; the container
 * is `role="radiogroup"` with the optional label as aria-label. Arrow keys
 * cycle focus between options (Roving Tabindex pattern).
 */
import { useRef, type KeyboardEvent } from 'react';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  testId?: string;
}

interface Props<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
  ariaLabel?: string;
  className?: string;
  /** Disable interaction (e.g. while a stream is mid-flight). */
  disabled?: boolean;
}

export default function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  disabled,
}: Props<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>): void {
    if (disabled) return;
    const idx = options.findIndex((o) => o.value === value);
    let next = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      next = (idx + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      next = (idx - 1 + options.length) % options.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      next = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      next = options.length - 1;
    } else {
      return;
    }
    const target = options[next];
    onChange(target.value);
    // Move focus to the newly-active button.
    const btn = containerRef.current?.querySelector<HTMLButtonElement>(
      `[data-segmented-value="${CSS.escape(target.value)}"]`,
    );
    btn?.focus();
  }

  const cls = ['seg-control', className].filter(Boolean).join(' ');

  return (
    <div
      ref={containerRef}
      className={cls}
      role="radiogroup"
      aria-label={ariaLabel}
      data-testid="segmented-control"
      onKeyDown={onKeyDown}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            disabled={disabled}
            className={`seg-control-option ${active ? 'is-active' : ''}`}
            data-segmented-value={o.value}
            data-testid={o.testId ?? `segmented-${o.value}`}
            onClick={() => {
              if (!disabled) onChange(o.value);
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
