import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(size = 18): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
}

export function IconDashboard({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1.2" />
      <rect x="14" y="3" width="7" height="5" rx="1.2" />
      <rect x="14" y="12" width="7" height="9" rx="1.2" />
      <rect x="3" y="16" width="7" height="5" rx="1.2" />
    </svg>
  );
}

export function IconPortfolio({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 12l9 4 9-4" />
      <path d="M3 17l9 4 9-4" />
    </svg>
  );
}

export function IconDebt({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <rect x="2.5" y="6" width="19" height="13" rx="2" />
      <path d="M2.5 10h19" />
      <path d="M6 15h4" />
    </svg>
  );
}

export function IconRetirement({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M3 21h18" />
      <path d="M5 21V9l7-5 7 5v12" />
      <path d="M9.5 14h5" />
      <path d="M9.5 17h5" />
    </svg>
  );
}

export function IconQuestions({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-1 .4-1.5 1-1.5 2" />
      <circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconResearch({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5 21 21" />
      <path d="M8 11h6" />
    </svg>
  );
}

export function IconMemory({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M5 7a3 3 0 1 1 6 0v10a3 3 0 1 1-6 0V7z" />
      <path d="M11 5a3 3 0 1 1 6 0v14a3 3 0 1 1-6 0V5z" />
      <path d="M17 9a3 3 0 1 1 6 0v6a3 3 0 1 1-6 0V9z" />
    </svg>
  );
}

export function IconChat({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M4 5h16v11H8l-4 4V5z" />
      <path d="M8 10h8" />
      <path d="M8 13h5" />
    </svg>
  );
}

export function IconTrade({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M3 7h13l-3-3" />
      <path d="M3 17h13l-3 3" />
      <path d="M16 4l4 3-4 3" />
      <path d="M16 14l4 3-4 3" />
    </svg>
  );
}

export function IconAnalytics({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M3 21h18" />
      <path d="M3 21V5" />
      <path d="M7 16v-4" />
      <path d="M12 16V8" />
      <path d="M17 16v-7" />
    </svg>
  );
}

export function IconSettings({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

export function IconPrompts({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M7 9h10" />
      <path d="M7 13h6" />
    </svg>
  );
}

export function IconConnectors({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M10 4v6m4-6v6" />
      <path d="M6 10h12l-2 4H8z" />
      <path d="M9 18h6" />
      <path d="M12 14v4" />
    </svg>
  );
}

export function IconUser({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function IconShield({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function IconBrain({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M9.5 3a3 3 0 0 0-3 3v.5a3 3 0 0 0-2 5.7V14a3 3 0 0 0 2 2.8V18a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z" />
      <path d="M14.5 3a3 3 0 0 1 3 3v.5a3 3 0 0 1 2 5.7V14a3 3 0 0 1-2 2.8V18a3 3 0 0 1-3 3 3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" />
    </svg>
  );
}

export function IconDanger({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5" />
      <circle cx="12" cy="18" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconCheck({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M4 12l5 5 11-12" />
    </svg>
  );
}

export function IconPlus({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconChevronRight({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function IconChevronDown({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* ── Phase 38a — 36×36 empty-state illustrations ── */
// Single shared factory so all empty-state SVGs render at 36 viewBox-units
// with the same stroke language as the 24×24 sidebar icons.
function emptyBase(): SVGProps<SVGSVGElement> {
  return {
    width: 36,
    height: 36,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    role: 'img',
    'aria-hidden': false,
  };
}

export function IconEmptyPortfolio({ size = 36, ...p }: IconProps) {
  return (
    <svg {...emptyBase()} width={size} height={size} aria-label="No holdings" {...p}>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 12l9 4 9-4" />
      <path d="M3 17l9 4 9-4" />
    </svg>
  );
}

export function IconEmptyBacktest({ size = 36, ...p }: IconProps) {
  return (
    <svg {...emptyBase()} width={size} height={size} aria-label="No backtest runs" {...p}>
      <path d="M3 20h18" />
      <path d="M5 20V14l4-4 4 4v6" />
      <path d="M11 20V8l4-4 4 4v12" />
      <circle cx="20" cy="6" r="1.2" />
    </svg>
  );
}

export function IconEmptyMemory({ size = 36, ...p }: IconProps) {
  return (
    <svg {...emptyBase()} width={size} height={size} aria-label="Empty memory vault" {...p}>
      <path d="M5 7a3 3 0 1 1 6 0v10a3 3 0 1 1-6 0V7z" />
      <path d="M11 5a3 3 0 1 1 6 0v14a3 3 0 1 1-6 0V5z" />
      <path d="M17 9a3 3 0 1 1 6 0v6a3 3 0 1 1-6 0V9z" />
    </svg>
  );
}

export function IconEmptyQuotes({ size = 36, ...p }: IconProps) {
  return (
    <svg {...emptyBase()} width={size} height={size} aria-label="No pending follow-throughs" {...p}>
      <path d="M5 8c-1.5 0-3 1.5-3 4 0 3 1.5 4 3 4h1v-3H4" />
      <path d="M13 8c-1.5 0-3 1.5-3 4 0 3 1.5 4 3 4h1v-3h-2" />
      <path d="M9 16h8" />
    </svg>
  );
}

export function IconEmptyCheck({ size = 36, ...p }: IconProps) {
  return (
    <svg {...emptyBase()} width={size} height={size} aria-label="All caught up" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  );
}

export function IconEmptyCommunity({ size = 36, ...p }: IconProps) {
  return (
    <svg {...emptyBase()} width={size} height={size} aria-label="No community signals" {...p}>
      <circle cx="8" cy="9" r="2.5" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M3 19c.5-3 2.5-4 5-4s4.5 1 5 4" />
      <path d="M13 19c.5-3 2.5-4 5-4s4.5 1 5 4" />
    </svg>
  );
}

export function IconEmptyDebt({ size = 36, ...p }: IconProps) {
  return (
    <svg {...emptyBase()} width={size} height={size} aria-label="No debts tracked" {...p}>
      <rect x="2.5" y="6" width="19" height="13" rx="2" />
      <path d="M2.5 10h19" />
      <path d="M6 15h4" />
      <path d="M14 15h3" />
    </svg>
  );
}

export function IconEmptyRetire({ size = 36, ...p }: IconProps) {
  return (
    <svg {...emptyBase()} width={size} height={size} aria-label="No retirement goal" {...p}>
      <path d="M3 21h18" />
      <path d="M5 21V9l7-5 7 5v12" />
      <path d="M9.5 14h5" />
      <path d="M9.5 17h5" />
      <path d="M10 11h4" />
    </svg>
  );
}
