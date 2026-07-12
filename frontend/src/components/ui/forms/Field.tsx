/**
 * Field — label + description + child + optional error wrapper.
 * The actual input/select/toggle is passed as children.
 * Label wires via htmlFor so assistive tech can announce it.
 */
import type { ReactNode } from 'react';
import InlineError from './InlineError';

interface Props {
  label?: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  inline?: boolean;
  className?: string;
}

export default function Field({
  label,
  htmlFor,
  description,
  error,
  required,
  children,
  inline,
  className,
}: Props) {
  const cls = ['field', inline ? 'field--inline' : '', className].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      {label && (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="field-required" aria-label="required">
              {'\u202F'}*
            </span>
          )}
        </label>
      )}
      <div className="field-children">{children}</div>
      {description && <span className="field-description">{description}</span>}
      {error && <InlineError message={error} />}
    </div>
  );
}
