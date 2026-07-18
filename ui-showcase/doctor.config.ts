/** @type {import('react-doctor').Config} */
export default {
  // Severity overrides — tweak as the codebase matures
  rules: {
    // Performance
    "no-array-index-key": "warn",
    "no-unnecessary-deps": "error",
    "no-memo-bomb": "error",

    // State management
    "no-derived-state": "warn",
    "no-async-set-state": "error",

    // Effects
    "no-effect-no-deps": "error",
    "no-effect-side-effect-leak": "warn",

    // Architecture
    "no-god-component": "warn",
    "no-props-drilling": "warn",

    // Security
    "no-dangerously-set-innerhtml": "error",

    // Accessibility
    "no-missing-aria": "warn",
  },
}
