/**
 * Input — text/email/password/number/search/url with optional maskToggle (eye icon).
 * TextArea — companion multi-line input with character counter.
 * Both emit aria-invalid when invalid={true} is passed.
 */
import {
  forwardRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
} from 'react';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'url';

interface Props {
  id?: string;
  type?: InputType;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  maxLength?: number;
  autoComplete?: string;
  autoFocus?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Type=password only: render an eye toggle that swaps type password ↔ text. */
  maskToggle?: boolean;
  /** Forwarded to the inner `<input aria-label>`. Prefer `aria-describedby` for content with associated help text. */
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
  min?: number;
  max?: number;
  step?: number;
  name?: string;
  'aria-describedby'?: string;
  testId?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(props, ref) {
  const {
    type = 'text',
    maskToggle,
    prefix,
    suffix,
    invalid,
    className,
    style,
    onChange,
    testId = 'input',
    ...rest
  } = props;

  const [revealed, setRevealed] = useState(false);
  const effectiveType =
    maskToggle && type === 'password' ? (revealed ? 'text' : 'password') : type;

  const cls = ['input', invalid ? 'input--invalid' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={cls} style={style}>
      {prefix && <span className="input-affix input-affix--prefix">{prefix}</span>}
      <input
        ref={ref}
        type={effectiveType}
        aria-invalid={invalid || undefined}
        className="input-native"
        value={rest.value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        id={rest.id}
        name={rest.name}
        placeholder={rest.placeholder}
        disabled={rest.disabled}
        readOnly={rest.readOnly}
        maxLength={rest.maxLength}
        autoComplete={rest.autoComplete}
        autoFocus={rest.autoFocus}
        min={rest.min}
        max={rest.max}
        step={rest.step}
        aria-describedby={rest['aria-describedby']}
        aria-label={rest.ariaLabel}
        data-testid={testId}
      />
      {maskToggle && type === 'password' ? (
        <button
          type="button"
          className="input-affix input-affix--suffix"
          data-testid="input-mask-toggle"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setRevealed((r) => !r)}
          aria-label={revealed ? 'Hide password' : 'Reveal password'}
          aria-pressed={revealed}
          tabIndex={-1}
        >
          {revealed ? <EyeOff /> : <EyeOn />}
        </button>
      ) : (
        suffix && <span className="input-affix input-affix--suffix">{suffix}</span>
      )}
    </span>
  );
});

// Tiny inline SVG eyes — no extra deps, no font-emoji rendering surprises.
function EyeOn() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a14.6 14.6 0 0 1-3.1 3.7M6.5 7.4A15 15 0 0 0 2 12s3.5 7 10 7a10.6 10.6 0 0 0 4-.85" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

// ── TextArea ──────────────────────────────────────────────────────────
interface TextAreaProps {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  maxLength?: number;
  showCount?: boolean;
  rows?: number;
  className?: string;
  monospace?: boolean;
  'aria-describedby'?: string;
  name?: string;
}

export function TextArea({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  readOnly,
  invalid,
  maxLength,
  showCount,
  rows = 4,
  className,
  monospace,
  'aria-describedby': described,
  name,
}: TextAreaProps) {
  const cls = ['textarea', invalid ? 'textarea--invalid' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={cls}>
      <textarea
        id={id}
        name={name}
        aria-invalid={invalid || undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        rows={rows}
        aria-describedby={described}
        className={
          monospace ? 'textarea-native textarea-native--mono' : 'textarea-native'
        }
      />
      {showCount && maxLength !== undefined && (
        <span className="textarea-count" aria-live="polite">
          {value.length}/{maxLength}
        </span>
      )}
    </span>
  );
}
