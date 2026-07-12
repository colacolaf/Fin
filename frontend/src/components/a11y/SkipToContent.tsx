/**
 * SkipToContent — first focusable element for keyboard users.
 * Phase 37 a11y baseline. Hidden until `:focus-visible`.
 * Skip the entire TopBar/Sidebar chrome with one Tab.
 */
export default function SkipToContent() {
  return (
    <a href="#main-content" className="skip-to-content" data-testid="skip-to-content">
      Skip to main content
    </a>
  );
}
