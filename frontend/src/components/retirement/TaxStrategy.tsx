import { useEffect, useState } from 'react';

interface TaxStrategyProps {
  currentTaxBracket: number;
  expectedRetirementBracket: number;
  rothPct: number;
  traditionalPct: number;
  taxablePct: number;
  onChange?: (profile: 'all-tr' | 'all-roth' | 'mix') => void;
}

type Profile = 'all-tr' | 'all-roth' | 'mix';

export default function TaxStrategy({ currentTaxBracket, expectedRetirementBracket, rothPct: rothInit, traditionalPct: trInit, taxablePct: taxableInit, onChange }: TaxStrategyProps) {
  const [profile, setProfile] = useState<Profile>('mix');
  const [saved, setSaved] = useState<number>(0);

  useEffect(() => {
    onChange?.(profile);
    // Naïve but explicit calc: each percentage point of Roth above 50 yields ~0.6% savings when bracket delta > 5.
    const bracketDelta = currentTaxBracket - expectedRetirementBracket;
    const effectiveRoth = profile === 'all-roth' ? 100 : profile === 'all-tr' ? 0 : rothInit;
    const baseSaved = effectiveRoth * 0.6;
    const score = baseSaved * Math.max(0, bracketDelta) / 10;
    setSaved(Math.round(score));
  }, [profile, currentTaxBracket, expectedRetirementBracket, rothInit, trInit, taxableInit, onChange]);

  const bracketDelta = currentTaxBracket - expectedRetirementBracket;
  const tone: 'pos' | 'neg' | 'neutral' = bracketDelta >= 8 ? 'pos' : bracketDelta <= -5 ? 'neg' : 'neutral';
  const toneLabel =
    tone === 'pos'
      ? `Bracket delta +${bracketDelta}% — Roth wins on future tax arbitrage`
      : tone === 'neg'
        ? `Bracket delta ${bracketDelta}% — Traditional unlocks more deductions now`
        : `Bracket delta ${bracketDelta}% — Mix keeps optionality`;

  return (
    <section className="bg-card" style={{ padding: 16 }} data-testid="tax-strategy">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Tax Strategy</h3>
        <span style={{ fontSize: 11, color: 'oklch(0.78 0.14 75)' }}>Estimated tax savings: <strong style={{ fontVariantNumeric: 'tabular-nums' }}>${saved.toLocaleString()}</strong></span>
      </header>
      <p className="coach-voice">{toneLabel}.</p>
      <div className="seg" role="tablist" aria-label="Tax profile preset">
        {(['all-tr', 'all-roth', 'mix'] as Profile[]).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={profile === p}
            className={profile === p ? 'active' : ''}
            onClick={() => setProfile(p)}
            data-testid={`tax-profile-${p}`}
            title={p === 'all-tr' ? 'Deduct now, pay later' : p === 'all-roth' ? 'Pay 24% now, withdraw tax-free' : 'Mix balances current deduction and Roth upside'}
          >
            {p === 'all-tr' ? 'All Traditional' : p === 'all-roth' ? 'All Roth' : 'Mix'}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
        <Bar pct={profile === 'all-tr' ? 100 : profile === 'all-roth' ? 0 : trInit} label="Traditional" color="oklch(0.55 0.04 250)" />
        <Bar pct={profile === 'all-tr' ? 0 : profile === 'all-roth' ? 100 : rothInit} label="Roth" color="oklch(0.72 0.16 170)" />
        <Bar pct={taxableInit} label="Taxable" color="oklch(0.55 0.02 210)" />
      </div>
    </section>
  );
}

function Bar({ pct, label, color }: { pct: number; label: string; color: string }) {
  return (
    <div>
      <span style={{ fontSize: 11, color: 'oklch(0.55 0.01 200)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 4, marginTop: 4, background: 'oklch(0.22 0.02 210)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: color, width: `${pct}%`, transition: 'width 320ms cubic-bezier(0.22, 1, 0.36, 1)' }} />
      </div>
    </div>
  );
}
