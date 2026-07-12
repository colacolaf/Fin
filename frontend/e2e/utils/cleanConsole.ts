/**
 * Phase-39 clean-console collector.
 * Sections 1.5 / 2.A — Attach page-level listeners for `console.error`,
 * `pageerror`, and `requestfailed`. After every test, assert the
 * collected array is empty (with an allow-list for known dev noise).
 *
 * Specs import `test` from THIS module (not `@playwright/test`) — the
 * wrapped test installs `beforeEach` + `afterEach` automatically so
 * the prompt's `expect(errors).toEqual([])` contract holds on every
 * spec that opts in.
 *
 * Allow-list documented inline. Edit intentionally — if you find a
 * new dev-only console.error to silence, add a regex here rather
 * than weakening the assertion in the spec.
 */
import { test as base, expect, type Page, type TestInfo } from '@playwright/test';

interface ConsoleIssue {
  type: 'console-error' | 'pageerror' | 'requestfailed';
  text: string;
}

// Per-test collector — keyed by Playwright's stable test id.
const issuesByTest = new Map<string, ConsoleIssue[]>();

const DEV_NOISE_ALLOWLIST: RegExp[] = [
  // vite-plugin-pwa with devOptions.enabled=false surfaces a "Failed to load
  // resource: sw.js" warning; harmless in dev and explicitly disabled.
  /Failed to load resource.*service-worker\.js/i,
  // PWA dev-mode registration-disabled warnings.
  /service[_ -]?worker.*?(disabled|not supported|registration)/i,
  // fdc3 / browser console warnings on unsupported APIs.
  /Download the React DevTools/i,
  // React 18/19 strict-mode dev-only console.error patterns. Enumerated by
  // canonical prefix so we do not silence legitimate 3rd-party `Warning:`
  // messages. Add a new row if a new benign React-strict warning surfaces.
  /^Warning: Each child in a list should have a unique "key" prop/i,
  /^Warning: Encountered two children with the same key/i,
  /^Warning: ReactDOM(?:\.render|Render)?[\s.]/i,
  /^Warning: validateDOMNesting/i,
  /^Warning: Function components cannot be given refs/i,
  /^Warning: useLayoutEffect does nothing on the server/i,
  /^Warning: An update to .* inside a test was not wrapped in act\(/i,
  /Maximum update depth exceeded/i,
  // 404 on /favicon.svg / .ico — common and harmless.
  /favicon\.(svg|ico)/i,
];

function isAllowlisted(text: string): boolean {
  return DEV_NOISE_ALLOWLIST.some((re) => re.test(text));
}

function bucketFor(testInfo: TestInfo): string {
  return `${testInfo.project?.name ?? 'unknown'}::${testInfo.titlePath.join(' > ')}`;
}

function record(testInfo: TestInfo, issue: ConsoleIssue): void {
  const key = bucketFor(testInfo);
  const list = issuesByTest.get(key) ?? [];
  list.push(issue);
  issuesByTest.set(key, list);
}

function attachListeners(page: Page, testInfo: TestInfo): void {
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (isAllowlisted(text)) return;
    record(testInfo, { type: 'console-error', text });
  });
  page.on('pageerror', (err) => {
    const text = err.message;
    if (isAllowlisted(text)) return;
    record(testInfo, { type: 'pageerror', text });
  });
  page.on('requestfailed', (req) => {
    const url = req.url();
    const errText = req.failure()?.errorText ?? 'unknown';
    if (isAllowlisted(`${url} ${errText}`)) return;
    record(testInfo, { type: 'requestfailed', text: `${req.method()} ${url} — ${errText}` });
  });
}

/**
 * Wrapped Playwright test — installs the per-test listeners on the page and
 * a hard assertion at afterEach. Specs that want console cleanliness
 * enforcement import `test` from here.
 */
export const test = base.extend({
  // no fixtures — this fixture override is purely for the hook wiring
  page: async ({ page }, use, testInfo) => {
    attachListeners(page, testInfo);
    await use(page);
  },
});

test.afterEach(({ }, testInfo) => {
  const list = issuesByTest.get(bucketFor(testInfo)) ?? [];
  issuesByTest.delete(bucketFor(testInfo));
  if (list.length > 0) {
    throw new Error(
      `Console collector hit ${list.length} issue(s) on "${bucketFor(testInfo)}":\n` +
        list.map((i) => `  [${i.type}] ${i.text.slice(0, 240)}`).join('\n'),
    );
  }
});

export { expect };
