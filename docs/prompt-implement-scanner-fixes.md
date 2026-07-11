Copy-paste this entire message into a new Cline session (ACT MODE):

---

Implement all fixes from the scanner fix report at `docs/scanner-fix-report.md`. The report at `https://raw.githubusercontent.com/colacolaf/Fin/main/docs/scanner-fix-report.md` contains:

1. Part A: 6 Semgrep SAST findings — 1 ERROR (`exec()` in backtest_engine.py), 5 WARNING (logger credential false positives)
2. Part B: Trivy — all clean, no fixes needed
3. Part C: 12 UI polish gaps from the 19b spec (ocean animation, sidebar, shimmer skeletons, empty states, CSS tokens, page transitions, card hover, CountUp component, TypewriterText component, toast animations, reduced-motion, responsive audit)
4. Part D: 6 security gaps (CSRF, refresh token rotation, cookies, CSP ordering, rate limit coverage, dependency re-audit)

Use these skills:
- `caveman` + `ponytail` for terse, minimal code
- `impeccable` for UI polish (Part C items)
- `ui-animation` for motion components (CountUp, TypewriterText, page transitions, toast)
- `owasp-security-check` for Part D security gaps
- `code-review-and-quality` to review all changes before committing

Reference files (already checked out):
- `docs/scanner-fix-report.md` — the fix specification
- `docs/implementation/19b_Polish_and_Security_Pass.md` — polish acceptance criteria
- `docs/security-audit-phase19.md` — existing security audit baseline
- `docs/GitHub_References.md` — library/package references if needed

Execute in order from Part E of the report (Block 1 → 6). After all fixes, run the verification checklist from Part F and commit with message `fix: [19b] scanner findings + polish gaps`.

---

END OF PROMPT. Copy everything above this line.