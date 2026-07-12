/**
 * Slider — numeric range with optional semantic labelFormatter.
 * `aria-valuetext` carries the formatted label so screen readers hear
 * "7 of 10, Aggressive" instead of "7".
 * The value chip floats above the thumb on :focus/:active (CSS-only).
 */
interface Props {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  /** Format the value for display + aria-valuetext. */
  labelFormatter?: (v: number) => string;
  ariaLabel?: string;
  disabled?: boolean;
  /** Override the data-testid of the <input>. Default is "slider". */
  testId?: string;
}

export default function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  labelFormatter,
  ariaLabel,
  disabled,
  testId = 'slider',
}: Props) {
  const formatted = labelFormatter ? labelFormatter(value) : String(value);
  return (
    <span className="slider">
      <span className="slider-track-wrap">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          aria-valuetext={formatted}
          aria-orientation="horizontal"
          aria-label={ariaLabel}
          className="slider-native"
          data-testid={testId}
        />
        <output className="slider-value-chip" data-testid={`${testId}-value-chip`}>
          {formatted}
        </output>
      </span>
      <span className="slider-value">{formatted}</span>
    </span>
  );
}
