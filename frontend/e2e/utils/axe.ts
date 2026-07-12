/**
 * Phase-39 axe-core helper for e2e routes.
 * Sections 1.6 / 2.B — re-exports the canonical helper from src/utils/audit so
 * specs have one knob (runAxeCheck), with a thin convenience wrapper
 * (expectNoAxeViolations) for callers that prefer the assertion shape.
 */
import type { Page } from '@playwright/test';
import { runAxeCheck, type AxeCheckOptions } from '../../src/utils/audit';

export { runAxeCheck, type AxeCheckOptions };

export interface AxeReport {
  url: string;
  violationCount: number;
  byRule: Record<string, { impact: string; nodes: number; helpUrl: string }>;
}

export async function expectNoAxeViolations(
  page: Page,
  opts?: AxeCheckOptions,
): Promise<void> {
  await runAxeCheck(page, opts);
}
