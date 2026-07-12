/**
 * audit — runAxeCheck(page) helper for Playwright e2e tests.
 * Phase 37 a11y primitive. Uses @axe-core/playwright (already in devDeps).
 * Throws on any WCAG 2.2 AA violation.
 */
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

export interface AxeCheckOptions {
  /** Tags to evaluate. Defaults cover WCAG 2.0 / 2.1 / 2.2 AA. */
  tags?: string[];
}

const DEFAULT_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

export async function runAxeCheck(page: Page, opts?: AxeCheckOptions): Promise<void> {
  const tags = opts?.tags ?? DEFAULT_TAGS;
  const result = await new AxeBuilder({ page }).withTags(tags).analyze();
  if (result.violations.length > 0) {
    const summary = result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      desc: v.description,
      nodes: v.nodes.length,
      helpUrl: v.helpUrl,
    }));
    throw new Error(`axe-core violations:\n${JSON.stringify(summary, null, 2)}`);
  }
}
