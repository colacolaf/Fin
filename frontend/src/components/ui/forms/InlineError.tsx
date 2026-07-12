/**
 * InlineError — visually-attached error message for a `<Field>`.
 * role="alert" + aria-live="polite" so screen readers announce without urgency spikes.
 */
interface Props {
  message: string;
  id?: string;
}

export default function InlineError({ message, id }: Props) {
  return (
    <span
      id={id}
      role="alert"
      aria-live="polite"
      className="field-error"
      data-testid="field-error"
    >
      {message}
    </span>
  );
}
