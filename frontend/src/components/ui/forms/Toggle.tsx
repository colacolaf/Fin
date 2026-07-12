/**
 * Toggle — controlled switch with role="switch".
 * Reuses the existing CSS .toggle / .toggle.on rules from ocean.css (Phase 21 Settings).
 * Reduced-motion respected by the existing .toggle transition neutralization.
 */
interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  testId?: string;
}

export default function Toggle({
  checked,
  onChange,
  disabled,
  ariaLabel,
  className,
  testId = 'toggle',
}: Props) {
  const cls = ['toggle', checked ? 'on' : '', className].filter(Boolean).join(' ');
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cls}
      onClick={() => onChange(!checked)}
      data-testid={testId}
    >
      <span className="toggle-thumb" />
    </button>
  );
}
