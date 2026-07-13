# Finance OS Setup Wizard

## Overview

The setup wizard walks the user through the required steps before they can open the Finance OS dashboard. It uses a two-column layout: a left panel with a large step number and progress indicator, and a right panel with the active step content.

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Finance OS Setup                                           │
│                                                             │
│  1 / 3                                                      │
│                                                             │
│  ● ○ ○                                                      │
│                                                             │
│  ───────────────────────────────────────────────────────  │
│                                                             │
│  Welcome to Finance OS                                      │
│  Your locally hosted financial command center.              │
│                                                             │
│  [Portfolio Agent]  [Debt Agent]  [Retirement Agent]      │
│                                                             │
│                                    [Back] [Next]            │
└─────────────────────────────────────────────────────────────┘
```

## Numbered Steps

### Step 1 — Welcome

- **Title:** "Welcome to Finance OS"
- **Description:** "Your locally hosted financial command center."
- **Content:** Feature carousel with three agent cards:
  - Portfolio Agent — "Monitors holdings across brokerages and suggests rebalancing moves."
  - Debt Agent — "Builds payoff plans and prioritizes high-interest accounts."
  - Retirement Agent — "Projects readiness and recommends contribution adjustments."

### Step 2 — Connect Accounts

- **Title:** "Connect your accounts"
- **Description:** "Securely link portfolio, bank, and debt accounts."
- **Content:** Multi-select grid of account types:
  - Brokerage
  - Bank
  - Retirement
  - Debt
  - Other
- **Helper text:** "You can add or remove accounts later in Settings."

### Step 3 — You're Ready

- **Title:** "You're ready"
- **Description:** "A few tips before you open your dashboard."
- **Content:** Numbered tips list:
  1. "All data stays local. Your encryption key never leaves this machine."
  2. "Agents run offline with Ollama. Paid LLMs are optional."
  3. "Trade execution is opt-in and requires your authorization key."

## Navigation

- **Back:** Goes to the previous step. Disabled on step 1.
- **Next:** Advances to the next step.
- **Complete:** Appears on the last step.

## Step Indicator

A dot-style progress indicator sits below the step number in the left panel. The active step is highlighted.
