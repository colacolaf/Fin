/**
 * Select — native <select> styled to match the Ocean.
 * Native preserves full macOS / iOS / screen-reader support;
 * styling is layered via .select / .select-native CSS rules.
 */
import type { ChangeEvent } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  name?: string;
  testId?: string;
}

export default function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  invalid,
  className,
  name,
  testId = 'select',
}: Props) {
  const cls = ['select', invalid ? 'select--invalid' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={cls}>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className="select-native"
        data-testid={testId}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span aria-hidden className="select-chevron">
        {'\u25BE'}
      </span>
    </span>
  );
}
