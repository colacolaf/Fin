import {
  IconChevronRight,
  IconDebt,
  IconPortfolio,
  IconRetirement,
} from '../layout/Icons';

interface OnboardingCardsProps {
  visible: boolean;
  onSelect: (agent: 'investment' | 'debt' | 'retirement') => void;
  onDismiss: () => void;
}

interface CardConfig {
  agent: 'investment' | 'debt' | 'retirement';
  eyebrow: string;
  title: string;
  desc: string;
  Icon: typeof IconPortfolio;
}

const CARDS: CardConfig[] = [
  {
    agent: 'investment',
    eyebrow: '01 · Portfolio',
    title: 'Run Investment Agent',
    desc: 'Surface top performers, concentration risk, and drift across your holdings.',
    Icon: IconPortfolio,
  },
  {
    agent: 'debt',
    eyebrow: '02 · Payoff',
    title: 'Run Debt Agent',
    desc: 'Compare avalanche vs. snowball — live interest savings per card.',
    Icon: IconDebt,
  },
  {
    agent: 'retirement',
    eyebrow: '03 · Horizon',
    title: 'Run Retirement Agent',
    desc: 'Project glide-path, Roth/Traditional mix, and tax-advantaged fills.',
    Icon: IconRetirement,
  },
];

export default function OnboardingCards({ visible, onSelect, onDismiss }: OnboardingCardsProps) {
  if (!visible) return null;
  return (
    <div
      className="onboarding-cards"
      role="region"
      aria-label="Run your first agent"
      data-testid="onboarding-cards"
    >
      {CARDS.map(({ agent, eyebrow, title, desc, Icon }) => (
        <button
          key={agent}
          type="button"
          className="onboarding-card"
          onClick={() => {
            onSelect(agent);
            onDismiss();
          }}
          data-testid={`onboarding-${agent}`}
          aria-label={`${title}: ${desc}`}
        >
          <div className="onboarding-card-head">
            <span className="onboarding-card-icon" aria-hidden="true">
              <Icon size={18} />
            </span>
            <h3 className="onboarding-card-title">{title}</h3>
          </div>
          <span className="onboarding-card-eyebrow">{eyebrow}</span>
          <p className="onboarding-card-desc">{desc}</p>
          <span className="onboarding-card-cta" aria-hidden="true">
            Try now <IconChevronRight size={14} />
          </span>
        </button>
      ))}
    </div>
  );
}
