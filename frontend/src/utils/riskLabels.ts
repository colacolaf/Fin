/**
 * riskLabels — semantic label formatters for sliders.
 * Phase 37 a11y primitive. Slider uses `aria-valuetext` from props' labelFormatter;
 * Settings.tsx (Phase 21 freeze) wires `riskLabel` for the Risk Tolerance row
 * in a later phase. Until then, these helpers are exported for completeness.
 */

export const RISK_LABELS = ['Conservative', 'Moderate', 'Balanced', 'Growth', 'Aggressive'] as const;

export function riskLabel(v: number, max = 10): string {
  const pct = (v / max) * 10;
  if (pct <= 2) return 'Very Conservative';
  if (pct <= 4) return 'Conservative';
  if (pct <= 6) return 'Balanced';
  if (pct <= 8) return 'Growth';
  return 'Aggressive';
}

export function riskValueText(v: number, max = 10): string {
  return `${v}/${max}, ${riskLabel(v, max)}`;
}

export const CONFIDENCE_LABELS = ['Low', 'Low-Mod', 'Moderate', 'Mod-High', 'High'] as const;

export function confidenceLabel(v: number): string {
  if (v <= 2) return `${v}%, Low confidence`;
  if (v <= 4) return `${v}%, Low-Moderate confidence`;
  if (v <= 6) return `${v}%, Moderate confidence`;
  if (v <= 8) return `${v}%, Moderately-High confidence`;
  return `${v}%, High confidence`;
}
