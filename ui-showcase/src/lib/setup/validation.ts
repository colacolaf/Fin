/* ================================================================== */
/*  Setup utilities — password validation, key generation              */
/* ================================================================== */

export interface ValidationRule {
  label: string
  test: (value: string) => boolean
}

export const passwordRules: ValidationRule[] = [
  { label: "At least 12 characters", test: (v) => v.length >= 12 },
  { label: "At least 1 uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "At least 2 special characters", test: (v) => (v.match(/[^a-zA-Z0-9]/g) || []).length >= 2 },
]

export function validatePassword(value: string): {
  valid: boolean
  results: { label: string; passed: boolean }[]
} {
  const results = passwordRules.map((rule) => ({
    label: rule.label,
    passed: rule.test(value),
  }))
  return {
    valid: results.every((r) => r.passed),
    results,
  }
}

/**
 * Generate a cryptographically random key.
 * Returns a 32-character hex string.
 */
export function generateKey(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Compute a strength score (0-3) based on how many rules pass.
 */
export function getStrength(value: string): number {
  return passwordRules.filter((r) => r.test(value)).length
}
